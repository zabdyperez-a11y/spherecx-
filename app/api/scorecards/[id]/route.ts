export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const scorecard = await prisma.scorecard.findUnique({
      where: { id: params.id },
      include: { sections: { include: { criteria: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
    })
    if (!scorecard) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(scorecard)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { name, description, sections } = await req.json()

    // Delete existing sections/criteria and recreate
    await prisma.section.deleteMany({ where: { scorecardId: params.id } })

    const scorecard = await prisma.scorecard.update({
      where: { id: params.id },
      data: {
        name, description: description || null,
        sections: {
          create: sections.map((s: any, si: number) => ({
            name: s.name, order: si,
            criteria: {
              create: s.criteria.map((c: any, ci: number) => ({
                question: c.question, isCritical: c.isCritical || false,
                weight: 1, order: ci,
              })),
            },
          })),
        },
      },
      include: { sections: { include: { criteria: true } } },
    })
    return NextResponse.json(scorecard)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.scorecard.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
