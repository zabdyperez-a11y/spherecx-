export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, getOrgFilter } from '@/lib/session'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const filter = getOrgFilter(session)

    const [evaluations, agents, scorecards] = await Promise.all([
      prisma.evaluation.findMany({
        where: { ...filter, status: 'SUBMITTED' },
        include: { agent: true, scorecard: true, answers: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.findMany({
        where: { role: 'AGENT', ...filter },
        include: { evaluationsOf: { where: { status: 'SUBMITTED' }, include: { answers: true } } },
      }),
      prisma.scorecard.findMany({
        where: filter,
        include: { _count: { select: { evaluations: true } } },
      }),
    ])

    const scoresTrend = evaluations.slice(-30).map(e => ({
      date: e.createdAt.toISOString().split('T')[0],
      score: e.totalScore ?? 0,
      passed: e.passed ?? false,
      agent: e.agent?.name || 'Unknown',
    }))

    const agentStats = agents.map(a => {
      const evals = a.evaluationsOf
      const scores = evals.map(e => e.answers.length > 0
        ? Math.round((e.answers.reduce((sum, ans) => sum + ans.score, 0) / (e.answers.length * 2)) * 100)
        : 0)
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      const passRate = scores.length > 0 ? Math.round((scores.filter(s => s >= 80).length / scores.length) * 100) : 0
      return { id: a.id, name: a.name || 'Unknown', evals: evals.length, avgScore: avg, passRate }
    }).sort((a, b) => b.avgScore - a.avgScore)

    const submitted = evaluations.filter(e => e.passed !== null)
    const passCount = submitted.filter(e => e.passed).length
    const failCount = submitted.filter(e => !e.passed).length

    const now = new Date()
    const weeklyVolume = Array.from({ length: 8 }, (_, i) => {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (7 * (7 - i)))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)
      const count = evaluations.filter(e => {
        const d = new Date(e.createdAt)
        return d >= weekStart && d < weekEnd
      }).length
      return { week: `W${i + 1}`, count }
    })

    const distribution = { excellent: 0, good: 0, needsWork: 0, failing: 0 }
    evaluations.forEach(e => {
      const s = e.totalScore ?? 0
      if (s >= 90) distribution.excellent++
      else if (s >= 80) distribution.good++
      else if (s >= 70) distribution.needsWork++
      else distribution.failing++
    })

    return NextResponse.json({
      summary: {
        totalEvals: evaluations.length,
        avgScore: evaluations.length > 0 ? Math.round(evaluations.reduce((sum, e) => sum + (e.totalScore ?? 0), 0) / evaluations.length) : 0,
        passRate: submitted.length > 0 ? Math.round((passCount / submitted.length) * 100) : 0,
        totalAgents: agents.length,
      },
      scoresTrend, agentStats,
      passFailBreakdown: { pass: passCount, fail: failCount },
      scorecardUsage: scorecards.map(s => ({ name: s.name, count: s._count.evaluations })).sort((a, b) => b.count - a.count),
      weeklyVolume, distribution,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
