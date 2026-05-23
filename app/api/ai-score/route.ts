import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

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
          {
            role: 'system',
            content: 'You are a QA evaluator. Always respond with ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the raw JSON array.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    })

    const data = await res.json()
    let text = data.choices?.[0]?.message?.content ?? ''
    // Strip any markdown wrapping just in case
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json({ text })
  } catch (error) {
    return NextResponse.json({ error: 'AI scoring failed' }, { status: 500 })
  }
}
