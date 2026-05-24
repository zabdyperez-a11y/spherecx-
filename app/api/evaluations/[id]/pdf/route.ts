export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
      include: {
        scorecard: { include: { sections: { include: { criteria: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } } },
        agent: true, evaluator: true,
        answers: { include: { criterion: true } },
      },
    })

    if (!evaluation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const SCORE_LABEL: Record<number, string> = { 2: 'Yes', 1: 'Partial', 0: 'No' }
    const SCORE_COLOR: Record<number, string> = { 2: '#059669', 1: '#d97706', 0: '#dc2626' }

    const sections = evaluation.scorecard?.sections.map(section => {
      const sectionAnswers = evaluation.answers.filter(a =>
        section.criteria.some(c => c.question === a.criterion.question)
      )
      const sectionScore = sectionAnswers.length > 0
        ? Math.round((sectionAnswers.reduce((s, a) => s + a.score, 0) / (sectionAnswers.length * 2)) * 100)
        : 0
      return { section, sectionAnswers, sectionScore }
    }) ?? []

    // Generate HTML that will be converted to PDF via print
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Evaluation Report — ${evaluation.agent?.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #0f172a; background: white; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #0f1629; margin-bottom: 24px; }
  .logo { font-size: 22px; font-weight: 700; color: #0f1629; letter-spacing: -0.5px; }
  .logo span { color: #3b82f6; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .pass { background: #dcfce7; color: #059669; }
  .fail { background: #fee2e2; color: #dc2626; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 28px; }
  .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
  .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 4px; }
  .meta-value { font-size: 16px; font-weight: 700; color: #0f172a; }
  .score-hero { text-align: center; padding: 24px; background: #f8fafc; border-radius: 12px; margin-bottom: 28px; }
  .score-number { font-size: 64px; font-weight: 800; color: ${(evaluation.totalScore ?? 0) >= 80 ? '#2563eb' : '#dc2626'}; line-height: 1; }
  .score-label { font-size: 14px; color: #64748b; margin-top: 8px; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; background: #f1f5f9; padding: 10px 16px; margin: 0 -40px; padding-left: 40px; padding-right: 40px; border-top: 1px solid #e2e8f0; }
  .criterion-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .criterion-q { flex: 1; padding-right: 16px; color: #374151; line-height: 1.4; }
  .criterion-score { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px; white-space: nowrap; }
  .criterion-note { font-size: 11px; color: #94a3b8; margin-top: 4px; font-style: italic; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">Sphere<span>CX</span></div>
    <div style="text-align:right">
      <div style="font-size:18px;font-weight:700;">Evaluation Report</div>
      <div style="color:#64748b;margin-top:4px;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-label">Agent</div>
      <div class="meta-value" style="font-size:14px;">${evaluation.agent?.name || '—'}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Scorecard</div>
      <div class="meta-value" style="font-size:13px;">${evaluation.scorecard?.name || '—'}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Call Date</div>
      <div class="meta-value" style="font-size:13px;">${new Date(evaluation.callDate).toLocaleDateString()}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Evaluator</div>
      <div class="meta-value" style="font-size:13px;">${evaluation.evaluator?.name || '—'}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Call ID</div>
      <div class="meta-value" style="font-size:13px;">${evaluation.callId || '—'}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Status</div>
      <div class="meta-value" style="font-size:13px;">${evaluation.status}</div>
    </div>
  </div>

  <div class="score-hero">
    <div class="score-number">${evaluation.totalScore ?? 0}%</div>
    <div class="score-label">Overall Score</div>
    <div style="margin-top:12px;">
      <span class="badge ${evaluation.passed ? 'pass' : 'fail'}">${evaluation.passed ? '✓ PASS' : '✗ FAIL'}</span>
    </div>
  </div>

  ${sections.map(({ section, sectionAnswers, sectionScore }) => `
  <div class="section-title">${section.name} — ${sectionScore}%</div>
  <div style="margin-bottom:8px;">
    ${section.criteria.map(criterion => {
      const answer = sectionAnswers.find(a => a.criterion.question === criterion.question)
      const score = answer?.score ?? -1
      const color = score >= 0 ? SCORE_COLOR[score] : '#94a3b8'
      const label = score >= 0 ? SCORE_LABEL[score] : 'N/A'
      return `
      <div class="criterion-row">
        <div class="criterion-q">
          ${criterion.question}
          ${criterion.isCritical ? '<span style="color:#ef4444;font-size:10px;font-weight:600;margin-left:6px;">CRITICAL</span>' : ''}
          ${answer?.note ? `<div class="criterion-note">"${answer.note}"</div>` : ''}
        </div>
        <span class="criterion-score" style="background:${color}20;color:${color};">${label}</span>
      </div>`
    }).join('')}
  </div>
  `).join('')}

  ${evaluation.notes ? `<div style="margin-top:24px;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;"><div style="font-size:11px;font-weight:700;color:#92400e;margin-bottom:6px;">EVALUATOR NOTES</div><div style="color:#78350f;">${evaluation.notes}</div></div>` : ''}

  <div class="footer">
    <span>SphereCX QA Platform</span>
    <span>Evaluation ID: ${evaluation.id}</span>
    <span>Generated ${new Date().toLocaleString()}</span>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Evaluation-Id': params.id,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
