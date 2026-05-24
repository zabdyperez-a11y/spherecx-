'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword: password }),
      })
      const data = await res.json()
      if (res.ok) { setDone(true); setTimeout(() => router.push('/login'), 2500) }
      else setError(data.error || 'Failed to reset password.')
    } catch { setError('Something went wrong.') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#07070f' }}>
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="SphereCX" width={160} height={44} className="object-contain" />
        </div>

        {done ? (
          <div>
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-white mb-2">Password reset!</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Redirecting to login...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-white mb-2">Set new password</h1>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>For {email}</p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  placeholder="Repeat password"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <Link href="/login" className="block mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          ← Back to login
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#07070f' }}><p className="text-slate-400">Loading...</p></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
