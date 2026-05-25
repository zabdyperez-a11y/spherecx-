export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        users: true,
        _count: { select: { evaluations: true, scorecards: true } },
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
    const { name, slug, plan, contactName, contactEmail, notes } = await req.json()

    const limits = {
      FREE: { maxUsers: 3, maxEvals: 50 },
      PRO: { maxUsers: 15, maxEvals: 500 },
      ENTERPRISE: { maxUsers: 999, maxEvals: 99999 },
    }

    const org = await prisma.organization.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        plan: plan || 'FREE',
        status: 'TRIAL',
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        notes: notes || null,
        maxUsers: limits[plan as keyof typeof limits]?.maxUsers ?? 3,
        maxEvals: limits[plan as keyof typeof limits]?.maxEvals ?? 50,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    })
    return NextResponse.json(org, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
