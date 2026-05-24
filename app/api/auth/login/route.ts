export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

function extractDomain(email: string): string | null {
  const match = email.match(/@(.+)$/)
  return match ? match[1].toLowerCase() : null
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@spherecx.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'spherecx2026'

    // Super admin check
    if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
      const cookieStore = cookies()
      cookieStore.set('spherecx_auth', 'authenticated', {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
      })
      await logAudit({
        userEmail: adminEmail, userName: 'Super Admin', userRole: 'SUPER_ADMIN',
        action: 'LOGIN', entity: 'session',
        details: { success: true }, ipAddress: ip,
      })
      return NextResponse.json({ success: true })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { org: true },
    })

    if (!user || !user.password) {
      await logAudit({ userEmail: email, action: 'LOGIN', entity: 'session', details: { success: false, reason: 'User not found' }, ipAddress: ip })
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // Check password — support both hashed and legacy plain text
    const validPassword = user.password.startsWith('$2')
      ? await bcrypt.compare(password, user.password)
      : user.password === password

    if (!validPassword) {
      await logAudit({ userEmail: email, action: 'LOGIN', entity: 'session', details: { success: false, reason: 'Wrong password' }, ipAddress: ip })
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // Domain check
    if (user.org?.allowedDomain) {
      const emailDomain = extractDomain(email)
      if (emailDomain !== user.org.allowedDomain) {
        return NextResponse.json({ error: `Access denied. This organization only allows @${user.org.allowedDomain} accounts.` }, { status: 403 })
      }
    }

    // Org status check
    if (user.org) {
      if (user.org.status === 'SUSPENDED' || user.org.status === 'CANCELLED') {
        return NextResponse.json({ error: 'Your account has been suspended. Contact support@spherecx.app.', code: 'SUSPENDED' }, { status: 403 })
      }
      if (user.org.status === 'TRIAL' && user.org.trialEndsAt && new Date() > user.org.trialEndsAt) {
        await prisma.organization.update({ where: { id: user.org.id }, data: { status: 'SUSPENDED' } })
        return NextResponse.json({ error: 'Your free trial has expired.', code: 'TRIAL_EXPIRED' }, { status: 403 })
      }
    }

    const cookieStore = cookies()
    cookieStore.set('spherecx_auth', 'authenticated', {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    })
    cookieStore.set('spherecx_user', JSON.stringify({
      id: user.id, email: user.email, name: user.name,
      role: user.role, orgId: user.orgId,
    }), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    })

    // Upgrade plain text password to hashed on successful login
    if (!user.password.startsWith('$2')) {
      const hashed = await bcrypt.hash(password, 10)
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    }

    await logAudit({
      userEmail: email, userName: user.name || undefined, userRole: user.role,
      userId: user.id, orgId: user.orgId || undefined,
      action: 'LOGIN', entity: 'session', details: { success: true }, ipAddress: ip,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
