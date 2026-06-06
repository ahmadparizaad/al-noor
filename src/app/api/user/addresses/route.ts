import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { addresses } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { z } from 'zod'

const addressSchema = z.object({
  label:    z.enum(['HOME', 'WORK', 'OTHER']).default('HOME'),
  fullName: z.string().min(2),
  phone:    z.string().regex(/^[6-9]\d{9}$/),
  line1:    z.string().min(5),
  line2:    z.string().optional(),
  city:     z.string().min(1),
  state:    z.string().min(1),
  pincode:  z.string().regex(/^\d{6}$/),
  isDefault: z.boolean().default(false),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, session.user.id))
    .orderBy(addresses.isDefault, addresses.createdAt)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = addressSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid address data' }, { status: 400 })

  const userId = session.user.id
  const data = parsed.data

  // If this is being set as default, clear existing default
  if (data.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)))
  }

  // If user has no addresses yet, make this the default automatically
  const existing = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, userId)).limit(1)
  const shouldBeDefault = data.isDefault || existing.length === 0

  const [newAddress] = await db
    .insert(addresses)
    .values({
      id:        randomUUID(),
      userId,
      label:     data.label,
      fullName:  data.fullName,
      phone:     data.phone,
      line1:     data.line1,
      line2:     data.line2 ?? null,
      city:      data.city,
      state:     data.state,
      pincode:   data.pincode,
      isDefault: shouldBeDefault,
    })
    .returning()

  return NextResponse.json(newAddress, { status: 201 })
}
