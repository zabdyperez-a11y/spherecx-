'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const AGENTS = ['Maria Lopez', 'Carlos Ruiz', 'Ana Torres', 'Luis Mora', 'Sofia Vega', 'Pedro Salas']

const SCORECARDS = [
  {
    id: '1', name: 'Inbound Sales Call', passScore: 80,
    sections: [
      { name: 'Opening', criteria: ['Did the agent greet the customer professionally?', "Did the agent confirm the customer's account details?"] },
      { name: 'Discovery', criteria: ['Did the agent ask open-ended questions?', "Did the agent identify the customer's main need?"] },
      { name: 'Pitch & Handling', criteria: ['Did the agent present a relevant solution?', 'Did the agent handle objections confidently?', 'Did the agent avoid over-promising?'] },
      { name: 'Closing', criteria: ['Did the agent attempt to close?', 'Did the agent summarize next steps clearly?', 'Did the agent thank the customer?'] },
    ]
  },
  {
    id: '2', name: 'Customer Support — Tier 1', passScore: 75,
    sections: [
      { name: 'Opening', criteria: ['Did the agent greet professionally?', 'Did the agent verify customer identity?'] },
      { name: 'Resolution', criteria: ['Did the agent understand the issue correctly?', 'Was the resolution appropriate?', 'Did the agent follow the correct process?'] },
      { name: 'Closing', criteria: ['Did the agent confirm resolution with the customer?', 'Did the agent offer additional help?'] },
    ]
  },
]

type Answer = 'yes' | 'partial' | 'no' | null
const SCORE_MAP: Record<string, number> = { yes: 1, partial: 0.5, no: 0 }

export default function NewEvaluationPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [agent, setAgent] = useState('')
  const [scorecardId, setScorecardId] = useState('')
  const [callDate, setCallDate] = useState('')
  const [callId, setCallId] = useState('')
  const [recordingUrl, setRecordingUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [criterionNotes, setCriterionNotes] = useState<Record<string, string>>({})
  const [aiReasons, setAiReasons] = useState<Record<string, string>>({})

  const [transcript, setTranscript] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiDone, setAiDone] = useState(false)

  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const scorecard = SCORECARDS.find(s => s.id === scorecardId)
  const allCriteria = scorecard?.sections.flatMap(s => s.criteria) ?? []
  const answered = allCriteria.filter(c => answers[c] != null).length
  const totalScore = allCriteria.length > 0
    ? Math.round((allCriteria.reduce((sum, c) => sum + (SCORE_MAP[answers[c] ?? ''] ?? 0), 0) / allCriteria.length) * 100)
    : 0
  const passed = scorecard ? totalScore >= scorecard.passScore : false

  const setAnswer = (criterion: string, value: Answer) =>
    setAnswers(a => ({ ...a, [criterion]: value }))

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setTranscript(ev.target?.result as string)
    reader.readAsText(file)
  }

  const handleAiScore = async () => {
    if (!transcript.trim()) { setAiError('Please paste a transcript or upload a file.'); return }
    if (!scorecardId) { setAiError('Please select a scorecard first.'); return }
    setAiError('')
    setAiLoading(true)
    setAiDone(false)

    const criteria = scorecard!.sections.flatMap(s =>
      s.criteria.map(c => ({ section: s.name, criterion: c }))
    )

    const prompt = `You are a QA evaluator for a call center. Analyze this call transcript and score each criterion.

TRANSCRIPT:
${transcript}

CRITERIA:
${criteria.map((c, i) => `${i + 1}. [${c.section}] ${c.criterion}`).join('\n')}

Respond ONLY with a valid JSON array — no other text, no markdown:
[{"criterion": "exact criterion text", "score": "yes" | "partial" | "no", "reason": "one sentence"}]`

    try {
      const res = await fetch('/api/ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      const text = data.text ?? ''
      const scores: { criterion: string; score: string; reason: string }[] = JSON.parse(text)

      const newAnswers: Record<string, Answer> = {}
      const newReasons: Record<string, string> = {}
      scores.forEach(s => {
        if (s.score === 'yes' || s.score === 'partial' || s.score === 'no') {
          newAnswers[s.criterion] = s.score
          newReasons[s.criterion] = s.reason
        }
      })
      setAnswers(newAnswers)
      setAiReasons(newReasons)
      setAiDone(true)
    } catch (e: any) {
      setAiError('AI scoring failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = (asDraft = false) => {
    if (!agent) { setError('Please select an agent.'); return }
    if (!scorecardId) { setError('Please select a scorecard.'); return }
    if (!callDate) { setError('Please enter the call date.'); return }
    if (!asDraft && answered < allCriteria.length) { setError('Please answer all criteria before submitting.'); return }
    setError('')
    setSubmitted(true)
    setTimeout(() => router.push('/evaluations'), 1200)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/evaluations" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">← Evaluations</Link>
            <span className="text-slate-200">/</span>
            <h1 className="text-xl font-semibold text-slate-900">New Evaluation</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleSubmit(true)}
              className="bg-white border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              Save as Draft
            </button>
            <button onClick={() => handleSubmit(false)}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${submitted ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              {submitted ? '✓ Submitted!' : 'Submit Evaluation'}
            </button>
          </div>
        </div>

        {error && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="grid grid-cols-3 gap-6">

          {/* Left column */}
          <div className="space-y-5">

            {/* Call details */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-700">Call Details</h2>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Agent *</label>
                <select value={agent} onChange={e => setAgent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400">
                  <option value="">Select agent...</option>
                  {AGENTS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Scorecard *</label>
                <select value={scorecardId} onChange={e => { setScorecardId(e.target.value); setAnswers({}); setAiReasons({}); setAiDone(false) }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400">
                  <option value="">Select scorecard...</option>
                  {SCORECARDS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Call Date *</label>
                <input type="date" value={callDate} onChange={e => setCallDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Call ID</label>
                <input type="text" value={callId} onChange={e => setCallId(e.target.value)} placeholder="e.g. CALL-4821"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Recording URL</label>
                <input type="url" value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)} placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400" />
                {recordingUrl && (
                  <a href={recordingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">▶ Play recording</a>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Overall Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="General feedback..." rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>

            {/* AI Auto-Score */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs">✦</span>
                  </div>
                  <h2 className="text-sm font-semibold text-slate-700">AI Auto-Score</h2>
                </div>
                <button onClick={() => setShowTranscript(!showTranscript)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  {showTranscript ? 'Hide' : 'Show'}
                </button>
              </div>

              {showTranscript && (
                <div className="space-y-3">
                  <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
                    placeholder="Paste the call transcript here..."
                    rows={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 resize-none" />
                  <div className="flex items-center gap-2">
                    <button onClick={() => fileRef.current?.click()}
                      className="flex-1 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors text-center">
                      ↑ Upload .txt file
                    </button>
                    <input ref={fileRef} type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                  </div>
                  {aiError && <p className="text-xs text-red-500">{aiError}</p>}
                  <button onClick={handleAiScore} disabled={aiLoading}
                    className={`w-full text-sm font-medium py-2.5 rounded-lg transition-all ${
                      aiLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : aiDone ? 'bg-emerald-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}>
                    {aiLoading ? '⟳ Analyzing transcript...' : aiDone ? '✓ Scores applied!' : '✦ Auto-Score with AI'}
                  </button>
                  {aiDone && (
                    <p className="text-xs text-slate-400 text-center">All criteria scored. Review and adjust below.</p>
                  )}
                </div>
              )}

              {!showTranscript && (
                <p className="text-xs text-slate-400">Paste a transcript and Claude will automatically score every criterion. You can still edit any answer.</p>
              )}
            </div>

            {/* Live score */}
            {scorecard && (
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Live Score</h2>
                <div className="flex items-center justify-center mb-3">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                      <circle cx="48" cy="48" r="40" fill="none"
                        stroke={totalScore >= scorecard.passScore ? '#3b82f6' : '#ef4444'}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - totalScore / 100)}`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900">{totalScore}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <span className={`text-sm font-semibold ${passed ? 'text-emerald-600' : answered === 0 ? 'text-slate-400' : 'text-red-500'}`}>
                    {answered === 0 ? 'Not started' : passed ? '✓ Pass' : '✗ Fail'}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{answered}/{allCriteria.length} answered · Pass at {scorecard.passScore}%</p>
                </div>
              </div>
            )}
          </div>

          {/* Right — scoring */}
          <div className="col-span-2 space-y-5">
            {!scorecard ? (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center shadow-sm">
                <p className="text-slate-400 text-sm">Select a scorecard to start scoring</p>
              </div>
            ) : (
              <>
                {aiDone && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="text-indigo-500 text-lg">✦</span>
                    <div>
                      <p className="text-sm font-medium text-indigo-700">AI scoring complete</p>
                      <p className="text-xs text-indigo-500">All criteria have been scored. Review each answer and adjust if needed.</p>
                    </div>
                  </div>
                )}
                {scorecard.sections.map((section, si) => (
                  <div key={si} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-700">{section.name}</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {section.criteria.map((criterion, ci) => (
                        <div key={ci} className={`px-5 py-4 ${answers[criterion] ? 'bg-white' : ''}`}>
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <p className="text-sm text-slate-700 flex-1">{criterion}</p>
                            <div className="flex gap-1.5 flex-shrink-0">
                              {(['yes', 'partial', 'no'] as const).map(val => (
                                <button key={val} onClick={() => setAnswer(criterion, val)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                                    answers[criterion] === val
                                      ? val === 'yes' ? 'bg-emerald-500 text-white border-emerald-500'
                                        : val === 'partial' ? 'bg-amber-400 text-white border-amber-400'
                                        : 'bg-red-500 text-white border-red-500'
                                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
                                  }`}>
                                  {val === 'yes' ? 'Yes' : val === 'partial' ? 'Partial' : 'No'}
                                </button>
                              ))}
                            </div>
                          </div>
                          {aiReasons[criterion] && (
                            <p className="text-xs text-indigo-500 mb-1.5 flex items-center gap-1">
                              <span>✦</span> {aiReasons[criterion]}
                            </p>
                          )}
                          <input type="text" value={criterionNotes[criterion] ?? ''}
                            onChange={e => setCriterionNotes(n => ({ ...n, [criterion]: e.target.value }))}
                            placeholder="Add a note (optional)"
                            className="w-full text-xs text-slate-500 placeholder-slate-300 bg-transparent border-b border-slate-100 pb-1 focus:outline-none focus:border-blue-300 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
