'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        if (data.code === 'TRIAL_EXPIRED') {
          router.push('/trial-expired')
        } else if (data.code === 'SUSPENDED') {
          setError('Your account has been suspended. Contact support@spherecx.app.')
        } else {
          setError(data.error || 'Invalid email or password.')
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#07070f' }}>

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12"
        style={{ background: '#0d0d1a', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <Image src="/logo.png" alt="SphereCX" width={160} height={42} className="object-contain" />

        <div>
          <h2 className="text-3xl font-semibold text-white mb-4 leading-snug">
            Quality assurance<br />built for call centers.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)' }} className="text-base">
            Score calls, track agent performance, and identify coaching opportunities — all in one place.
          </p>

          <div className="mt-12 space-y-4">
            {[
              { icon: '✓', text: 'AI-powered call scoring' },
              { icon: '✓', text: 'Custom scorecards per team' },
              { icon: '✓', text: 'Real-time performance dashboards' },
              { icon: '✓', text: 'CSV export and reporting' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-blue-400 font-bold text-sm">{f.icon}</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © 2026 SphereCX. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">

          <div className="lg:hidden mb-10 flex justify-center">
            <Image src="/logo.png" alt="SphereCX" width={140} height={36} className="object-contain" />
          </div>

          <h1 className="text-2xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Sign in to your SphereCX account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                style={{
                  background: '#0d0d1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                style={{
                  background: '#0d0d1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all mt-2"
              style={{
                background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center justify-between mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <Link href="/forgot-password" className="hover:text-blue-400 transition-colors">Forgot password?</Link>
            <span>Need access? Contact your admin.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
