import { cookies } from 'next/headers'

export type SessionUser = {
  id?: string
  email: string
  name?: string | null
  role: string
  orgId?: string | null
  isSuperAdmin: boolean
}

export function getSession(): SessionUser | null {
  try {
    const cookieStore = cookies()
    const auth = cookieStore.get('spherecx_auth')?.value
    if (auth !== 'authenticated') return null

    const userCookie = cookieStore.get('spherecx_user')?.value
    if (!userCookie) {
      // Legacy super admin login — no user cookie
      return {
        email: 'admin@spherecx.com',
        name: 'Admin',
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
      }
    }

    const user = JSON.parse(userCookie)
    return {
      ...user,
      isSuperAdmin: user.role === 'SUPER_ADMIN',
    }
  } catch {
    return null
  }
}

// Returns orgId filter for Prisma queries
// SUPER_ADMIN gets no filter (sees everything)
// Everyone else is scoped to their org
export function getOrgFilter(session: SessionUser): { orgId?: string } {
  if (session.isSuperAdmin) return {}
  return { orgId: session.orgId || undefined }
}
