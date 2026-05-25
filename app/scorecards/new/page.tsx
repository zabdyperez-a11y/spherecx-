'use client'

import { useState } from 'react'
import Link from 'next/link'

type Criterion = {
  id: string
  question: string
  isCritical: boolean
  weight: number
}

type Section = {
  id: string
  name: string
  criteria: Criterion[]
}

const emptySection = (): Section => ({
  id: crypto.randomUUID(),
  name: '',
  criteria: [],
})

const emptyCriterion = (): Criterion => ({
  id: crypto.randomUUID(),
  question: '',
  isCritical: false,
  weight: 1,
})

export default function NewScorecardPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [passScore, setPassScore] = useState(80)
  const [sections, setSections] = useState<Section[]>([emptySection()])
  const [saved, setSaved] = useState(false)

  const addSection = () => setSections([...sections, emptySection()])

  const updateSection = (id: string, name: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, name } : s)))
  }

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id))
  }

  const addCriterion = (sectionId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, criteria: [...s.criteria, emptyCriterion()] } : s
      )
    )
  }

  const updateCriterion = (sectionId: string, criterionId: string, updates: Partial<Criterion>) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              criteria: s.criteria.map((c) =>
                c.id === criterionId ? { ...c, ...updates } : c
              ),
            }
          : s
      )
    )
  }

  const removeCriterion = (sectionId: string, criterionId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, criteria: s.criteria.filter((c) => c.id !== criterionId) }
          : s
      )
    )
  }

  const totalCriteria = sections.reduce((a, s) => a + s.criteria.length, 0)

  const handleSave = () => {
    // In real app: POST to /api/scorecards
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/scorecards" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Scorecards
          </Link>
          <span className="text-slate-700">/</span>
          <h1 className="text-xl font-semibold text-white">New Scorecard</h1>
        </div>
        <button
          onClick={handleSave}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {saved ? '✓ Saved' : 'Save Scorecard'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">
        {/* Basic info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">General Info</h2>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Scorecard Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Inbound Sales Call"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What calls is this scorecard for?"
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              Pass Score: <span className="text-white font-medium">{passScore}%</span>
            </label>
            <input
              type="range"
              min={50}
              max={100}
              value={passScore}
              onChange={(e) => setPassScore(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>50%</span><span>100%</span>
            </div>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center justify-between text-sm text-slate-400 px-1">
          <span>{sections.length} section{sections.length !== 1 ? 's' : ''} · {totalCriteria} criteria</span>
          <button
            onClick={addSection}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            + Add Section
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, si) => (
            <div key={section.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-800/40">
                <span className="text-xs font-bold text-slate-500 w-5 text-center">{si + 1}</span>
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) => updateSection(section.id, e.target.value)}
                  placeholder="Section name (e.g. Opening, Compliance, Resolution)"
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm font-medium focus:outline-none"
                />
                <button
                  onClick={() => removeSection(section.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>

              {/* Criteria */}
              <div className="divide-y divide-slate-800">
                {section.criteria.map((criterion) => (
                  <div key={criterion.id} className="flex items-start gap-3 px-6 py-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={criterion.question}
                        onChange={(e) =>
                          updateCriterion(section.id, criterion.id, { question: e.target.value })
                        }
                        placeholder="Enter evaluation question..."
                        className="w-full bg-transparent text-slate-200 placeholder-slate-600 text-sm focus:outline-none"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer whitespace-nowrap mt-0.5">
                      <input
                        type="checkbox"
                        checked={criterion.isCritical}
                        onChange={(e) =>
                          updateCriterion(section.id, criterion.id, { isCritical: e.target.checked })
                        }
                        className="accent-red-500"
                      />
                      Critical
                    </label>
                    <button
                      onClick={() => removeCriterion(section.id, criterion.id)}
                      className="text-slate-700 hover:text-red-400 transition-colors text-lg leading-none mt-0.5"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add criterion */}
              <div className="px-6 py-3 border-t border-slate-800">
                <button
                  onClick={() => addCriterion(section.id)}
                  className="text-xs text-slate-500 hover:text-indigo-400 transition-colors font-medium"
                >
                  + Add criterion
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom save */}
        {totalCriteria > 0 && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              {saved ? '✓ Saved' : 'Save Scorecard'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
