// Central permissions config for SphereCX
// Every role, every page, every action defined here

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'TEAM_LEAD' | 'QA_ANALYST' | 'AGENT'

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  TEAM_LEAD: 'Team Lead',
  QA_ANALYST: 'QA Analyst',
  AGENT: 'Agent',
}

export const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-indigo-100 text-indigo-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  SUPERVISOR: 'bg-cyan-100 text-cyan-700',
  TEAM_LEAD: 'bg-teal-100 text-teal-700',
  QA_ANALYST: 'bg-emerald-100 text-emerald-700',
  AGENT: 'bg-slate-100 text-slate-600',
}

// What each role can do
export const PERMISSIONS = {
  // QA
  view_evaluations: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'TEAM_LEAD', 'QA_ANALYST', 'AGENT'],
  create_evaluations: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'QA_ANALYST'],
  view_own_evaluations: ['AGENT'],
  manage_scorecards: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'QA_ANALYST'],
  bulk_score: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'QA_ANALYST'],
  // HR
  view_hr: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  manage_hr: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  view_own_hr: ['SUPERVISOR', 'TEAM_LEAD', 'QA_ANALYST', 'AGENT'],
  add_incidents: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  conduct_reviews: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR'],
  // Scheduling
  view_scheduling: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR'],
  manage_scheduling: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  // Training
  view_training: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'TEAM_LEAD', 'QA_ANALYST', 'AGENT'],
  manage_training: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  // Operations
  view_operations: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  manage_operations: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  // Reports
  view_reports: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'TEAM_LEAD', 'QA_ANALYST'],
  // Settings
  manage_users: ['SUPER_ADMIN', 'ADMIN'],
  view_audit: ['SUPER_ADMIN', 'ADMIN'],
  // Billing
  manage_billing: ['SUPER_ADMIN'],
}

export function hasPermission(role: string, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as string[]).includes(role)
}

export const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/dashboard',   icon: 'home',         roles: ['*'] },
  { label: 'Scorecards',    href: '/scorecards',  icon: 'clipboard',    roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','QA_ANALYST'] },
  { label: 'Evaluations',   href: '/evaluations', icon: 'check-circle', roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','TEAM_LEAD','QA_ANALYST'] },
  { label: 'My Scores',     href: '/agent',       icon: 'user',         roles: ['AGENT'] },
  { label: 'Bulk Scoring',  href: '/bulk-score',  icon: 'layers',       roles: ['SUPER_ADMIN','ADMIN','MANAGER','QA_ANALYST'] },
  { label: 'Agents',        href: '/agents',      icon: 'users',        roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','TEAM_LEAD','QA_ANALYST'] },
  { label: 'HR',            href: '/hr',          icon: 'user-group',   roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
  { label: 'Scheduling',    href: '/scheduling',  icon: 'calendar',     roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR'] },
  { label: 'Training',      href: '/training',    icon: 'book',         roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','TEAM_LEAD','QA_ANALYST','AGENT'] },
  { label: 'Operations',    href: '/operations',  icon: 'chart',        roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
  { label: 'Reports',       href: '/reports',     icon: 'bar-chart',    roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR','TEAM_LEAD','QA_ANALYST'] },
  { label: 'Audit Log',     href: '/audit',       icon: 'log',          roles: ['SUPER_ADMIN','ADMIN'] },
  { label: 'Settings',      href: '/settings',    icon: 'settings',     roles: ['SUPER_ADMIN','ADMIN'] },
  { label: 'Leave',         href: '/leave',       icon: 'calendar',     roles: ['SUPER_ADMIN','ADMIN','MANAGER','SUPERVISOR'] },
  { label: 'Onboarding',    href: '/onboarding',  icon: 'book',         roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
  { label: 'Payroll',       href: '/payroll',     icon: 'credit-card',  roles: ['SUPER_ADMIN','ADMIN'] },
  { label: 'Billing',       href: '/admin',       icon: 'credit-card',  roles: ['SUPER_ADMIN'] },
]
