'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type Module = { id: string; title: string; description: string | null; category: string | null; duration: number | null; isRequired: boolean; _count: { completions: number } }

export default function TrainingPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'modules' | 'add'>('modules')
  const [form, setForm] = useState({ title: '', description: '', category: '', duration: '', isRequired: false, content: '' })
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Module | null>(null)

  const load = () => {
    fetch('/api/training/modules').then(r => r.json())
      .then(data => { setModules(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const addModule = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/training/modules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duration: form.duration ? parseInt(form.duration) : null }),
      })
      if (res.ok) { setTab('modules'); load(); setForm({ title: '', description: '', category: '', duration: '', isRequired: false, content: '' }) }
    } catch {} finally { setSaving(false) }
  }

  const categories = Array.from(new Set(modules.map(m => m.category).filter(Boolean) as string[]))
  const required = modules.filter(m => m.isRequired)
  const totalCompletions = modules.reduce((a, m) => a + m._count.completions, 0)

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="app-main flex-1">
        <div className="page-header">
          <div>
            <h1 className="page-title">Training & Development</h1>
            <p className="page-subtitle">Manage training modules, certifications, and completions</p>
          </div>
          <button onClick={() => setTab('add')} className="btn-primary">+ New Module</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Modules', value: modules.length },
            { label: 'Required', value: required.length },
            { label: 'Categories', value: categories.length },
            { label: 'Total Completions', value: totalCompletions },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-5 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
          {[{ key: 'modules', label: 'Modules' }, { key: 'add', label: '+ New Module' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'modules' && (
          <div className={`grid gap-5 ${selected ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <div className={selected ? 'col-span-2' : ''}>
              <div className="card overflow-hidden">
                {loading ? <div className="py-10 text-center text-sm text-slate-400">Loading...</div> :
                modules.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-slate-400 text-sm mb-2">No training modules yet.</p>
                    <button onClick={() => setTab('add')} className="btn-primary text-xs">Create First Module</button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead><tr>{['Module', 'Category', 'Duration', 'Required', 'Completions', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {modules.map(m => (
                        <tr key={m.id} onClick={() => setSelected(selected?.id === m.id ? null : m)} className={`table-row cursor-pointer ${selected?.id === m.id ? 'bg-blue-50' : ''}`}>
                          <td className="table-cell">
                            <p className="font-medium text-slate-900">{m.title}</p>
                            {m.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{m.description}</p>}
                          </td>
                          <td className="table-cell"><span className="badge-blue">{m.category || 'General'}</span></td>
                          <td className="table-cell text-slate-600">{m.duration ? `${m.duration} min` : '—'}</td>
                          <td className="table-cell">{m.isRequired ? <span className="badge-red">Required</span> : <span className="badge-slate">Optional</span>}</td>
                          <td className="table-cell text-slate-600">{m._count.completions}</td>
                          <td className="table-cell text-xs text-blue-600 font-medium">Details →</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            {selected && (
              <div className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-slate-900">{selected.title}</p>
                    <span className="badge-blue mt-1">{selected.category || 'General'}</span>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-slate-500 text-lg">×</button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    ['Duration', selected.duration ? `${selected.duration} min` : '—'],
                    ['Required', selected.isRequired ? 'Yes' : 'No'],
                    ['Completions', selected._count.completions],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                {selected.description && <p className="text-sm text-slate-600">{selected.description}</p>}
              </div>
            )}
          </div>
        )}

        {tab === 'add' && (
          <div className="card p-6 max-w-lg">
            <h2 className="text-sm font-semibold text-slate-700 mb-5">New Training Module</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Customer Service Fundamentals" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
                  <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Compliance, Sales" className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Duration (minutes)</label>
                  <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 30" className="input" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="input resize-none" placeholder="What will employees learn?" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Content / Instructions</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} className="input resize-none" placeholder="Training content, links, instructions..." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isRequired} onChange={e => setForm({ ...form, isRequired: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-slate-700">Mark as required training</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={addModule} disabled={saving || !form.title} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Create Module'}</button>
              <button onClick={() => setTab('modules')} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
