export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(req: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const where: any = session.isSuperAdmin ? {} : { orgId: session.orgId || undefined }
    if (startDate) where.date = { ...where.date, gte: new Date(startDate) }
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) }

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: { employee: true },
      orderBy: [{ employee: { lastName: 'asc' } } as any, { date: 'asc' }],
    })

    const byEmployee: Record<string, any> = {}
    for (const r of records) {
      const key = r.employeeId
      if (!byEmployee[key]) {
        byEmployee[key] = {
          id: r.employee.id,
          name: `${r.employee.firstName} ${r.employee.lastName}`,
          jobTitle: r.employee.jobTitle,
          department: r.employee.department,
          payRate: r.employee.payRate,
          payType: r.employee.payType,
          totalHours: 0, presentDays: 0, absentDays: 0, ptoDays: 0,
        }
      }
      byEmployee[key].totalHours = Math.round((byEmployee[key].totalHours + (r.hoursWorked || 0)) * 100) / 100
      if (['PRESENT', 'LATE'].includes(r.status)) byEmployee[key].presentDays++
      if (r.status === 'ABSENT') byEmployee[key].absentDays++
      if (r.status === 'PTO') byEmployee[key].ptoDays++
    }

    const summary = Object.values(byEmployee).map((emp: any) => ({
      ...emp,
      grossPay: emp.payType === 'SALARY' ? Math.round((emp.payRate || 0) / 26 * 100) / 100 : Math.round(emp.totalHours * (emp.payRate || 0) * 100) / 100,
    }))

    return NextResponse.json(summary)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
