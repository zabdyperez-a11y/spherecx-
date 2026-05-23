'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

type NavItem = { label: string; href: string; icon: string; roles: string[] }

const NAV: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard',   icon: '▦', roles: ['*'] },
  { label: 'Scorecards',  href: '/scorecards',  icon: '◫', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','QA_ANALYST'] },
  { label: 'Evaluations', href: '/evaluations', icon: '✓', roles: ['*'] },
  { label: 'Agents',      href: '/agents',      icon: '◎', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','TEAM_LEAD','QA_ANALYST'] },
  { label: 'Reports',     href: '/reports',     icon: '↗', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','TEAM_LEAD','QA_ANALYST'] },
  { label: 'Audit Log',   href: '/audit',       icon: '⊛', roles: ['SUPER_ADMIN','ADMIN'] },
  { label: 'Settings',    href: '/settings',    icon: '⚙', roles: ['SUPER_ADMIN','ADMIN'] },
  // Only visible to SphereCX owner
  { label: 'Billing',     href: '/admin',       icon: '◈', roles: ['SUPER_ADMIN'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState('SUPER_ADMIN')
  const [userName, setUserName] = useState('Zabdy Perez')
  const [userRoleLabel, setUserRoleLabel] = useState('Super Admin')

  useEffect(() => {
    try {
      const match = document.cookie.split(';').find(c => c.trim().startsWith('spherecx_user='))
      if (match) {
        const val = match.split('=').slice(1).join('=')
        const user = JSON.parse(decodeURIComponent(val))
        setRole(user.role || 'AGENT')
        setUserName(user.name || user.email || 'User')
        const labels: Record<string, string> = {
          SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', MANAGER: 'Manager',
          SUPERVISOR: 'Supervisor', TEAM_LEAD: 'Team Lead',
          QA_ANALYST: 'QA Analyst', AGENT: 'Agent',
        }
        setUserRoleLabel(labels[user.role] || user.role)
      }
    } catch {}
  }, [])

  const visibleNav = NAV.filter(item =>
    item.roles.includes('*') || item.roles.includes(role)
  )

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-56 min-h-screen flex flex-col border-r border-slate-100 bg-white">
      <div className="px-5 py-5 border-b border-slate-100">
        <Image src="/logo.png" alt="SphereCX" width={130} height={34} className="object-contain" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleNav.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100">
        {role === 'SUPER_ADMIN' && (
          <div className="mb-3 px-2 py-1 bg-indigo-50 rounded-lg">
            <p className="text-xs font-semibold text-indigo-600">SphereCX Owner</p>
          </div>
        )}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
            {userName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{userName}</p>
            <p className="text-xs text-slate-400">{userRoleLabel}</p>
          </div>
        </div>
        <button onClick={signOut} className="w-full text-left text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Sign out →
        </button>
      </div>
    </aside>
  )
}
