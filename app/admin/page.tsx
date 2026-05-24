'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type Org = {
  id: string; name: string; slug: string
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED'
  contactName: string | null; contactEmail: string | null
  allowedDomain: string | null
  maxUsers: number; maxEvals: number
  trialEndsAt: string | null; createdAt: string; notes: string | null
  users: { id: string; name: string | null; email: string; role: string }[]
  _count: { evaluations: number; scorecards: number }
}

const PS = { FREE: 'bg-slate-100 text-slate-600', PRO: 'bg-blue-50 text-blue-600', ENTERPRISE: 'bg-indigo-50 text-indigo-600' }
const SS = { ACTIVE: 'bg-emerald-50 text-emerald-600', TRIAL: 'bg-amber-50 text-amber-600', SUSPENDED: 'bg-red-50 text-red-500', CANCELLED: 'bg-slate-100 text-slate-400' }
const PP = { FREE: '$0', PRO: '$299/mo', ENTERPRISE: '$999/mo' }
const PL = { FREE: { users: 3, evals: 50 }, PRO: { users: 15, evals: 500 }, ENTERPRISE: { users: 999, evals: 99999 } }

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

export default function AdminPage() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Org | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', contactName: '', contactEmail: '', plan: 'FREE', notes: '', allowedDomain: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [showTempPass, setShowTempPass] = useState(false)
  const [tempPass, setTempPass] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState('')
  const [showInviteUser, setShowInviteUser] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'QA_ANALYST', password: '' })
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const load = () => {
    fetch('/api/admin/clients').then(r => r.json())
      .then(data => { setOrgs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const addClient = async () => {
    if (!form.name.trim()) { setAddError('Name is required.'); return }
    setAdding(true); setAddError('')
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setForm({ name: '', contactName: '', contactEmail: '', plan: 'FREE', notes: '', allowedDomain: '' }); setShowAdd(false); load() }
      else { const d = await res.json(); setAddError(d.error || 'Failed.') }
    } catch { setAddError('Failed.') } finally { setAdding(false) }
  }

  const patch = async (id: string, data: any, msg?: string) => {
    setActionLoading(msg || null)
    await fetch(`/api/admin/clients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    load()
    setActionLoading(null)
    if (msg) { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000) }
    const updated = orgs.find(o => o.id === id)
    if (selected?.id === id && updated) setSelected({ ...updated, ...data })
  }

  const inviteUser = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) { setInviteError('Name and email are required.'); return }
    if (!selected) return
    setInviting(true); setInviteError('')
    try {
      const res = await fetch('/api/admin/organizations/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inviteForm, orgId: selected.id }),
      })
      if (res.ok) {
        setInviteForm({ name: '', email: '', role: 'QA_ANALYST', password: '' })
        setShowInviteUser(false)
        setActionMsg(`${inviteForm.name} added successfully`)
        load()
      } else {
        const d = await res.json(); setInviteError(d.error || 'Failed to add user.')
      }
    } catch { setInviteError('Failed to add user.') } finally { setInviting(false) }
  }

  const removeUser = async (userId: string) => {
    await fetch('/api/settings/users', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId }),
    })
    setActionMsg('User removed'); load()
  }

  const deleteClient = async (id: string) => {
    setActionLoading('Deleting...')
    await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' })
    setSelected(null); setConfirmDelete(false); load()
    setActionLoading(null)
  }

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const getSetupLink = (org: Org) => {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://spherecx.vercel.app'
    return `${base}/login?org=${org.slug}`
  }

  const filtered = orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()) || (o.contactEmail || '').includes(search.toLowerCase()))
  const mrr = orgs.filter(o => o.status !== 'CANCELLED' && o.status !== 'SUSPENDED').reduce((s, o) => s + (o.plan === 'PRO' ? 299 : o.plan === 'ENTERPRISE' ? 999 : 0), 0)

  const trialDaysLeft = (org: Org) => {
    if (!org.trialEndsAt) return null
    const diff = new Date(org.trialEndsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="app-main flex-1">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs bg-indigo-100 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">SUPER ADMIN</span>
            <h1 className="text-xl font-semibold text-slate-900 mt-1">Client Billing</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage all SphereCX clients, plans and access</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Add Client
          </button>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-lg">
            ✓ {actionMsg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Clients', value: orgs.length },
            { label: 'Active', value: orgs.filter(o => o.status === 'ACTIVE').length },
            { label: 'On Trial', value: orgs.filter(o => o.status === 'TRIAL').length },
            { label: 'MRR', value: `$${mrr.toLocaleString()}` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Add Client Form */}
        {showAdd && (
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">New Client</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Company Name *', key: 'name', placeholder: 'Acme Call Center', type: 'text' },
                { label: 'Contact Name', key: 'contactName', placeholder: 'John Smith', type: 'text' },
                { label: 'Contact Email', key: 'contactEmail', placeholder: 'john@company.com', type: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Plan</label>
                <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                  <option value="FREE">Free — $0/mo (3 users, 50 evals)</option>
                  <option value="PRO">Pro — $299/mo (15 users, 500 evals)</option>
                  <option value="ENTERPRISE">Enterprise — $999/mo (Unlimited)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Allowed Email Domain <span className="text-slate-300">(auto-detected from contact email)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">@</span>
                  <input value={form.allowedDomain} onChange={e => setForm({ ...form, allowedDomain: e.target.value })}
                    placeholder="company.com — leave blank to auto-detect"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Only emails from this domain can be added as users for this client.</p>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Internal Notes</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Referred by X, closing date Y..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            </div>
            {addError && <p className="text-xs text-red-500 mt-3">{addError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={addClient} disabled={adding}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-lg disabled:opacity-50">
                {adding ? 'Adding...' : 'Add Client'}
              </button>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 text-sm hover:text-slate-700">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 w-64 shadow-sm" />
        </div>

        <div className={`grid gap-6 ${selected ? 'grid-cols-3' : 'grid-cols-1'}`}>

          {/* Table */}
          <div className={selected ? 'col-span-2' : 'col-span-1'}>
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              {loading ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">Loading clients...</div>
              ) : filtered.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-slate-400 text-sm mb-2">No clients yet.</p>
                  <button onClick={() => setShowAdd(true)} className="text-blue-600 text-sm font-medium hover:underline">Add your first client →</button>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Company', 'Plan', 'Status', 'Users', 'Trial', 'MRR', ''].map(h => (
                        <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((org, i) => {
                      const days = trialDaysLeft(org)
                      return (
                        <tr key={org.id} onClick={() => setSelected(selected?.id === org.id ? null : org)}
                          className={`cursor-pointer transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-50' : ''} ${selected?.id === org.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-slate-900">{org.name}</p>
                            <p className="text-xs text-slate-400">{org.contactEmail || '—'}</p>
                          </td>
                          <td className="px-5 py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PS[org.plan]}`}>{org.plan}</span></td>
                          <td className="px-5 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SS[org.status]}`}>{org.status}</span></td>
                          <td className="px-5 py-4 text-sm text-slate-600">{org.users.length}<span className="text-slate-300">/{org.maxUsers}</span></td>
                          <td className="px-5 py-4">
                            {days === null ? <span className="text-xs text-slate-300">—</span> :
                              days === 0 ? <span className="text-xs font-medium text-red-500">Expired</span> :
                              <span className={`text-xs font-medium ${days <= 3 ? 'text-red-500' : days <= 7 ? 'text-amber-500' : 'text-slate-500'}`}>{days}d left</span>
                            }
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-slate-700">{PP[org.plan]}</td>
                          <td className="px-5 py-4 text-xs text-blue-600 font-medium">Manage →</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Client Detail Panel */}
          {selected && (
            <div className="space-y-4">

              {/* Header card */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{selected.name}</p>
                    <p className="text-sm text-slate-400">{selected.contactName || '—'}</p>
                    <p className="text-xs text-slate-300">{selected.contactEmail}</p>
                  </div>
                  <button onClick={() => { setSelected(null); setConfirmDelete(false); setShowTempPass(false); setShowInviteUser(false) }}
                    className="text-slate-300 hover:text-slate-500 text-lg">×</button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Plan', value: selected.plan, sub: PP[selected.plan] },
                    { label: 'Status', value: selected.status },
                    { label: 'Users', value: `${selected.users.length}/${selected.maxUsers}` },
                    { label: 'Trial left', value: trialDaysLeft(selected) !== null ? `${trialDaysLeft(selected)}d` : '—' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-slate-400">{s.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{s.value}</p>
                      {s.sub && <p className="text-xs text-slate-400">{s.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Change Plan */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Plan</p>
                  <div className="flex gap-1.5">
                    {(['FREE', 'PRO', 'ENTERPRISE'] as const).map(p => (
                      <button key={p} onClick={() => patch(selected.id, { plan: p }, `Plan changed to ${p}`)}
                        className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${selected.plan === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change Status */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Status</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'] as const).map(s => (
                      <button key={s} onClick={() => patch(selected.id, { status: s }, `Status changed to ${s}`)}
                        className={`text-xs py-1 px-2.5 rounded-lg font-medium transition-colors ${selected.status === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {selected.notes && (
                  <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                    <p className="text-xs text-amber-700">{selected.notes}</p>
                  </div>
                )}
              </div>

              {/* Domain restriction card */}
              <div className={`rounded-xl border p-4 shadow-sm ${selected.allowedDomain ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Domain Restriction</p>
                    {selected.allowedDomain
                      ? <p className="text-sm font-bold text-emerald-700">@{selected.allowedDomain}</p>
                      : <p className="text-xs text-slate-400">No domain set — any email can be added</p>
                    }
                    <p className="text-xs text-slate-400 mt-1">
                      {selected.allowedDomain
                        ? 'Only emails from this domain can log in or be invited.'
                        : 'Set a domain to restrict access to company emails only.'}
                    </p>
                  </div>
                  {selected.allowedDomain && <span className="text-lg">🔒</span>}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-slate-400">@</span>
                  <input
                    defaultValue={selected.allowedDomain || ''}
                    placeholder="company.com"
                    onBlur={e => { if (e.target.value !== (selected.allowedDomain || '')) patch(selected.id, { allowedDomain: e.target.value || null }, 'Domain restriction updated') }}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Setup & Access</p>

                {/* Setup link */}
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1.5">Setup / Login Link</p>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                    <p className="text-xs text-slate-500 font-mono flex-1 truncate">{getSetupLink(selected)}</p>
                    <button onClick={() => handleCopy(getSetupLink(selected), 'link')}
                      className={`text-xs font-medium flex-shrink-0 ${copied === 'link' ? 'text-emerald-600' : 'text-blue-600 hover:text-blue-700'}`}>
                      {copied === 'link' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Temp password */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-slate-500">Temporary Password</p>
                    <button onClick={() => { setTempPass(generateTempPassword()); setShowTempPass(true) }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium">Generate</button>
                  </div>
                  {showTempPass && tempPass && (
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                      <p className="text-xs font-mono text-slate-800 flex-1">{tempPass}</p>
                      <button onClick={() => handleCopy(tempPass, 'pass')}
                        className={`text-xs font-medium flex-shrink-0 ${copied === 'pass' ? 'text-emerald-600' : 'text-blue-600 hover:text-blue-700'}`}>
                        {copied === 'pass' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                  {showTempPass && tempPass && (
                    <p className="text-xs text-slate-400 mt-1">Share this with the client. They should change it on first login.</p>
                  )}
                </div>

                {/* Force reset */}
                <button onClick={() => { const p = generateTempPassword(); setTempPass(p); setShowTempPass(true); patch(selected.id, { forcePasswordReset: true }, 'Password reset flagged') }}
                  className="w-full text-xs text-amber-600 border border-amber-200 bg-amber-50 py-2 rounded-lg hover:bg-amber-100 transition-colors font-medium">
                  ↺ Force Password Reset on Next Login
                </button>
              </div>

              {/* Users */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Users ({selected.users.length}/{selected.maxUsers})</p>
                  <button onClick={() => { setShowInviteUser(!showInviteUser); setInviteError('') }}
                    className="text-xs text-blue-600 font-medium hover:text-blue-700">
                    {showInviteUser ? 'Cancel' : '+ Invite'}
                  </button>
                </div>

                {showInviteUser && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-3 border border-slate-100">
                    <div className="space-y-2">
                      <input value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                        placeholder="Full name *"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                      <input type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                        placeholder="Email address *"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                      <input value={inviteForm.password} onChange={e => setInviteForm({ ...inviteForm, password: e.target.value })}
                        placeholder="Password (leave blank to auto-generate)"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                      <select value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="TEAM_LEAD">Team Lead</option>
                        <option value="QA_ANALYST">QA Analyst</option>
                        <option value="AGENT">Agent</option>
                      </select>
                    </div>
                    {inviteError && <p className="text-xs text-red-500 mt-2">{inviteError}</p>}
                    <button onClick={inviteUser} disabled={inviting}
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg disabled:opacity-50 transition-colors">
                      {inviting ? 'Adding...' : 'Add User'}
                    </button>
                  </div>
                )}

                {selected.users.length === 0 ? (
                  <p className="text-xs text-slate-400">No users yet. Invite your first user above.</p>
                ) : (
                  <div className="space-y-2">
                    {selected.users.map(u => (
                      <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <div>
                          <p className="text-xs font-medium text-slate-700">{u.name || 'Unnamed'}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{u.role}</span>
                          <button onClick={() => removeUser(u.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-xl border border-red-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">Danger Zone</p>

                {!confirmDelete ? (
                  <div className="space-y-2">
                    <button onClick={() => patch(selected.id, { status: 'SUSPENDED' }, 'Client suspended')}
                      className="w-full text-xs text-red-400 border border-red-200 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium">
                      🚫 Suspend Client
                    </button>
                    <button onClick={() => setConfirmDelete(true)}
                      className="w-full text-xs text-red-500 border border-red-300 bg-red-50 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium">
                      🗑 Permanently Delete Client
                    </button>
                  </div>
                ) : (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-xs font-semibold text-red-700 mb-1">Are you sure?</p>
                    <p className="text-xs text-red-500 mb-3">This will permanently delete <strong>{selected.name}</strong> and all their data. This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => deleteClient(selected.id)} disabled={actionLoading !== null}
                        className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                        {actionLoading === 'Deleting...' ? 'Deleting...' : 'Yes, Delete Forever'}
                      </button>
                      <button onClick={() => setConfirmDelete(false)} className="flex-1 text-xs bg-white border border-slate-200 text-slate-600 py-2 rounded-lg font-medium hover:bg-slate-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
