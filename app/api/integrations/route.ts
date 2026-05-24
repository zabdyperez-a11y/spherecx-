export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

// Store integration configs (in production, use encrypted storage)
const INTEGRATIONS: Record<string, any> = {}

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(INTEGRATIONS[session.orgId || 'default'] || {})
}

export async function POST(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const key = session.orgId || 'default'
    INTEGRATIONS[key] = { ...INTEGRATIONS[key], ...body, updatedAt: new Date().toISOString() }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
