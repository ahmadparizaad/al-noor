import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'

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
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, password, phone } = parsed.data

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    // Return 201 (same as success) to prevent email enumeration — attacker cannot
    // distinguish "account exists" from "account created" via status code or body.
    return NextResponse.json({ success: true }, { status: 201 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.insert(users).values({
    id:           randomUUID(),
    email,
    name,
    phone:        phone ?? null,
    passwordHash,
    role:         'customer',
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
