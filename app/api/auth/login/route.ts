import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ALLOWED_USERS = [
  { email: process.env.ADMIN_EMAIL || 'admin@spherecx.com', password: process.env.ADMIN_PASSWORD || 'spherecx2026' },
]

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const user = ALLOWED_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const cookieStore = cookies()
    cookieStore.set('spherecx_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
