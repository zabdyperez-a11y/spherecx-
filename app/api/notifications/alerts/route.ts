export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, getOrgFilter } from '@/lib/session'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const filter = getOrgFilter(session)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    const agents = await prisma.user.findMany({
      where: { role: 'AGENT', ...filter },
      include: {
        evaluationsOf: {
          where: { status: 'SUBMITTED', createdAt: { gte: fourteenDaysAgo } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const alerts = []
    for (const agent of agents) {
      const recent = agent.evaluationsOf.filter(e => e.createdAt >= sevenDaysAgo)
      const previous = agent.evaluationsOf.filter(e => e.createdAt < sevenDaysAgo)
      if (recent.length === 0 || previous.length === 0) continue

      const recentAvg = recent.reduce((s, e) => s + (e.totalScore ?? 0), 0) / recent.length
      const prevAvg = previous.reduce((s, e) => s + (e.totalScore ?? 0), 0) / previous.length
      const drop = prevAvg - recentAvg

      if (drop >= 10) {
        alerts.push({
          agentName: agent.name, agentEmail: agent.email,
          recentAvg: Math.round(recentAvg), prevAvg: Math.round(prevAvg), drop: Math.round(drop),
        })
      }
    }

    return NextResponse.json({ alerts, agentsChecked: agents.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
