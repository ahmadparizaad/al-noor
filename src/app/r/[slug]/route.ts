import { NextRequest, NextResponse } from 'next/server'
import { UAParser } from 'ua-parser-js'
import { db } from '@/lib/db'
import { qrCodes, qrScans } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { randomBytes } from 'crypto'

function resolveDeviceType(deviceType: string | undefined): 'mobile' | 'desktop' | 'tablet' {
  if (deviceType === 'mobile' || deviceType === 'tablet') return deviceType
  return 'desktop'
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.slug, slug)).limit(1)

  if (!qrCode || !qrCode.isActive) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const userAgent = req.headers.get('user-agent') ?? ''
  const parsed = new UAParser(userAgent).getResult()

  const city = req.headers.get('x-vercel-ip-city')
  const country = req.headers.get('x-vercel-ip-country')
  const region = req.headers.get('x-vercel-ip-country-region')
  const latitude = req.headers.get('x-vercel-ip-latitude')
  const longitude = req.headers.get('x-vercel-ip-longitude')

  await Promise.all([
    db.update(qrCodes).set({ scanCount: sql`${qrCodes.scanCount} + 1` }).where(eq(qrCodes.id, qrCode.id)),
    db.insert(qrScans).values({
      id: randomBytes(8).toString('hex'),
      qrCodeId: qrCode.id,
      deviceType: resolveDeviceType(parsed.device.type),
      browser: parsed.browser.name ?? null,
      os: parsed.os.name ?? null,
      city: city ? decodeURIComponent(city) : null,
      country: country ?? null,
      region: region ? decodeURIComponent(region) : null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      userAgent,
      referrer: req.headers.get('referer'),
    }),
  ])

  return NextResponse.redirect(qrCode.destination, 302)
}
