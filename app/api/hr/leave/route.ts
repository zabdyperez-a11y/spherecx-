export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const where = session.isSuperAdmin ? {} : { orgId: session.orgId || undefined }
    const requests = await prisma.leaveRequest.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(requests)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, status, reviewNote } = await req.json()
    const request = await prisma.leaveRequest.update({
      where: { id },
      data: { status, reviewNote, reviewedBy: session.name || session.email, reviewedAt: new Date() },
      include: { employee: true },
    })
    return NextResponse.json(request)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
