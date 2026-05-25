export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const where = session.isSuperAdmin ? {} : { orgId: session.orgId || undefined }
    const modules = await prisma.trainingModule.findMany({
      where,
      include: { _count: { select: { completions: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(modules)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const module = await prisma.trainingModule.create({
      data: { ...body, orgId: session.isSuperAdmin ? null : (session.orgId || null) },
    })
    return NextResponse.json(module, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
