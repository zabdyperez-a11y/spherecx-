export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, getOrgFilter } from '@/lib/session'
import { logAudit } from '@/lib/audit'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const filter = getOrgFilter(session)
    const evaluations = await prisma.evaluation.findMany({
      where: filter,
      include: {
        scorecard: true, agent: true, evaluator: true,
        answers: { include: { criterion: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(evaluations)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { scorecardId, agentId, evaluatorId, callDate, callId, recordingUrl, notes, answers, totalScore, passed, status } = body

    const evaluation = await prisma.evaluation.create({
      data: {
        scorecardId, agentId,
        evaluatorId: evaluatorId || session.id || agentId,
        orgId: session.isSuperAdmin ? (body.orgId || null) : (session.orgId || null),
        callDate: new Date(callDate),
        callId: callId || null,
        recordingUrl: recordingUrl || null,
        notes: notes || null,
        totalScore, passed,
        status: status || 'SUBMITTED',
        answers: {
          create: (answers || []).map((a: any) => ({
            criterionId: a.criterionId,
            score: a.score,
            note: a.note || null,
          })),
        },
      },
      include: { scorecard: true, agent: true, answers: true },
    })

    await logAudit({
      userEmail: session.email, userName: session.name, userRole: session.role,
      userId: session.id, orgId: session.orgId,
      action: status === 'DRAFT' ? 'DRAFT' : 'SUBMIT',
      entity: 'evaluation', entityId: evaluation.id,
      details: { score: totalScore, passed, callId },
    })

    return NextResponse.json(evaluation, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
