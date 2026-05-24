'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

type Evaluation = {
  id: string; totalScore: number | null; passed: boolean | null
  callDate: string; status: string; acknowledgedAt: string | null
  scorecard: { name: string }
  answers: { score: number; criterion: { question: string; isCritical: boolean } }[]
}

export default function AgentPortal() {
  const [evals, setEvals] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'scores' | 'coaching'>('scores')

  useEffect(() => {
    fetch('/api/evaluations').then(r => r.json())
      .then(data => { setEvals(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const submitted = evals.filter(e => e.status === 'SUBMITTED' || e.status === 'ACKNOWLEDGED')
  const avgScore = submitted.length > 0
    ? Math.round(submitted.reduce((a, e) => a + (e.totalScore ?? 0), 0) / submitted.length)
    : null
  const passRate = submitted.length > 0
    ? Math.round((submitted.filter(e => e.passed).length / submitted.length) * 100)
    : null
  const unacknowledged = submitted.filter(e => !e.acknowledgedAt)

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="app-main flex-1">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Performance</h1>
            <p className="page-subtitle">Your QA scores and coaching feedback</p>
          </div>
        </div>

        {unacknowledged.length > 0 && (
          <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
            <span className="text-amber-500 text-lg">!</span>
            <p className="text-sm text-amber-700 font-medium">
              You have {unacknowledged.length} evaluation{unacknowledged.length > 1 ? 's' : ''} that need{unacknowledged.length === 1 ? 's' : ''} your acknowledgment.
            </p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Evaluations', value: submitted.length || '—' },
            { label: 'Average Score', value: avgScore != null ? `${avgScore}%` : '—' },
            { label: 'Pass Rate', value: passRate != null ? `${passRate}%` : '—' },
            { label: 'Pending Review', value: unacknowledged.length },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Score trend */}
        {submitted.length > 1 && (
          <div className="card p-5 mb-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">Score Trend</p>
            <div className="flex items-end gap-1 h-16">
              {submitted.slice(-12).map((e, i) => (
                <div key={e.id} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t transition-all"
                    style={{
                      height: `${Math.max(4, ((e.totalScore ?? 0) / 100) * 56)}px`,
                      background: (e.totalScore ?? 0) >= 80 ? '#3b82f6' : (e.totalScore ?? 0) >= 70 ? '#f59e0b' : '#ef4444',
                      opacity: 0.5 + (i / 12) * 0.5,
                    }} />
                  <span className="text-xs text-slate-400">{e.totalScore ?? 0}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading your evaluations...</div>
          ) : submitted.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 text-sm">No evaluations yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>{['Date', 'Scorecard', 'Score', 'Result', 'Status', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {submitted.map(e => (
                  <tr key={e.id} className="table-row">
                    <td className="table-cell text-slate-500 text-xs">{new Date(e.callDate).toLocaleDateString()}</td>
                    <td className="table-cell font-medium text-slate-800">{e.scorecard?.name}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${e.totalScore ?? 0}%`, background: (e.totalScore ?? 0) >= 80 ? '#3b82f6' : '#ef4444' }} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{e.totalScore ?? 0}%</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={e.passed ? 'badge-green' : 'badge-red'}>{e.passed ? 'Pass' : 'Fail'}</span>
                    </td>
                    <td className="table-cell">
                      {e.acknowledgedAt
                        ? <span className="badge-green">✓ Acknowledged</span>
                        : <span className="badge-amber">Needs Review</span>
                      }
                    </td>
                    <td className="table-cell">
                      <Link href={`/evaluations/${e.id}`} className="text-xs text-blue-600 font-medium">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
