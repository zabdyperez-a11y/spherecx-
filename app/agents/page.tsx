'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type Agent = {
  id: string
  name: string
  email: string
  role: string
  team?: { name: string } | null
  evaluationsOf: {
    id: string
    totalScore: number | null
    passed: boolean | null
    createdAt: string
    scorecard: { name: string }
  }[]
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Agent | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)

  const load = () => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(data => { setAgents(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const addAgent = async () => {
    if (!newName.trim() || !newEmail.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, email: newEmail }),
      })
      if (res.ok) {
        setNewName(''); setNewEmail(''); setShowAdd(false); load()
      }
    } catch {} finally { setAdding(false) }
  }

  const getAvgScore = (agent: Agent) => {
    const scored = agent.evaluationsOf.filter(e => e.totalScore != null)
    if (scored.length === 0) return null
    return Math.round(scored.reduce((a, e) => a + (e.totalScore ?? 0), 0) / scored.length)
  }

  const getPassRate = (agent: Agent) => {
    const submitted = agent.evaluationsOf.filter(e => e.passed != null)
    if (submitted.length === 0) return null
    return Math.round((submitted.filter(e => e.passed).length / submitted.length) * 100)
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
  const getColor = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length]

  const filtered = agents.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Agents</h1>
            <p className="text-sm text-slate-400 mt-0.5">Performance profiles and coaching history</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Add Agent
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm mb-6 max-w-md">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Add New Agent</h2>
            <div className="space-y-3">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              <div className="flex gap-2">
                <button onClick={addAgent} disabled={adding || !newName || !newEmail}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
                  {adding ? 'Adding...' : 'Add Agent'}
                </button>
                <button onClick={() => setShowAdd(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 text-sm font-medium py-2 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Agents', value: agents.length },
            { label: 'Avg Score', value: (() => { const s = agents.map(getAvgScore).filter(Boolean) as number[]; return s.length ? Math.round(s.reduce((a,b) => a+b, 0) / s.length) + '%' : '—' })() },
            { label: 'Avg Pass Rate', value: (() => { const s = agents.map(getPassRate).filter(Boolean) as number[]; return s.length ? Math.round(s.reduce((a,b) => a+b, 0) / s.length) + '%' : '—' })() },
            { label: 'Total Evaluations', value: agents.reduce((a, ag) => a + ag.evaluationsOf.length, 0) },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input type="text" placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 w-56 shadow-sm" />
        </div>

        <div className={`grid gap-6 ${selected ? 'grid-cols-3' : 'grid-cols-1'}`}>
          <div className={selected ? 'col-span-2' : 'col-span-1'}>
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              {loading ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">Loading agents...</div>
              ) : filtered.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-slate-400 text-sm mb-3">No agents yet.</p>
                  <button onClick={() => setShowAdd(true)} className="text-blue-600 text-sm font-medium hover:underline">Add your first agent →</button>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Agent', 'Team', 'Evals', 'Avg Score', 'Pass Rate', 'Last Eval', ''].map(h => (
                        <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((agent, i) => {
                      const avgScore = getAvgScore(agent)
                      const passRate = getPassRate(agent)
                      const lastEval = agent.evaluationsOf[0]
                      return (
                        <tr key={agent.id} onClick={() => setSelected(selected?.id === agent.id ? null : agent)}
                          className={`cursor-pointer transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-50' : ''} ${selected?.id === agent.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: getColor(agent.name || '') }}>
                                {getInitials(agent.name || '?')}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{agent.name}</p>
                                <p className="text-xs text-slate-400">{agent.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-500">{agent.team?.name || '—'}</td>
                          <td className="px-5 py-3 text-sm text-slate-600">{agent.evaluationsOf.length}</td>
                          <td className="px-5 py-3">
                            {avgScore == null ? <span className="text-sm text-slate-400">—</span> : (
                              <div className="flex items-center gap-2">
                                <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${avgScore}%` }} />
                                </div>
                                <span className="text-sm font-medium text-slate-700">{avgScore}%</span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {passRate == null ? <span className="text-sm text-slate-400">—</span> : (
                              <span className={`text-sm font-medium ${passRate >= 80 ? 'text-emerald-600' : passRate >= 65 ? 'text-amber-500' : 'text-red-500'}`}>{passRate}%</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-400">
                            {lastEval ? new Date(lastEval.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-5 py-3 text-xs text-blue-600 font-medium">Profile →</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {selected && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: getColor(selected.name || '') }}>
                      {getInitials(selected.name || '?')}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-900">{selected.name}</p>
                      <p className="text-sm text-slate-400">{selected.email}</p>
                      <p className="text-xs text-slate-300 mt-0.5">{selected.team?.name || 'No team'}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-slate-500 text-lg">×</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Avg Score', value: getAvgScore(selected) != null ? getAvgScore(selected) + '%' : '—' },
                    { label: 'Pass Rate', value: getPassRate(selected) != null ? getPassRate(selected) + '%' : '—' },
                    { label: 'Evaluations', value: selected.evaluationsOf.length },
                    { label: 'Last Eval', value: selected.evaluationsOf[0] ? new Date(selected.evaluationsOf[0].createdAt).toLocaleDateString() : '—' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-slate-400">{s.label}</p>
                      <p className="text-lg font-semibold text-slate-900">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selected.evaluationsOf.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Evaluations</p>
                  <div className="space-y-2">
                    {selected.evaluationsOf.slice(0, 5).map(e => (
                      <div key={e.id} className="flex items-center justify-between">
                        <p className="text-xs text-slate-600">{e.scorecard.name}</p>
                        <div className="flex items-center gap-2">
                          {e.totalScore != null && <span className="text-xs font-medium text-slate-700">{e.totalScore}%</span>}
                          {e.passed != null && (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${e.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                              {e.passed ? 'Pass' : 'Fail'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <a href="/evaluations/new" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg transition-colors text-center">
                  + New Evaluation
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
