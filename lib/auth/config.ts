import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || process.env.ADMIN_EMAIL || 'admin@spherecx.com').split(',').map(e => e.trim())

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@spherecx.com'
        const adminPassword = process.env.ADMIN_PASSWORD || 'spherecx2026'
        if (credentials?.email === adminEmail && credentials?.password === adminPassword) {
          return { id: '1', name: 'Admin', email: adminEmail, role: 'SUPER_ADMIN' }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Allow if email is in the allowed list, or if no list is set (allow all)
        if (ALLOWED_EMAILS.length === 0 || ALLOWED_EMAILS.includes(user.email || '')) {
          return true
        }
        return false
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) { token.role = (user as any).role || 'ADMIN' }
      return token
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).role = token.role }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}
