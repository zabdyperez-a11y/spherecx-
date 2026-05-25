'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

type Employee = {
  id: string; firstName: string; lastName: string; email: string; phone: string | null
  jobTitle: string | null; department: string | null; status: string
  hireDate: string; terminationDate: string | null; payRate: number | null; payType: string | null
  location: string | null; employmentType: string | null; emergencyContact: string | null; notes: string | null
  incidents: any[]; reviews: any[]; attendance: any[]; trainings: any[]; documents: any[]
}

type LeaveRequest = { id: string; type: string; startDate: string; endDate: string; days: number; status: string; reason: string | null }
type Module = { id: string; title: string; category: string | null; isRequired: boolean }

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'badge-green', ON_LEAVE: 'badge-amber', SUSPENDED: 'bg-orange-50 text-orange-600 badge',
  TERMINATED: 'badge-red', RESIGNED: 'badge-slate',
}
const LEAVE_COLORS: Record<string, string> = {
  PENDING: 'badge-amber', APPROVED: 'badge-green', DENIED: 'badge-red', CANCELLED: 'badge-slate',
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [leave, setLeave] = useState<LeaveRequest[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'performance' | 'attendance' | 'training' | 'leave' | 'documents'>('overview')
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ type: 'PTO', startDate: '', endDate: '', reason: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/hr/employees/${id}`).then(r => r.json()),
      fetch(`/api/hr/employees/${id}/leave`).then(r => r.json()),
      fetch('/api/training/modules').then(r => r.json()),
    ]).then(([emp, lv, mods]) => {
      setEmployee(emp); setLeave(Array.isArray(lv) ? lv : []); setModules(Array.isArray(mods) ? mods : [])
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

  const markTrainingComplete = async (moduleId: string) => {
    await fetch(`/api/hr/employees/${id}/training`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId, status: 'COMPLETED' }),
    })
    const emp = await fetch(`/api/hr/employees/${id}`).then(r => r.json())
    setEmployee(emp)
  }

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="app-main flex-1 flex items-center justify-center">
        <p style={{ color: "var(--text-3)" }}>Loading...</p>
      </main>
    </div>
  )

  if (!employee) return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="app-main flex-1 flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: "var(--text-3)" }} className="mb-2">Employee not found.</p>
          <Link href="/hr" className="text-blue-600 text-sm">Back to HR</Link>
        </div>
      </main>
    </div>
  )

  const tenure = Math.floor((Date.now() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  const totalHours = employee.attendance.reduce((a: number, r: any) => a + (r.hoursWorked || 0), 0)
  const absences = employee.attendance.filter((r: any) => r.status === 'ABSENT').length
  const lateDays = employee.attendance.filter((r: any) => r.status === 'LATE').length
  const assignedModules = employee.trainings.map((t: any) => t.moduleId)
  const completedTrainings = employee.trainings.filter((t: any) => t.status === 'COMPLETED').length

  const TABS = [
    { key: 'overview', label: 'Overview' }, { key: 'performance', label: 'Reviews' },
    { key: 'attendance', label: 'Attendance' }, { key: 'training', label: 'Training' },
    { key: 'leave', label: 'Leave' }, { key: 'documents', label: 'Documents' },
  ]

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="app-main flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/hr" className="text-slate-400 hover:text-slate-600 text-sm">← HR</Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-bold text-white">
                {employee.firstName[0]}{employee.lastName[0]}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{employee.firstName} {employee.lastName}</h1>
                <p className="text-sm text-slate-500">{employee.jobTitle || 'No title'} · {employee.department || 'No department'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={STATUS_COLORS[employee.status] || 'badge-slate'}>{employee.status.replace('_', ' ')}</span>
                  <span className="text-xs text-slate-400">{tenure} months tenure</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab('leave'); setShowLeaveForm(true)} className="btn-secondary text-xs">+ Leave Request</button>
            <Link href="/hr" className="btn-primary text-xs">Edit Employee</Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Hours Logged', value: Math.round(totalHours) + 'h' },
            { label: 'Absences', value: absences, color: absences > 3 ? 'text-red-500' : '' },
            { label: 'Late Days', value: lateDays, color: lateDays > 3 ? 'text-amber-500' : '' },
            { label: 'Incidents', value: employee.incidents.length, color: employee.incidents.length > 0 ? 'text-orange-500' : '' },
            { label: 'Training', value: `${completedTrainings}/${employee.trainings.length}` },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-semibold ${(s as any).color || 'text-slate-900'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white border border-slate-100 rounded-xl p-1 shadow-sm overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-5">
            <div className="card p-5">
              <p className="section-title mb-4">Personal Information</p>
              <div className="space-y-3">
                {[
                  ['Email', employee.email], ['Phone', employee.phone || '—'],
                  ['Location', employee.location || '—'], ['Employment Type', employee.employmentType?.replace('_', ' ') || '—'],
                  ['Hire Date', new Date(employee.hireDate).toLocaleDateString()],
                  ['Pay', employee.payRate ? `$${employee.payRate} / ${employee.payType === 'HOURLY' ? 'hour' : 'year'}` : '—'],
                  ['Emergency Contact', employee.emergencyContact || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start gap-4">
                    <span className="text-sm text-slate-400 flex-shrink-0">{label}</span>
                    <span className="text-sm font-medium text-slate-700 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Incidents */}
              <div className="card p-5">
                <p className="section-title mb-3">Disciplinary History ({employee.incidents.length})</p>
                {employee.incidents.length === 0 ? (
                  <p className="text-sm text-slate-400">No incidents on record. ✓</p>
                ) : (
                  <div className="space-y-2">
                    {employee.incidents.slice(0, 3).map((inc: any) => (
                      <div key={inc.id} className="flex items-start justify-between gap-3 bg-slate-50 rounded-lg p-3">
                        <div>
                          <span className="badge-red text-xs">{inc.type.replace('_', ' ')}</span>
                          <p className="text-xs text-slate-500 mt-1 truncate">{inc.description}</p>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">{new Date(inc.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {employee.notes && (
                <div className="card p-5">
                  <p className="section-title mb-2">Notes</p>
                  <p className="text-sm text-slate-600">{employee.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PERFORMANCE REVIEWS */}
        {tab === 'performance' && (
          <div className="card overflow-hidden">
            {employee.reviews.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No performance reviews yet.</div>
            ) : (
              <table className="w-full">
                <thead><tr>{['Review Type', 'Date', 'QA', 'Attendance', 'Productivity', 'Overall', 'Reviewed By'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {employee.reviews.map((r: any) => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell"><span className="badge-blue">{r.reviewType}</span></td>
                      <td className="table-cell text-slate-500 text-xs">{new Date(r.reviewDate).toLocaleDateString()}</td>
                      {[r.qaScore, r.attendanceScore, r.productivityScore, r.overallScore].map((s, i) => (
                        <td key={i} className="table-cell">
                          {s != null ? <span className={s >= 80 ? 'badge-green' : s >= 70 ? 'badge-amber' : 'badge-red'}>{s}%</span> : <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                      <td className="table-cell text-slate-500 text-xs">{r.reviewedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ATTENDANCE */}
        {tab === 'attendance' && (
          <div className="card overflow-hidden">
            {employee.attendance.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No attendance records yet.</div>
            ) : (
              <table className="w-full">
                <thead><tr>{['Date', 'Status', 'Clock In', 'Clock Out', 'Hours', 'Notes'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {employee.attendance.map((r: any) => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell text-slate-600 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="table-cell">
                        <span className={{ PRESENT: 'badge-green', ABSENT: 'badge-red', LATE: 'badge-amber', PTO: 'badge-blue', SICK: 'bg-purple-50 text-purple-600 badge', HALF_DAY: 'badge-slate' }[r.status] || 'badge-slate'}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-slate-500">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="table-cell text-xs text-slate-500">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="table-cell font-medium text-slate-700">{r.hoursWorked != null ? `${r.hoursWorked}h` : '—'}</td>
                      <td className="table-cell text-xs text-slate-400">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TRAINING */}
        {tab === 'training' && (
          <div className="grid grid-cols-2 gap-5">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Assigned Training ({employee.trainings.length})</p>
              </div>
              {employee.trainings.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No modules assigned yet.</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {employee.trainings.map((t: any) => (
                    <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{t.module?.title}</p>
                        <p className="text-xs text-slate-400">{t.module?.category || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={{ COMPLETED: 'badge-green', IN_PROGRESS: 'badge-amber', NOT_STARTED: 'badge-slate', EXPIRED: 'badge-red' }[t.status] || 'badge-slate'}>
                          {t.status.replace('_', ' ')}
                        </span>
                        {t.status !== 'COMPLETED' && (
                          <button onClick={() => markTrainingComplete(t.moduleId)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Mark Done</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Available Modules</p>
              </div>
              {modules.filter(m => !assignedModules.includes(m.id)).length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">All modules assigned.</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {modules.filter(m => !assignedModules.includes(m.id)).map(m => (
                    <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{m.title}</p>
                        <div className="flex gap-1.5 mt-0.5">
                          <span className="badge-blue">{m.category || 'General'}</span>
                          {m.isRequired && <span className="badge-red">Required</span>}
                        </div>
                      </div>
                      <button onClick={() => assignTraining(m.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Assign →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LEAVE */}
        {tab === 'leave' && (
          <>
            {showLeaveForm && (
              <div className="card p-5 mb-5 max-w-lg">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">New Leave Request</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Leave Type</label>
                    <select value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} className="input">
                      {['PTO', 'SICK', 'PERSONAL', 'BEREAVEMENT', 'UNPAID', 'OTHER'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Start Date</label>
                      <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} className="input" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">End Date</label>
                      <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} className="input" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Reason</label>
                    <input value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="input" placeholder="Optional reason..." />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={submitLeave} disabled={saving} className="btn-primary">{saving ? 'Submitting...' : 'Submit Request'}</button>
                  <button onClick={() => setShowLeaveForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            )}
            {!showLeaveForm && (
              <button onClick={() => setShowLeaveForm(true)} className="btn-primary mb-4">+ New Leave Request</button>
            )}
            <div className="card overflow-hidden">
              {leave.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">No leave requests yet.</div>
              ) : (
                <table className="w-full">
                  <thead><tr>{['Type', 'Start', 'End', 'Days', 'Status', 'Reason'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {leave.map(r => (
                      <tr key={r.id} className="table-row">
                        <td className="table-cell"><span className="badge-blue">{r.type}</span></td>
                        <td className="table-cell text-slate-500 text-xs">{new Date(r.startDate).toLocaleDateString()}</td>
                        <td className="table-cell text-slate-500 text-xs">{new Date(r.endDate).toLocaleDateString()}</td>
                        <td className="table-cell text-slate-700 font-medium">{r.days}d</td>
                        <td className="table-cell"><span className={LEAVE_COLORS[r.status] || 'badge-slate'}>{r.status}</span></td>
                        <td className="table-cell text-slate-400 text-xs">{r.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* DOCUMENTS */}
        {tab === 'documents' && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="section-title">Employee Documents</p>
              <button className="btn-primary text-xs">+ Upload Document</button>
            </div>
            {employee.documents.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-slate-400 text-sm">No documents uploaded yet.</p>
                <p className="text-xs text-slate-300 mt-1">Upload offer letters, contracts, certifications, IDs...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {employee.documents.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📄</span>
                      <div><p className="text-sm font-medium text-slate-800">{d.name}</p><p className="text-xs text-slate-400">{d.type}</p></div>
                    </div>
                    {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-medium">Download</a>}
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
