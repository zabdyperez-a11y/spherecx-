'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  return (
    <aside className="w-56 min-h-screen flex flex-col bg-white border-r border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100">
        <Image src="/logo.png" alt="SphereCX" width={130} height={34} className="object-contain" />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}>
              <span className="text-base w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">Z</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">Zabdy Perez</p>
            <p className="text-xs text-slate-400 truncate">QA Analyst</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
