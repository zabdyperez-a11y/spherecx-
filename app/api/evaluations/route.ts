import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const evaluations = await prisma.evaluation.findMany({
      include: {
        scorecard: true,
        agent: true,
        evaluator: true,
        answers: { include: { criterion: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(evaluations)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { scorecardId, agentId, evaluatorId, callDate, callId, recordingUrl, notes, answers, totalScore, passed, status } = body

    const evaluation = await prisma.evaluation.create({
      data: {
        scorecardId,
        agentId,
        evaluatorId,
        callDate: new Date(callDate),
        callId: callId || null,
        recordingUrl: recordingUrl || null,
        notes: notes || null,
        totalScore,
        passed,
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
    return NextResponse.json(evaluation, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
