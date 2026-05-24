'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

type Evaluation = {
  id: string; totalScore: number | null; passed: boolean | null
  callDate: string; status: string; acknowledged: boolean | null
  scorecard: { name: string }
  answers: { score: number; criterion: { question: string } }[]
}

export default function AgentPortalPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Evaluation | null>(null)
  const [acknowledging, setAcknowledging] = useState(false)

  useEffect(() => {
    fetch('/api/evaluations').then(r => r.json())
      .then(data => { setEvaluations(Array.isArray(data) ? data.filter((e: any) => e.status === 'SUBMITTED' || e.status === 'RESOLVED') : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const acknowledge = async (id: string) => {
    setAcknowledging(true)
    try {
      await fetch(`/api/evaluations/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged: true }),
      })
      setEvaluations(e => e.map(ev => ev.id === id ? { ...ev, acknowledged: true } : ev))
      if (selected?.id === id) setSelected(s => s ? { ...s, acknowledged: true } : null)
    } catch {} finally { setAcknowledging(false) }
  }

  const submitted = evaluations.filter(e => e.status === 'SUBMITTED')
  const avgScore = submitted.length > 0
    ? Math.round(submitted.reduce((a, e) => a + (e.totalScore ?? 0), 0) / submitted.length)
    : null
  const passRate = submitted.length > 0
    ? Math.round((submitted.filter(e => e.passed).length / submitted.length) * 100)
    : null
  const unacknowledged = evaluations.filter(e => !e.acknowledged).length

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Performance</h1>
            <p className="page-subtitle">Your QA scores and coaching feedback</p>
          </div>
          {unacknowledged > 0 && (
            <div className="px-4 py-2 bg-amber-50 border border-amber-100 text-amber-700 text-sm rounded-lg font-medium">
              {unacknowledged} evaluation{unacknowledged > 1 ? 's' : ''} need your acknowledgment
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Evaluations', value: evaluations.length },
            { label: 'Avg Score', value: avgScore != null ? `${avgScore}%` : '—' },
            { label: 'Pass Rate', value: passRate != null ? `${passRate}%` : '—' },
            { label: 'Pending Acknowledgment', value: unacknowledged },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className={`grid gap-6 ${selected ? 'grid-cols-3' : 'grid-cols-1'}`}>
          <div className={selected ? 'col-span-2' : ''}>
            <div className="card overflow-hidden">
              {loading ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading your evaluations...</div>
              ) : evaluations.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-400 text-sm">No evaluations yet. Your QA scores will appear here.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>{['Date', 'Scorecard', 'Score', 'Result', 'Status', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {evaluations.map(e => (
                      <tr key={e.id} onClick={() => setSelected(selected?.id === e.id ? null : e)}
                        className={`table-row cursor-pointer ${selected?.id === e.id ? 'bg-blue-50' : ''}`}>
                        <td className="table-cell text-slate-500 text-xs">{new Date(e.callDate).toLocaleDateString()}</td>
                        <td className="table-cell font-medium text-slate-900">{e.scorecard?.name}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${e.totalScore ?? 0}%`, background: (e.totalScore ?? 0) >= 80 ? '#2563eb' : '#dc2626' }} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{e.totalScore ?? 0}%</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={e.passed ? 'badge-green' : 'badge-red'}>{e.passed ? 'Pass' : 'Fail'}</span>
                        </td>
                        <td className="table-cell">
                          {e.acknowledged
                            ? <span className="text-xs text-emerald-500 font-medium">✓ Acknowledged</span>
                            : <span className="text-xs text-amber-500 font-medium">⚠ Needs Review</span>
                          }
                        </td>
                        <td className="table-cell text-blue-600 text-xs font-medium">View →</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selected.scorecard?.name}</p>
                    <p className="text-xs text-slate-400">{new Date(selected.callDate).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-slate-500">×</button>
                </div>

                <div className="flex items-center justify-center py-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                      <circle cx="40" cy="40" r="32" fill="none" stroke={selected.passed ? '#2563eb' : '#dc2626'} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - (selected.totalScore ?? 0) / 100)}`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-slate-900">{selected.totalScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  {selected.answers?.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 flex-1 pr-2 truncate">{a.criterion?.question}</span>
                      <span className={`badge flex-shrink-0 ${a.score === 2 ? 'badge-green' : a.score === 1 ? 'badge-amber' : 'badge-red'}`}>
                        {a.score === 2 ? 'Yes' : a.score === 1 ? 'Partial' : 'No'}
                      </span>
                    </div>
                  ))}
                </div>

                {!selected.acknowledged && (
                  <button onClick={() => acknowledge(selected.id)} disabled={acknowledging}
                    className="w-full mt-4 btn-primary text-xs disabled:opacity-50">
                    {acknowledging ? 'Saving...' : '✓ Acknowledge & Accept Feedback'}
                  </button>
                )}
                {selected.acknowledged && (
                  <div className="mt-4 text-center text-xs text-emerald-600 font-medium">✓ You acknowledged this evaluation</div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
