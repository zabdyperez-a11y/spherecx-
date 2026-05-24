'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

type Integration = {
  id: string; name: string; logo: string; description: string; category: string
  status: 'connected' | 'available' | 'coming_soon'
  features: string[]; setupFields: { key: string; label: string; type: string; placeholder: string }[]
  docsUrl?: string; webhookInfo?: string
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'ringcentral', name: 'RingCentral', logo: '📞', category: 'Phone System',
    status: 'available',
    description: 'Automatically import call recordings, transcripts, and call logs. Score calls directly from your RingCentral dashboard.',
    features: ['Auto-import call recordings', 'Pull transcripts automatically', 'Sync call metadata (duration, agent, queue)', 'Real-time call events via webhook'],
    setupFields: [
      { key: 'rc_client_id', label: 'Client ID', type: 'text', placeholder: 'From RingCentral Developer Portal' },
      { key: 'rc_client_secret', label: 'Client Secret', type: 'password', placeholder: '••••••••••••' },
      { key: 'rc_account_id', label: 'Account ID', type: 'text', placeholder: 'Your RingCentral account ID' },
    ],
    docsUrl: 'https://developers.ringcentral.com',
    webhookInfo: 'Set your RingCentral webhook URL to: https://spherecx.vercel.app/api/webhooks/ringcentral',
  },
  {
    id: 'gohighlevel', name: 'GoHighLevel', logo: '🚀', category: 'CRM',
    status: 'available',
    description: 'Sync contact data, pull conversation history, and log QA evaluations directly to GHL contact records.',
    features: ['Sync contact profiles to agents', 'Log evaluations as GHL activities', 'Pull call recordings from GHL', 'Trigger automations on QA events'],
    setupFields: [
      { key: 'ghl_api_key', label: 'API Key', type: 'password', placeholder: 'From GHL Settings > Integrations' },
      { key: 'ghl_location_id', label: 'Location ID', type: 'text', placeholder: 'Your GHL location/sub-account ID' },
    ],
    docsUrl: 'https://highlevel.stoplight.io',
    webhookInfo: 'Add webhook in GHL: Settings > Integrations > Webhooks → URL: https://spherecx.vercel.app/api/webhooks/gohighlevel',
  },
  {
    id: 'five9', name: 'Five9', logo: '☁️', category: 'Contact Center',
    status: 'available',
    description: 'Pull agent performance data, call recordings, and real-time queue metrics from Five9.',
    features: ['Import agent performance data', 'Sync call recordings', 'Real-time queue monitoring', 'Automatic evaluation triggers'],
    setupFields: [
      { key: 'five9_username', label: 'API Username', type: 'text', placeholder: 'admin@yourcompany.com' },
      { key: 'five9_password', label: 'API Password', type: 'password', placeholder: '••••••••••••' },
      { key: 'five9_domain', label: 'Domain', type: 'text', placeholder: 'app.five9.com' },
    ],
    docsUrl: 'https://webapps.five9.com/assets/files/for_customers/documentation/apis/',
  },
  {
    id: 'genesys', name: 'Genesys Cloud', logo: '🌐', category: 'Contact Center',
    status: 'coming_soon',
    description: 'Enterprise contact center integration with full conversation analytics.',
    features: ['Full conversation analytics', 'Agent state monitoring', 'Queue performance data', 'AI transcript import'],
    setupFields: [],
  },
  {
    id: 'talkdesk', name: 'Talkdesk', logo: '💬', category: 'Contact Center',
    status: 'coming_soon',
    description: 'Pull call data, recordings, and agent metrics from Talkdesk.',
    features: ['Call recording sync', 'Agent performance data', 'Real-time dashboards'],
    setupFields: [],
  },
  {
    id: 'salesforce', name: 'Salesforce', logo: '☁️', category: 'CRM',
    status: 'available',
    description: 'Log evaluations as Salesforce activities and sync agent data bidirectionally.',
    features: ['Log evaluations as SF activities', 'Sync agent to SF contacts', 'Pull call data from SF CTI', 'Custom object support'],
    setupFields: [
      { key: 'sf_instance_url', label: 'Instance URL', type: 'text', placeholder: 'https://yourcompany.salesforce.com' },
      { key: 'sf_access_token', label: 'Access Token', type: 'password', placeholder: 'From SF Connected App' },
    ],
    docsUrl: 'https://developer.salesforce.com',
  },
  {
    id: 'zapier', name: 'Zapier', logo: '⚡', category: 'Automation',
    status: 'available',
    description: 'Connect SphereCX to 6,000+ apps. Trigger automations when evaluations are submitted or scores drop.',
    features: ['Trigger on evaluation submitted', 'Trigger on low score', 'Send coaching reports anywhere', 'Create evaluations from any app'],
    setupFields: [
      { key: 'zapier_webhook', label: 'Zapier Webhook URL', type: 'text', placeholder: 'https://hooks.zapier.com/hooks/catch/...' },
    ],
    docsUrl: 'https://zapier.com',
    webhookInfo: 'SphereCX will POST evaluation data to this URL when events occur.',
  },
  {
    id: 'slack', name: 'Slack', logo: '💬', category: 'Notifications',
    status: 'available',
    description: 'Get real-time alerts in Slack when evaluations are submitted, scores drop, or disputes are filed.',
    features: ['Score drop alerts', 'Evaluation submitted notifications', 'Weekly digest', 'Dispute notifications'],
    setupFields: [
      { key: 'slack_webhook', label: 'Slack Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/services/...' },
      { key: 'slack_channel', label: 'Channel Name', type: 'text', placeholder: '#qa-alerts' },
    ],
    docsUrl: 'https://api.slack.com/messaging/webhooks',
    webhookInfo: 'Create an Incoming Webhook in Slack: Apps > Incoming Webhooks > Add to Slack',
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Phone System': 'badge-blue',
  'CRM': 'badge-purple',
  'Contact Center': 'badge-indigo',
  'Automation': 'badge-amber',
  'Notifications': 'badge-green',
}

export default function IntegrationsPage() {
  const [selected, setSelected] = useState<Integration | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [filter, setFilter] = useState('All')

  const categories = ['All', ...Array.from(new Set(INTEGRATIONS.map(i => i.category)))]

  const filtered = filter === 'All' ? INTEGRATIONS : INTEGRATIONS.filter(i => i.category === filter)
  const connected = INTEGRATIONS.filter(i => i.status === 'connected').length

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await fetch('/api/integrations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [selected.id]: form }),
      })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch {} finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main className="app-main flex-1">
        <div className="page-header">
          <div>
            <h1 className="page-title">Integrations</h1>
            <p className="page-subtitle">Connect SphereCX to your phone system, CRM, and productivity tools</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-green">{connected} connected</span>
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>{INTEGRATIONS.length} available</span>
          </div>
        </div>

        {/* How it works */}
        <div className="card p-5 mb-6" style={{ background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', border: '1px solid #bfdbfe' }}>
          <div className="grid grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Connect your phone system', desc: 'Link RingCentral, Five9, or Talkdesk to auto-import call recordings and transcripts' },
              { step: '2', title: 'SphereCX scores automatically', desc: 'AI analyzes transcripts and scores every call against your scorecard — no manual work' },
              { step: '3', title: 'Push results anywhere', desc: 'Sync evaluations to your CRM, send alerts to Slack, or trigger Zapier automations' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#2563eb' }}>{s.step}</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1e3a8a' }}>{s.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#3b82f6' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${filter === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className={`grid gap-5 ${selected ? 'grid-cols-3' : 'grid-cols-3'}`}>
          {/* Integration cards */}
          <div className={selected ? 'col-span-2 grid grid-cols-2 gap-4 content-start' : 'col-span-3 grid grid-cols-3 gap-4'}>
            {filtered.map(integration => (
              <div key={integration.id}
                onClick={() => integration.status !== 'coming_soon' && setSelected(selected?.id === integration.id ? null : integration)}
                className={`card p-5 transition-all duration-150 ${integration.status === 'coming_soon' ? 'opacity-60' : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'} ${selected?.id === integration.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      {integration.logo}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{integration.name}</p>
                      <span className={CATEGORY_COLORS[integration.category] || 'badge-slate'}>{integration.category}</span>
                    </div>
                  </div>
                  <div>
                    {integration.status === 'connected' && <span className="badge-green">● Connected</span>}
                    {integration.status === 'available' && <span className="badge-slate">Available</span>}
                    {integration.status === 'coming_soon' && <span className="badge-amber">Coming Soon</span>}
                  </div>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-3)', lineHeight: '1.5' }}>{integration.description}</p>
                <ul className="space-y-1">
                  {integration.features.slice(0, 3).map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
                      <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Setup panel */}
          {selected && (
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selected.logo}</span>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-1)' }}>{selected.name}</p>
                      <span className={CATEGORY_COLORS[selected.category] || 'badge-slate'}>{selected.category}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ color: 'var(--text-4)' }} className="hover:opacity-70 text-xl">×</button>
                </div>

                <p className="text-sm mb-5" style={{ color: 'var(--text-3)', lineHeight: '1.6' }}>{selected.description}</p>

                {selected.webhookInfo && (
                  <div className="alert-info mb-4">
                    <p className="text-xs font-semibold mb-1" style={{ color: '#0369a1' }}>Setup Instructions</p>
                    <p className="text-xs" style={{ color: '#0284c7' }}>{selected.webhookInfo}</p>
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  {selected.setupFields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>{field.label}</label>
                      <input type={field.type} value={form[field.key] || ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        placeholder={field.placeholder} className="input" />
                    </div>
                  ))}
                </div>

                {saved && <div className="alert-success mb-3 text-xs text-emerald-700 font-medium">✓ Configuration saved!</div>}

                <div className="flex gap-2">
                  <button onClick={save} disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Saving...' : 'Save & Connect'}
                  </button>
                  {selected.docsUrl && (
                    <a href={selected.docsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs px-3">
                      Docs ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="card p-5">
                <p className="section-title mb-3">All Features</p>
                <ul className="space-y-2">
                  {selected.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
