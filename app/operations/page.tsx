'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type Campaign = {
  id: string; name: string; type: string; status: string
  startDate: string | null; endDate: string | null; description: string | null
  targetCalls: number | null; script: string | null
  metrics: { date: string; totalCalls: number; answered: number; converted: number; avgHandle: number | null }[]
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'badge-green', PAUSED: 'badge-amber', COMPLETED: 'badge-blue', CANCELLED: 'badge-slate',
}

export default function OperationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'campaigns' | 'add'>('campaigns')
  const [selected, setSelected] = useState<Campaign | null>(null)
  const [form, setForm] = useState({ name: '', type: 'INBOUND', status: 'ACTIVE', description: '', startDate: '', endDate: '', targetCalls: '', script: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/operations/campaigns').then(r => r.json())
      .then(data => { setCampaigns(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const addCampaign = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/operations/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, targetCalls: form.targetCalls ? parseInt(form.targetCalls) : null }),
      })
      if (res.ok) { setTab('campaigns'); load(); setForm({ name: '', type: 'INBOUND', status: 'ACTIVE', description: '', startDate: '', endDate: '', targetCalls: '', script: '' }) }
    } catch {} finally { setSaving(false) }
  }

  const active = campaigns.filter(c => c.status === 'ACTIVE')
  const totalCalls = campaigns.flatMap(c => c.metrics).reduce((a, m) => a + m.totalCalls, 0)
  const totalConverted = campaigns.flatMap(c => c.metrics).reduce((a, m) => a + m.converted, 0)
  const convRate = totalCalls > 0 ? Math.round((totalConverted / totalCalls) * 100) : 0

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="page-header">
          <div>
            <h1 className="page-title">Operations</h1>
            <p className="page-subtitle">Campaigns, call queues, and performance KPIs</p>
          </div>
          <button onClick={() => setTab('add')} className="btn-primary">+ New Campaign</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Campaigns', value: active.length },
            { label: 'Total Campaigns', value: campaigns.length },
            { label: 'Total Calls', value: totalCalls.toLocaleString() },
            { label: 'Conversion Rate', value: `${convRate}%` },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-5 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
          {[{ key: 'campaigns', label: '📞 Campaigns' }, { key: 'add', label: '+ New Campaign' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'campaigns' && (
          <div className={`grid gap-5 ${selected ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <div className={selected ? 'col-span-2' : ''}>
              <div className="card overflow-hidden">
                {loading ? <div className="py-10 text-center text-sm text-slate-400">Loading...</div> :
                campaigns.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-slate-400 text-sm mb-2">No campaigns yet.</p>
                    <button onClick={() => setTab('add')} className="btn-primary text-xs">Create First Campaign</button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead><tr>{['Campaign', 'Type', 'Status', 'Target', 'Total Calls', 'Conversion', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {campaigns.map(c => {
                        const calls = c.metrics.reduce((a, m) => a + m.totalCalls, 0)
                        const conv = c.metrics.reduce((a, m) => a + m.converted, 0)
                        const rate = calls > 0 ? Math.round((conv / calls) * 100) : 0
                        return (
                          <tr key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)} className={`table-row cursor-pointer ${selected?.id === c.id ? 'bg-blue-50' : ''}`}>
                            <td className="table-cell">
                              <p className="font-medium text-slate-900">{c.name}</p>
                              {c.description && <p className="text-xs text-slate-400 truncate max-w-xs">{c.description}</p>}
                            </td>
                            <td className="table-cell"><span className="badge-blue">{c.type}</span></td>
                            <td className="table-cell"><span className={STATUS_STYLE[c.status] || 'badge-slate'}>{c.status}</span></td>
                            <td className="table-cell text-slate-600">{c.targetCalls?.toLocaleString() || '—'}</td>
                            <td className="table-cell text-slate-700 font-medium">{calls.toLocaleString()}</td>
                            <td className="table-cell">
                              <span className={rate >= 20 ? 'badge-green' : rate >= 10 ? 'badge-amber' : 'badge-slate'}>{rate}%</span>
                            </td>
                            <td className="table-cell text-xs text-blue-600 font-medium">Details →</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {selected && (
              <div className="card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{selected.name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="badge-blue">{selected.type}</span>
                      <span className={STATUS_STYLE[selected.status] || 'badge-slate'}>{selected.status}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-slate-500 text-lg">×</button>
                </div>
                {selected.description && <p className="text-sm text-slate-600">{selected.description}</p>}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Target Calls', selected.targetCalls?.toLocaleString() || '—'],
                    ['Start Date', selected.startDate ? new Date(selected.startDate).toLocaleDateString() : '—'],
                    ['End Date', selected.endDate ? new Date(selected.endDate).toLocaleDateString() : '—'],
                    ['Total Calls', selected.metrics.reduce((a, m) => a + m.totalCalls, 0).toLocaleString()],
                    ['Answered', selected.metrics.reduce((a, m) => a + m.answered, 0).toLocaleString()],
                    ['Converted', selected.metrics.reduce((a, m) => a + m.converted, 0).toLocaleString()],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                {selected.script && (
                  <div>
                    <p className="section-title mb-2">Call Script</p>
                    <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 max-h-32 overflow-y-auto">{selected.script}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'add' && (
          <div className="card p-6 max-w-lg">
            <h2 className="text-sm font-semibold text-slate-700 mb-5">New Campaign</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Campaign Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Q2 Outbound Sales" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input">
                    {['INBOUND', 'OUTBOUND', 'BLENDED', 'CHAT', 'EMAIL'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
                    {['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Target Calls</label>
                <input type="number" value={form.targetCalls} onChange={e => setForm({ ...form, targetCalls: e.target.value })} placeholder="e.g. 1000" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Call Script</label>
                <textarea value={form.script} onChange={e => setForm({ ...form, script: e.target.value })} rows={4} className="input resize-none" placeholder="Paste the call script here..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={addCampaign} disabled={saving || !form.name} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Create Campaign'}</button>
              <button onClick={() => setTab('campaigns')} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
// Metrics logging is handled via /api/operations/campaigns/[id]/metrics
