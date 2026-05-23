export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const entity = searchParams.get('entity')
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '200')

    const where: any = {}
    // Non-super-admins only see their org's audit logs
    if (!session.isSuperAdmin && session.orgId) where.orgId = session.orgId
    if (entity) where.entity = entity
    if (action) where.action = action

    const logs = await prisma.auditLog.findMany({
      where, orderBy: { createdAt: 'desc' }, take: limit,
    })
    return NextResponse.json(logs)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const log = await prisma.auditLog.create({ data: body })
    return NextResponse.json(log, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
