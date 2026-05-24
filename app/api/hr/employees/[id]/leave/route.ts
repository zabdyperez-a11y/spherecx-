export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: params.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(requests)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const start = new Date(body.startDate)
    const end = new Date(body.endDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: params.id,
        orgId: session.orgId || null,
        type: body.type,
        startDate: start,
        endDate: end,
        days,
        reason: body.reason || null,
      },
    })
    return NextResponse.json(request, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
