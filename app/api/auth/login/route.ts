export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rateLimit'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const limit = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)
    if (!limit.allowed) {
      return NextResponse.json({ error: `Too many attempts. Try again in ${limit.retryAfter}s.` }, { status: 429 })
    }

    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@spherecx.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'spherecx2026'

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }

    // Super admin hardcoded login
    if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
      const cookieStore = cookies()
      cookieStore.set('spherecx_auth', 'authenticated', cookieOpts)
      cookieStore.set('spherecx_user', JSON.stringify({
        id: 'super-admin',
        email: adminEmail,
        name: 'Zabdy Perez',
        role: 'SUPER_ADMIN',
        orgId: null,
      }), cookieOpts)
      return NextResponse.json({ success: true })
    }

    // DB login
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { org: true },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const validPassword = user.password.startsWith('$2')
      ? await bcrypt.compare(password, user.password)
      : user.password === password

    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // Check org status
    if (user.org) {
      if (['SUSPENDED', 'CANCELLED'].includes(user.org.status)) {
        return NextResponse.json({ error: 'Account suspended. Contact support@spherecx.app.', code: 'SUSPENDED' }, { status: 403 })
      }
      if (user.org.status === 'TRIAL' && user.org.trialEndsAt && new Date() > user.org.trialEndsAt) {
        return NextResponse.json({ error: 'Trial expired.', code: 'TRIAL_EXPIRED' }, { status: 403 })
      }
    }

    const cookieStore = cookies()
    cookieStore.set('spherecx_auth', 'authenticated', cookieOpts)
    cookieStore.set('spherecx_user', JSON.stringify({
      id: user.id, email: user.email, name: user.name,
      role: user.role, orgId: user.orgId,
    }), cookieOpts)

    // Upgrade plain text password
    if (!user.password.startsWith('$2')) {
      const hashed = await bcrypt.hash(password, 10)
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
