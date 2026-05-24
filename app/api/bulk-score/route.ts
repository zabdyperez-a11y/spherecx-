export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { transcripts, scorecardId, criteria } = await req.json()
    // Score each transcript with AI
    const results = await Promise.all(
      transcripts.map(async (t: { id: string; content: string; agentName?: string }) => {
        const prompt = `You are a QA evaluator. Analyze this call transcript and score each criterion.

TRANSCRIPT:
${t.content.slice(0, 2000)}

CRITERIA:
${criteria.map((c: any, i: number) => `${i + 1}. ${c.question} (ID: ${c.id})`).join('\n')}

Respond ONLY with a valid JSON array:
[{"id": "criterion_id", "score": "yes"|"partial"|"no", "reason": "one sentence"}]`

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o', max_tokens: 800,
            messages: [
              { role: 'system', content: 'You are a QA evaluator. Respond with ONLY valid JSON array, no markdown.' },
              { role: 'user', content: prompt },
            ],
          }),
        })
        const data = await res.json()
        let text = data.choices?.[0]?.message?.content ?? '[]'
        text = text.replace(/`{3}json/g, '').replace(/`{3}/g, '').trim()
        const scores = JSON.parse(text)
        const total = scores.length > 0
          ? Math.round((scores.reduce((sum: number, s: any) => {
              return sum + (s.score === 'yes' ? 1 : s.score === 'partial' ? 0.5 : 0)
            }, 0) / scores.length) * 100)
          : 0
        return { id: t.id, agentName: t.agentName, scores, totalScore: total, passed: total >= 80 }
      })
    )
    return NextResponse.json(results)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
