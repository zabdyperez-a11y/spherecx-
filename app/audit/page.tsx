'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type Log = {
  id: string
  userEmail: string
  userName: string | null
  userRole: string | null
  action: string
  entity: string
  entityId: string | null
  entityName: string | null
  details: string | null
  ipAddress: string | null
  createdAt: string
}

const ACTION_STYLE: Record<string, string> = {
  LOGIN: 'bg-emerald-50 text-emerald-600',
  LOGOUT: 'bg-slate-100 text-slate-500',
  CREATE: 'bg-blue-50 text-blue-600',
  UPDATE: 'bg-amber-50 text-amber-600',
  DELETE: 'bg-red-50 text-red-500',
  SUBMIT: 'bg-indigo-50 text-indigo-600',
  DRAFT: 'bg-slate-100 text-slate-500',
  INVITE: 'bg-purple-50 text-purple-600',
  REMOVE: 'bg-red-50 text-red-500',
  ROLE_CHANGE: 'bg-amber-50 text-amber-600',
  PLAN_CHANGE: 'bg-indigo-50 text-indigo-600',
  STATUS_CHANGE: 'bg-amber-50 text-amber-600',
  DISPUTE: 'bg-orange-50 text-orange-600',
  RESOLVE: 'bg-emerald-50 text-emerald-600',
  VIEW: 'bg-slate-50 text-slate-400',
}

const ACTION_ICON: Record<string, string> = {
  LOGIN: '→', LOGOUT: '←', CREATE: '+', UPDATE: '✎',
  DELETE: '✕', SUBMIT: '✓', DRAFT: '⊘', INVITE: '✉',
  REMOVE: '−', ROLE_CHANGE: '◈', PLAN_CHANGE: '★',
  STATUS_CHANGE: '⊛', DISPUTE: '!', RESOLVE: '✓', VIEW: '◉',
}

const ENTITY_ICON: Record<string, string> = {
  evaluation: '✓', scorecard: '◫', agent: '◎',
  user: '○', team: '▣', organization: '◆',
  session: '⊕', report: '↗',
}

function parseDetails(raw: string | null) {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function formatAction(action: string, entity: string, entityName: string | null, details: any) {
  const n = entityName ? `"${entityName}"` : ''
  switch (action) {
    case 'LOGIN': return 'Logged in'
    case 'LOGOUT': return 'Logged out'
    case 'CREATE': return `Created ${entity} ${n}`
    case 'UPDATE': return `Updated ${entity} ${n}`
    case 'DELETE': return `Deleted ${entity} ${n}`
    case 'SUBMIT': return `Submitted evaluation ${n}`
    case 'DRAFT': return `Saved evaluation as draft ${n}`
    case 'INVITE': return `Invited user ${details?.email || n}`
    case 'REMOVE': return `Removed ${entity} ${n}`
    case 'ROLE_CHANGE': return `Changed role of ${n} to ${details?.newRole || ''}`
    case 'PLAN_CHANGE': return `Changed plan to ${details?.plan || ''}`
    case 'STATUS_CHANGE': return `Changed status to ${details?.status || ''}`
    case 'DISPUTE': return `Disputed evaluation ${n}`
    case 'RESOLVE': return `Resolved evaluation ${n}`
    default: return `${action} on ${entity} ${n}`
  }
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(date).toLocaleDateString()
}

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('ALL')
  const [filterEntity, setFilterEntity] = useState('ALL')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/audit?limit=200')
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const actions = ['ALL', ...Array.from(new Set(logs.map(l => l.action)))]
  const entities = ['ALL', ...Array.from(new Set(logs.map(l => l.entity)))]

  const filtered = logs.filter(l => {
    const matchSearch = l.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      (l.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.entityName || '').toLowerCase().includes(search.toLowerCase())
    const matchAction = filterAction === 'ALL' || l.action === filterAction
    const matchEntity = filterEntity === 'ALL' || l.entity === filterEntity
    return matchSearch && matchAction && matchEntity
  })

  const stats = {
    total: logs.length,
    today: logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
    logins: logs.filter(l => l.action === 'LOGIN').length,
    changes: logs.filter(l => ['CREATE', 'UPDATE', 'DELETE', 'SUBMIT'].includes(l.action)).length,
  }

  const exportCSV = () => {
    const headers = ['Time', 'User', 'Role', 'Action', 'Entity', 'Entity Name', 'IP', 'Details']
    const rows = filtered.map(l => [
      new Date(l.createdAt).toISOString(),
      l.userEmail, l.userRole || '', l.action,
      l.entity, l.entityName || '', l.ipAddress || '',
      l.details || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'audit-log.csv'; a.click()
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="app-main flex-1">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
            <p className="text-sm text-slate-400 mt-0.5">Full history of all actions taken by your team</p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm">
            ↓ Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Events', value: stats.total },
            { label: 'Today', value: stats.today },
            { label: 'Logins', value: stats.logins },
            { label: 'Data Changes', value: stats.changes },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input type="text" placeholder="Search user or entity..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 w-56 shadow-sm" />

          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none shadow-sm">
            {actions.map(a => <option key={a}>{a}</option>)}
          </select>

          <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none shadow-sm">
            {entities.map(e => <option key={e}>{e}</option>)}
          </select>

          <span className="text-sm text-slate-400">{filtered.length} events</span>
        </div>

        {/* Log feed */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Loading audit logs...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-slate-400 text-sm">No audit events yet.</p>
              <p className="text-xs text-slate-300 mt-1">Actions will appear here as your team uses SphereCX.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(log => {
                const details = parseDetails(log.details)
                const isExpanded = expanded === log.id
                return (
                  <div key={log.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">

                      {/* Action badge */}
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${ACTION_STYLE[log.action] || 'bg-slate-100 text-slate-500'}`}>
                          {ACTION_ICON[log.action]} {log.action}
                        </span>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-900">{log.userName || log.userEmail}</span>
                          {log.userRole && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{log.userRole}</span>
                          )}
                          <span className="text-sm text-slate-600">
                            {formatAction(log.action, log.entity, log.entityName, details)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400">{timeAgo(log.createdAt)}</span>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                          {log.ipAddress && (
                            <>
                              <span className="text-xs text-slate-300">·</span>
                              <span className="text-xs text-slate-400 font-mono">{log.ipAddress}</span>
                            </>
                          )}
                          {log.entity && (
                            <>
                              <span className="text-xs text-slate-300">·</span>
                              <span className="text-xs text-slate-400">
                                {ENTITY_ICON[log.entity]} {log.entity}
                              </span>
                            </>
                          )}
                          {details && (
                            <button onClick={() => setExpanded(isExpanded ? null : log.id)}
                              className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                              {isExpanded ? 'Hide details' : 'View details'}
                            </button>
                          )}
                        </div>

                        {/* Expanded details */}
                        {isExpanded && details && (
                          <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2 font-mono text-xs text-slate-600">
                            {Object.entries(details).map(([k, v]) => (
                              <div key={k} className="flex gap-2">
                                <span className="text-slate-400">{k}:</span>
                                <span className="text-slate-700">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Time */}
                      <span className="text-xs text-slate-300 flex-shrink-0">{timeAgo(log.createdAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
