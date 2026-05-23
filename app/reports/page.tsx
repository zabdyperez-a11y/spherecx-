'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const TREND_DATA = [
  { month: 'Jan', avg: 78, pass: 68 },
  { month: 'Feb', avg: 80, pass: 71 },
  { month: 'Mar', avg: 76, pass: 65 },
  { month: 'Apr', avg: 82, pass: 74 },
  { month: 'May', avg: 84, pass: 79 },
]

const SCORECARD_DATA = [
  { name: 'Inbound Sales', avg: 87, evals: 58 },
  { name: 'Support T1', avg: 79, evals: 47 },
  { name: 'Escalation', avg: 91, evals: 22 },
  { name: 'Outbound', avg: 74, evals: 15 },
]

const AGENTS = [
  { name: 'Luis Mora', evals: 18, avg: 93, passed: 17, trend: 'up' },
  { name: 'Maria Lopez', evals: 22, avg: 89, passed: 20, trend: 'up' },
  { name: 'Ana Torres', evals: 15, avg: 85, passed: 13, trend: 'stable' },
  { name: 'Pedro Salas', evals: 12, avg: 78, passed: 9, trend: 'down' },
  { name: 'Carlos Ruiz', evals: 20, avg: 72, passed: 12, trend: 'down' },
  { name: 'Sofia Vega', evals: 16, avg: 69, passed: 9, trend: 'down' },
]

const RAW_DATA = [
  { date: '2026-05-22', agent: 'Maria Lopez', scorecard: 'Inbound Sales', score: 91, result: 'Pass', evaluator: 'Zabdy P.' },
  { date: '2026-05-22', agent: 'Carlos Ruiz', scorecard: 'Customer Support T1', score: 74, result: 'Fail', evaluator: 'Zabdy P.' },
  { date: '2026-05-21', agent: 'Ana Torres', scorecard: 'Inbound Sales', score: 88, result: 'Pass', evaluator: 'Zabdy P.' },
  { date: '2026-05-21', agent: 'Luis Mora', scorecard: 'Escalation Handling', score: 95, result: 'Pass', evaluator: 'Zabdy P.' },
  { date: '2026-05-20', agent: 'Sofia Vega', scorecard: 'Customer Support T1', score: 71, result: 'Fail', evaluator: 'Zabdy P.' },
]

function exportCSV() {
  const headers = ['Date', 'Agent', 'Scorecard', 'Score', 'Result', 'Evaluator']
  const rows = RAW_DATA.map(r => [r.date, r.agent, r.scorecard, r.score, r.result, r.evaluator])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'spherecx-report.csv'
  a.click()
}

export default function ReportsPage() {
  const [range, setRange] = useState('This Month')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
            <p className="text-sm text-slate-400 mt-0.5">Performance analytics · QRS Call Center</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm bg-white">
              {['This Month', 'Last 3 Months', 'This Year'].map((r) => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1.5 transition-colors ${range === r ? 'bg-blue-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {r}
                </button>
              ))}
            </div>
            <button onClick={exportCSV}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              ↓ Export CSV
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Evaluations', value: '142' },
            { label: 'Avg Score', value: '84.3%' },
            { label: 'Pass Rate', value: '79%' },
            { label: 'Agents Evaluated', value: '28' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-6 mb-6">

          {/* Score trend */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-4">Score Trend</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[60, 100]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Avg Score" />
                <Line type="monotone" dataKey="pass" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Pass Rate %" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* By scorecard */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-4">Avg Score by Scorecard</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SCORECARD_DATA} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[60, 100]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent ranking */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Agent Rankings</p>
            <p className="text-xs text-slate-400">Sorted by average score</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['#', 'Agent', 'Evaluations', 'Avg Score', 'Passed', 'Pass Rate', 'Trend'].map((h) => (
                  <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AGENTS.map((a, i) => (
                <tr key={a.name} className={`hover:bg-slate-50 transition-colors ${i < AGENTS.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <td className="px-5 py-3 text-sm font-bold text-slate-300">{i + 1}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-900">{a.name}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{a.evals}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${a.avg}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{a.avg}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500">{a.passed}/{a.evals}</td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-medium" style={{
                      color: a.passed / a.evals >= 0.8 ? '#10b981' : a.passed / a.evals >= 0.65 ? '#f59e0b' : '#ef4444'
                    }}>
                      {Math.round((a.passed / a.evals) * 100)}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-lg">
                    {a.trend === 'up' ? '↑' : a.trend === 'down' ? '↓' : '→'}
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
