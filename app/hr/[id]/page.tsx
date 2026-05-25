'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function EmployeeDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [employee, setEmployee] = useState<any>(null)
  const [leave, setLeave] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ type: 'PTO', startDate: '', endDate: '', reason: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/hr/employees/${id}`).then(r => r.json()),
      fetch(`/api/hr/employees/${id}/leave`).then(r => r.json()),
      fetch('/api/training/modules').then(r => r.json()),
    ]).then(([emp, lv, mods]) => {
      setEmployee(emp)
      setLeave(Array.isArray(lv) ? lv : [])
      setModules(Array.isArray(mods) ? mods : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const submitLeave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/hr/employees/${id}/leave`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm),
      })
      setShowLeaveForm(false)
      const lv = await fetch(`/api/hr/employees/${id}/leave`).then(r => r.json())
      setLeave(Array.isArray(lv) ? lv : [])
    } catch {} finally { setSaving(false) }
  }

  const assignTraining = async (moduleId: string) => {
    await fetch(`/api/hr/employees/${id}/training`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId, status: 'NOT_STARTED' }),
    })
    const emp = await fetch(`/api/hr/employees/${id}`).then(r => r.json())
    setEmployee(emp)
  }

  const markComplete = async (moduleId: string) => {
    await fetch(`/api/hr/employees/${id}/training`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId, status: 'COMPLETED' }),
    })
    const emp = await fetch(`/api/hr/employees/${id}`).then(r => r.json())
    setEmployee(emp)
  }

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'badge-green', ON_LEAVE: 'badge-amber', SUSPENDED: 'badge-orange',
    TERMINATED: 'badge-red', RESIGNED: 'badge-slate',
  }

  const LEAVE_COLORS: Record<string, string> = {
    PENDING: 'badge-amber', APPROVED: 'badge-green', DENIED: 'badge-red', CANCELLED: 'badge-slate',
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main className="app-main flex-1 flex items-center justify-center">
          <p style={{ color: 'var(--text-3)' }}>Loading employee file...</p>
        </main>
      </div>
    )
  }

  if (!employee || employee.error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main className="app-main flex-1 flex items-center justify-center">
          <div className="text-center">
            <p style={{ color: 'var(--text-3)' }} className="mb-2">Employee not found.</p>
            <Link href="/hr" className="text-blue-600 text-sm">Back to HR</Link>
          </div>
        </main>
      </div>
    )
  }

  const tenure = Math.floor((Date.now() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  const totalHours = employee.attendance?.reduce((a: number, r: any) => a + (r.hoursWorked || 0), 0) || 0
  const absences = employee.attendance?.filter((r: any) => r.status === 'ABSENT').length || 0
  const lateDays = employee.attendance?.filter((r: any) => r.status === 'LATE').length || 0
  const assignedModules = employee.trainings?.map((t: any) => t.moduleId) || []
  const completedTrainings = employee.trainings?.filter((t: any) => t.status === 'COMPLETED').length || 0

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'performance', label: 'Reviews' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'training', label: 'Training' },
    { key: 'leave', label: 'Leave' },
    { key: 'documents', label: 'Documents' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main className="app-main flex-1">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/hr" className="text-sm" style={{ color: 'var(--text-3)' }}>← HR</Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </div>
              <div>
                <h1 className="page-title">{employee.firstName} {employee.lastName}</h1>
                <p className="page-subtitle">{employee.jobTitle || 'No title'} · {employee.department || 'No department'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={STATUS_COLORS[employee.status] || 'badge-slate'}>{employee.status?.replace('_', ' ')}</span>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>{tenure} months tenure</span>
                </div>
              </div>
            </div>
          </div>
          <Link href="/hr" className="btn-secondary text-xs">Edit Employee</Link>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Hours Logged', value: Math.round(totalHours) + 'h' },
            { label: 'Absences', value: absences },
            { label: 'Late Days', value: lateDays },
            { label: 'Incidents', value: employee.incidents?.length || 0 },
            { label: 'Training', value: `${completedTrainings}/${employee.trainings?.length || 0}` },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="tab-bar mb-5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`tab-item ${tab === t.key ? 'active' : ''}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-5">
            <div className="card p-5">
              <p className="section-title mb-4">Personal Information</p>
              <div className="space-y-3">
                {[
                  ['Email', employee.email],
                  ['Phone', employee.phone || '—'],
                  ['Location', employee.location || '—'],
                  ['Employment Type', employee.employmentType?.replace('_', ' ') || '—'],
                  ['Hire Date', new Date(employee.hireDate).toLocaleDateString()],
                  ['Pay', employee.payRate ? `$${employee.payRate}/${employee.payType === 'HOURLY' ? 'hr' : 'yr'}` : '—'],
                  ['Emergency Contact', employee.emergencyContact || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-sm" style={{ color: 'var(--text-3)' }}>{label}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="card p-5">
                <p className="section-title mb-3">Disciplinary History ({employee.incidents?.length || 0})</p>
                {!employee.incidents?.length ? (
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>No incidents on record.</p>
                ) : (
                  <div className="space-y-2">
                    {employee.incidents.slice(0, 3).map((inc: any) => (
                      <div key={inc.id} className="flex items-start justify-between gap-3 p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                        <div>
                          <span className="badge-red">{inc.type?.replace('_', ' ')}</span>
                          <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-3)' }}>{inc.description}</p>
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>{new Date(inc.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {employee.notes && (
                <div className="card p-5">
                  <p className="section-title mb-2">Notes</p>
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>{employee.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'performance' && (
          <div className="card overflow-hidden">
            {!employee.reviews?.length ? (
              <div className="py-10 text-center text-sm" style={{ color: 'var(--text-3)' }}>No performance reviews yet.</div>
            ) : (
              <table className="w-full">
                <thead><tr>{['Type', 'Date', 'QA', 'Attendance', 'Productivity', 'Overall', 'By'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-2)' }}>
                  {employee.reviews.map((r: any) => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell"><span className="badge-blue">{r.reviewType}</span></td>
                      <td className="table-cell text-xs">{new Date(r.reviewDate).toLocaleDateString()}</td>
                      {[r.qaScore, r.attendanceScore, r.productivityScore, r.overallScore].map((s, i) => (
                        <td key={i} className="table-cell">
                          {s != null ? <span className={s >= 80 ? 'badge-green' : s >= 70 ? 'badge-amber' : 'badge-red'}>{s}%</span> : <span style={{ color: 'var(--text-4)' }}>—</span>}
                        </td>
                      ))}
                      <td className="table-cell text-xs">{r.reviewedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'attendance' && (
          <div className="card overflow-hidden">
            {!employee.attendance?.length ? (
              <div className="py-10 text-center text-sm" style={{ color: 'var(--text-3)' }}>No attendance records yet.</div>
            ) : (
              <table className="w-full">
                <thead><tr>{['Date', 'Status', 'Clock In', 'Clock Out', 'Hours', 'Notes'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-2)' }}>
                  {employee.attendance.map((r: any) => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell text-xs">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="table-cell">
                        <span className={{ PRESENT: 'badge-green', ABSENT: 'badge-red', LATE: 'badge-amber', PTO: 'badge-blue', SICK: 'badge-purple', HALF_DAY: 'badge-slate' }[r.status] || 'badge-slate'}>
                          {r.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell text-xs">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="table-cell text-xs">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="table-cell font-medium">{r.hoursWorked != null ? `${r.hoursWorked}h` : '—'}</td>
                      <td className="table-cell text-xs">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'training' && (
          <div className="grid grid-cols-2 gap-5">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Assigned ({employee.trainings?.length || 0})</p>
              </div>
              {!employee.trainings?.length ? (
                <div className="py-8 text-center text-sm" style={{ color: 'var(--text-3)' }}>No modules assigned.</div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border-2)' }}>
                  {employee.trainings.map((t: any) => (
                    <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t.module?.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t.module?.category || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={{ COMPLETED: 'badge-green', IN_PROGRESS: 'badge-amber', NOT_STARTED: 'badge-slate', EXPIRED: 'badge-red' }[t.status] || 'badge-slate'}>
                          {t.status?.replace('_', ' ')}
                        </span>
                        {t.status !== 'COMPLETED' && (
                          <button onClick={() => markComplete(t.moduleId)} className="text-xs text-emerald-600 font-medium">Done</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Available Modules</p>
              </div>
              {modules.filter(m => !assignedModules.includes(m.id)).length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: 'var(--text-3)' }}>All modules assigned.</div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border-2)' }}>
                  {modules.filter(m => !assignedModules.includes(m.id)).map(m => (
                    <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{m.title}</p>
                        <span className="badge-blue">{m.category || 'General'}</span>
                      </div>
                      <button onClick={() => assignTraining(m.id)} className="text-xs text-blue-600 font-medium">Assign</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'leave' && (
          <div>
            <button onClick={() => setShowLeaveForm(!showLeaveForm)} className="btn-primary mb-4">
              + New Leave Request
            </button>
            {showLeaveForm && (
              <div className="card p-5 mb-5 max-w-lg">
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>New Leave Request</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Leave Type</label>
                    <select value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} className="input">
                      {['PTO', 'SICK', 'PERSONAL', 'BEREAVEMENT', 'UNPAID', 'OTHER'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Start Date</label>
                    <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>End Date</label>
                    <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Reason</label>
                    <input value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="input" placeholder="Optional..." />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={submitLeave} disabled={saving} className="btn-primary">{saving ? 'Submitting...' : 'Submit'}</button>
                  <button onClick={() => setShowLeaveForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            )}
            <div className="card overflow-hidden">
              {!leave.length ? (
                <div className="py-10 text-center text-sm" style={{ color: 'var(--text-3)' }}>No leave requests yet.</div>
              ) : (
                <table className="w-full">
                  <thead><tr>{['Type', 'Start', 'End', 'Days', 'Status', 'Reason'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-2)' }}>
                    {leave.map((r: any) => (
                      <tr key={r.id} className="table-row">
                        <td className="table-cell"><span className="badge-blue">{r.type}</span></td>
                        <td className="table-cell text-xs">{new Date(r.startDate).toLocaleDateString()}</td>
                        <td className="table-cell text-xs">{new Date(r.endDate).toLocaleDateString()}</td>
                        <td className="table-cell font-medium">{r.days}d</td>
                        <td className="table-cell"><span className={LEAVE_COLORS[r.status] || 'badge-slate'}>{r.status}</span></td>
                        <td className="table-cell text-xs">{r.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === 'documents' && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="section-title">Documents</p>
              <button className="btn-primary text-xs">+ Upload</button>
            </div>
            {!employee.documents?.length ? (
              <div className="py-10 text-center">
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {employee.documents.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{d.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{d.type}</p>
                    </div>
                    {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600">Download</a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
