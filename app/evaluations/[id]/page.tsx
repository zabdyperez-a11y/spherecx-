'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

type Comment = { id: string; userName: string; userRole: string | null; content: string; createdAt: string }
type Answer = { id: string; score: number; note: string | null; criterion: { question: string; isCritical: boolean } }
type Evaluation = {
  id: string; totalScore: number | null; passed: boolean | null
  callId: string | null; callDate: string; recordingUrl: string | null
  notes: string | null; status: string; createdAt: string
  acknowledgedAt: string | null; acknowledgedBy: string | null
  agent: { id: string; name: string | null; email: string }
  evaluator: { id: string; name: string | null }
  scorecard: { name: string; sections: { id: string; name: string; criteria: { id: string; question: string; isCritical: boolean }[] }[] }
  answers: Answer[]
}

const SCORE_LABEL: Record<number, { label: string; color: string }> = {
  2: { label: 'Yes', color: 'badge-green' },
  1: { label: 'Partial', color: 'badge-amber' },
  0: { label: 'No', color: 'badge-red' },
}

const STATUS_STYLE: Record<string, string> = {
  SUBMITTED: 'badge-green', DRAFT: 'badge-slate',
  DISPUTED: 'bg-orange-50 text-orange-600 badge', RESOLVED: 'badge-blue',
  ACKNOWLEDGED: 'bg-purple-50 text-purple-600 badge',
}

export default function EvaluationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [userRole, setUserRole] = useState('SUPER_ADMIN')

  useEffect(() => {
    try {
      const match = document.cookie.split(';').find(c => c.trim().startsWith('spherecx_user='))
      if (match) {
        const user = JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')))
        setUserRole(user.role || 'AGENT')
      }
    } catch {}

    fetch(`/api/evaluations/${id}`)
      .then(r => r.json())
      .then(data => { setEvaluation(data); setLoading(false) })
      .catch(() => setLoading(false))

    fetch(`/api/evaluations/${id}/comments`)
      .then(r => r.json())
      .then(data => setComments(Array.isArray(data) ? data : []))
  }, [id])

  const updateStatus = async (status: string) => {
    setUpdating(true)
    const res = await fetch(`/api/evaluations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setEvaluation(e => e ? { ...e, status: updated.status } : null)
    }
    setUpdating(false)
  }

  const acknowledge = async () => {
    setAcknowledging(true)
    const res = await fetch(`/api/evaluations/${id}/acknowledge`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setEvaluation(e => e ? { ...e, status: 'ACKNOWLEDGED', acknowledgedAt: updated.acknowledgedAt, acknowledgedBy: updated.acknowledgedBy } : null)
    }
    setAcknowledging(false)
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    setSubmittingComment(true)
    const res = await fetch(`/api/evaluations/${id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    })
    if (res.ok) {
      const comment = await res.json()
      setComments(c => [...c, comment])
      setNewComment('')
    }
    setSubmittingComment(false)
  }

  const exportPDF = () => {
    if (!evaluation) return
    setExportingPdf(true)

    const content = `
SPHERECX — EVALUATION REPORT
================================
Agent: ${evaluation.agent?.name || '—'}
Scorecard: ${evaluation.scorecard?.name}
Call Date: ${new Date(evaluation.callDate).toLocaleDateString()}
Call ID: ${evaluation.callId || '—'}
Evaluated: ${new Date(evaluation.createdAt).toLocaleString()}
Evaluator: ${evaluation.evaluator?.name || '—'}

OVERALL SCORE: ${evaluation.totalScore ?? 0}% — ${evaluation.passed ? 'PASS' : 'FAIL'}
STATUS: ${evaluation.status}

================================
CRITERIA BREAKDOWN
================================
${evaluation.scorecard?.sections?.map(section => `
${section.name.toUpperCase()}
${section.criteria.map(criterion => {
  const answer = evaluation.answers.find(a => a.criterion.question === criterion.question)
  const scoreLabel = answer ? (answer.score === 2 ? 'YES' : answer.score === 1 ? 'PARTIAL' : 'NO') : 'NOT SCORED'
  return `  [${scoreLabel}] ${criterion.question}${answer?.note ? `\n        Note: ${answer.note}` : ''}`
}).join('\n')}
`).join('\n') || ''}

================================
${evaluation.notes ? `EVALUATOR NOTES\n${evaluation.notes}\n\n================================` : ''}
${evaluation.acknowledgedAt ? `ACKNOWLEDGED BY: ${evaluation.acknowledgedBy} on ${new Date(evaluation.acknowledgedAt).toLocaleString()}` : 'NOT YET ACKNOWLEDGED'}

Generated by SphereCX on ${new Date().toLocaleString()}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evaluation-${evaluation.agent?.name?.replace(/\s+/g, '-') || 'report'}-${new Date(evaluation.callDate).toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setExportingPdf(false)
  }

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
          <Link href="/evaluations" className="text-blue-600 text-sm">← Back</Link>
        </div>
      </main>
    </div>
  )

  const canAcknowledge = ['SUBMITTED', 'RESOLVED'].includes(evaluation.status) && !evaluation.acknowledgedAt
  const canDispute = evaluation.status === 'SUBMITTED'
  const canResolve = evaluation.status === 'DISPUTED'
  const isAgent = userRole === 'AGENT'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/evaluations" className="text-slate-400 hover:text-slate-600 text-sm">← Evaluations</Link>
            <span className="text-slate-200">/</span>
            <h1 className="text-xl font-semibold text-slate-900">{evaluation.agent?.name} — {evaluation.scorecard?.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportPDF} disabled={exportingPdf}
              className="btn-secondary text-xs flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export
            </button>
            <span className={STATUS_STYLE[evaluation.status] || 'badge-slate'}>{evaluation.status}</span>
            {canAcknowledge && (
              <button onClick={acknowledge} disabled={acknowledging}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {acknowledging ? 'Acknowledging...' : '✓ Acknowledge'}
              </button>
            )}
            {!isAgent && canDispute && (
              <button onClick={() => updateStatus('DISPUTED')} disabled={updating}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors disabled:opacity-50">
                Dispute
              </button>
            )}
            {!isAgent && canResolve && (
              <button onClick={() => updateStatus('RESOLVED')} disabled={updating}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50">
                Mark Resolved
              </button>
            )}
          </div>
        </div>

        {evaluation.acknowledgedAt && (
          <div className="mb-5 px-4 py-3 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-700">
            ✓ Acknowledged by <strong>{evaluation.acknowledgedBy}</strong> on {new Date(evaluation.acknowledgedAt).toLocaleString()}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Left panel */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Call Details</h2>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: 'Agent', value: evaluation.agent?.name || '—' },
                  { label: 'Evaluator', value: evaluation.evaluator?.name || '—' },
                  { label: 'Scorecard', value: evaluation.scorecard?.name },
                  { label: 'Call Date', value: new Date(evaluation.callDate).toLocaleDateString() },
                  { label: 'Call ID', value: evaluation.callId || '—' },
                  { label: 'Evaluated', value: new Date(evaluation.createdAt).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-slate-400 flex-shrink-0">{label}</span>
                    <span className="font-medium text-slate-700 text-right">{value}</span>
                  </div>
                ))}
              </div>
              {evaluation.recordingUrl && (
                <a href={evaluation.recordingUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-600 border border-blue-100 bg-blue-50 rounded-lg py-2 hover:bg-blue-100 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Play Recording
                </a>
              )}
            </div>

            {/* Score circle */}
            <div className="card p-5 text-center">
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
              <div className="card p-5">
                <p className="section-title mb-2">Evaluator Notes</p>
                <p className="text-sm text-slate-600">{evaluation.notes}</p>
              </div>
            )}

            {/* Comments */}
            <div className="card p-5">
              <p className="section-title mb-3">Comments ({comments.length})</p>
              {comments.length > 0 && (
                <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                  {comments.map(c => (
                    <div key={c.id} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-700">{c.userName}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyDown={e => e.key === 'Enter' && submitComment()}
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
                <button onClick={submitComment} disabled={submittingComment || !newComment.trim()}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg disabled:opacity-50 transition-colors">
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Criteria */}
          <div className="col-span-2 space-y-4">
            {evaluation.scorecard?.sections.map(section => {
              const sectionAnswers = evaluation.answers.filter(a =>
                section.criteria.some(c => c.question === a.criterion.question)
              )
              const sectionScore = sectionAnswers.length > 0
                ? Math.round((sectionAnswers.reduce((s, a) => s + a.score, 0) / (sectionAnswers.length * 2)) * 100)
                : null
              return (
                <div key={section.id} className="card overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">{section.name}</h3>
                    {sectionScore !== null && (
                      <span className={sectionScore >= 80 ? 'badge-green' : 'badge-red'}>{sectionScore}%</span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-50">
                    {section.criteria.map(criterion => {
                      const answer = evaluation.answers.find(a => a.criterion.question === criterion.question)
                      const scoreInfo = answer ? SCORE_LABEL[answer.score] : null
                      return (
                        <div key={criterion.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm text-slate-700 flex-1">
                              {criterion.question}
                              {criterion.isCritical && <span className="ml-2 text-xs text-red-400 font-medium bg-red-50 px-1.5 py-0.5 rounded">Critical</span>}
                            </p>
                            {scoreInfo
                              ? <span className={`${scoreInfo.color} text-xs font-semibold flex-shrink-0`}>{scoreInfo.label}</span>
                              : <span className="text-xs text-slate-300 flex-shrink-0">Not scored</span>
                            }
                          </div>
                          {answer?.note && <p className="text-xs text-slate-400 mt-1.5 italic">"{answer.note}&quot;</p>}
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
