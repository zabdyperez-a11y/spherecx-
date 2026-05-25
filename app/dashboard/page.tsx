import Sidebar from '@/components/Sidebar'

const STATS = [
  { label: 'Evaluations This Month', value: '142', change: '+12%', up: true },
  { label: 'Average Score', value: '84.3%', change: '+2.1%', up: true },
  { label: 'Pass Rate', value: '79%', change: '-3%', up: false },
  { label: 'Agents Evaluated', value: '28', change: '+4', up: true },
]

const RECENT = [
  { agent: 'Maria Lopez', scorecard: 'Inbound Sales', score: 91, passed: true, date: 'May 22' },
  { agent: 'Carlos Ruiz', scorecard: 'Customer Support T1', score: 74, passed: false, date: 'May 22' },
  { agent: 'Ana Torres', scorecard: 'Inbound Sales', score: 88, passed: true, date: 'May 21' },
  { agent: 'Luis Mora', scorecard: 'Escalation Handling', score: 95, passed: true, date: 'May 21' },
  { agent: 'Sofia Vega', scorecard: 'Customer Support T1', score: 71, passed: false, date: 'May 20' },
]

const BARS = [
  { range: '0–59', pct: 5, color: 'bg-red-400' },
  { range: '60–69', pct: 8, color: 'bg-orange-400' },
  { range: '70–79', pct: 18, color: 'bg-yellow-400' },
  { range: '80–89', pct: 41, color: 'bg-blue-400' },
  { range: '90–100', pct: 28, color: 'bg-blue-600' },
]

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">May 2026 · QRS Call Center</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + New Evaluation
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-2">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
              <p className={`text-xs mt-1 font-medium ${s.up ? 'text-emerald-500' : 'text-red-400'}`}>
                {s.change} vs last month
              </p>
            </div>
          ))}
        </div>

        {/* Score distribution */}
        <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-700">Score Distribution</p>
            <p className="text-xs text-slate-400">142 evaluations</p>
          </div>
          <div className="flex items-end gap-2 h-20">
            {BARS.map((b) => (
              <div key={b.range} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-slate-500">{b.pct}%</span>
                <div className={`w-full rounded-t-md ${b.color}`} style={{ height: `${b.pct * 2.5}px` }} />
                <span className="text-xs text-slate-400">{b.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent evaluations */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Recent Evaluations</p>
            <a href="/evaluations" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</a>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Agent', 'Scorecard', 'Score', 'Result', 'Date'].map((h) => (
                  <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT.map((r, i) => (
                <tr key={i} className={`hover:bg-slate-50 transition-colors ${i < RECENT.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <td className="px-5 py-3 text-sm font-medium text-slate-900">{r.agent}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{r.scorecard}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${r.score >= 80 ? 'bg-blue-500' : r.score >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${r.score}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{r.score}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {r.passed ? 'Pass' : 'Fail'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
