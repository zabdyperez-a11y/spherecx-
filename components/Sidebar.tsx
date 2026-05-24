'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

type NavItem = { label: string; href: string; icon: string; roles: string[] }

const NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', roles: ['*'] },
  { label: 'Scorecards',   href: '/scorecards',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','QA_ANALYST'] },
  { label: 'Evaluations',  href: '/evaluations', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['*'] },
  { label: 'Bulk Scoring', href: '/bulk-score',  icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', roles: ['SUPER_ADMIN','ADMIN','MANAGER','QA_ANALYST'] },
  { label: 'Agents',       href: '/agents',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','TEAM_LEAD','QA_ANALYST'] },
  { label: 'My Performance',href: '/agent',      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', roles: ['AGENT'] },
  { label: 'Reports',      href: '/reports',     icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','TEAM_LEAD','QA_ANALYST'] },
  { label: 'Audit Log',    href: '/audit',       icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', roles: ['SUPER_ADMIN','ADMIN'] },
  { label: 'Settings',     href: '/settings',    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', roles: ['SUPER_ADMIN','ADMIN'] },
  { label: 'HR',           href: '/hr',          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
  { label: 'Scheduling',   href: '/scheduling',  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR'] },
  { label: 'Training',     href: '/training',    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
  { label: 'Operations',   href: '/operations',  icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
  { label: 'Billing',      href: '/admin',       icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', roles: ['SUPER_ADMIN'] },
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
        setUserName(user.name || user.email?.split('@')[0] || 'User')
        const labels: Record<string, string> = {
          SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', MANAGER: 'Manager',
          SUPERVISOR: 'Supervisor', TEAM_LEAD: 'Team Lead',
          QA_ANALYST: 'QA Analyst', AGENT: 'Agent',
        }
        setUserRoleLabel(labels[user.role] || user.role)
      }
    } catch {}
  }, [])

  const visibleNav = NAV.filter(item => item.roles.includes('*') || item.roles.includes(role))
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-56 min-h-screen flex flex-col bg-white border-r border-slate-100">
      <div className="px-5 py-5 border-b border-slate-100">
        <Image src="/logo.png" alt="SphereCX" width={120} height={32} className="object-contain object-left" />
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {visibleNav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/agent' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all duration-100 group
                ${active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}`}>
              <svg className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
                {item.icon.split(' M').filter(Boolean).map((d, i) => (
                  <path key={i} strokeLinecap="round" strokeLinejoin="round" d={i === 0 ? d : `M${d}`} />
                ))}
              </svg>
              <span>{item.label}</span>
              {active && <div className="ml-auto w-1 h-4 bg-blue-500 rounded-full" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-100">
        {role === 'SUPER_ADMIN' && (
          <div className="mx-1 mb-2 px-2 py-1 bg-indigo-50 rounded-md">
            <p className="text-xs font-semibold text-indigo-600">SphereCX Owner</p>
          </div>
        )}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{userName}</p>
            <p className="text-xs text-slate-400 leading-tight">{userRoleLabel}</p>
          </div>
          <button onClick={signOut} className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0" title="Sign out">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
