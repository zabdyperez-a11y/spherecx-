export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function extractDomain(email: string): string | null {
  const match = email.match(/@(.+)$/)
  return match ? match[1].toLowerCase() : null
}

export async function POST(req: Request) {
  try {
    const { orgId, name, email, role, password } = await req.json()

    // Check domain restriction
    if (orgId) {
      const org = await prisma.organization.findUnique({ where: { id: orgId } })
      if (org?.allowedDomain) {
        const emailDomain = extractDomain(email)
        if (emailDomain !== org.allowedDomain) {
          return NextResponse.json({
            error: `This organization only allows @${org.allowedDomain} email addresses. The email "${email}" is not allowed.`
          }, { status: 400 })
        }
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role || 'QA_ANALYST',
        orgId: orgId || null,
        password: password || null,
      },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
