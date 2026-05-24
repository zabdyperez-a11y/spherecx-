'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

type Agent = { id: string; name: string }
type Criterion = { id: string; question: string; isCritical: boolean }
type Section = { id: string; name: string; criteria: Criterion[] }
type Scorecard = { id: string; name: string; passScore?: number; sections: Section[] }

const SCORE_MAP: Record<string, number> = { yes: 1, partial: 0.5, no: 0 }
type Answer = 'yes' | 'partial' | 'no' | null

export default function NewEvaluationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileRef = useRef<HTMLInputElement>(null)

  const [agents, setAgents] = useState<Agent[]>([])
  const [scorecards, setScorecards] = useState<Scorecard[]>([])

  const [agentId, setAgentId] = useState(searchParams.get('agent') || '')
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
  const [aiDone, setAiDone] = useState(false)
  const [aiError, setAiError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [coaching, setCoaching] = useState<any>(null)
  const [coachingLoading, setCoachingLoading] = useState(false)

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(data => setAgents(Array.isArray(data) ? data : []))
    fetch('/api/scorecards').then(r => r.json()).then(data => setScorecards(Array.isArray(data) ? data : []))
  }, [])

  const scorecard = scorecards.find(s => s.id === scorecardId)
  const allCriteria = scorecard?.sections.flatMap(s => s.criteria) ?? []
  const answered = allCriteria.filter(c => answers[c.id] != null).length
  const totalScore = allCriteria.length > 0
    ? Math.round((allCriteria.reduce((sum, c) => sum + (SCORE_MAP[answers[c.id] ?? ''] ?? 0), 0) / allCriteria.length) * 100)
    : 0
  const passScore = scorecard?.passScore ?? 80
  const passed = totalScore >= passScore

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setTranscript(ev.target?.result as string)
    reader.readAsText(file)
  }

  const handleAiScore = async () => {
    if (!transcript.trim()) { setAiError('Please paste a transcript first.'); return }
    if (!scorecardId) { setAiError('Please select a scorecard first.'); return }
    setAiError(''); setAiLoading(true); setAiDone(false)

    const criteria = scorecard!.sections.flatMap(s => s.criteria.map(c => ({ id: c.id, section: s.name, criterion: c.question })))
    const prompt = `You are a QA evaluator. Analyze this transcript and score each criterion.

TRANSCRIPT:
${transcript}

CRITERIA:
${criteria.map((c, i) => `${i + 1}. [${c.section}] ${c.criterion} (ID: ${c.id})`).join('\n')}

Respond ONLY with a valid JSON array:
[{"id": "criterion_id", "score": "yes"|"partial"|"no", "reason": "one sentence"}]`

    try {
      const res = await fetch('/api/ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      let text = data.text ?? ''
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const scores = JSON.parse(text)
      const newAnswers: Record<string, Answer> = {}
      const newReasons: Record<string, string> = {}
      scores.forEach((s: any) => {
        if (s.score === 'yes' || s.score === 'partial' || s.score === 'no') {
          newAnswers[s.id] = s.score
          newReasons[s.id] = s.reason
        }
      })
      setAnswers(newAnswers); setAiReasons(newReasons); setAiDone(true)
    } catch {
      setAiError('AI scoring failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const generateCoaching = async () => {
    if (!agentId || answered === 0) return
    setCoachingLoading(true)
    const agent = agents.find(a => a.id === agentId)
    try {
      const answersMap: Record<string, string> = {}
      allCriteria.forEach(c => { if (answers[c.id]) answersMap[c.question] = answers[c.id]! })
      const res = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agent?.name, scorecard: scorecard?.name, score: totalScore, passed, answers: answersMap, transcript, notes }),
      })
      setCoaching(await res.json())
    } catch {} finally { setCoachingLoading(false) }
  }

  const handleSubmit = async (asDraft = false) => {
    if (!agentId) { setError('Please select an agent.'); return }
    if (!scorecardId) { setError('Please select a scorecard.'); return }
    if (!callDate) { setError('Please enter the call date.'); return }
    if (!asDraft && answered < allCriteria.length) { setError('Please answer all criteria before submitting.'); return }
    setError(''); setSaving(true)
    try {
      const answersPayload = allCriteria.map(c => ({
        criterionId: c.id,
        score: answers[c.id] === 'yes' ? 2 : answers[c.id] === 'partial' ? 1 : 0,
        note: criterionNotes[c.id] || null,
      }))
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId, scorecardId, evaluatorId: agentId,
          callDate, callId, recordingUrl, notes,
          totalScore, passed, status: asDraft ? 'DRAFT' : 'SUBMITTED',
          answers: answersPayload,
        }),
      })
      if (res.ok) router.push('/evaluations')
      else { const d = await res.json(); setError(d.error || 'Failed to save.') }
    } catch { setError('Failed to save.') } finally { setSaving(false) }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/evaluations" className="text-slate-400 hover:text-slate-600 text-sm">← Evaluations</Link>
            <span className="text-slate-200">/</span>
            <h1 className="text-xl font-semibold text-slate-900">New Evaluation</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleSubmit(true)} disabled={saving}
              className="bg-white border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              Save as Draft
            </button>
            <button onClick={() => handleSubmit(false)} disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Submit Evaluation'}
            </button>
          </div>
        </div>

        {error && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-700">Call Details</h2>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Agent *</label>
                <select value={agentId} onChange={e => setAgentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400">
                  <option value="">Select agent...</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                {agents.length === 0 && <p className="text-xs text-amber-500 mt-1">No agents found. <Link href="/agents" className="underline">Add agents first →</Link></p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Scorecard *</label>
                <select value={scorecardId} onChange={e => { setScorecardId(e.target.value); setAnswers({}); setAiReasons({}); setAiDone(false) }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400">
                  <option value="">Select scorecard...</option>
                  {scorecards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Recording URL</label>
                <input type="url" value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)} placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400" />
                {recordingUrl && <a href={recordingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">▶ Play recording</a>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Overall Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="General feedback..." rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-xs">✦</div>
                  <h2 className="text-sm font-semibold text-slate-700">AI Auto-Score</h2>
                </div>
                <button onClick={() => setShowTranscript(!showTranscript)} className="text-xs text-blue-600 font-medium">{showTranscript ? 'Hide' : 'Show'}</button>
              </div>
              {showTranscript && (
                <div className="space-y-3">
                  <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Paste the call transcript here..." rows={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 resize-none" />
                  <button onClick={() => fileRef.current?.click()} className="w-full text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 text-center">↑ Upload .txt file</button>
                  <input ref={fileRef} type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                  {aiError && <p className="text-xs text-red-500">{aiError}</p>}
                  <button onClick={handleAiScore} disabled={aiLoading}
                    className={`w-full text-sm font-medium py-2.5 rounded-lg transition-all ${aiLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : aiDone ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                    {aiLoading ? '⟳ Analyzing...' : aiDone ? '✓ Scores applied!' : '✦ Auto-Score with AI'}
                  </button>
                </div>
              )}
              {!showTranscript && <p className="text-xs text-slate-400">Paste a transcript and AI will score every criterion automatically.</p>}
            </div>

            {scorecard && (
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Live Score</h2>
                <div className="flex items-center justify-center mb-3">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                      <circle cx="48" cy="48" r="40" fill="none" stroke={totalScore >= passScore ? '#3b82f6' : '#ef4444'} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - totalScore / 100)}`} />
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
                  <p className="text-xs text-slate-400 mt-1">{answered}/{allCriteria.length} answered · Pass at {passScore}%</p>
                </div>
              </div>
            )}
          </div>

          <div className="col-span-2 space-y-5">
            {!scorecard ? (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center shadow-sm">
                <p className="text-slate-400 text-sm">Select a scorecard to start scoring</p>
                {scorecards.length === 0 && <p className="text-xs text-slate-300 mt-2">No scorecards yet. <Link href="/scorecards/new" className="text-blue-500 underline">Create one first →</Link></p>}
              </div>
            ) : (
              <>
                {aiDone && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="text-indigo-500">✦</span>
                    <div>
                      <p className="text-sm font-medium text-indigo-700">AI scoring complete</p>
                      <p className="text-xs text-indigo-500">Review and adjust any answers before submitting.</p>
                    </div>
                  </div>
                )}
                {scorecard.sections.map((section, si) => (
                  <div key={section.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-700">{section.name}</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {section.criteria.map((criterion) => (
                        <div key={criterion.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <p className="text-sm text-slate-700 flex-1">
                              {criterion.question}
                              {criterion.isCritical && <span className="ml-2 text-xs text-red-500 font-medium">Critical</span>}
                            </p>
                            <div className="flex gap-1.5 flex-shrink-0">
                              {(['yes', 'partial', 'no'] as const).map(val => (
                                <button key={val} onClick={() => setAnswers(a => ({ ...a, [criterion.id]: val }))}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                                    answers[criterion.id] === val
                                      ? val === 'yes' ? 'bg-emerald-500 text-white border-emerald-500'
                                        : val === 'partial' ? 'bg-amber-400 text-white border-amber-400'
                                        : 'bg-red-500 text-white border-red-500'
                                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                  }`}>
                                  {val === 'yes' ? 'Yes' : val === 'partial' ? 'Partial' : 'No'}
                                </button>
                              ))}
                            </div>
                          </div>
                          {aiReasons[criterion.id] && <p className="text-xs text-indigo-500 mb-1.5">✦ {aiReasons[criterion.id]}</p>}
                          <input type="text" value={criterionNotes[criterion.id] ?? ''} onChange={e => setCriterionNotes(n => ({ ...n, [criterion.id]: e.target.value }))}
                            placeholder="Add a note (optional)"
                            className="w-full text-xs text-slate-500 placeholder-slate-300 bg-transparent border-b border-slate-100 pb-1 focus:outline-none focus:border-blue-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {answered > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-xs">✦</div>
                        <p className="text-sm font-semibold text-slate-700">AI Coaching Summary</p>
                      </div>
                      {!coaching && (
                        <button onClick={generateCoaching} disabled={coachingLoading}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${coachingLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                          {coachingLoading ? '⟳ Generating...' : '✦ Generate Coaching Report'}
                        </button>
                      )}
                    </div>
                    {!coaching && !coachingLoading && (
                      <div className="px-5 py-8 text-center">
                        <p className="text-sm text-slate-400">Generate a personalized coaching report for this agent.</p>
                      </div>
                    )}
                    {coachingLoading && <div className="px-5 py-8 text-center text-sm text-indigo-400">✦ Analyzing and generating coaching report...</div>}
                    {coaching && !coaching.error && (
                      <div className="px-5 py-5 space-y-5">
                        <div className="bg-indigo-50 rounded-lg px-4 py-3 border border-indigo-100">
                          <p className="text-sm font-semibold text-indigo-800">{coaching.headline}</p>
                          <p className="text-sm text-indigo-700 mt-1">{coaching.overallFeedback}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">✓ Strengths</p>
                          <ul className="space-y-2">{coaching.strengths?.map((s: string, i: number) => <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-emerald-500 flex-shrink-0">●</span>{s}</li>)}</ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">↑ Areas to Improve</p>
                          <ul className="space-y-2">{coaching.improvements?.map((s: string, i: number) => <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-amber-400 flex-shrink-0">●</span>{s}</li>)}</ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">→ Action Items</p>
                          <ul className="space-y-1.5">{coaching.actionItems?.map((s: string, i: number) => <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-blue-400 font-bold flex-shrink-0">{i + 1}.</span>{s}</li>)}</ul>
                        </div>
                        <div className="border-t border-slate-100 pt-4">
                          <p className="text-sm text-slate-500 italic">{coaching.coachingNote}</p>
                        </div>
                        <button onClick={() => setCoaching(null)} className="text-xs text-slate-400 hover:text-slate-600">Regenerate ↺</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
