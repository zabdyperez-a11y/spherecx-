import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'SphereCX — Call Center QA Platform',
  description: 'AI-powered quality assurance for call center teams',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-slate-50 antialiased`}>{children}</body>
    </html>
  )
}
