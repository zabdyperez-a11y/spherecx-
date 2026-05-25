export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { transcript, criteria } = await req.json()

    const criteriaList = criteria.map((c: any, i: number) => `${i + 1}. ${c.question} (ID: ${c.id})`).join('\n')

    const prompt = 'You are a QA evaluator for a call center. Analyze this transcript and score each criterion.\n\nTRANSCRIPT:\n' + transcript.slice(0, 3000) + '\n\nCRITERIA:\n' + criteriaList + '\n\nRespond ONLY with a valid JSON array. No markdown, no explanation.\n[{"id": "criterion_id", "score": "yes" or "partial" or "no", "reason": "one sentence"}]'

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'You are a QA evaluator. Respond with ONLY valid JSON array, no markdown.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? '[]'
    return NextResponse.json({ text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
