'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

type Scorecard = {
  id: string; name: string; description: string | null
  isActive: boolean; updatedAt: string
  sections: { id: string; criteria: { id: string }[] }[]
  _count: { evaluations: number }
}

export default function ScorecardsPage() {
  const [scorecards, setScorecards] = useState<Scorecard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = () => {
    fetch('/api/scorecards').then(r => r.json())
      .then(data => { setScorecards(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const deleteScorecard = async (id: string) => {
    if (!confirm('Delete this scorecard? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/scorecards/${id}`, { method: 'DELETE' })
    setScorecards(s => s.filter(sc => sc.id !== id))
    setDeleting(null)
  }

  const filtered = scorecards.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const totalCriteria = scorecards.reduce((a, s) => a + s.sections.reduce((b, sec) => b + sec.criteria.length, 0), 0)

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="app-main flex-1">
        <div className="page-header">
          <div>
            <h1 className="page-title">Scorecards</h1>
            <p className="page-subtitle">Manage your QA evaluation templates</p>
          </div>
          <Link href="/scorecards/new" className="btn-primary">+ New Scorecard</Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Scorecards', value: scorecards.length },
            { label: 'Active', value: scorecards.filter(s => s.isActive).length },
            { label: 'Total Criteria', value: totalCriteria },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <input type="text" placeholder="Search scorecards..." value={search} onChange={e => setSearch(e.target.value)}
            className="input w-64" />
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">No scorecards yet</p>
              <p className="text-slate-400 text-xs mb-4">Create your first QA scorecard to start evaluating calls</p>
              <Link href="/scorecards/new" className="btn-primary text-xs">Create Scorecard</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {['Name', 'Sections', 'Criteria', 'Used In', 'Status', 'Updated', ''].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(sc => (
                  <tr key={sc.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-medium text-slate-900">{sc.name}</p>
                      {sc.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{sc.description}</p>}
                    </td>
                    <td className="table-cell text-slate-600">{sc.sections.length}</td>
                    <td className="table-cell text-slate-600">{sc.sections.reduce((a, s) => a + s.criteria.length, 0)}</td>
                    <td className="table-cell text-slate-600">{sc._count.evaluations} evals</td>
                    <td className="table-cell">
                      <span className={sc.isActive ? 'badge-green' : 'badge-slate'}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sc.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {sc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell text-slate-400 text-xs">{new Date(sc.updatedAt).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <Link href={`/scorecards/${sc.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit</Link>
                        <button onClick={() => deleteScorecard(sc.id)} disabled={deleting === sc.id}
                          className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-50">
                          {deleting === sc.id ? '...' : 'Delete'}
                        </button>
                      </div>
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
