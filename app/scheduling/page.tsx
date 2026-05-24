'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type Employee = { id: string; firstName: string; lastName: string; jobTitle: string | null; department: string | null }
type AttendanceRecord = {
  id: string; date: string; status: string; clockIn: string | null; clockOut: string | null
  hoursWorked: number | null; notes: string | null; employee: Employee
}

const STATUS_STYLE: Record<string, string> = {
  PRESENT: 'badge-green', ABSENT: 'badge-red', LATE: 'badge-amber',
  HALF_DAY: 'bg-orange-50 text-orange-600 badge', PTO: 'badge-blue', SICK: 'bg-purple-50 text-purple-600 badge',
}

export default function SchedulingPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'attendance' | 'add'>('attendance')
  const [form, setForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT', clockIn: '', clockOut: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('All')

  const load = () => {
    Promise.all([
      fetch('/api/hr/employees').then(r => r.json()),
      fetch('/api/scheduling/attendance').then(r => r.json()),
    ]).then(([emps, recs]) => {
      setEmployees(Array.isArray(emps) ? emps : [])
      setRecords(Array.isArray(recs) ? recs : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const addRecord = async () => {
    setSaving(true)
    try {
      const clockIn = form.clockIn ? `${form.date}T${form.clockIn}:00` : null
      const clockOut = form.clockOut ? `${form.date}T${form.clockOut}:00` : null
      const hoursWorked = (clockIn && clockOut)
        ? Math.round(((new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 3600000) * 10) / 10
        : null
      await fetch('/api/scheduling/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, clockIn, clockOut, hoursWorked }),
      })
      setTab('attendance'); load()
      setForm({ employeeId: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT', clockIn: '', clockOut: '', notes: '' })
    } catch {} finally { setSaving(false) }
  }

  const today = records.filter(r => new Date(r.date).toDateString() === new Date().toDateString())
  const filtered = filter === 'All' ? records : records.filter(r => r.status === filter)

  const presentToday = today.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length
  const absentToday = today.filter(r => r.status === 'ABSENT').length
  const lateToday = today.filter(r => r.status === 'LATE').length
  const totalHours = records.reduce((a, r) => a + (r.hoursWorked ?? 0), 0)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="page-header">
          <div>
            <h1 className="page-title">Scheduling & Attendance</h1>
            <p className="page-subtitle">Track shifts, clock-ins, and attendance patterns</p>
          </div>
          <button onClick={() => setTab('add')} className="btn-primary">+ Log Attendance</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Present Today', value: presentToday, color: 'text-emerald-600' },
            { label: 'Absent Today', value: absentToday, color: 'text-red-500' },
            { label: 'Late Today', value: lateToday, color: 'text-amber-500' },
            { label: 'Total Hours Logged', value: `${Math.round(totalHours)}h`, color: 'text-slate-900' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-5 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
          {[{ key: 'attendance', label: '📋 Attendance Log' }, { key: 'add', label: '+ Log Entry' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'attendance' && (
          <>
            <div className="flex gap-2 mb-4 flex-wrap">
              {['All', 'PRESENT', 'ABSENT', 'LATE', 'PTO', 'SICK', 'HALF_DAY'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="card overflow-hidden">
              {loading ? <div className="py-10 text-center text-sm text-slate-400">Loading...</div> :
              filtered.length === 0 ? <div className="py-10 text-center text-sm text-slate-400">No attendance records yet.</div> : (
                <table className="w-full">
                  <thead><tr>{['Employee', 'Date', 'Status', 'Clock In', 'Clock Out', 'Hours', 'Notes'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(r => (
                      <tr key={r.id} className="table-row">
                        <td className="table-cell font-medium text-slate-900">{r.employee?.firstName} {r.employee?.lastName}</td>
                        <td className="table-cell text-slate-500 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="table-cell"><span className={STATUS_STYLE[r.status] || 'badge-slate'}>{r.status.replace('_', ' ')}</span></td>
                        <td className="table-cell text-slate-600 text-xs">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td className="table-cell text-slate-600 text-xs">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td className="table-cell text-slate-700 font-medium">{r.hoursWorked != null ? `${r.hoursWorked}h` : '—'}</td>
                        <td className="table-cell text-slate-400 text-xs truncate max-w-xs">{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {tab === 'add' && (
          <div className="card p-6 max-w-lg">
            <h2 className="text-sm font-semibold text-slate-700 mb-5">Log Attendance Entry</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Employee *</label>
                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="input">
                  <option value="">Select employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Status *</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
                    {['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'PTO', 'SICK'].map(s => <option key={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Clock In</label>
                  <input type="time" value={form.clockIn} onChange={e => setForm({ ...form, clockIn: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Clock Out</label>
                  <input type="time" value={form.clockOut} onChange={e => setForm({ ...form, clockOut: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Called in sick, doctor appointment..." className="input" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={addRecord} disabled={saving || !form.employeeId || !form.date} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Log Entry'}</button>
              <button onClick={() => setTab('attendance')} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
