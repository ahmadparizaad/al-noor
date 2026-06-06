import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_PATHS = ['/admin', '/api/admin']
const PROTECTED_PATHS = ['/orders', '/account', '/profile', '/api/orders', '/api/user']

export default auth(function middleware(req: NextRequest & { auth: { user?: { role?: string } } | null }) {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Admin routes: must be logged in + role=admin
  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login?callbackUrl=' + encodeURIComponent(pathname), req.url))
    }
    if (session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/403', req.url))
    }
  }

  // Protected customer routes: must be logged in
  if (PROTECTED_PATHS.some(p => pathname.startsWith(p))) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login?callbackUrl=' + encodeURIComponent(pathname), req.url))
    }
  }

  // Payment API: only accessible server-side (no direct browser GET)
  if (pathname.startsWith('/api/payments') && req.method === 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/account/:path*',
    '/profile/:path*',
    '/api/admin/:path*',
    '/api/orders/:path*',
    '/api/user/:path*',
    '/api/payments/:path*',
  ],
}
