export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const metric = await prisma.campaignMetric.create({
      data: {
        campaignId: params.id,
        date: new Date(body.date),
        totalCalls: body.totalCalls || 0,
        answered: body.answered || 0,
        converted: body.converted || 0,
        avgHandle: body.avgHandle || null,
      },
    })
    return NextResponse.json(metric, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
