export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
      include: {
        scorecard: { include: { sections: { include: { criteria: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } } },
        agent: true, evaluator: true,
        answers: { include: { criterion: true } },
      },
    })
    if (!evaluation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(evaluation)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const evaluation = await prisma.evaluation.update({
      where: { id: params.id },
      data: { status: body.status },
      include: { agent: true, scorecard: true },
    })
    return NextResponse.json(evaluation)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
