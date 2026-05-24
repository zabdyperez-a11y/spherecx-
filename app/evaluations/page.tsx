'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

type Evaluation = {
  id: string; callId: string | null; callDate: string
  totalScore: number | null; passed: boolean | null; status: string
  agent: { name: string | null }; evaluator: { name: string | null }; scorecard: { name: string }
}

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED: 'badge-green', DRAFT: 'badge-slate',
  DISPUTED: 'bg-orange-50 text-orange-600 badge', RESOLVED: 'badge-blue',
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')

  useEffect(() => {
    fetch('/api/evaluations').then(r => r.json())
      .then(data => { setEvaluations(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = evaluations.filter(e => {
    const matchSearch = (e.agent?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.callId || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch && (status === 'All' || e.status === status)
  })

  const submitted = evaluations.filter(e => e.status === 'SUBMITTED')
  const avgScore = submitted.length > 0
    ? Math.round(submitted.reduce((a, e) => a + (e.totalScore ?? 0), 0) / submitted.length)
    : null

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="page-header">
          <div>
            <h1 className="page-title">Evaluations</h1>
            <p className="page-subtitle">Score and review call quality</p>
          </div>
          <Link href="/evaluations/new" className="btn-primary">+ New Evaluation</Link>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: evaluations.length },
            { label: 'Submitted', value: submitted.length },
            { label: 'Avg Score', value: avgScore != null ? `${avgScore}%` : '—' },
            { label: 'Disputed', value: evaluations.filter(e => e.status === 'DISPUTED').length },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input type="text" placeholder="Search agent or call ID..." value={search} onChange={e => setSearch(e.target.value)} className="input w-64" />
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm bg-white shadow-sm">
            {['All', 'SUBMITTED', 'DRAFT', 'DISPUTED', 'RESOLVED'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-2 transition-colors text-xs font-medium ${status === s ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {s === 'All' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading evaluations...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">No evaluations yet</p>
              <p className="text-slate-400 text-xs mb-4">Start scoring calls to track quality</p>
              <Link href="/evaluations/new" className="btn-primary text-xs">Score a Call</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>{['Call ID', 'Agent', 'Scorecard', 'Score', 'Result', 'Status', 'Date', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(e => (
                  <tr key={e.id} className="table-row">
                    <td className="table-cell font-mono text-slate-400 text-xs">{e.callId || '—'}</td>
                    <td className="table-cell font-medium text-slate-900">{e.agent?.name || '—'}</td>
                    <td className="table-cell text-slate-500">{e.scorecard?.name}</td>
                    <td className="table-cell">
                      {e.totalScore == null ? <span className="text-slate-300">—</span> : (
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${e.totalScore}%`, background: e.totalScore >= 80 ? '#2563eb' : e.totalScore >= 70 ? '#d97706' : '#dc2626' }} />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{e.totalScore}%</span>
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      {e.passed == null ? <span className="text-slate-300">—</span> : (
                        <span className={e.passed ? 'badge-green' : 'badge-red'}>{e.passed ? 'Pass' : 'Fail'}</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={STATUS_BADGE[e.status] || 'badge-slate'}>
                        {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="table-cell text-slate-400 text-xs">{new Date(e.callDate).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <Link href={`/evaluations/${e.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View →</Link>
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
