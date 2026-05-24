export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const review = await prisma.performanceReview.create({
      data: {
        ...body,
        employeeId: params.id,
        orgId: session.orgId || null,
        reviewDate: new Date(body.reviewDate),
      },
    })
    return NextResponse.json(review, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
