export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { agent, scorecard, answers } = await req.json()

    const criteriaText = Object.entries(answers as Record<string, string>)
      .map(([criterion, result]) => `- ${criterion}: ${result}`)
      .join('\n')

    const prompt = `You are an expert call center coach. An evaluation was just completed for ${agent}.

Scorecard: ${scorecard}

Results:
${criteriaText}

Write a professional, specific coaching summary (3-4 paragraphs) that:
1. Acknowledges what the agent did well
2. Identifies the specific areas that need improvement
3. Gives concrete, actionable steps to improve
4. Ends with an encouraging note

Be specific, not generic. Reference the actual criteria results.`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 600,
        messages: [
          { role: 'system', content: 'You are an expert call center QA coach.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await res.json()
    const coaching = data.choices?.[0]?.message?.content ?? 'Unable to generate coaching summary.'
    return NextResponse.json({ coaching })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
