'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type Org = {
  id: string; name: string; slug: string
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED'
  contactName: string | null; contactEmail: string | null
  maxUsers: number; maxEvals: number
  trialEndsAt: string | null; createdAt: string; notes: string | null
  users: { id: string; name: string | null; email: string; role: string }[]
  _count: { evaluations: number; scorecards: number }
}

const PS = { FREE: 'bg-slate-100 text-slate-600', PRO: 'bg-blue-50 text-blue-600', ENTERPRISE: 'bg-indigo-50 text-indigo-600' }
const SS = { ACTIVE: 'bg-emerald-50 text-emerald-600', TRIAL: 'bg-amber-50 text-amber-600', SUSPENDED: 'bg-red-50 text-red-500', CANCELLED: 'bg-slate-100 text-slate-400' }
const PP = { FREE: '$0', PRO: '$299/mo', ENTERPRISE: '$999/mo' }
const PL = { FREE: { users: 3, evals: 50 }, PRO: { users: 15, evals: 500 }, ENTERPRISE: { users: 999, evals: 99999 } }

export default function AdminPage() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Org | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', contactName: '', contactEmail: '', plan: 'FREE', notes: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [tempPass, setTempPass] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [setupLink, setSetupLink] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const load = () => {
    fetch('/api/admin/clients').then(r => r.json())
      .then(data => { setOrgs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const selectOrg = (org: Org | null) => {
    setSelected(org)
    setTempPass('')
    setActionMsg(null)
    setSetupLink(null)
    setDeleteConfirm(false)
  }

  const addClient = async () => {
    if (!form.name.trim()) { setAddError('Name is required.'); return }
    setAdding(true); setAddError('')
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setForm({ name: '', contactName: '', contactEmail: '', plan: 'FREE', notes: '' }); setShowAdd(false); load() }
      else { const d = await res.json(); setAddError(d.error || 'Failed.') }
    } catch { setAddError('Failed.') } finally { setAdding(false) }
  }

  const patch = async (id: string, data: object) => {
    await fetch(`/api/admin/clients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    load(); if (selected?.id === id) selectOrg(null)
  }

  const runAction = async (action: string, id: string) => {
    setActionLoading(action); setActionMsg(null); setSetupLink(null)
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' })
        if (res.ok) { selectOrg(null); load() }
        else { const d = await res.json(); setActionMsg({ type: 'err', text: d.error || 'Delete failed.' }) }
      } else if (action === 'force-reset') {
        const res = await fetch(`/api/admin/clients/${id}/force-reset`, { method: 'POST' })
        if (res.ok) setActionMsg({ type: 'ok', text: 'Password reset email sent to all admin users.' })
        else { const d = await res.json(); setActionMsg({ type: 'err', text: d.error || 'Failed.' }) }
      } else if (action === 'temp-password') {
        if (!tempPass.trim()) { setActionMsg({ type: 'err', text: 'Enter a temporary password.' }); return }
        const res = await fetch(`/api/admin/clients/${id}/temp-password`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: tempPass }),
        })
        if (res.ok) { setActionMsg({ type: 'ok', text: 'Temporary password set. User must reset on next login.' }); setTempPass('') }
        else { const d = await res.json(); setActionMsg({ type: 'err', text: d.error || 'Failed.' }) }
      } else if (action === 'setup-link') {
        const res = await fetch(`/api/admin/clients/${id}/setup-link`, { method: 'POST' })
        if (res.ok) { const d = await res.json(); setSetupLink(d.link) }
        else { const d = await res.json(); setActionMsg({ type: 'err', text: d.error || 'Failed.' }) }
      } else if (action === 'suspend') {
        await patch(id, { status: 'SUSPENDED' })
      }
    } catch { setActionMsg({ type: 'err', text: 'Request failed.' }) }
    finally { setActionLoading(null) }
  }

  const filtered = orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()) || (o.contactEmail || '').includes(search.toLowerCase()))
  const mrr = orgs.filter(o => o.status !== 'CANCELLED' && o.status !== 'SUSPENDED').reduce((s, o) => s + (o.plan === 'PRO' ? 299 : o.plan === 'ENTERPRISE' ? 999 : 0), 0)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs bg-indigo-100 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">SUPER ADMIN</span>
            <h1 className="text-xl font-semibold text-slate-900 mt-1">Client Billing</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage all SphereCX clients, plans and access</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">+ Add Client</button>
        </div>

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
                  <input type={f.type} value={(form as Record<string, string>)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
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
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Internal Notes</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Referred by X, closing date Y..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            </div>
            {addError && <p className="text-xs text-red-500 mt-3">{addError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={addClient} disabled={adding} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-lg disabled:opacity-50">
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
                      {['Company', 'Plan', 'Status', 'Users', 'Evals', 'MRR', 'Trial Ends', ''].map(h => (
                        <th key={h} className="text-left text-xs text-slate-400 font-medium px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((org, i) => (
                      <tr key={org.id} onClick={() => selectOrg(selected?.id === org.id ? null : org)}
                        className={`cursor-pointer transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-50' : ''} ${selected?.id === org.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-900">{org.name}</p>
                          <p className="text-xs text-slate-400">{org.contactEmail || '—'}</p>
                        </td>
                        <td className="px-5 py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PS[org.plan]}`}>{org.plan}</span></td>
                        <td className="px-5 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SS[org.status]}`}>{org.status}</span></td>
                        <td className="px-5 py-4 text-sm text-slate-600">{org.users.length}<span className="text-slate-300">/{org.maxUsers}</span></td>
                        <td className="px-5 py-4 text-sm text-slate-600">{org._count.evaluations}<span className="text-slate-300">/{org.maxEvals}</span></td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-700">{PP[org.plan]}</td>
                        <td className="px-5 py-4 text-sm text-slate-400">{org.trialEndsAt ? new Date(org.trialEndsAt).toLocaleDateString() : '—'}</td>
                        <td className="px-5 py-4 text-xs text-blue-600 font-medium">Manage →</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {selected && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{selected.name}</p>
                    <p className="text-sm text-slate-400">{selected.contactName || '—'}</p>
                    <p className="text-xs text-slate-300">{selected.contactEmail}</p>
                  </div>
                  <button onClick={() => selectOrg(null)} className="text-slate-300 hover:text-slate-500 text-lg">×</button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Plan', value: selected.plan, sub: PP[selected.plan] },
                    { label: 'Status', value: selected.status, sub: null },
                    { label: 'Users', value: `${selected.users.length}/${selected.maxUsers}`, sub: null },
                    { label: 'Evals Used', value: `${selected._count.evaluations}/${selected.maxEvals}`, sub: null },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-slate-400">{s.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{s.value}</p>
                      {s.sub && <p className="text-xs text-slate-400">{s.sub}</p>}
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Change Plan</p>
                  <div className="flex gap-1.5">
                    {(['FREE', 'PRO', 'ENTERPRISE'] as const).map(p => (
                      <button key={p} onClick={() => patch(selected.id, { plan: p })}
                        className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${selected.plan === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Change Status</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'] as const).map(s => (
                      <button key={s} onClick={() => patch(selected.id, { status: s })}
                        className={`text-xs py-1 px-2.5 rounded-lg font-medium transition-colors ${selected.status === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {selected.notes && (
                  <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100 mb-4">
                    <p className="text-xs text-amber-700 font-medium">Note</p>
                    <p className="text-xs text-amber-600">{selected.notes}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Users ({selected.users.length}/{selected.maxUsers})</p>
                  <button className="text-xs text-blue-600 font-medium">+ Invite</button>
                </div>
                {selected.users.length === 0 ? (
                  <p className="text-xs text-slate-400">No users yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selected.users.map(u => (
                      <div key={u.id} className="flex items-center justify-between py-1">
                        <div>
                          <p className="text-xs font-medium text-slate-700">{u.name || 'Unnamed'}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{u.role}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Plan Features</p>
                <div className="space-y-2 text-sm">
                  {[
                    ['Users', PL[selected.plan].users === 999 ? 'Unlimited' : PL[selected.plan].users],
                    ['Evals/month', PL[selected.plan].evals === 99999 ? 'Unlimited' : PL[selected.plan].evals],
                    ['Scorecards', selected.plan === 'FREE' ? 3 : 'Unlimited'],
                    ['AI Auto-Score', selected.plan !== 'FREE' ? '✓' : '✗'],
                    ['Coaching Reports', selected.plan !== 'FREE' ? '✓' : '✗'],
                    ['Priority Support', selected.plan === 'ENTERPRISE' ? '✓' : '✗'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-slate-500">{label}</span>
                      <span className={`font-medium ${value === '✓' ? 'text-emerald-600' : value === '✗' ? 'text-slate-300' : 'text-slate-800'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Client Actions</p>

                {actionMsg && (
                  <div className={`rounded-lg px-3 py-2 mb-3 text-xs font-medium ${actionMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                    {actionMsg.text}
                  </div>
                )}

                {setupLink && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs font-medium text-blue-700 mb-1">Setup Link (expires in 24h)</p>
                    <p className="text-xs text-blue-600 break-all font-mono">{setupLink}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(setupLink); setActionMsg({ type: 'ok', text: 'Link copied to clipboard.' }) }}
                      className="text-xs text-blue-700 font-medium mt-1 hover:underline">
                      Copy link
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Set Temporary Password</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempPass}
                        onChange={e => setTempPass(e.target.value)}
                        placeholder="Enter temp password..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                      />
                      <button
                        onClick={() => runAction('temp-password', selected.id)}
                        disabled={actionLoading === 'temp-password'}
                        className="text-xs bg-slate-800 text-white px-3 py-2 rounded-lg font-medium hover:bg-slate-900 disabled:opacity-50 whitespace-nowrap">
                        {actionLoading === 'temp-password' ? '...' : 'Set'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => runAction('force-reset', selected.id)}
                    disabled={!!actionLoading}
                    className="w-full text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg font-medium text-left disabled:opacity-50 transition-colors">
                    {actionLoading === 'force-reset' ? 'Sending...' : 'Force Password Reset Email'}
                  </button>

                  <button
                    onClick={() => runAction('setup-link', selected.id)}
                    disabled={!!actionLoading}
                    className="w-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg font-medium text-left disabled:opacity-50 transition-colors">
                    {actionLoading === 'setup-link' ? 'Generating...' : 'Generate Setup Link'}
                  </button>

                  <button
                    onClick={() => { if (selected.status !== 'SUSPENDED') runAction('suspend', selected.id) }}
                    disabled={!!actionLoading || selected.status === 'SUSPENDED'}
                    className="w-full text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-2 rounded-lg font-medium text-left disabled:opacity-50 transition-colors">
                    {selected.status === 'SUSPENDED' ? 'Already Suspended' : actionLoading === 'suspend' ? 'Suspending...' : 'Suspend Client'}
                  </button>

                  {!deleteConfirm ? (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="w-full text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg font-medium text-left transition-colors">
                      Delete Client Permanently
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-red-700 font-medium mb-2">This will permanently delete {selected.name} and all its data. This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => runAction('delete', selected.id)}
                          disabled={actionLoading === 'delete'}
                          className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50">
                          {actionLoading === 'delete' ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="flex-1 text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-medium">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
