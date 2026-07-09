'use server'

import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { qrCodes, qrScans } from '@/lib/schema'
import { eq, desc, sql, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AdminQrCode, QrAnalytics } from '@/types/admin'
import { generateQRCode } from '@/lib/qr-generator'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') throw new Error('Unauthorized')
}

const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only').max(50)
const nameSchema = z.string().min(1).max(100)
const destinationSchema = z.string().url().max(500).refine(
  url => url.startsWith('http://') || url.startsWith('https://'),
  'Destination must be an HTTP or HTTPS URL'
)
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex code like #9E7F4A')

const createQrSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  destination: destinationSchema,
  qrColor: colorSchema.default('#000000'),
})

const updateQrSchema = z.object({
  destination: destinationSchema.optional(),
  isActive: z.boolean().optional(),
  qrColor: colorSchema.optional(),
})

export type CreateQrInput = z.infer<typeof createQrSchema>
export type UpdateQrInput = z.infer<typeof updateQrSchema>

function toAdminQrCode(row: typeof qrCodes.$inferSelect): AdminQrCode {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    destination: row.destination,
    isActive: row.isActive,
    scanCount: row.scanCount,
    qrPngUrl: row.qrPngUrl,
    qrSvgUrl: row.qrSvgUrl,
    qrColor: row.qrColor,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function getAdminQrCodes(): Promise<AdminQrCode[]> {
  await requireAdmin()

  const rows = await db.select().from(qrCodes).orderBy(desc(qrCodes.createdAt))
  return rows.map(toAdminQrCode)
}

export async function getAdminQrCode(id: string): Promise<AdminQrCode | null> {
  await requireAdmin()

  const [row] = await db.select().from(qrCodes).where(eq(qrCodes.id, id)).limit(1)
  return row ? toAdminQrCode(row) : null
}

export async function createQrCode(input: CreateQrInput): Promise<AdminQrCode> {
  await requireAdmin()

  const data = createQrSchema.parse(input)

  const [existing] = await db.select({ id: qrCodes.id }).from(qrCodes).where(eq(qrCodes.slug, data.slug)).limit(1)
  if (existing) throw new Error('This slug is already in use')

  const { qrPngUrl, qrSvgUrl } = await generateQRCode({ slug: data.slug, color: data.qrColor })

  const [row] = await db
    .insert(qrCodes)
    .values({
      id: randomBytes(8).toString('hex'),
      name: data.name,
      slug: data.slug,
      destination: data.destination,
      qrColor: data.qrColor,
      qrPngUrl,
      qrSvgUrl,
    })
    .returning()

  revalidatePath('/admin/qr-codes')
  return toAdminQrCode(row)
}

export async function updateQrCode(id: string, input: UpdateQrInput): Promise<AdminQrCode> {
  await requireAdmin()

  const data = updateQrSchema.parse(input)

  const [current] = await db.select().from(qrCodes).where(eq(qrCodes.id, id)).limit(1)
  if (!current) throw new Error('QR code not found')

  let qrPngUrl = current.qrPngUrl
  let qrSvgUrl = current.qrSvgUrl
  if (data.qrColor && data.qrColor !== current.qrColor) {
    const regenerated = await generateQRCode({ slug: current.slug, color: data.qrColor })
    qrPngUrl = regenerated.qrPngUrl
    qrSvgUrl = regenerated.qrSvgUrl
  }

  const [row] = await db
    .update(qrCodes)
    .set({
      destination: data.destination ?? current.destination,
      isActive: data.isActive ?? current.isActive,
      qrColor: data.qrColor ?? current.qrColor,
      qrPngUrl,
      qrSvgUrl,
      updatedAt: new Date(),
    })
    .where(eq(qrCodes.id, id))
    .returning()

  revalidatePath('/admin/qr-codes')
  revalidatePath(`/admin/qr-codes/${id}`)
  return toAdminQrCode(row)
}

export async function deleteQrCode(id: string): Promise<void> {
  await requireAdmin()

  await db.delete(qrCodes).where(eq(qrCodes.id, id))
  revalidatePath('/admin/qr-codes')
}

export async function getQrAnalytics(qrCodeId: string): Promise<QrAnalytics> {
  await requireAdmin()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [[totalRow], [todayRow], deviceRows, browserRows, osRows, dailyRows, locationRows] = await Promise.all([
    db.select({ value: count() }).from(qrScans).where(eq(qrScans.qrCodeId, qrCodeId)),
    db.select({ value: count() }).from(qrScans).where(sql`${qrScans.qrCodeId} = ${qrCodeId} AND ${qrScans.scannedAt} >= ${startOfToday}`),
    db
      .select({ deviceType: qrScans.deviceType, value: count() })
      .from(qrScans)
      .where(eq(qrScans.qrCodeId, qrCodeId))
      .groupBy(qrScans.deviceType),
    db
      .select({ name: qrScans.browser, value: count() })
      .from(qrScans)
      .where(sql`${qrScans.qrCodeId} = ${qrCodeId} AND ${qrScans.browser} IS NOT NULL`)
      .groupBy(qrScans.browser)
      .orderBy(desc(count()))
      .limit(10),
    db
      .select({ name: qrScans.os, value: count() })
      .from(qrScans)
      .where(sql`${qrScans.qrCodeId} = ${qrCodeId} AND ${qrScans.os} IS NOT NULL`)
      .groupBy(qrScans.os)
      .orderBy(desc(count()))
      .limit(10),
    db
      .select({ date: sql<string>`to_char(${qrScans.scannedAt}, 'YYYY-MM-DD')`, value: count() })
      .from(qrScans)
      .where(sql`${qrScans.qrCodeId} = ${qrCodeId} AND ${qrScans.scannedAt} >= ${thirtyDaysAgo}`)
      .groupBy(sql`to_char(${qrScans.scannedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${qrScans.scannedAt}, 'YYYY-MM-DD')`),
    db
      .select({
        city: qrScans.city,
        country: qrScans.country,
        latitude: qrScans.latitude,
        longitude: qrScans.longitude,
        value: count(),
      })
      .from(qrScans)
      .where(sql`${qrScans.qrCodeId} = ${qrCodeId} AND ${qrScans.city} IS NOT NULL`)
      .groupBy(qrScans.city, qrScans.country, qrScans.latitude, qrScans.longitude)
      .orderBy(desc(count()))
      .limit(20),
  ])

  const deviceBreakdown = { mobile: 0, desktop: 0, tablet: 0 }
  for (const r of deviceRows) {
    if (r.deviceType && r.deviceType in deviceBreakdown) {
      deviceBreakdown[r.deviceType as keyof typeof deviceBreakdown] = r.value
    }
  }

  return {
    totalScans: totalRow?.value ?? 0,
    todayScans: todayRow?.value ?? 0,
    deviceBreakdown,
    browserBreakdown: browserRows.map(r => ({ name: r.name ?? 'Unknown', count: r.value })),
    osBreakdown: osRows.map(r => ({ name: r.name ?? 'Unknown', count: r.value })),
    dailyScans: dailyRows.map(r => ({ date: r.date, count: r.value })),
    locations: locationRows.map(r => ({
      city: r.city ?? 'Unknown',
      country: r.country ?? 'Unknown',
      latitude: r.latitude ? Number(r.latitude) : null,
      longitude: r.longitude ? Number(r.longitude) : null,
      count: r.value,
    })),
  }
}
