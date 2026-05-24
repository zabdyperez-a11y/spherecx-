'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

type Answer = { id: string; score: number; note: string | null; criterion: { question: string; isCritical: boolean } }
type Evaluation = {
  id: string; totalScore: number | null; passed: boolean | null
  callId: string | null; callDate: string; recordingUrl: string | null
  notes: string | null; status: string; createdAt: string
  agent: { id: string; name: string | null; email: string }
  evaluator: { id: string; name: string | null }
  scorecard: { name: string; sections: { id: string; name: string; criteria: { id: string; question: string; isCritical: boolean }[] }[] }
  answers: Answer[]
}

const SCORE_LABEL: Record<number, { label: string; color: string }> = {
  2: { label: 'Yes', color: 'bg-emerald-50 text-emerald-600' },
  1: { label: 'Partial', color: 'bg-amber-50 text-amber-600' },
  0: { label: 'No', color: 'bg-red-50 text-red-500' },
}

const STATUS_ACTIONS: Record<string, { next: string; label: string; color: string }[]> = {
  SUBMITTED: [{ next: 'DISPUTED', label: 'Dispute', color: 'bg-orange-50 text-orange-500 border-orange-200' }],
  DISPUTED: [{ next: 'RESOLVED', label: 'Mark Resolved', color: 'bg-blue-50 text-blue-600 border-blue-200' }],
  DRAFT: [{ next: 'SUBMITTED', label: 'Submit', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' }],
  RESOLVED: [],
}

export default function EvaluationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetch(`/api/evaluations/${id}`)
      .then(r => r.json())
      .then(data => { setEvaluation(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const updateStatus = async (status: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/evaluations/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setEvaluation(e => e ? { ...e, status: updated.status } : null)
      }
    } catch {} finally { setUpdating(false) }
  }

  const getAnswerForCriterion = (criterionId: string) =>
    evaluation?.answers.find(a => a.criterion.question === evaluation.scorecard.sections.flatMap(s => s.criteria).find(c => c.id === criterionId)?.question)

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50"><Sidebar />
      <main className="flex-1 flex items-center justify-center"><p className="text-slate-400 text-sm">Loading...</p></main>
    </div>
  )

  if (!evaluation) return (
    <div className="flex min-h-screen bg-slate-50"><Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-2">Evaluation not found.</p>
          <Link href="/evaluations" className="text-blue-600 text-sm">← Back to evaluations</Link>
        </div>
      </main>
    </div>
  )

  const statusActions = STATUS_ACTIONS[evaluation.status] || []
  const STATUS_STYLE: Record<string, string> = {
    SUBMITTED: 'bg-emerald-50 text-emerald-600',
    DRAFT: 'bg-slate-100 text-slate-500',
    DISPUTED: 'bg-orange-50 text-orange-500',
    RESOLVED: 'bg-blue-50 text-blue-600',
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/evaluations" className="text-slate-400 hover:text-slate-600 text-sm">← Evaluations</Link>
            <span className="text-slate-200">/</span>
            <h1 className="text-xl font-semibold text-slate-900">
              {evaluation.agent?.name} — {evaluation.scorecard?.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_STYLE[evaluation.status]}`}>{evaluation.status}</span>
            {statusActions.map(action => (
              <button key={action.next} onClick={() => updateStatus(action.next)} disabled={updating}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${action.color}`}>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: call details + score */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Call Details</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Agent', value: evaluation.agent?.name || '—' },
                  { label: 'Evaluator', value: evaluation.evaluator?.name || '—' },
                  { label: 'Scorecard', value: evaluation.scorecard?.name },
                  { label: 'Call Date', value: new Date(evaluation.callDate).toLocaleDateString() },
                  { label: 'Call ID', value: evaluation.callId || '—' },
                  { label: 'Evaluated', value: new Date(evaluation.createdAt).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
              {evaluation.recordingUrl && (
                <a href={evaluation.recordingUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-4 block text-center text-xs text-blue-600 border border-blue-100 bg-blue-50 rounded-lg py-2 hover:bg-blue-100">
                  ▶ Play Recording
                </a>
              )}
            </div>

            {/* Score card */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm text-center">
              <p className="text-xs text-slate-400 mb-3">Overall Score</p>
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle cx="48" cy="48" r="40" fill="none"
                    stroke={evaluation.passed ? '#3b82f6' : '#ef4444'} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - (evaluation.totalScore ?? 0) / 100)}`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{evaluation.totalScore ?? 0}%</span>
                </div>
              </div>
              <span className={`text-sm font-semibold ${evaluation.passed ? 'text-emerald-600' : 'text-red-500'}`}>
                {evaluation.passed ? '✓ Pass' : '✗ Fail'}
              </span>
            </div>

            {evaluation.notes && (
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Evaluator Notes</p>
                <p className="text-sm text-slate-600">{evaluation.notes}</p>
              </div>
            )}
          </div>

          {/* Right: scored criteria */}
          <div className="col-span-2 space-y-4">
            {evaluation.scorecard?.sections.map(section => {
              const sectionAnswers = evaluation.answers.filter(a =>
                section.criteria.some(c => c.question === a.criterion.question)
              )
              const sectionScore = sectionAnswers.length > 0
                ? Math.round((sectionAnswers.reduce((sum, a) => sum + a.score, 0) / (sectionAnswers.length * 2)) * 100)
                : null

              return (
                <div key={section.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">{section.name}</h3>
                    {sectionScore !== null && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${sectionScore >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {sectionScore}%
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-50">
                    {section.criteria.map(criterion => {
                      const answer = evaluation.answers.find(a => a.criterion.question === criterion.question)
                      const scoreInfo = answer ? SCORE_LABEL[answer.score] : null
                      return (
                        <div key={criterion.id} className="px-5 py-3.5">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm text-slate-700 flex-1">
                              {criterion.question}
                              {criterion.isCritical && <span className="ml-2 text-xs text-red-400 font-medium">Critical</span>}
                            </p>
                            {scoreInfo ? (
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${scoreInfo.color}`}>
                                {scoreInfo.label}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300 flex-shrink-0">Not scored</span>
                            )}
                          </div>
                          {answer?.note && (
                            <p className="text-xs text-slate-400 mt-1.5 italic">Note: {answer.note}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
