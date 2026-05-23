export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const scorecards = await prisma.scorecard.findMany({
      include: {
        sections: {
          include: { criteria: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
        _count: { select: { evaluations: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(scorecards)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch scorecards' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, sections } = await req.json()
    const scorecard = await prisma.scorecard.create({
      data: {
        name,
        description: description || null,
        sections: {
          create: sections.map((s: any, si: number) => ({
            name: s.name,
            order: si,
            criteria: {
              create: s.criteria.map((c: any, ci: number) => ({
                question: c.question,
                isCritical: c.isCritical || false,
                weight: 1,
                order: ci,
              })),
            },
          })),
        },
      },
      include: { sections: { include: { criteria: true } } },
    })
    return NextResponse.json(scorecard, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
