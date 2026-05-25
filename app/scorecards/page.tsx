'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

type Scorecard = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  updatedAt: string
  sections: { id: string; criteria: { id: string }[] }[]
  _count: { evaluations: number }
}

export default function ScorecardsPage() {
  const [scorecards, setScorecards] = useState<Scorecard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/scorecards')
      .then(r => r.json())
      .then(data => { setScorecards(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = scorecards.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const deleteScorecard = async (id: string) => {
    await fetch(`/api/scorecards/${id}`, { method: 'DELETE' })
    setScorecards(scorecards.filter(s => s.id !== id))
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Scorecards</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage your QA evaluation templates</p>
          </div>
          <Link href="/scorecards/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + New Scorecard
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Scorecards', value: scorecards.length },
            { label: 'Active', value: scorecards.filter(s => s.isActive).length },
            { label: 'Total Criteria', value: scorecards.reduce((a, s) => a + s.sections.reduce((b, sec) => b + sec.criteria.length, 0), 0) },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input type="text" placeholder="Search scorecards..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 w-64 shadow-sm" />
        </div>

        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Loading scorecards...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-slate-400 text-sm mb-3">No scorecards yet.</p>
              <Link href="/scorecards/new" className="text-blue-600 text-sm font-medium hover:underline">Create your first scorecard →</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Name', 'Sections', 'Criteria', 'Evaluations', 'Status', 'Updated', ''].map(h => (
                    <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sc, i) => (
                  <tr key={sc.id} className={`hover:bg-slate-50 transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-900">{sc.name}</p>
                      {sc.description && <p className="text-xs text-slate-400 mt-0.5">{sc.description}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{sc.sections.length}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{sc.sections.reduce((a, s) => a + s.criteria.length, 0)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{sc._count.evaluations}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${sc.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {sc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{new Date(sc.updatedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/scorecards/${sc.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit</Link>
                        <button onClick={() => deleteScorecard(sc.id)} className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
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
