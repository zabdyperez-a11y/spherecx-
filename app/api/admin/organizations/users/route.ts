export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

function extractDomain(email: string): string | null {
  const match = email.match(/@(.+)$/)
  return match ? match[1].toLowerCase() : null
}

export async function POST(req: Request) {
  try {
    const { orgId, name, email, role, password } = await req.json()

    if (orgId) {
      const org = await prisma.organization.findUnique({ where: { id: orgId } })
      if (org?.allowedDomain) {
        const emailDomain = extractDomain(email)
        if (emailDomain !== org.allowedDomain) {
          return NextResponse.json({
            error: `This organization only allows @${org.allowedDomain} email addresses.`
          }, { status: 400 })
        }
      }
    }

    const rawPassword = password || Math.random().toString(36).slice(-8) + '!'
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    const user = await prisma.user.create({
      data: { name, email, role: role || 'QA_ANALYST', orgId: orgId || null, password: hashedPassword },
    })
    return NextResponse.json({ ...user, tempPassword: !password ? rawPassword : undefined }, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
