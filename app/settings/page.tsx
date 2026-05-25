'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type User = {
  id: string
  name: string | null
  email: string
  role: string
  team: { id: string; name: string } | null
  createdAt: string
}

const ROLES = [
  {
    key: 'ADMIN',
    label: 'Admin',
    color: 'bg-indigo-100 text-indigo-700',
    description: 'Full access. Manage users, billing, all data.',
    permissions: ['manage_users', 'manage_billing', 'view_all', 'create_scorecards', 'score_calls', 'view_reports'],
  },
  {
    key: 'MANAGER',
    label: 'Manager',
    color: 'bg-purple-100 text-purple-700',
    description: 'Oversees all teams. Can view all reports and manage QA.',
    permissions: ['view_all', 'create_scorecards', 'score_calls', 'view_reports', 'manage_team'],
  },
  {
    key: 'SUPERVISOR',
    label: 'Supervisor',
    color: 'bg-blue-100 text-blue-700',
    description: 'Manages a team. Can score calls and view team reports.',
    permissions: ['score_calls', 'view_reports', 'manage_team', 'create_scorecards'],
  },
  {
    key: 'TEAM_LEAD',
    label: 'Team Lead',
    color: 'bg-cyan-100 text-cyan-700',
    description: 'Leads a group of agents. Can view team performance.',
    permissions: ['score_calls', 'view_team_reports'],
  },
  {
    key: 'QA_ANALYST',
    label: 'QA Analyst',
    color: 'bg-emerald-100 text-emerald-700',
    description: 'Scores calls and creates evaluations.',
    permissions: ['score_calls', 'view_reports'],
  },
  {
    key: 'AGENT',
    label: 'Agent',
    color: 'bg-slate-100 text-slate-600',
    description: 'Can view their own scores and evaluations only.',
    permissions: ['view_own_scores'],
  },
]

const PERMISSION_LABELS: Record<string, string> = {
  manage_users: 'Manage Users',
  manage_billing: 'View Billing',
  view_all: 'View All Data',
  create_scorecards: 'Create Scorecards',
  score_calls: 'Score Calls',
  view_reports: 'View Reports',
  manage_team: 'Manage Team',
  view_team_reports: 'View Team Reports',
  view_own_scores: 'View Own Scores',
}

const MOCK_BILLING = {
  plan: 'PRO',
  status: 'ACTIVE',
  nextBillingDate: 'June 22, 2026',
  amount: '$299.00',
  seats: { used: 8, max: 15 },
  evals: { used: 142, max: 500 },
  trialDaysLeft: null,
  invoices: [
    { date: 'May 1, 2026', amount: '$299.00', status: 'Paid' },
    { date: 'Apr 1, 2026', amount: '$299.00', status: 'Paid' },
    { date: 'Mar 1, 2026', amount: '$299.00', status: 'Paid' },
  ],
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'users' | 'roles' | 'billing'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'QA_ANALYST' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetch('/api/settings/users')
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const inviteUser = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setForm({ name: '', email: '', role: 'QA_ANALYST' }); setShowInvite(false); load() }
      else { const d = await res.json(); setError(d.error || 'Failed.') }
    } catch { setError('Failed to invite user.') } finally { setSaving(false) }
  }

  const updateRole = async (id: string, role: string) => {
    await fetch('/api/settings/users', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    load()
  }

  const removeUser = async (id: string) => {
    if (!confirm('Remove this user?')) return
    await fetch('/api/settings/users', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const getRoleStyle = (role: string) => ROLES.find(r => r.key === role)?.color || 'bg-slate-100 text-slate-500'
  const getRoleLabel = (role: string) => ROLES.find(r => r.key === role)?.label || role

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your team, roles, and billing</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
          {[
            { key: 'users', label: '👥 Users' },
            { key: 'roles', label: '🔒 Roles & Permissions' },
            { key: 'billing', label: '💳 Billing' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 w-56 shadow-sm" />
                <span className="text-sm text-slate-400">{users.length} users</span>
              </div>
              <button onClick={() => setShowInvite(!showInvite)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                + Invite User
              </button>
            </div>

            {showInvite && (
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm mb-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Invite New User</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name *</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Role</label>
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                      {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
                {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
                <div className="flex gap-3 mt-4">
                  <button onClick={inviteUser} disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-50">
                    {saving ? 'Inviting...' : 'Send Invite'}
                  </button>
                  <button onClick={() => setShowInvite(false)} className="text-slate-500 text-sm hover:text-slate-700">Cancel</button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              {loading ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">Loading users...</div>
              ) : filtered.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-slate-400 text-sm mb-2">No users yet.</p>
                  <button onClick={() => setShowInvite(true)} className="text-blue-600 text-sm font-medium hover:underline">Invite your first user →</button>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['User', 'Role', 'Team', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user, i) => (
                      <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                              {(user.name || user.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{user.name || 'Unnamed'}</p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <select value={user.role} onChange={e => updateRole(user.id, e.target.value)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${getRoleStyle(user.role)}`}>
                            {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-500">{user.team?.name || '—'}</td>
                        <td className="px-5 py-3 text-sm text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <button onClick={() => removeUser(user.id)} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ROLES TAB */}
        {tab === 'roles' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm mb-2">
              <p className="text-sm text-slate-500">SphereCX uses <strong className="text-slate-700">6 built-in roles</strong>. Each role controls what a user can see and do inside your account.</p>
            </div>
            {ROLES.map(role => (
              <div key={role.key} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${role.color}`}>{role.label}</span>
                    <p className="text-sm text-slate-600">{role.description}</p>
                  </div>
                  <span className="text-xs text-slate-300">{users.filter(u => u.role === role.key).length} users</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(PERMISSION_LABELS).map(perm => (
                    <span key={perm}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${role.permissions.includes(perm) ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                      {role.permissions.includes(perm) ? '✓' : '✗'} {PERMISSION_LABELS[perm]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BILLING TAB */}
        {tab === 'billing' && (
          <div className="space-y-5 max-w-2xl">

            {/* Current Plan */}
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">Current Plan</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-slate-900">Pro</span>
                    <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-2.5 py-1 rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">$299/month · Next billing {MOCK_BILLING.nextBillingDate}</p>
                </div>
                <button className="text-sm text-blue-600 font-medium hover:underline">Upgrade to Enterprise →</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500">Seats used</span>
                    <span className="font-medium text-slate-700">{MOCK_BILLING.seats.used} / {MOCK_BILLING.seats.max}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(MOCK_BILLING.seats.used / MOCK_BILLING.seats.max) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500">Evaluations this month</span>
                    <span className="font-medium text-slate-700">{MOCK_BILLING.evals.used} / {MOCK_BILLING.evals.max}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(MOCK_BILLING.evals.used / MOCK_BILLING.evals.max) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Plan comparison */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Plan Comparison</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs text-slate-400 font-medium px-5 py-3">Feature</th>
                    <th className="text-center text-xs font-semibold px-5 py-3 text-slate-500">Free</th>
                    <th className="text-center text-xs font-semibold px-5 py-3 text-blue-600 bg-blue-50">Pro ✓</th>
                    <th className="text-center text-xs font-semibold px-5 py-3 text-indigo-600">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Price', '$0', '$299/mo', '$999/mo'],
                    ['Users', '3', '15', 'Unlimited'],
                    ['Evaluations/mo', '50', '500', 'Unlimited'],
                    ['Scorecards', '3', 'Unlimited', 'Unlimited'],
                    ['AI Auto-Score', '✗', '✓', '✓'],
                    ['Coaching Reports', '✗', '✓', '✓'],
                    ['Custom Branding', '✗', '✗', '✓'],
                    ['Priority Support', '✗', '✗', '✓'],
                    ['API Access', '✗', '✗', '✓'],
                  ].map(([feature, free, pro, ent], i) => (
                    <tr key={feature} className={`${i < 8 ? 'border-b border-slate-50' : ''}`}>
                      <td className="px-5 py-3 text-sm text-slate-600">{feature}</td>
                      <td className="px-5 py-3 text-sm text-center text-slate-400">{free}</td>
                      <td className={`px-5 py-3 text-sm text-center font-medium bg-blue-50 ${pro === '✓' ? 'text-emerald-600' : pro === '✗' ? 'text-slate-300' : 'text-blue-700'}`}>{pro}</td>
                      <td className={`px-5 py-3 text-sm text-center ${ent === '✓' ? 'text-emerald-600' : ent === '✗' ? 'text-slate-300' : 'text-slate-700'}`}>{ent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoices */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Invoice History</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Date', 'Amount', 'Status', ''].map(h => (
                      <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_BILLING.invoices.map((inv, i) => (
                    <tr key={i} className={`${i < MOCK_BILLING.invoices.length - 1 ? 'border-b border-slate-50' : ''}`}>
                      <td className="px-5 py-3 text-sm text-slate-700">{inv.date}</td>
                      <td className="px-5 py-3 text-sm font-medium text-slate-900">{inv.amount}</td>
                      <td className="px-5 py-3"><span className="text-xs bg-emerald-50 text-emerald-600 font-medium px-2.5 py-1 rounded-full">{inv.status}</span></td>
                      <td className="px-5 py-3"><button className="text-xs text-blue-600 hover:underline">Download PDF</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Danger zone */}
            <div className="bg-white rounded-xl border border-red-100 p-5 shadow-sm">
              <p className="text-sm font-semibold text-red-500 mb-1">Danger Zone</p>
              <p className="text-xs text-slate-400 mb-3">These actions are irreversible. Please be certain.</p>
              <div className="flex gap-3">
                <button className="text-xs text-red-400 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">Cancel Subscription</button>
                <button className="text-xs text-red-400 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">Delete Account</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
