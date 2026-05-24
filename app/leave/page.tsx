'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type LeaveRequest = {
  id: string; type: string; startDate: string; endDate: string; days: number
  status: string; reason: string | null; reviewNote: string | null; reviewedBy: string | null
  employee: { id: string; firstName: string; lastName: string; department: string | null }
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'badge-amber', APPROVED: 'badge-green', DENIED: 'badge-red', CANCELLED: 'badge-slate',
}

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')

  const load = () => {
    fetch('/api/hr/leave').then(r => r.json())
      .then(data => { setRequests(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/hr/leave', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, reviewNote }),
    })
    setReviewing(null); setReviewNote(''); load()
  }

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter)
  const pending = requests.filter(r => r.status === 'PENDING').length

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="app-main flex-1">
        <div className="page-header">
          <div>
            <h1 className="page-title">Leave Management</h1>
            <p className="page-subtitle">Review and approve time-off requests</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pending Approval', value: pending, color: pending > 0 ? 'text-amber-500' : '' },
            { label: 'Approved This Month', value: requests.filter(r => r.status === 'APPROVED').length },
            { label: 'Denied', value: requests.filter(r => r.status === 'DENIED').length },
            { label: 'Total Requests', value: requests.length },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-semibold ${(s as any).color || 'text-slate-900'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          {['PENDING', 'APPROVED', 'DENIED', 'All'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
              {s} {s === 'PENDING' && pending > 0 ? `(${pending})` : ''}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          {loading ? <div className="py-10 text-center text-sm text-slate-400">Loading...</div> :
          filtered.length === 0 ? <div className="py-10 text-center text-sm text-slate-400">No {filter.toLowerCase()} requests.</div> : (
            <div className="divide-y divide-slate-50">
              {filtered.map(r => (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {r.employee.firstName[0]}{r.employee.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{r.employee.firstName} {r.employee.lastName}</p>
                        <p className="text-xs text-slate-400">{r.employee.department || 'No department'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="badge-blue">{r.type}</span>
                          <span className={STATUS_STYLE[r.status]}>{r.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()} ({r.days}d)
                        </p>
                      </div>
                      {r.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(r.id, 'APPROVED')}
                            className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium">Approve</button>
                          <button onClick={() => setReviewing(reviewing === r.id ? null : r.id)}
                            className="text-xs bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium">Deny</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {r.reason && <p className="text-xs text-slate-500 mt-2 ml-12">"{r.reason}"</p>}
                  {reviewing === r.id && (
                    <div className="mt-3 ml-12 flex gap-2">
                      <input value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Reason for denial (optional)" className="input flex-1 text-xs" />
                      <button onClick={() => updateStatus(r.id, 'DENIED')} className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium">Confirm Deny</button>
                    </div>
                  )}
                  {r.reviewedBy && <p className="text-xs text-slate-400 mt-1 ml-12">Reviewed by {r.reviewedBy}{r.reviewNote ? ` — "${r.reviewNote}"` : ''}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
