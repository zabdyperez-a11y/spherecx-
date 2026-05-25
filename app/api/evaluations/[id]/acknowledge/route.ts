export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const evaluation = await prisma.evaluation.update({
      where: { id: params.id },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: session.name || session.email,
        status: 'ACKNOWLEDGED' as any,
      } as any,
    })
    await logAudit({
      userEmail: session.email, userName: session.name, userRole: session.role,
      userId: session.id, orgId: session.orgId,
      action: 'UPDATE', entity: 'evaluation', entityId: params.id,
      details: { action: 'acknowledged' },
    })
    return NextResponse.json(evaluation)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
