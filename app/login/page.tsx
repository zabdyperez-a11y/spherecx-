'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/dashboard')
      } else if (data.code === 'TRIAL_EXPIRED') {
        router.push('/trial-expired')
      } else {
        setError(data.error || 'Invalid credentials.')
      }
    } catch { setError('Connection error. Please try again.') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#080d1a' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10"
        style={{ background: 'linear-gradient(135deg, #0c1a3d 0%, #0f1629 60%, #0a0f1e 100%)' }}>
        <div>
          <Image src="/logo.png" alt="SphereCX" width={140} height={38} className="object-contain object-left brightness-[10]" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Quality assurance that<br />actually gets done.
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' }}>
            AI-powered call scoring, coaching, HR, scheduling, and operations — all in one platform built for call center teams.
          </p>
          <div className="space-y-3">
            {[
              'Score calls automatically with GPT-4o',
              'Track HR, attendance, and training in one place',
              'Role-based access for every team member',
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)' }}>
                  <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 SphereCX. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Image src="/logo.png" alt="SphereCX" width={130} height={36} className="object-contain mx-auto brightness-[10]" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Sign in to your SphereCX account</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-300 flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                placeholder="you@company.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Password</label>
                <Link href="/forgot-password" className="text-xs" style={{ color: 'rgba(99,130,246,0.8)' }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => { e.target.style.border = '1px solid rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                  onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                  placeholder="••••••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity"
                  style={{ color: 'white' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    {showPassword
                      ? <><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></>
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !email || !password}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Need an account?{' '}
            <a href="mailto:support@spherecx.app" style={{ color: 'rgba(99,130,246,0.7)' }}>Contact support</a>
          </p>
        </div>
      </div>
    </div>
  )
}
