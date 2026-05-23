export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const limits: Record<string, { maxUsers: number; maxEvals: number }> = {
      FREE: { maxUsers: 3, maxEvals: 50 },
      PRO: { maxUsers: 15, maxEvals: 500 },
      ENTERPRISE: { maxUsers: 999, maxEvals: 99999 },
    }
    const updateData: any = { ...body }
    if (body.plan && limits[body.plan]) {
      updateData.maxUsers = limits[body.plan].maxUsers
      updateData.maxEvals = limits[body.plan].maxEvals
    }
    const org = await prisma.organization.update({
      where: { id: params.id },
      data: updateData,
    })
    return NextResponse.json(org)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.organization.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
