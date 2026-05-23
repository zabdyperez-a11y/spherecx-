import Link from 'next/link'
import Image from 'next/image'

export default function TrialExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#07070f' }}>
      <div className="w-full max-w-md text-center px-8">
        <Image src="/logo.png" alt="SphereCX" width={160} height={42} className="object-contain mx-auto mb-8" />

        <div className="text-5xl mb-4">⏰</div>
        <h1 className="text-2xl font-semibold text-white mb-3">Your trial has ended</h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Your 14-day free trial has expired. Upgrade to continue using SphereCX and keep all your data.
        </p>

        <div className="space-y-3 mb-8">
          {[
            { plan: 'Pro', price: '$299/mo', features: ['15 users', '500 evals/month', 'AI auto-scoring', 'Coaching reports'], color: '#3b82f6' },
            { plan: 'Enterprise', price: '$999/mo', features: ['Unlimited users', 'Unlimited evals', 'Priority support', 'Custom branding'], color: '#6366f1' },
          ].map(p => (
            <div key={p.plan} className="rounded-xl p-5 text-left"
              style={{ background: '#0d0d1a', border: `1px solid ${p.color}30` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-semibold text-white">{p.plan}</span>
                <span className="text-sm font-semibold" style={{ color: p.color }}>{p.price}</span>
              </div>
              <ul className="space-y-1">
                {p.features.map(f => (
                  <li key={f} className="text-xs flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ color: p.color }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <a href="mailto:sales@spherecx.app?subject=Upgrade SphereCX"
          className="block w-full py-3 rounded-lg text-sm font-semibold text-white mb-3 transition-all"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Contact Sales to Upgrade
        </a>

        <Link href="/login" className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          ← Back to login
        </Link>
      </div>
    </div>
  )
}
