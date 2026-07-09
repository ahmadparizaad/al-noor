import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, verificationTokens } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomUUID, createHash } from 'crypto'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendVerificationEmail } from '@/lib/email'

const registerSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
  phone:    z.string().regex(/^[6-9]\d{9}$/).optional(),
})

export async function POST(req: NextRequest) {
  // Rate limit: 5 registrations per IP per 15 minutes
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit({ key: `register:${ip}`, limit: 5, windowMs: 15 * 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  const body = await req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const details = process.env.NODE_ENV === 'development' ? parsed.error.flatten() : undefined
    return NextResponse.json({ error: 'Invalid input', ...(details && { details }) }, { status: 400 })
  }

  const { name, email, password, phone } = parsed.data

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    // Return 201 (same as success) to prevent email enumeration — attacker cannot
    // distinguish "account exists" from "account created" via status code or body.
    return NextResponse.json({ success: true }, { status: 201 })
  }

  const userId = randomUUID()
  const token = randomUUID()
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  const passwordHash = await bcrypt.hash(password, 12)

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id:           userId,
      email,
      name,
      phone:        phone ?? null,
      passwordHash,
      role:         'customer',
    })

    await tx.insert(verificationTokens).values({
      id: randomUUID(),
      userId,
      tokenHash,
      expiresAt,
    })
  })

  // Send verification email after transaction commits
  try {
    await sendVerificationEmail({ email, name, token })
  } catch (err) {
    console.error('[register] Failed to send verification email:', err)
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

