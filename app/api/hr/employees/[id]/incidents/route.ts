export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const incident = await prisma.disciplinaryAction.create({
      data: {
        ...body,
        employeeId: params.id,
        orgId: session.orgId || null,
        date: new Date(body.date),
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      },
    })
    return NextResponse.json(incident, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
