export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    const ip = req.headers.get('x-forwarded-for') || 'unknown'

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@spherecx.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'spherecx2026'

    // Check if it's the super admin
    const isSuperAdmin = email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword

    if (!isSuperAdmin) {
      // Try to find user in database
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { org: true },
      })

      if (!user || user.password !== password) {
        await logAudit({
          userEmail: email, action: 'LOGIN', entity: 'session',
          details: { success: false, reason: 'Invalid credentials' }, ipAddress: ip,
        })
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
      }

      // Check org status and trial
      if (user.org) {
        if (user.org.status === 'SUSPENDED' || user.org.status === 'CANCELLED') {
          return NextResponse.json({
            error: 'Your account has been suspended. Please contact support.',
            code: 'SUSPENDED'
          }, { status: 403 })
        }

        if (user.org.status === 'TRIAL' && user.org.trialEndsAt) {
          const now = new Date()
          if (now > user.org.trialEndsAt) {
            // Auto-suspend expired trial
            await prisma.organization.update({
              where: { id: user.org.id },
              data: { status: 'SUSPENDED' },
            })
            await logAudit({
              userEmail: email, action: 'LOGIN', entity: 'session',
              details: { success: false, reason: 'Trial expired', orgId: user.org.id }, ipAddress: ip,
            })
            return NextResponse.json({
              error: 'Your free trial has expired.',
              code: 'TRIAL_EXPIRED',
              trialEndedAt: user.org.trialEndsAt,
            }, { status: 403 })
          }
        }
      }

      // Valid user login
      const cookieStore = cookies()
      cookieStore.set('spherecx_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      cookieStore.set('spherecx_user', JSON.stringify({
        id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })

      await logAudit({
        userEmail: email, userName: user.name || undefined, userRole: user.role,
        userId: user.id, orgId: user.orgId || undefined,
        action: 'LOGIN', entity: 'session',
        details: { success: true }, ipAddress: ip,
      })

      return NextResponse.json({ success: true })
    }

    // Super admin login
    const cookieStore = cookies()
    cookieStore.set('spherecx_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    await logAudit({
      userEmail: adminEmail, userName: 'Super Admin', userRole: 'SUPER_ADMIN',
      action: 'LOGIN', entity: 'session',
      details: { success: true }, ipAddress: ip,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
