'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

export default function DashboardPage() {
  const [evals, setEvals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('SUPER_ADMIN')
  const [userName, setUserName] = useState('Admin')

  useEffect(() => {
    try {
      const match = document.cookie.split(';').find(c => c.trim().startsWith('spherecx_user='))
      if (match) {
        const user = JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')))
        setRole(user.role || 'SUPER_ADMIN')
        setUserName(user.name || 'Admin')
      }
    } catch {}
    fetch('/api/evaluations').then(r => r.json())
      .then(d => { setEvals(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const submitted = evals.filter(e => e.status === 'SUBMITTED')
  const avgScore = submitted.length > 0 ? Math.round(submitted.reduce((a: number, e: any) => a + (e.totalScore ?? 0), 0) / submitted.length) : null
  const passRate = submitted.length > 0 ? Math.round((submitted.filter((e: any) => e.passed).length / submitted.length) * 100) : null
  const disputed = evals.filter((e: any) => e.status === 'DISPUTED').length
  const isAgent = role === 'AGENT'

  const quickLinks = [
    { label: 'New Evaluation', href: '/evaluations/new', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','QA_ANALYST'] },
    { label: 'Bulk AI Scoring', href: '/bulk-score', roles: ['SUPER_ADMIN','ADMIN','MANAGER','QA_ANALYST'] },
    { label: 'HR — Employees', href: '/hr', roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
    { label: 'Scheduling', href: '/scheduling', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR'] },
    { label: 'Training', href: '/training', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','TEAM_LEAD','QA_ANALYST','AGENT'] },
    { label: 'Operations', href: '/operations', roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
    { label: 'Leave Requests', href: '/leave', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR'] },
    { label: 'Payroll', href: '/payroll', roles: ['SUPER_ADMIN','ADMIN'] },
    { label: 'Integrations', href: '/integrations', roles: ['SUPER_ADMIN','ADMIN'] },
    { label: 'Billing', href: '/admin', roles: ['SUPER_ADMIN'] },
  ].filter(l => l.roles.includes(role))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main className="app-main flex-1">
        <div className="page-header">
          <div>
            <h1 className="page-title">Welcome back, {userName.split(' ')[0]}</h1>
            <p className="page-subtitle">{isAgent ? 'Your performance overview' : "Here's what's happening today"}</p>
          </div>
          {!isAgent && (
            <Link href="/evaluations/new" className="btn-primary">+ New Evaluation</Link>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Evaluations', value: submitted.length || '—' },
            { label: 'Avg Score', value: avgScore != null ? `${avgScore}%` : '—' },
            { label: 'Pass Rate', value: passRate != null ? `${passRate}%` : '—' },
            { label: 'Disputed', value: disputed || '—' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Recent Evaluations</p>
              <Link href="/evaluations" className="text-xs text-blue-600">View all →</Link>
            </div>
            {loading ? (
              <div className="py-10 text-center text-sm" style={{ color: 'var(--text-3)' }}>Loading...</div>
            ) : evals.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>No evaluations yet.</p>
                {!isAgent && <Link href="/evaluations/new" className="btn-primary text-xs">Score your first call</Link>}
              </div>
            ) : (
              <table className="w-full">
                <thead><tr>{['Agent','Scorecard','Score','Result','Date'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-2)' }}>
                  {evals.slice(0, 8).map((e: any) => (
                    <tr key={e.id} className="table-row">
                      <td className="table-cell font-medium" style={{ color: 'var(--text-1)' }}>{e.agent?.name || '—'}</td>
                      <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>{e.scorecard?.name}</td>
                      <td className="table-cell">
                        {e.totalScore == null ? <span style={{ color: 'var(--text-4)' }}>—</span> : (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                              <div className="h-full rounded-full" style={{ width: `${e.totalScore}%`, background: e.totalScore >= 80 ? '#2563eb' : '#ef4444' }} />
                            </div>
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{e.totalScore}%</span>
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        {e.passed == null ? <span style={{ color: 'var(--text-4)' }}>—</span>
                          : <span className={e.passed ? 'badge-green' : 'badge-red'}>{e.passed ? 'Pass' : 'Fail'}</span>}
                      </td>
                      <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>{new Date(e.callDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card p-5">
            <p className="section-title mb-4">Quick Access</p>
            <div className="space-y-1">
              {quickLinks.slice(0, 8).map(l => (
                <Link key={l.href} href={l.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group"
                  style={{ color: 'var(--text-2)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span className="text-sm">{l.label}</span>
                  <span className="text-xs" style={{ color: 'var(--text-4)' }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
