'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: '▦' },
  { label: 'Scorecards', href: '/scorecards', icon: '◫' },
  { label: 'Evaluations', href: '/evaluations', icon: '✓' },
  { label: 'Agents', href: '/agents', icon: '◎' },
  { label: 'Reports', href: '/reports', icon: '↗' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-56 min-h-screen flex flex-col" style={{ background: '#0f1629', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Image src="/logo.png" alt="SphereCX" width={130} height={34} className="object-contain" />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
              style={active
                ? { background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontWeight: 500 }
                : { color: 'rgba(255,255,255,0.45)' }
              }>
              <span className="text-base w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Z</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">Zabdy Perez</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>QA Analyst</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full text-xs py-1.5 rounded-lg transition-all text-left px-2"
          style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' }}>
          Sign out →
        </button>
      </div>
    </aside>
  )
}
