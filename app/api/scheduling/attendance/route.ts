export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const where = session.isSuperAdmin ? {} : { orgId: session.orgId || undefined }
    const records = await prisma.attendanceRecord.findMany({
      where,
      include: { employee: true },
      orderBy: { date: 'desc' },
      take: 100,
    })
    return NextResponse.json(records)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const record = await prisma.attendanceRecord.create({
      data: {
        ...body,
        orgId: session.orgId || null,
        date: new Date(body.date),
        clockIn: body.clockIn ? new Date(body.clockIn) : null,
        clockOut: body.clockOut ? new Date(body.clockOut) : null,
      },
    })
    return NextResponse.json(record, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
