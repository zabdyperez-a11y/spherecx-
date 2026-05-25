export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { orgId, name, email, role, password } = await req.json()
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role || 'QA_ANALYST',
        orgId,
        password: password || null,
      },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
