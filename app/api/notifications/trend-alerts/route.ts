export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const filter = session.isSuperAdmin ? {} : { orgId: session.orgId || undefined }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    const agents = await prisma.user.findMany({
      where: { role: 'AGENT', ...filter },
      include: {
        evaluationsOf: {
          where: { status: 'SUBMITTED', createdAt: { gte: fourteenDaysAgo } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const alerts: any[] = []
    for (const agent of agents) {
      const recent = agent.evaluationsOf.filter(e => new Date(e.createdAt) >= sevenDaysAgo)
      const previous = agent.evaluationsOf.filter(e => new Date(e.createdAt) < sevenDaysAgo)
      if (recent.length === 0 || previous.length === 0) continue
      const recentAvg = recent.reduce((s, e) => s + (e.totalScore ?? 0), 0) / recent.length
      const prevAvg = previous.reduce((s, e) => s + (e.totalScore ?? 0), 0) / previous.length
      const drop = prevAvg - recentAvg
      if (drop >= 10) alerts.push({ agentName: agent.name, recentAvg: Math.round(recentAvg), prevAvg: Math.round(prevAvg), drop: Math.round(drop) })
    }

    // Send email if alerts found
    if (alerts.length > 0 && process.env.RESEND_API_KEY) {
      const appUrl = process.env.NEXTAUTH_URL || 'https://spherecx.vercel.app'
      const html = `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8fafc;padding:20px;">
<div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;">
<div style="background:#0f1629;padding:24px 32px;"><h1 style="color:white;margin:0;font-size:18px;">SphereCX Performance Alert</h1></div>
<div style="padding:32px;">
<p style="color:#475569;">The following agents had a score drop of 10%+ this week:</p>
${alerts.map(a => `<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:8px 0;">
<strong>${a.agentName}</strong>: ${a.prevAvg}% → ${a.recentAvg}% (↓${a.drop}%)
</div>`).join('')}
<a href="${appUrl}/reports" style="display:inline-block;margin-top:20px;background:#3b82f6;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">View Reports →</a>
</div></div></body></html>`
      await sendEmail({ to: session.email, subject: `SphereCX Alert: ${alerts.length} agent${alerts.length > 1 ? 's' : ''} need attention`, html })
    }

    return NextResponse.json({ alerts, sent: alerts.length > 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
