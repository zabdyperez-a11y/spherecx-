// Reusable page wrapper — handles layout, header, responsive padding
import Sidebar from './Sidebar'

type Props = {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}

export default function PageShell({ title, subtitle, action, children }: Props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main className="app-main flex-1 min-w-0">
        <div className="page-header">
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}
