import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const scorecards = await prisma.scorecard.findMany({
      include: {
        sections: {
          include: { criteria: true },
        },
        _count: { select: { evaluations: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(scorecards)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch scorecards' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, description, passScore, sections } = body

    const scorecard = await prisma.scorecard.create({
      data: {
        name,
        description,
        sections: {
          create: sections.map((section: any, si: number) => ({
            name: section.name,
            order: si,
            criteria: {
              create: section.criteria.map((c: any, ci: number) => ({
                question: c.question,
                isCritical: c.isCritical ?? false,
                weight: c.weight ?? 1,
                order: ci,
              })),
            },
          })),
        },
      },
      include: {
        sections: { include: { criteria: true } },
      },
    })

    return NextResponse.json(scorecard, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create scorecard' }, { status: 500 })
  }
}
