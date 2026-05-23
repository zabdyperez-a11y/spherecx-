import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { agent, scorecard, score, passed, answers, transcript, notes } = await req.json()

    const criteriaResults = Object.entries(answers)
      .map(([criterion, result]) => `- ${criterion}: ${result}`)
      .join('\n')

    const prompt = `You are an expert call center coach. An evaluation was just completed for ${agent}.

SCORECARD: ${scorecard}
OVERALL SCORE: ${score}% (${passed ? 'PASS' : 'FAIL'})

CRITERIA RESULTS:
${criteriaResults}

${transcript ? `CALL TRANSCRIPT EXCERPT:\n${transcript.slice(0, 1500)}` : ''}

${notes ? `EVALUATOR NOTES: ${notes}` : ''}

Generate a personalized coaching summary. Respond ONLY with a valid JSON object, no markdown, no backticks:
{
  "headline": "One encouraging sentence summarizing their performance (use their first name)",
  "overallFeedback": "2-3 sentences of honest, specific overall assessment",
  "strengths": ["3 specific strengths based on what they did well, each 1-2 sentences"],
  "improvements": ["2-3 specific areas to improve, each with a concrete actionable tip"],
  "actionItems": ["3 specific action items for next call, short and actionable"],
  "coachingNote": "One motivating closing sentence personalized to their situation"
}`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: 'You are an expert call center coach. Always respond with ONLY valid JSON. No markdown, no backticks, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await res.json()
    let text = data.choices?.[0]?.message?.content ?? ''
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const summary = JSON.parse(text)
    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate coaching summary' }, { status: 500 })
  }
}
