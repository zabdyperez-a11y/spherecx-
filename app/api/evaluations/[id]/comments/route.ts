export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const comments = await prisma.evaluationComment.findMany({
      where: { evaluationId: params.id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(comments)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { content } = await req.json()
    const comment = await prisma.evaluationComment.create({
      data: {
        evaluationId: params.id,
        userId: session.id || null,
        userName: session.name || session.email,
        userRole: session.role,
        content,
      },
    })
    return NextResponse.json(comment, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
