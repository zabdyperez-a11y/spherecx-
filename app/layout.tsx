import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SphereCX — Call Center Operations Platform',
  description: 'AI-powered QA, HR, scheduling, and operations for call centers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{children}</body>
    </html>
  )
}
