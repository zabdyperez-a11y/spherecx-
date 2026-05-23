'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

type Evaluation = {
  id: string
  totalScore: number | null
  passed: boolean | null
  callDate: string
  callId: string | null
  status: string
  agent: { name: string | null }
  scorecard: { name: string }
  createdAt: string
}

export default function Dashboard() {
  const searchParams = useSearchParams()
  const accessDenied = searchParams.get('denied') === '1'
  const [evals, setEvals] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/evaluations')
      .then(r => r.json())
      .then(data => { setEvals(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const submitted = evals.filter(e => e.status === 'SUBMITTED')
  const avgScore = submitted.length > 0
    ? Math.round(submitted.reduce((a, e) => a + (e.totalScore ?? 0), 0) / submitted.length)
    : null
  const passRate = submitted.length > 0
    ? Math.round((submitted.filter(e => e.passed).length / submitted.length) * 100)
    : null

  const STATS = [
    { label: 'Evaluations This Month', value: submitted.length || '—' },
    { label: 'Average Score', value: avgScore != null ? `${avgScore}%` : '—' },
    { label: 'Pass Rate', value: passRate != null ? `${passRate}%` : '—' },
    { label: 'Total Submitted', value: submitted.length || '—' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">SphereCX · Quality Assurance</p>
          </div>
          <Link href="/evaluations/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + New Evaluation
          </Link>
        </div>

        {accessDenied && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <span>🚫</span> You don't have permission to access that page.
          </div>
        )}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {STATS.map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-2">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick actions when empty */}
        {!loading && evals.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-100 p-8 shadow-sm mb-6 text-center">
            <p className="text-slate-500 font-medium mb-2">Welcome to SphereCX</p>
            <p className="text-sm text-slate-400 mb-5">Get started by creating a scorecard, adding your agents, then scoring your first call.</p>
            <div className="flex justify-center gap-3">
              <Link href="/scorecards/new" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Create Scorecard</Link>
              <Link href="/agents" className="bg-white border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50">Add Agents</Link>
            </div>
          </div>
        )}

        {/* Recent evaluations */}
        {evals.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Recent Evaluations</p>
              <Link href="/evaluations" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
            </div>
            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Loading...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    {['Agent', 'Scorecard', 'Score', 'Result', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evals.slice(0, 8).map((e, i) => (
                    <tr key={e.id} className={`hover:bg-slate-50 transition-colors ${i < 7 ? 'border-b border-slate-50' : ''}`}>
                      <td className="px-5 py-3 text-sm font-medium text-slate-900">{e.agent?.name || '—'}</td>
                      <td className="px-5 py-3 text-sm text-slate-500">{e.scorecard?.name}</td>
                      <td className="px-5 py-3">
                        {e.totalScore == null ? <span className="text-slate-400 text-sm">—</span> : (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full"
                                style={{ width: `${e.totalScore}%`, background: e.totalScore >= 80 ? '#3b82f6' : e.totalScore >= 70 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                            <span className="text-sm font-medium text-slate-700">{e.totalScore}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {e.passed == null ? <span className="text-slate-400 text-sm">—</span> : (
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${e.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            {e.passed ? 'Pass' : 'Fail'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400">{new Date(e.callDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
