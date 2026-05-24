export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const where = session.isSuperAdmin ? {} : { orgId: session.orgId || undefined }
    const campaigns = await prisma.campaign.findMany({
      where,
      include: { metrics: { orderBy: { date: 'desc' }, take: 7 } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(campaigns)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const campaign = await prisma.campaign.create({
      data: {
        ...body,
        orgId: session.isSuperAdmin ? null : (session.orgId || null),
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    })
    return NextResponse.json(campaign, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
