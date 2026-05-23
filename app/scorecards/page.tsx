'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

type Scorecard = {
  id: string
  name: string
  description: string
  sections: number
  criteria: number
  passScore: number
  isActive: boolean
  updatedAt: string
}

const DEFAULTS: Scorecard[] = [
  { id: '1', name: 'Inbound Sales Call', description: 'Standard evaluation for inbound sales interactions', sections: 4, criteria: 18, passScore: 80, isActive: true, updatedAt: 'May 20, 2026' },
  { id: '2', name: 'Customer Support — Tier 1', description: 'Basic support call quality evaluation', sections: 3, criteria: 12, passScore: 75, isActive: true, updatedAt: 'May 18, 2026' },
  { id: '3', name: 'Escalation Handling', description: 'For complex or escalated customer situations', sections: 5, criteria: 22, passScore: 85, isActive: false, updatedAt: 'May 10, 2026' },
]

export default function ScorecardsPage() {
  const [scorecards, setScorecards] = useState<Scorecard[]>(DEFAULTS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    const saved = localStorage.getItem('scorecards')
    if (saved) setScorecards([...DEFAULTS, ...JSON.parse(saved)])
  }, [])

  const filtered = scorecards.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'active' ? s.isActive : !s.isActive)
    return matchSearch && matchFilter
  })

  const deleteScorecard = (id: string) => {
    const updated = scorecards.filter(s => s.id !== id)
    setScorecards(updated)
    const custom = updated.filter(s => !DEFAULTS.find(d => d.id === s.id))
    localStorage.setItem('scorecards', JSON.stringify(custom))
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">

        {/* Header */}
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
            <p className="text-xs text-slate-400 mb-1">Total Scorecards</p>
            <p className="text-2xl font-semibold text-slate-900">{scorecards.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
            <p className="text-xs text-slate-400 mb-1">Active</p>
            <p className="text-2xl font-semibold text-slate-900">{scorecards.filter(s => s.isActive).length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
            <p className="text-xs text-slate-400 mb-1">Total Criteria</p>
            <p className="text-2xl font-semibold text-slate-900">{scorecards.reduce((a, s) => a + s.criteria, 0)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search scorecards..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 w-64 shadow-sm"
          />
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm bg-white shadow-sm">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Name', 'Sections', 'Criteria', 'Pass Score', 'Status', 'Updated', ''].map(h => (
                  <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">No scorecards found</td></tr>
              ) : filtered.map((sc, i) => (
                <tr key={sc.id} className={`hover:bg-slate-50 transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-900">{sc.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{sc.description}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{sc.sections}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{sc.criteria}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-slate-700">{sc.passScore}%</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${sc.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {sc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">{sc.updatedAt}</td>
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
        </div>
      </main>
    </div>
  )
}
