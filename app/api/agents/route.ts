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
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT', ...filter },
      include: {
        evaluationsOf: {
          include: { scorecard: true, answers: true },
          orderBy: { createdAt: 'desc' },
        },
        team: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(agents)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, email, teamId } = await req.json()
    const agent = await prisma.user.create({
      data: {
        name, email, role: 'AGENT',
        orgId: session.isSuperAdmin ? null : (session.orgId || null),
        teamId: teamId || null,
      },
    })

    await logAudit({
      userEmail: session.email, userName: session.name, userRole: session.role,
      userId: session.id, orgId: session.orgId,
      action: 'CREATE', entity: 'agent',
      entityId: agent.id, entityName: agent.name || email,
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
