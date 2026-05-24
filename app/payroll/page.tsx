'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type PayrollEntry = {
  id: string; name: string; jobTitle: string | null; department: string | null
  payRate: number | null; payType: string | null
  totalHours: number; presentDays: number; absentDays: number; ptoDays: number; grossPay: number
}

export default function PayrollPage() {
  const [data, setData] = useState<PayrollEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll?start=${startDate}&end=${endDate}`)
      const d = await res.json()
      setData(Array.isArray(d) ? d : [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const totalHours = data.reduce((a, e) => a + e.totalHours, 0)
  const totalGross = data.reduce((a, e) => a + e.grossPay, 0)

  const exportCSV = () => {
    const headers = ['Employee', 'Title', 'Department', 'Pay Type', 'Pay Rate', 'Hours', 'Present Days', 'Absent Days', 'PTO Days', 'Gross Pay']
    const rows = data.map(e => [
      e.name, e.jobTitle || '', e.department || '',
      e.payType || '', e.payRate || 0, e.totalHours,
      e.presentDays, e.absentDays, e.ptoDays,
      `$${e.grossPay.toFixed(2)}`
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `payroll-${startDate}-to-${endDate}.csv`; a.click()
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="page-header">
          <div>
            <h1 className="page-title">Payroll</h1>
            <p className="page-subtitle">Hours summary and gross pay calculations for export</p>
          </div>
          <button onClick={exportCSV} disabled={data.length === 0} className="btn-secondary text-xs disabled:opacity-50">
            ↓ Export CSV for Payroll
          </button>
        </div>

        {/* Date range */}
        <div className="card p-5 mb-6 flex items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Pay Period Start</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input w-40" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Pay Period End</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input w-40" />
          </div>
          <button onClick={load} disabled={loading} className="btn-primary">
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Employees', value: data.length },
            { label: 'Total Hours', value: `${Math.round(totalHours)}h` },
            { label: 'Est. Gross Payroll', value: `$${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: 'Avg Hours/Employee', value: data.length > 0 ? `${Math.round(totalHours / data.length)}h` : '—' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden">
          {loading ? <div className="py-10 text-center text-sm text-slate-400">Calculating payroll...</div> :
          data.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-slate-400 text-sm">No attendance data for selected period.</p>
              <p className="text-xs text-slate-300 mt-1">Log attendance in the Scheduling module first.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>{['Employee', 'Dept', 'Pay Rate', 'Hours', 'Present', 'Absent', 'PTO', 'Gross Pay'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map(e => (
                  <tr key={e.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-medium text-slate-900">{e.name}</p>
                      <p className="text-xs text-slate-400">{e.jobTitle || '—'}</p>
                    </td>
                    <td className="table-cell text-slate-500">{e.department || '—'}</td>
                    <td className="table-cell text-slate-600">
                      {e.payRate ? `$${e.payRate}/${e.payType === 'HOURLY' ? 'hr' : 'yr'}` : '—'}
                    </td>
                    <td className="table-cell font-medium text-slate-800">{e.totalHours}h</td>
                    <td className="table-cell text-slate-600">{e.presentDays}d</td>
                    <td className="table-cell">
                      <span className={e.absentDays > 2 ? 'badge-red' : 'text-slate-600 text-sm'}>{e.absentDays}d</span>
                    </td>
                    <td className="table-cell text-slate-600">{e.ptoDays}d</td>
                    <td className="table-cell">
                      <span className="font-semibold text-slate-900">${e.grossPay.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-slate-700">Totals</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-800">{Math.round(totalHours)}h</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{data.reduce((a, e) => a + e.presentDays, 0)}d</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{data.reduce((a, e) => a + e.absentDays, 0)}d</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{data.reduce((a, e) => a + e.ptoDays, 0)}d</td>
                  <td className="px-5 py-3 text-sm font-bold text-slate-900">${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
