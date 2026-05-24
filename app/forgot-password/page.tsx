'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // In production this would send a reset email via Resend
    // For now we show a confirmation message
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#07070f' }}>
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <Image src="/logo.png" alt="SphereCX" width={140} height={38} className="object-contain mb-10" />

          {!sent ? (
            <>
              <h1 className="text-2xl font-semibold text-white mb-2">Reset your password</h1>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="you@company.com" />
                </div>
                <button type="submit" disabled={loading || !email}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-4">✉️</div>
              <h2 className="text-xl font-semibold text-white mb-3">Check your email</h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                If an account exists for <strong className="text-white">{email}</strong>, you&apos;ll receive a password reset link shortly.
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Didn&apos;t get it? Contact <a href="mailto:support@spherecx.app" className="text-blue-400">support@spherecx.app</a>
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
