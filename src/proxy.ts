import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from '@auth/core/jwt'

const ADMIN_PATHS     = ['/admin', '/api/admin']
const PROTECTED_PATHS = ['/orders', '/account', '/profile', '/api/orders', '/api/user']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Decode JWT from session cookie — edge-safe (Web Crypto, no Node.js crypto)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
    secureCookie: process.env.NODE_ENV === 'production',
  })

  // Block direct browser GET on payment API
  if (pathname.startsWith('/api/payments') && req.method === 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  // Admin routes: must be logged in + role=admin
  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login?callbackUrl=' + encodeURIComponent(pathname), req.url))
    }
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/403', req.url))
    }
  }

  // Protected customer routes: must be logged in
  if (PROTECTED_PATHS.some(p => pathname.startsWith(p))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login?callbackUrl=' + encodeURIComponent(pathname), req.url))
    }
  }

  return NextResponse.next()
}

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
