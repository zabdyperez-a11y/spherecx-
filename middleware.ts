import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/trial-expired']
const SUPER_ADMIN_ONLY = ['/admin', '/api/admin']

// Pages blocked for AGENT role
const AGENT_BLOCKED = ['/scorecards/new', '/agents', '/reports', '/settings', '/audit', '/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.includes('favicon') || pathname.includes('logo.png')) {
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

  // Parse role from cookie
  let role = 'SUPER_ADMIN'
  try {
    const userCookie = request.cookies.get('spherecx_user')?.value
    if (userCookie) {
      role = JSON.parse(userCookie).role || 'AGENT'
    }
  } catch {}

  // Only super admin can access billing admin
  if (SUPER_ADMIN_ONLY.some(p => pathname.startsWith(p)) && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard?denied=1', request.url))
  }

  // Block agents from restricted pages
  if (role === 'AGENT' && AGENT_BLOCKED.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard?denied=1', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
}
