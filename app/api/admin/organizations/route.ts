export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { evaluations: true, scorecards: true } }
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orgs)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, slug, plan, billingEmail, maxAgents, maxEvals, notes } = await req.json()
    const org = await prisma.organization.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        plan: plan || 'FREE',
        billingEmail: billingEmail || null,
        maxAgents: maxAgents || (plan === 'PRO' ? 25 : plan === 'ENTERPRISE' ? 999 : 5),
        maxEvals: maxEvals || (plan === 'PRO' ? 500 : plan === 'ENTERPRISE' ? 99999 : 50),
        notes: notes || null,
        status: 'TRIAL',
      },
    })
    return NextResponse.json(org, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
