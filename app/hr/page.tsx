'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type Employee = {
  id: string; firstName: string; lastName: string; email: string
  jobTitle: string | null; department: string | null; status: string
  hireDate: string; terminationDate: string | null; payRate: number | null; payType: string | null
  incidents: { type: string }[]
  reviews: { overallScore: number | null }[]
  _count: { incidents: number; trainings: number }
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'badge-green', ON_LEAVE: 'badge-amber', SUSPENDED: 'bg-orange-50 text-orange-600 badge',
  TERMINATED: 'badge-red', RESIGNED: 'badge-slate',
}

const SEVERITY_STYLE: Record<string, string> = {
  VERBAL_WARNING: 'badge-amber', WRITTEN_WARNING: 'bg-orange-50 text-orange-600 badge',
  FINAL_WARNING: 'badge-red', SUSPENSION: 'badge-red', TERMINATION: 'bg-red-100 text-red-800 badge',
}

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('All')
  const [status, setStatus] = useState('All')
  const [tab, setTab] = useState<'roster' | 'incidents' | 'add'>('roster')
  const [selected, setSelected] = useState<Employee | null>(null)
  const [showIncident, setShowIncident] = useState(false)
  const [showReview, setShowReview] = useState(false)

  const [addForm, setAddForm] = useState({
    firstName: '', lastName: '', email: '', jobTitle: '', department: '',
    hireDate: '', employmentType: 'FULL_TIME', payRate: '', payType: 'HOURLY', phone: '', location: '',
  })
  const [incidentForm, setIncidentForm] = useState({
    type: 'VERBAL_WARNING', date: '', description: '', action: '', issuedBy: '', followUpDate: '',
  })
  const [reviewForm, setReviewForm] = useState({
    reviewType: 'MONTHLY', reviewDate: '', reviewedBy: '',
    qaScore: '', attendanceScore: '', productivityScore: '', overallScore: '',
    strengths: '', improvements: '', goals: '',
  })
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/hr/employees').then(r => r.json())
      .then(data => { setEmployees(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const depts = ['All', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean) as string[]))]

  const filtered = employees.filter(e => {
    const name = `${e.firstName} ${e.lastName}`.toLowerCase()
    return name.includes(search.toLowerCase()) &&
      (dept === 'All' || e.department === dept) &&
      (status === 'All' || e.status === status)
  })

  const addEmployee = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/hr/employees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, hireDate: new Date(addForm.hireDate).toISOString(), payRate: addForm.payRate ? parseFloat(addForm.payRate) : null }),
      })
      if (res.ok) { setTab('roster'); load(); setAddForm({ firstName: '', lastName: '', email: '', jobTitle: '', department: '', hireDate: '', employmentType: 'FULL_TIME', payRate: '', payType: 'HOURLY', phone: '', location: '' }) }
    } catch {} finally { setSaving(false) }
  }

  const addIncident = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await fetch(`/api/hr/employees/${selected.id}/incidents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentForm),
      })
      setShowIncident(false); load()
    } catch {} finally { setSaving(false) }
  }

  const addReview = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await fetch(`/api/hr/employees/${selected.id}/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewForm,
          qaScore: reviewForm.qaScore ? parseFloat(reviewForm.qaScore) : null,
          attendanceScore: reviewForm.attendanceScore ? parseFloat(reviewForm.attendanceScore) : null,
          productivityScore: reviewForm.productivityScore ? parseFloat(reviewForm.productivityScore) : null,
          overallScore: reviewForm.overallScore ? parseFloat(reviewForm.overallScore) : null,
        }),
      })
      setShowReview(false); load()
    } catch {} finally { setSaving(false) }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/hr/employees/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, terminationDate: ['TERMINATED', 'RESIGNED'].includes(newStatus) ? new Date().toISOString() : null }),
    })
    load(); setSelected(null)
  }

  const totalActive = employees.filter(e => e.status === 'ACTIVE').length
  const totalIncidents = employees.reduce((a, e) => a + e._count.incidents, 0)
  const avgScore = (() => {
    const scored = employees.flatMap(e => e.reviews).filter(r => r.overallScore != null)
    return scored.length > 0 ? Math.round(scored.reduce((a, r) => a + (r.overallScore ?? 0), 0) / scored.length) : null
  })()

  const F = ({ label, value, type = 'text', options }: any) => (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      {options ? (
        <select value={value.value} onChange={e => value.set(e.target.value)} className="input">
          {options.map((o: any) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
      ) : (
        <input type={type} value={value.value} onChange={e => value.set(e.target.value)} className="input" />
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="page-header">
          <div>
            <h1 className="page-title">Human Resources</h1>
            <p className="page-subtitle">Employee management, performance, and compliance</p>
          </div>
          <button onClick={() => setTab('add')} className="btn-primary">+ Add Employee</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Employees', value: employees.length },
            { label: 'Active', value: totalActive },
            { label: 'Open Incidents', value: totalIncidents },
            { label: 'Avg Review Score', value: avgScore != null ? `${avgScore}%` : '—' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
          {[{ key: 'roster', label: '👥 Employee Roster' }, { key: 'incidents', label: '⚠️ Incidents' }, { key: 'add', label: '+ Add Employee' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ROSTER TAB */}
        {tab === 'roster' && (
          <>
            <div className="flex gap-3 mb-4 flex-wrap">
              <input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="input w-56" />
              <select value={dept} onChange={e => setDept(e.target.value)} className="input w-44">
                {depts.map(d => <option key={d}>{d}</option>)}
              </select>
              <select value={status} onChange={e => setStatus(e.target.value)} className="input w-40">
                {['All', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RESIGNED'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className={`grid gap-5 ${selected ? 'grid-cols-3' : 'grid-cols-1'}`}>
              <div className={selected ? 'col-span-2' : ''}>
                <div className="card overflow-hidden">
                  {loading ? <div className="py-10 text-center text-sm text-slate-400">Loading...</div> :
                  filtered.length === 0 ? <div className="py-10 text-center text-sm text-slate-400">No employees found.</div> : (
                    <table className="w-full">
                      <thead><tr>{['Employee', 'Title', 'Department', 'Status', 'Hire Date', 'Incidents', 'Last Review', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {filtered.map(emp => (
                          <tr key={emp.id} onClick={() => setSelected(selected?.id === emp.id ? null : emp)}
                            className={`table-row cursor-pointer ${selected?.id === emp.id ? 'bg-blue-50' : ''}`}>
                            <td className="table-cell">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                                  {emp.firstName[0]}{emp.lastName[0]}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{emp.firstName} {emp.lastName}</p>
                                  <p className="text-xs text-slate-400">{emp.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="table-cell text-slate-600">{emp.jobTitle || '—'}</td>
                            <td className="table-cell text-slate-600">{emp.department || '—'}</td>
                            <td className="table-cell"><span className={STATUS_STYLE[emp.status] || 'badge-slate'}>{emp.status.replace('_', ' ')}</span></td>
                            <td className="table-cell text-slate-400 text-xs">{new Date(emp.hireDate).toLocaleDateString()}</td>
                            <td className="table-cell">
                              {emp._count.incidents > 0
                                ? <span className="badge-red">{emp._count.incidents}</span>
                                : <span className="text-slate-300 text-sm">—</span>}
                            </td>
                            <td className="table-cell">
                              {emp.reviews[0]?.overallScore != null
                                ? <span className={emp.reviews[0].overallScore >= 80 ? 'badge-green' : 'badge-amber'}>{emp.reviews[0].overallScore}%</span>
                                : <span className="text-slate-300 text-sm">—</span>}
                            </td>
                            <td className="table-cell text-xs text-blue-600 font-medium">View →</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {selected && (
                <div className="space-y-4">
                  <div className="card p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
                          {selected.firstName[0]}{selected.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{selected.firstName} {selected.lastName}</p>
                          <p className="text-sm text-slate-400">{selected.jobTitle || 'No title'}</p>
                          <span className={`${STATUS_STYLE[selected.status] || 'badge-slate'} mt-1`}>{selected.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-slate-500 text-lg">×</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                      {[
                        ['Department', selected.department || '—'],
                        ['Hire Date', new Date(selected.hireDate).toLocaleDateString()],
                        ['Email', selected.email],
                        ['Pay', selected.payRate ? `$${selected.payRate}/${selected.payType === 'HOURLY' ? 'hr' : 'yr'}` : '—'],
                        ['Incidents', selected._count.incidents],
                        ['Trainings', selected._count.trainings],
                      ].map(([label, value]) => (
                        <div key={label} className="bg-slate-50 rounded-lg p-2.5">
                          <p className="text-slate-400">{label}</p>
                          <p className="font-semibold text-slate-800 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setShowIncident(true)} className="flex-1 text-xs border border-orange-200 bg-orange-50 text-orange-600 py-2 rounded-lg font-medium hover:bg-orange-100">+ Incident</button>
                      <button onClick={() => setShowReview(true)} className="flex-1 text-xs border border-blue-200 bg-blue-50 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-100">+ Review</button>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-500 mb-2">Change Status</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RESIGNED'].map(s => (
                          <button key={s} onClick={() => updateStatus(selected.id, s)}
                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${selected.status === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {s.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selected.incidents.length > 0 && (
                    <div className="card p-5">
                      <p className="section-title mb-3">Recent Incidents</p>
                      <div className="space-y-2">
                        {selected.incidents.slice(0, 3).map((inc: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-slate-600 truncate">{inc.type.replace('_', ' ')}</span>
                            <span className={SEVERITY_STYLE[inc.type] || 'badge-slate'}>{inc.type.split('_')[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Incident Modal */}
            {showIncident && selected && (
              <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                  <h2 className="text-base font-semibold text-slate-900 mb-4">New Disciplinary Action — {selected.firstName} {selected.lastName}</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Incident Type</label>
                      <select value={incidentForm.type} onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })} className="input">
                        {['VERBAL_WARNING', 'WRITTEN_WARNING', 'FINAL_WARNING', 'SUSPENSION', 'TERMINATION'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Date *</label>
                        <input type="date" value={incidentForm.date} onChange={e => setIncidentForm({ ...incidentForm, date: e.target.value })} className="input" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Follow-up Date</label>
                        <input type="date" value={incidentForm.followUpDate} onChange={e => setIncidentForm({ ...incidentForm, followUpDate: e.target.value })} className="input" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Description *</label>
                      <textarea value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} rows={3} className="input resize-none" placeholder="Describe what happened..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Action Taken *</label>
                      <input value={incidentForm.action} onChange={e => setIncidentForm({ ...incidentForm, action: e.target.value })} className="input" placeholder="e.g. Issued written warning, placed on PIP..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Issued By *</label>
                      <input value={incidentForm.issuedBy} onChange={e => setIncidentForm({ ...incidentForm, issuedBy: e.target.value })} className="input" placeholder="Manager name" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={addIncident} disabled={saving} className="flex-1 btn-primary">
                      {saving ? 'Saving...' : 'Save Incident'}
                    </button>
                    <button onClick={() => setShowIncident(false)} className="flex-1 btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Review Modal */}
            {showReview && selected && (
              <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
                  <h2 className="text-base font-semibold text-slate-900 mb-4">Performance Review — {selected.firstName} {selected.lastName}</h2>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Review Type</label>
                        <select value={reviewForm.reviewType} onChange={e => setReviewForm({ ...reviewForm, reviewType: e.target.value })} className="input">
                          {['MONTHLY', 'QUARTERLY', 'ANNUAL', 'PIP'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Review Date</label>
                        <input type="date" value={reviewForm.reviewDate} onChange={e => setReviewForm({ ...reviewForm, reviewDate: e.target.value })} className="input" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Reviewed By</label>
                      <input value={reviewForm.reviewedBy} onChange={e => setReviewForm({ ...reviewForm, reviewedBy: e.target.value })} className="input" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-1">Scores (0-100)</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'QA Score', key: 'qaScore' }, { label: 'Attendance Score', key: 'attendanceScore' },
                        { label: 'Productivity Score', key: 'productivityScore' }, { label: 'Overall Score', key: 'overallScore' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label>
                          <input type="number" min="0" max="100" value={(reviewForm as any)[f.key]} onChange={e => setReviewForm({ ...reviewForm, [f.key]: e.target.value })} className="input" placeholder="0-100" />
                        </div>
                      ))}
                    </div>
                    {[
                      { label: 'Strengths', key: 'strengths' }, { label: 'Areas to Improve', key: 'improvements' }, { label: 'Goals', key: 'goals' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label>
                        <textarea value={(reviewForm as any)[f.key]} onChange={e => setReviewForm({ ...reviewForm, [f.key]: e.target.value })} rows={2} className="input resize-none" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={addReview} disabled={saving} className="flex-1 btn-primary">{saving ? 'Saving...' : 'Save Review'}</button>
                    <button onClick={() => setShowReview(false)} className="flex-1 btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* INCIDENTS TAB */}
        {tab === 'incidents' && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">All Disciplinary Actions</p>
            </div>
            {employees.flatMap(e => e.incidents.map(inc => ({ ...inc, employee: e }))).length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No incidents recorded.</div>
            ) : (
              <table className="w-full">
                <thead><tr>{['Employee', 'Type', 'Description', 'Status', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.flatMap(emp => emp.incidents.map((inc: any, i: number) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell font-medium text-slate-900">{emp.firstName} {emp.lastName}</td>
                      <td className="table-cell"><span className={SEVERITY_STYLE[inc.type] || 'badge-slate'}>{inc.type.replace('_', ' ')}</span></td>
                      <td className="table-cell text-slate-500 max-w-xs truncate">{inc.description || '—'}</td>
                      <td className="table-cell"><span className={inc.resolved ? 'badge-green' : 'badge-amber'}>{inc.resolved ? 'Resolved' : 'Open'}</span></td>
                      <td className="table-cell text-xs text-blue-600 font-medium cursor-pointer" onClick={() => setSelected(emp)}>View Employee →</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ADD TAB */}
        {tab === 'add' && (
          <div className="card p-6 max-w-2xl">
            <h2 className="text-sm font-semibold text-slate-700 mb-5">New Employee</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'First Name *', key: 'firstName' }, { label: 'Last Name *', key: 'lastName' },
                { label: 'Email *', key: 'email', type: 'email' }, { label: 'Phone', key: 'phone', type: 'tel' },
                { label: 'Job Title', key: 'jobTitle' }, { label: 'Department', key: 'department' },
                { label: 'Hire Date *', key: 'hireDate', type: 'date' }, { label: 'Location', key: 'location' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label>
                  <input type={f.type || 'text'} value={(addForm as any)[f.key]}
                    onChange={e => setAddForm({ ...addForm, [f.key]: e.target.value })} className="input" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Employment Type</label>
                <select value={addForm.employmentType} onChange={e => setAddForm({ ...addForm, employmentType: e.target.value })} className="input">
                  {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMP'].map(t => <option key={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Pay Type</label>
                <select value={addForm.payType} onChange={e => setAddForm({ ...addForm, payType: e.target.value })} className="input">
                  {['HOURLY', 'SALARY'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Pay Rate</label>
                <input type="number" value={addForm.payRate} onChange={e => setAddForm({ ...addForm, payRate: e.target.value })} placeholder={addForm.payType === 'HOURLY' ? 'e.g. 18.50' : 'e.g. 45000'} className="input" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={addEmployee} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Employee'}</button>
              <button onClick={() => setTab('roster')} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
