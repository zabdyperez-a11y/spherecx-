'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

type Criterion = { id: string; question: string; isCritical: boolean }
type Section = { id: string; name: string; criteria: Criterion[] }

const uid = () => Math.random().toString(36).slice(2, 9)

export default function NewScorecardPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [passScore, setPassScore] = useState(80)
  const [sections, setSections] = useState<Section[]>([{ id: uid(), name: '', criteria: [] }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addSection = () => setSections(s => [...s, { id: uid(), name: '', criteria: [] }])
  const updateSectionName = (id: string, name: string) => setSections(s => s.map(sec => sec.id === id ? { ...sec, name } : sec))
  const removeSection = (id: string) => setSections(s => s.filter(sec => sec.id !== id))
  const addCriterion = (sid: string) => setSections(s => s.map(sec => sec.id === sid ? { ...sec, criteria: [...sec.criteria, { id: uid(), question: '', isCritical: false }] } : sec))
  const updateCriterion = (sid: string, cid: string, updates: Partial<Criterion>) => setSections(s => s.map(sec => sec.id === sid ? { ...sec, criteria: sec.criteria.map(c => c.id === cid ? { ...c, ...updates } : c) } : sec))
  const removeCriterion = (sid: string, cid: string) => setSections(s => s.map(sec => sec.id === sid ? { ...sec, criteria: sec.criteria.filter(c => c.id !== cid) } : sec))

  const totalCriteria = sections.reduce((a, s) => a + s.criteria.length, 0)

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter a scorecard name.'); return }
    if (totalCriteria === 0) { setError('Add at least one criterion.'); return }
    setError(''); setSaving(true)
    try {
      const res = await fetch('/api/scorecards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, passScore, sections }),
      })
      if (res.ok) {
        router.push('/scorecards')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save.')
      }
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/scorecards" className="text-slate-400 hover:text-slate-600 text-sm">← Scorecards</Link>
            <span className="text-slate-200">/</span>
            <h1 className="text-xl font-semibold text-slate-900">New Scorecard</h1>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Scorecard'}
          </button>
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="max-w-2xl space-y-5">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">General Info</h2>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Scorecard Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Inbound Sales Call"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What calls is this for?" rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Pass Score — <span className="text-blue-600 font-semibold">{passScore}%</span></label>
              <input type="range" min={50} max={100} value={passScore} onChange={e => setPassScore(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-slate-500">{sections.length} section{sections.length !== 1 ? 's' : ''} · {totalCriteria} criteria</p>
            <button onClick={addSection} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add Section</button>
          </div>

          {sections.map((section, si) => (
            <div key={section.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 w-5 text-center">{si + 1}</span>
                <input type="text" value={section.name} onChange={e => updateSectionName(section.id, e.target.value)}
                  placeholder="Section name (e.g. Opening, Compliance)"
                  className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none" />
                {sections.length > 1 && (
                  <button onClick={() => removeSection(section.id)} className="text-slate-300 hover:text-red-400 text-xl">×</button>
                )}
              </div>
              <div className="divide-y divide-slate-50">
                {section.criteria.map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-2 h-2 rounded-full bg-slate-200 flex-shrink-0" />
                    <input type="text" value={c.question} onChange={e => updateCriterion(section.id, c.id, { question: e.target.value })}
                      placeholder="e.g. Did the agent greet professionally?"
                      className="flex-1 text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent" />
                    <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer whitespace-nowrap">
                      <input type="checkbox" checked={c.isCritical} onChange={e => updateCriterion(section.id, c.id, { isCritical: e.target.checked })} className="accent-red-500" />
                      <span className={c.isCritical ? 'text-red-500 font-medium' : ''}>Critical</span>
                    </label>
                    <button onClick={() => removeCriterion(section.id, c.id)} className="text-slate-300 hover:text-red-400 text-xl">×</button>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-slate-50">
                <button onClick={() => addCriterion(section.id)} className="text-xs text-slate-400 hover:text-blue-600 font-medium">+ Add criterion</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
