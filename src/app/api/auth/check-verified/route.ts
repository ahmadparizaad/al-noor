import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  // Rate limit: 20 checks per IP per 15 minutes
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit({ key: `check-verified:${ip}`, limit: 20, windowMs: 15 * 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
  }

  try {
    const [user] = await db
      .select({
        role: users.role,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)

    if (!user) {
      return NextResponse.json({ exists: false, verified: true })
    }

    // Admins are not subject to customer email verification checks
    if (user.role === 'admin') {
      return NextResponse.json({ exists: true, verified: true })
    }

    return NextResponse.json({
      exists: true,
      verified: user.emailVerified !== null,
    })
  } catch (err) {
    console.error('[check-verified] Error checking user verification status:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
