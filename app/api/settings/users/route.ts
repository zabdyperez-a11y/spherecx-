export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const where = session.isSuperAdmin ? {} : { orgId: session.orgId || undefined }
    const users = await prisma.user.findMany({
      where, include: { team: true, org: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(users)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, email, role, teamId, password } = await req.json()
    const user = await prisma.user.create({
      data: {
        name, email,
        role: role || 'AGENT',
        orgId: session.isSuperAdmin ? null : (session.orgId || null),
        teamId: teamId || null,
        password: password || null,
      },
      include: { team: true },
    })

    await logAudit({
      userEmail: session.email, userName: session.name, userRole: session.role,
      userId: session.id, orgId: session.orgId,
      action: 'INVITE', entity: 'user',
      entityId: user.id, entityName: user.name || email,
      details: { role, email },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, ...data } = await req.json()
    const user = await prisma.user.update({ where: { id }, data, include: { team: true } })

    await logAudit({
      userEmail: session.email, userName: session.name, userRole: session.role,
      userId: session.id, orgId: session.orgId,
      action: data.role ? 'ROLE_CHANGE' : 'UPDATE', entity: 'user',
      entityId: id, details: data,
    })

    return NextResponse.json(user)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await req.json()
    await prisma.user.delete({ where: { id } })

    await logAudit({
      userEmail: session.email, userName: session.name, userRole: session.role,
      userId: session.id, orgId: session.orgId,
      action: 'REMOVE', entity: 'user', entityId: id,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
