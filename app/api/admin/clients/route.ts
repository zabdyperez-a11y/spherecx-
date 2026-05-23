export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, welcomeEmail } from '@/lib/email'
import { logAudit } from '@/lib/audit'

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

    const limits: Record<string, { maxUsers: number; maxEvals: number }> = {
      FREE: { maxUsers: 3, maxEvals: 50 },
      PRO: { maxUsers: 15, maxEvals: 500 },
      ENTERPRISE: { maxUsers: 999, maxEvals: 99999 },
    }

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    const org = await prisma.organization.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        plan: plan || 'FREE',
        status: 'TRIAL',
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        notes: notes || null,
        maxUsers: limits[plan]?.maxUsers ?? 3,
        maxEvals: limits[plan]?.maxEvals ?? 50,
        trialEndsAt,
      },
    })

    // Send welcome email if contact email provided
    if (contactEmail) {
      const loginUrl = process.env.NEXTAUTH_URL || 'https://spherecx.vercel.app'
      const html = welcomeEmail({
        name: contactName || name,
        email: contactEmail,
        orgName: name,
        plan: plan || 'FREE',
        trialEndsAt,
        loginUrl: `${loginUrl}/login`,
      })
      await sendEmail({
        to: contactEmail,
        subject: `Welcome to SphereCX — Your ${plan || 'FREE'} trial starts today`,
        html,
      })
    }

    await logAudit({
      userEmail: 'admin@spherecx.com',
      action: 'CREATE',
      entity: 'organization',
      entityId: org.id,
      entityName: org.name,
      details: { plan, contactEmail, trialEndsAt: trialEndsAt.toISOString() },
    })

    return NextResponse.json(org, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
