'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setSent(true)
      else setError('Something went wrong. Please try again.')
    } catch { setError('Something went wrong.') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#07070f' }}>
      <div className="w-full max-w-sm">

        {/* Logo — centered and bigger */}
        <div className="flex justify-center mb-10">
          <Image src="/logo.png" alt="SphereCX" width={180} height={48} className="object-contain" />
        </div>

        {!sent ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white mb-2">Forgot your password?</h1>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Enter your email and we&apos;ll send you a reset link right away.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder="you@company.com" />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={loading || !email}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <Link href="/login" className="block mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              ← Back to login
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">Check your email</h2>
            <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              We sent a reset link to
            </p>
            <p className="text-sm font-semibold text-white mb-6">{email}</p>
            <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Didn&apos;t get it? Check your spam folder or{' '}
              <button onClick={() => setSent(false)} className="text-blue-400 hover:text-blue-300">try again</button>.
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Need help? <a href="mailto:support@spherecx.app" className="text-blue-400">support@spherecx.app</a>
            </p>
            <Link href="/login" className="block mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              ← Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
