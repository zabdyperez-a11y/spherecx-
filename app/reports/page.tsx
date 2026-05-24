'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type ReportData = {
  summary: { totalEvals: number; avgScore: number; passRate: number; totalAgents: number }
  scoresTrend: { date: string; score: number; passed: boolean; agent: string }[]
  agentStats: { id: string; name: string; evals: number; avgScore: number; passRate: number }[]
  passFailBreakdown: { pass: number; fail: number }
  scorecardUsage: { name: string; count: number }[]
  weeklyVolume: { week: string; count: number }[]
  distribution: { excellent: number; good: number; needsWork: number; failing: number }
}

const DIST_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(d => { if (d && d.summary) setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const exportCSV = () => {
    if (!data) return
    const rows = data.agentStats.map(a => [a.name, a.evals, a.avgScore + '%', a.passRate + '%'])
    const csv = [['Agent', 'Evaluations', 'Avg Score', 'Pass Rate'], ...rows]
      .map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'spherecx-report.csv'; a.click()
  }

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading reports...</p>
      </main>
    </div>
  )

  if (!data) return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <p className="text-slate-400 text-sm">No data available yet.</p>
      </main>
    </div>
  )

  const distData = [
    { name: 'Excellent (90+)', value: data.distribution.excellent },
    { name: 'Good (80-89)', value: data.distribution.good },
    { name: 'Needs Work (70-79)', value: data.distribution.needsWork },
    { name: 'Failing (<70)', value: data.distribution.failing },
  ].filter(d => d.value > 0)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
            <p className="text-sm text-slate-400 mt-0.5">Performance analytics across your team</p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm">
            ↓ Export CSV
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Evaluations', value: data.summary.totalEvals },
            { label: 'Average Score', value: data.summary.avgScore + '%' },
            { label: 'Pass Rate', value: data.summary.passRate + '%' },
            { label: 'Agents Tracked', value: data.summary.totalAgents },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {data.summary.totalEvals === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm">
            <p className="text-slate-400 mb-2">No submitted evaluations yet.</p>
            <p className="text-sm text-slate-300">Start scoring calls to see analytics here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">

            {/* Score trend */}
            {data.scoresTrend.length > 1 && (
              <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-700 mb-4">Score Trend (Last 30 Evaluations)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.scoresTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={d => d.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip formatter={(v: any) => [`${v}%`, 'Score']} labelStyle={{ color: '#475569' }} />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Weekly volume */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-700 mb-4">Weekly Evaluation Volume</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.weeklyVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Score distribution */}
            {distData.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-700 mb-4">Score Distribution</p>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={distData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                        {distData.map((_, i) => <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {distData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: DIST_COLORS[i] }} />
                        <span className="text-xs text-slate-600">{d.name}</span>
                        <span className="text-xs font-semibold text-slate-800 ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pass/Fail */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-700 mb-4">Pass / Fail Breakdown</p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                  <p className="text-3xl font-bold text-emerald-600">{data.passFailBreakdown.pass}</p>
                  <p className="text-xs text-emerald-500 mt-1">Passed</p>
                </div>
                <div className="flex-1 bg-red-50 rounded-xl p-4 text-center border border-red-100">
                  <p className="text-3xl font-bold text-red-500">{data.passFailBreakdown.fail}</p>
                  <p className="text-xs text-red-400 mt-1">Failed</p>
                </div>
              </div>
              {data.passFailBreakdown.pass + data.passFailBreakdown.fail > 0 && (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(data.passFailBreakdown.pass / (data.passFailBreakdown.pass + data.passFailBreakdown.fail)) * 100}%` }} />
                </div>
              )}
            </div>

            {/* Scorecard usage */}
            {data.scorecardUsage.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-700 mb-4">Scorecard Usage</p>
                <div className="space-y-3">
                  {data.scorecardUsage.map(s => (
                    <div key={s.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 truncate">{s.name}</span>
                        <span className="text-slate-400 ml-2">{s.count} evals</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${Math.max(4, (s.count / Math.max(...data.scorecardUsage.map(x => x.count))) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent leaderboard */}
            {data.agentStats.length > 0 && (
              <div className="col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-700">Agent Leaderboard</p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-50">
                      {['Rank', 'Agent', 'Evaluations', 'Avg Score', 'Pass Rate', 'Performance'].map(h => (
                        <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.agentStats.map((agent, i) => (
                      <tr key={agent.id} className={`hover:bg-slate-50 ${i < data.agentStats.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <td className="px-5 py-3">
                          <span className={`text-sm font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-400' : 'text-slate-300'}`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-slate-900">{agent.name}</td>
                        <td className="px-5 py-3 text-sm text-slate-500">{agent.evals}</td>
                        <td className="px-5 py-3">
                          <span className={`text-sm font-semibold ${agent.avgScore >= 80 ? 'text-emerald-600' : agent.avgScore >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                            {agent.avgScore}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600">{agent.passRate}%</td>
                        <td className="px-5 py-3">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${agent.avgScore}%`, background: agent.avgScore >= 80 ? '#10b981' : agent.avgScore >= 70 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
