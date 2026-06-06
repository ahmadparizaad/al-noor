import { NextRequest, NextResponse } from 'next/server'
import { verifyCallbackChecksum } from '@/lib/phonepe'
import { db } from '@/lib/db'
import { orders } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const receivedChecksum = req.headers.get('X-VERIFY') ?? ''
  const rawBody = await req.text()

  // Verify checksum before doing anything
  const isValid = verifyCallbackChecksum(rawBody, receivedChecksum)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: { response?: string }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const decoded = JSON.parse(Buffer.from(payload.response ?? '', 'base64').toString())
  const { merchantTransactionId, transactionState } = decoded?.data ?? {}

  if (!merchantTransactionId) {
    return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 })
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.phonePeTransactionId, merchantTransactionId))
    .limit(1)

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Idempotency: skip if already processed
  if (order.paymentStatus !== 'pending') {
    return NextResponse.json({ ok: true })
  }

  const paymentSuccess = transactionState === 'COMPLETED'

  await db
    .update(orders)
    .set({
      paymentStatus: paymentSuccess ? 'paid' : 'failed',
      status: paymentSuccess ? 'confirmed' : 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(orders.phonePeTransactionId, merchantTransactionId))

  return NextResponse.json({ ok: true })
}
