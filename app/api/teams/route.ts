import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const teams = await prisma.team.findMany({ include: { members: true } })
    return NextResponse.json(teams)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json()
    const team = await prisma.team.create({ data: { name, description: description || null } })
    return NextResponse.json(team, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
