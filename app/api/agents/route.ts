export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
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
  try {
    const { name, email, teamId } = await req.json()
    const agent = await prisma.user.create({
      data: { name, email, role: 'AGENT', teamId: teamId || null },
    })

    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    await logAudit({
      userEmail: 'admin@spherecx.com',
      action: 'CREATE',
      entity: 'agent',
      entityId: agent.id,
      entityName: agent.name || email,
      details: { email },
      ipAddress: ip,
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
