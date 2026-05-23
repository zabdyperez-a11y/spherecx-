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
    const scorecards = await prisma.scorecard.findMany({
      where: filter,
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, description, sections } = await req.json()
    const scorecard = await prisma.scorecard.create({
      data: {
        name, description: description || null,
        orgId: session.isSuperAdmin ? null : (session.orgId || null),
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

    await logAudit({
      userEmail: session.email, userName: session.name, userRole: session.role,
      userId: session.id, orgId: session.orgId,
      action: 'CREATE', entity: 'scorecard',
      entityId: scorecard.id, entityName: scorecard.name,
    })

    return NextResponse.json(scorecard, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
