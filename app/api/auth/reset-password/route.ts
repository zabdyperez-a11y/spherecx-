export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rateLimit'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'

    // Rate limit: 3 reset requests per hour per IP
    const limit = rateLimit(`reset:${ip}`, 3, 60 * 60 * 1000)
    if (!limit.allowed) {
      return NextResponse.json({
        error: `Too many requests. Try again in ${limit.retryAfter} seconds.`
      }, { status: 429 })
    }

    const { email, token, newPassword } = await req.json()

    // REQUEST reset
    if (email && !token) {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
      if (!user) return NextResponse.json({ success: true }) // Always succeed — don't reveal if email exists

      const resetToken = crypto.randomBytes(32).toString('hex')
      const expiry = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry: expiry } as any,
      })

      const appUrl = process.env.NEXTAUTH_URL || 'https://spherecx.vercel.app'
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

      await sendEmail({
        to: email,
        subject: 'Reset your SphereCX password',
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0f1629;padding:28px 32px;">
      <h1 style="margin:0;color:white;font-size:20px;font-weight:600;">SphereCX</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Reset your password</h2>
      <p style="color:#64748b;margin:0 0 24px;font-size:14px;">Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:600;font-size:15px;margin-bottom:20px;">
        Reset Password →
      </a>
      <p style="color:#94a3b8;font-size:12px;margin:0;">If you didn't request this, ignore this email. Your password won't change.</p>
    </div>
  </div>
</body>
</html>`
      })

      return NextResponse.json({ success: true })
    }

    // CONFIRM reset
    if (token && newPassword && email) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
      }

      const user = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          resetToken: token,
          resetTokenExpiry: { gt: new Date() },
        },
      })

      if (!user) return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })

      const hashed = await bcrypt.hash(newPassword, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed, resetToken: null, resetTokenExpiry: null } as any,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
