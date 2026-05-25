export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    // Check all agents for score drops — call this from a cron job weekly
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      include: {
        evaluationsOf: {
          where: { status: 'SUBMITTED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { scorecard: true },
        },
        org: true,
      },
    })

    const alerts: { agentName: string; drop: number; recentAvg: number; prevAvg: number }[] = []

    for (const agent of agents) {
      const evals = agent.evaluationsOf
      if (evals.length < 4) continue

      const recent = evals.slice(0, Math.floor(evals.length / 2))
      const previous = evals.slice(Math.floor(evals.length / 2))

      const recentAvg = Math.round(recent.reduce((s, e) => s + (e.totalScore ?? 0), 0) / recent.length)
      const prevAvg = Math.round(previous.reduce((s, e) => s + (e.totalScore ?? 0), 0) / previous.length)
      const drop = prevAvg - recentAvg

      if (drop >= 10) {
        alerts.push({ agentName: agent.name || agent.email, drop, recentAvg, prevAvg })

        // Find org admin to notify
        if (agent.orgId) {
          const admins = await prisma.user.findMany({
            where: { orgId: agent.orgId, role: { in: ['ADMIN', 'MANAGER', 'SUPERVISOR'] as any } },
          })

          for (const admin of admins) {
            if (!admin.email) continue
            await sendEmail({
              to: admin.email,
              subject: `⚠️ Performance Alert: ${agent.name || agent.email} score dropped ${drop}%`,
              html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0f1629;padding:28px 32px;">
      <h1 style="margin:0;color:white;font-size:20px;font-weight:600;">SphereCX</h1>
    </div>
    <div style="padding:32px;">
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:16px;font-weight:700;color:#c2410c;">⚠️ Performance Alert</p>
      </div>
      <h2 style="font-size:18px;color:#0f172a;margin:0 0 12px;">${agent.name || agent.email} score dropped ${drop}%</h2>
      <p style="color:#64748b;margin:0 0 20px;">This agent's recent performance shows a significant decline that may need coaching attention.</p>
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:#dc2626;">${recentAvg}%</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Recent Average</div>
        </div>
        <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:#059669;">${prevAvg}%</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Previous Average</div>
        </div>
      </div>
      <a href="${process.env.NEXTAUTH_URL || 'https://spherecx.vercel.app'}/agents" style="display:block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:600;font-size:15px;">
        View Agent Profile →
      </a>
    </div>
  </div>
</body>
</html>`
            })
          }
        }
      }
    }

    return NextResponse.json({ alerts, checked: agents.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
