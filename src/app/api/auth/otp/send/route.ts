import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { phoneOtps } from '@/lib/schema'
import { eq, lt } from 'drizzle-orm'
import { createHash, randomUUID } from 'crypto'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendWhatsAppOtp } from '@/lib/whatsapp'

const sendOtpSchema = z.object({
  phone: z.string().refine((val) => {
    // Standardize: strip spaces, dashes, parentheses and +91
    const cleaned = val.replace(/\D/g, '')
    const baseNum = cleaned.startsWith('91') && cleaned.length === 12 ? cleaned.slice(2) : cleaned
    return /^[6-9]\d{9}$/.test(baseNum)
  }, {
    message: 'Please enter a valid 10-digit mobile number'
  })
})

export async function POST(req: NextRequest) {
  // Rate limit by IP: 5 OTP requests per 15 minutes
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rlIp = checkRateLimit({ key: `otp_ip:${ip}`, limit: 5, windowMs: 15 * 60 * 1000 })
  if (!rlIp.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts from this device. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const parsed = sendOtpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    // Normalize phone number to standard 10 digits
    const rawPhone = parsed.data.phone.replace(/\D/g, '')
    const phone = rawPhone.startsWith('91') && rawPhone.length === 12 ? rawPhone.slice(2) : rawPhone

    // Rate limit by phone number: 3 requests per 10 minutes
    const rlPhone = checkRateLimit({ key: `otp_phone:${phone}`, limit: 3, windowMs: 10 * 60 * 1000 })
    if (!rlPhone.allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests for this number. Please wait a few minutes.' },
        { status: 429 }
      )
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = createHash('sha256').update(otpCode).digest('hex')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes validity

    // Clean up expired OTPs to prevent database build-up
    await db.delete(phoneOtps).where(lt(phoneOtps.expiresAt, new Date())).catch(() => {})

    // Delete any active OTPs for this phone number
    await db.delete(phoneOtps).where(eq(phoneOtps.phone, phone))

    // Insert new OTP record
    await db.insert(phoneOtps).values({
      id: randomUUID(),
      phone,
      otpHash,
      expiresAt,
      attempts: 0,
    })

    // Send the OTP via WhatsApp
    const sendResult = await sendWhatsAppOtp(phone, otpCode)

    if (!sendResult.success) {
      // If Meta API fails, log it but return success in dev-mode or display error if production
      console.error('[send-otp] Failed to deliver WhatsApp message:', sendResult.error)
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Failed to send WhatsApp message. Please try again.' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[send-otp] Error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
