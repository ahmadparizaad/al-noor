'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const nameSchema = z.object({
  name: z.string().min(1).max(100),
})

const emailSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(8),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

async function getAdminUser() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user) throw new Error('User not found')
  return user
}

export async function updateAdminName(formData: FormData) {
  const user = await getAdminUser()
  const parsed = nameSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: 'Invalid name.' }

  await db.update(users).set({ name: parsed.data.name }).where(eq(users.id, user.id))
  revalidatePath('/admin/profile')
  return { success: true }
}

export async function updateAdminEmail(formData: FormData) {
  const user = await getAdminUser()
  const parsed = emailSchema.safeParse({
    email: formData.get('email'),
    currentPassword: formData.get('currentPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  if (!user.passwordHash) return { error: 'No password set on this account.' }
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!valid) return { error: 'Current password is incorrect.' }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1)
  if (existing.length > 0 && existing[0].id !== user.id) return { error: 'Email already in use.' }

  await db.update(users).set({ email: parsed.data.email }).where(eq(users.id, user.id))
  revalidatePath('/admin/profile')
  return { success: true }
}

export async function updateAdminPassword(formData: FormData) {
  const user = await getAdminUser()
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  if (!user.passwordHash) return { error: 'No password set on this account.' }
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!valid) return { error: 'Current password is incorrect.' }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id))
  revalidatePath('/admin/profile')
  return { success: true }
}
