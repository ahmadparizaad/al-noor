import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/cashfree'
import { db } from '@/lib/db'
import { orders, orderItems, products } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const timestamp = req.headers.get('x-webhook-timestamp') ?? ''
  const signature = req.headers.get('x-webhook-signature') ?? ''
  const rawBody = await req.text()

  // Verify signature before doing anything
  const isValid = verifyWebhookSignature(rawBody, timestamp, signature)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const orderId = payload?.data?.order?.order_id
  const paymentStatus = payload?.data?.payment?.payment_status

  if (!orderId) {
    return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.phonePeTransactionId, orderId))
    .limit(1)

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Idempotency: skip if already processed
  if (order.paymentStatus !== 'pending') {
    return NextResponse.json({ ok: true })
  }

  const paymentSuccess = paymentStatus === 'SUCCESS'

  await db.transaction(async (tx) => {
    // Update order status
    await tx
      .update(orders)
      .set({
        paymentStatus: paymentSuccess ? 'paid' : 'failed',
        status: paymentSuccess ? 'confirmed' : 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(orders.phonePeTransactionId, orderId))

    // Decrement stock for confirmed orders
    if (paymentSuccess) {
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))

      for (const item of items) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
          })
          .where(eq(products.id, item.productId))
      }
    }
  })

  return NextResponse.json({ ok: true })
}
