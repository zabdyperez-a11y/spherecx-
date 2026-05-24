import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login', '/trial-expired', '/forgot-password', '/reset-password',
  '/api/auth/login', '/api/auth/logout', '/api/auth/reset-password',
]

// Routes and which roles can access them
const ROUTE_ROLES: { path: string; roles: string[] }[] = [
  { path: '/admin',       roles: ['SUPER_ADMIN'] },
  { path: '/api/admin',   roles: ['SUPER_ADMIN'] },
  { path: '/audit',       roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/settings',    roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/hr',          roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { path: '/api/hr',      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { path: '/operations',  roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { path: '/api/operations', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { path: '/scheduling',  roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR'] },
  { path: '/api/scheduling', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR'] },
  { path: '/bulk-score',  roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'QA_ANALYST'] },
  { path: '/reports',     roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'TEAM_LEAD', 'QA_ANALYST'] },
  { path: '/scorecards',  roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'QA_ANALYST'] },
  { path: '/agents',      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'TEAM_LEAD', 'QA_ANALYST'] },
  { path: '/training',    roles: ['*'] },
  { path: '/agent',       roles: ['AGENT'] },
  { path: '/evaluations', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'TEAM_LEAD', 'QA_ANALYST'] },
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files
  if (pathname.startsWith('/_next') || pathname.match(/\.(ico|png|jpg|svg|css|js)$/)) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isAuthenticated = request.cookies.get('spherecx_auth')?.value === 'authenticated'

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!isAuthenticated) return NextResponse.next()

  // Parse role
  let role = 'SUPER_ADMIN'
  try {
    const userCookie = request.cookies.get('spherecx_user')?.value
    if (userCookie) role = JSON.parse(userCookie).role || 'AGENT'
  } catch {}

  // Check route permissions
  for (const route of ROUTE_ROLES) {
    if (pathname.startsWith(route.path)) {
      if (route.roles.includes('*')) break
      if (!route.roles.includes(role)) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/dashboard?denied=1', request.url))
      }
      break
    }
  }

  // Agents can only access their own evaluations page
  if (role === 'AGENT' && pathname.startsWith('/evaluations') && !pathname.includes('/evaluations/')) {
    return NextResponse.redirect(new URL('/agent', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
}
