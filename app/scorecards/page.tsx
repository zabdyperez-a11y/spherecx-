'use client'

import { useState } from 'react'
import Link from 'next/link'

const MOCK_SCORECARDS = [
  {
    id: '1',
    name: 'Inbound Sales Call',
    description: 'Standard evaluation for inbound sales interactions',
    sections: 4,
    criteria: 18,
    passScore: 80,
    isActive: true,
    updatedAt: '2026-05-20',
  },
  {
    id: '2',
    name: 'Customer Support — Tier 1',
    description: 'Basic support call quality evaluation',
    sections: 3,
    criteria: 12,
    passScore: 75,
    isActive: true,
    updatedAt: '2026-05-18',
  },
  {
    id: '3',
    name: 'Escalation Handling',
    description: 'For complex or escalated customer situations',
    sections: 5,
    criteria: 22,
    passScore: 85,
    isActive: false,
    updatedAt: '2026-05-10',
  },
]

export default function ScorecardsPage() {
  const [scorecards] = useState(MOCK_SCORECARDS)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">SphereCX</p>
          <h1 className="text-xl font-semibold text-white">Scorecards</h1>
        </div>
        <Link
          href="/scorecards/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> New Scorecard
        </Link>
      </div>

      {/* Nav */}
      <div className="border-b border-slate-800 px-8">
        <nav className="flex gap-6 text-sm">
          {['Dashboard', 'Scorecards', 'Evaluations', 'Agents', 'Reports'].map((item) => (
            <a
              key={item}
              href="#"
              className={`py-3 border-b-2 transition-colors ${
                item === 'Scorecards'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Scorecards" value={scorecards.length} />
          <StatCard label="Active" value={scorecards.filter((s) => s.isActive).length} />
          <StatCard label="Total Criteria" value={scorecards.reduce((a, s) => a + s.criteria, 0)} />
        </div>

        {/* Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-400 font-medium uppercase tracking-wider px-6 py-4">Name</th>
                <th className="text-left text-xs text-slate-400 font-medium uppercase tracking-wider px-6 py-4">Sections</th>
                <th className="text-left text-xs text-slate-400 font-medium uppercase tracking-wider px-6 py-4">Criteria</th>
                <th className="text-left text-xs text-slate-400 font-medium uppercase tracking-wider px-6 py-4">Pass Score</th>
                <th className="text-left text-xs text-slate-400 font-medium uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs text-slate-400 font-medium uppercase tracking-wider px-6 py-4">Updated</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {scorecards.map((sc, i) => (
                <tr
                  key={sc.id}
                  className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                    i === scorecards.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <p className="text-white font-medium text-sm">{sc.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{sc.description}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-sm">{sc.sections}</td>
                  <td className="px-6 py-4 text-slate-300 text-sm">{sc.criteria}</td>
                  <td className="px-6 py-4 text-slate-300 text-sm">{sc.passScore}%</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        sc.isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      {sc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{sc.updatedAt}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/scorecards/${sc.id}`}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
