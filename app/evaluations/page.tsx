'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

type Evaluation = {
  id: string
  callId: string | null
  callDate: string
  totalScore: number | null
  passed: boolean | null
  status: string
  agent: { name: string }
  evaluator: { name: string }
  scorecard: { name: string }
}

const STATUS_STYLE: Record<string, string> = {
  SUBMITTED: 'bg-emerald-50 text-emerald-600',
  DRAFT: 'bg-slate-100 text-slate-500',
  DISPUTED: 'bg-orange-50 text-orange-500',
  RESOLVED: 'bg-blue-50 text-blue-600',
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')

  useEffect(() => {
    fetch('/api/evaluations')
      .then(r => r.json())
      .then(data => { setEvaluations(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = evaluations.filter(e => {
    const matchSearch = e.agent?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (e.callId || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = status === 'All' || e.status === status
    return matchSearch && matchStatus
  })

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Evaluations</h1>
            <p className="text-sm text-slate-400 mt-0.5">Score and review call quality</p>
          </div>
          <Link href="/evaluations/new" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + New Evaluation
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: evaluations.length },
            { label: 'Submitted', value: evaluations.filter(e => e.status === 'SUBMITTED').length },
            { label: 'Drafts', value: evaluations.filter(e => e.status === 'DRAFT').length },
            { label: 'Disputed', value: evaluations.filter(e => e.status === 'DISPUTED').length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input type="text" placeholder="Search agent or call ID..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 w-64 shadow-sm" />
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm bg-white shadow-sm">
            {['All', 'SUBMITTED', 'DRAFT', 'DISPUTED'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-2 transition-colors ${status === s ? 'bg-blue-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>
                {s === 'All' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Loading evaluations...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-slate-400 text-sm mb-3">No evaluations yet.</p>
              <Link href="/evaluations/new" className="text-blue-600 text-sm font-medium hover:underline">Create your first evaluation →</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Call ID', 'Agent', 'Scorecard', 'Score', 'Result', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={e.id} className={`hover:bg-slate-50 transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <td className="px-5 py-3 text-xs font-mono text-slate-400">{e.callId || '—'}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{e.agent?.name}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">{e.scorecard?.name}</td>
                    <td className="px-5 py-3">
                      {e.totalScore == null ? <span className="text-sm text-slate-400">—</span> : (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${e.totalScore}%`, background: e.totalScore >= 80 ? '#3b82f6' : e.totalScore >= 70 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{e.totalScore}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {e.passed == null ? <span className="text-sm text-slate-400">—</span> : (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${e.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                          {e.passed ? 'Pass' : 'Fail'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[e.status] || 'bg-slate-100 text-slate-500'}`}>
                        {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400">{new Date(e.callDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <Link href={`/evaluations/${e.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View</Link>
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
