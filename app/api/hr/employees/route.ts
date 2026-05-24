export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const where = session.isSuperAdmin ? {} : { orgId: session.orgId || undefined }
    const employees = await prisma.employee.findMany({
      where,
      include: {
        incidents: { orderBy: { createdAt: 'desc' }, take: 3 },
        reviews: { orderBy: { reviewDate: 'desc' }, take: 1 },
        _count: { select: { incidents: true, trainings: true } },
      },
      orderBy: { lastName: 'asc' },
    })
    return NextResponse.json(employees)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const employee = await prisma.employee.create({
      data: { ...body, orgId: session.isSuperAdmin ? (body.orgId || null) : (session.orgId || null) },
    })
    return NextResponse.json(employee, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
