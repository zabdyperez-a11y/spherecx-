'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { ROLE_LABELS, hasPermission } from '@/lib/permissions'

type Evaluation = {
  id: string; totalScore: number | null; passed: boolean | null
  callDate: string; status: string
  agent: { name: string | null }; scorecard: { name: string }
}

type QuickStat = { label: string; value: string | number; sub?: string; color?: string; href?: string }

export default function DashboardContent() {
  const searchParams = useSearchParams()
  const accessDenied = searchParams.get('denied') === '1'
  const [evals, setEvals] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('SUPER_ADMIN')
  const [userName, setUserName] = useState('Admin')

  useEffect(() => {
    try {
      const match = document.cookie.split(';').find(c => c.trim().startsWith('spherecx_user='))
      if (match) {
        const val = match.split('=').slice(1).join('=')
        const user = JSON.parse(decodeURIComponent(val))
        setRole(user.role || 'SUPER_ADMIN')
        setUserName(user.name || 'User')
      }
    } catch {}

    fetch('/api/evaluations').then(r => r.json())
      .then(data => { setEvals(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const submitted = evals.filter(e => e.status === 'SUBMITTED')
  const avgScore = submitted.length > 0 ? Math.round(submitted.reduce((a, e) => a + (e.totalScore ?? 0), 0) / submitted.length) : null
  const passRate = submitted.length > 0 ? Math.round((submitted.filter(e => e.passed).length / submitted.length) * 100) : null
  const disputed = evals.filter(e => e.status === 'DISPUTED').length

  const isAgent = role === 'AGENT'
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  const quickActions = [
    hasPermission(role, 'create_evaluations') && { label: '+ New Evaluation', href: '/evaluations/new', color: 'bg-blue-600 text-white hover:bg-blue-700' },
    hasPermission(role, 'manage_scorecards') && { label: '+ New Scorecard', href: '/scorecards/new', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' },
    hasPermission(role, 'bulk_score') && { label: '⚡ Bulk Score', href: '/bulk-score', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' },
    hasPermission(role, 'manage_hr') && { label: '+ Add Employee', href: '/hr', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' },
  ].filter(Boolean) as { label: string; href: string; color: string }[]

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="app-main flex-1">

        {accessDenied && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
            <span>🚫</span> You don&apos;t have permission to access that page.
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{greeting}, {userName.split(' ')[0]} 👋</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {isAgent ? 'Here\'s your performance overview' : 'Here\'s what\'s happening today'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {quickActions.slice(0, 3).map(a => (
              <Link key={a.href} href={a.href} className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${a.color}`}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        {!isAgent && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {([
              { label: 'Total Evaluations', value: submitted.length || '—', href: '/evaluations' },
              { label: 'Average Score', value: avgScore != null ? `${avgScore}%` : '—', color: avgScore != null ? (avgScore >= 80 ? 'text-emerald-600' : avgScore >= 70 ? 'text-amber-500' : 'text-red-500') : '' },
              { label: 'Pass Rate', value: passRate != null ? `${passRate}%` : '—', color: passRate != null ? (passRate >= 80 ? 'text-emerald-600' : 'text-amber-500') : '' },
              { label: 'Disputed', value: disputed || '—', color: disputed > 0 ? 'text-orange-500' : '', href: disputed > 0 ? '/evaluations' : undefined },
            ] as QuickStat[]).map(s => (
              <div key={s.label} className="stat-card">
                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-semibold ${s.color || 'text-slate-900'}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Agent stats */}
        {isAgent && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'My Evaluations', value: submitted.length || '—' },
              { label: 'My Avg Score', value: avgScore != null ? `${avgScore}%` : '—', color: avgScore != null ? (avgScore >= 80 ? 'text-emerald-600' : 'text-amber-500') : '' },
              { label: 'Pass Rate', value: passRate != null ? `${passRate}%` : '—' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-semibold ${(s as any).color || 'text-slate-900'}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-5">
          {/* Recent evaluations */}
          <div className="col-span-2">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{isAgent ? 'My Recent Evaluations' : 'Recent Evaluations'}</p>
                {!isAgent && <Link href="/evaluations" className="text-xs text-blue-600 font-medium hover:text-blue-700">View all →</Link>}
              </div>
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
              ) : evals.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-slate-400 text-sm mb-3">No evaluations yet.</p>
                  {hasPermission(role, 'create_evaluations') && (
                    <Link href="/evaluations/new" className="btn-primary text-xs">Score your first call →</Link>
                  )}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>{['Agent', 'Scorecard', 'Score', 'Result', 'Date'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {evals.slice(0, 6).map(e => (
                      <tr key={e.id} className="table-row">
                        <td className="table-cell font-medium text-slate-900">{e.agent?.name || '—'}</td>
                        <td className="table-cell text-slate-500 text-xs">{e.scorecard?.name}</td>
                        <td className="table-cell">
                          {e.totalScore == null ? <span className="text-slate-300">—</span> : (
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${e.totalScore}%`, background: e.totalScore >= 80 ? '#2563eb' : '#ef4444' }} />
                              </div>
                              <span className="text-sm font-medium text-slate-700">{e.totalScore}%</span>
                            </div>
                          )}
                        </td>
                        <td className="table-cell">
                          {e.passed == null ? <span className="text-slate-300">—</span>
                            : <span className={e.passed ? 'badge-green' : 'badge-red'}>{e.passed ? 'Pass' : 'Fail'}</span>}
                        </td>
                        <td className="table-cell text-slate-400 text-xs">{new Date(e.callDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <div className="card p-5">
              <p className="section-title mb-3">Quick Access</p>
              <div className="space-y-1.5">
                {[
                  hasPermission(role, 'create_evaluations') && { label: 'New Evaluation', href: '/evaluations/new', icon: '✓' },
                  hasPermission(role, 'bulk_score') && { label: 'Bulk AI Scoring', href: '/bulk-score', icon: '⚡' },
                  hasPermission(role, 'manage_scorecards') && { label: 'Build Scorecard', href: '/scorecards/new', icon: '◫' },
                  hasPermission(role, 'view_hr') && { label: 'HR — Employee Roster', href: '/hr', icon: '👥' },
                  hasPermission(role, 'view_scheduling') && { label: 'Log Attendance', href: '/scheduling', icon: '📅' },
                  hasPermission(role, 'view_training') && { label: 'Training Modules', href: '/training', icon: '📚' },
                  hasPermission(role, 'view_operations') && { label: 'Campaigns', href: '/operations', icon: '📞' },
                  hasPermission(role, 'view_reports') && { label: 'View Reports', href: '/reports', icon: '' },
                  role === 'AGENT' && { label: 'My Performance', href: '/agent', icon: '' },
                ].filter(Boolean).slice(0, 6).map((item: any) => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                    <span className="text-base w-6 text-center">{item.icon}</span>
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
                    <span className="ml-auto text-slate-300 group-hover:text-slate-500 text-xs">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Score breakdown */}
            {submitted.length > 0 && !isAgent && (
              <div className="card p-5">
                <p className="section-title mb-3">Score Breakdown</p>
                {[
                  { label: 'Excellent (90+)', count: submitted.filter(e => (e.totalScore ?? 0) >= 90).length, color: 'bg-emerald-500' },
                  { label: 'Good (80-89)', count: submitted.filter(e => (e.totalScore ?? 0) >= 80 && (e.totalScore ?? 0) < 90).length, color: 'bg-blue-500' },
                  { label: 'Needs Work (70-79)', count: submitted.filter(e => (e.totalScore ?? 0) >= 70 && (e.totalScore ?? 0) < 80).length, color: 'bg-amber-400' },
                  { label: 'Failing (<70)', count: submitted.filter(e => (e.totalScore ?? 0) < 70).length, color: 'bg-red-500' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${b.color} flex-shrink-0`} />
                    <span className="text-xs text-slate-500 flex-1">{b.label}</span>
                    <span className="text-xs font-semibold text-slate-700">{b.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
