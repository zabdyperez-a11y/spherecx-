interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — email not sent')
    return { success: false, error: 'No API key' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'SphereCX <noreply@spherecx.app>',
        to,
        subject,
        html,
      }),
    })
    const data = await res.json()
    return { success: res.ok, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export function welcomeEmail(params: {
  name: string
  email: string
  orgName: string
  plan: string
  trialEndsAt: Date | null
  loginUrl: string
  password?: string
}) {
  const { name, email, orgName, plan, trialEndsAt, loginUrl, password } = params
  const planColors = { FREE: '#64748b', PRO: '#3b82f6', ENTERPRISE: '#6366f1' }
  const color = planColors[plan as keyof typeof planColors] || '#3b82f6'

  const trialSection = trialEndsAt ? `
    <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#92400e;">
        <strong>⏰ Trial Period:</strong> Your free trial runs until
        <strong>${trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
        After that, you'll need an active plan to continue using SphereCX.
      </p>
    </div>
  ` : ''

  const planLimits: Record<string, { users: string; evals: string }> = {
    FREE: { users: '3 users', evals: '50 evaluations/month' },
    PRO: { users: '15 users', evals: '500 evaluations/month' },
    ENTERPRISE: { users: 'Unlimited users', evals: 'Unlimited evaluations' },
  }
  const limits = planLimits[plan] || planLimits.FREE

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background:#0f1629;padding:28px 32px;">
      <h1 style="margin:0;color:white;font-size:22px;font-weight:600;">SphereCX</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:13px;">Quality Assurance Platform</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Welcome to SphereCX, ${name}! 👋</h2>
      <p style="color:#64748b;margin:0 0 24px;font-size:15px;">Your account for <strong>${orgName}</strong> is ready. Here are your details:</p>

      <!-- Plan badge -->
      <div style="display:inline-block;background:${color}15;border:1px solid ${color}30;border-radius:20px;padding:6px 16px;margin-bottom:20px;">
        <span style="color:${color};font-weight:600;font-size:13px;">● ${plan} PLAN</span>
      </div>

      ${trialSection}

      <!-- Account details -->
      <div style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Account Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Email</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${email}</td></tr>
          ${password ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Temp Password</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${password}</td></tr>` : ''}
          <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Organization</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${orgName}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Plan</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${plan}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Users included</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${limits.users}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Evaluations</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${limits.evals}</td></tr>
          ${trialEndsAt ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Trial ends</td><td style="padding:6px 0;color:#d97706;font-size:14px;font-weight:600;">${trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td></tr>` : ''}
        </table>
      </div>

      <!-- CTA -->
      <a href="${loginUrl}" style="display:block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:600;font-size:15px;margin-bottom:24px;">
        Access SphereCX →
      </a>

      <p style="color:#94a3b8;font-size:13px;margin:0;">Questions? Reply to this email or contact <a href="mailto:support@spherecx.app" style="color:#3b82f6;">support@spherecx.app</a></p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 SphereCX. You're receiving this because an account was created for you.</p>
    </div>
  </div>
</body>
</html>`
}

export function trialExpiryReminderEmail(params: {
  name: string
  orgName: string
  daysLeft: number
  upgradeUrl: string
}) {
  const { name, orgName, daysLeft, upgradeUrl } = params
  const urgency = daysLeft <= 3 ? '🚨 Urgent' : daysLeft <= 7 ? '⚠️ Reminder' : '📅 Heads up'

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0f1629;padding:28px 32px;">
      <h1 style="margin:0;color:white;font-size:22px;font-weight:600;">SphereCX</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">${urgency}: Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}</h2>
      <p style="color:#64748b;margin:0 0 20px;">Hi ${name}, your SphereCX trial for <strong>${orgName}</strong> is ending soon. Upgrade now to keep access to all your evaluations, scorecards, and coaching data.</p>
      <a href="${upgradeUrl}" style="display:block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:600;font-size:15px;">
        Upgrade Now →
      </a>
    </div>
  </div>
</body>
</html>`
}
