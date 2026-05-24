export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const completions = await prisma.trainingCompletion.findMany({
      where: { employeeId: params.id },
      include: { module: true },
      orderBy: { createdAt: 'desc' } as any,
    })
    return NextResponse.json(completions)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { moduleId, status, score } = await req.json()
    const existing = await prisma.trainingCompletion.findFirst({ where: { employeeId: params.id, moduleId } })
    if (existing) {
      const updated = await prisma.trainingCompletion.update({
        where: { id: existing.id },
        data: { status, score, completedAt: status === 'COMPLETED' ? new Date() : null },
        include: { module: true },
      })
      return NextResponse.json(updated)
    }
    const completion = await prisma.trainingCompletion.create({
      data: { employeeId: params.id, moduleId, status: status || 'IN_PROGRESS', score, startedAt: new Date(), completedAt: status === 'COMPLETED' ? new Date() : null },
      include: { module: true },
    })
    return NextResponse.json(completion, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
