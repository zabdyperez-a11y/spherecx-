import { prisma } from '@/lib/db'

export type AuditAction =
  | 'LOGIN' | 'LOGOUT'
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  | 'SUBMIT' | 'DRAFT' | 'DISPUTE' | 'RESOLVE'
  | 'INVITE' | 'REMOVE' | 'ROLE_CHANGE'
  | 'PLAN_CHANGE' | 'STATUS_CHANGE'

export type AuditEntity =
  | 'evaluation' | 'scorecard' | 'agent' | 'user'
  | 'team' | 'organization' | 'session' | 'report'

interface LogParams {
  userEmail: string
  userName?: string | null
  userRole?: string | null
  userId?: string | null
  orgId?: string | null
  action: AuditAction
  entity: AuditEntity
  entityId?: string | null
  entityName?: string | null
  details?: Record<string, any> | null
  ipAddress?: string | null
}

export async function logAudit(params: LogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userEmail: params.userEmail,
        userName: params.userName || null,
        userRole: params.userRole || null,
        userId: params.userId || null,
        orgId: params.orgId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        entityName: params.entityName || null,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
      },
    })
  } catch (e) {
    // Never let audit logging break the main flow
    console.error('Audit log failed:', e)
  }
}
