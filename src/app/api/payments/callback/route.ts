import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/cashfree'
import { db } from '@/lib/db'
import { orders, orderItems, products, users } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { sendOrderConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const timestamp = req.headers.get('x-webhook-timestamp') ?? ''
  const signature = req.headers.get('x-webhook-signature') ?? ''
  const rawBody = await req.text()

  // Verify signature before doing anything
  const isValid = verifyWebhookSignature(rawBody, timestamp, signature)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown> | null = null
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const data = payload?.data as Record<string, unknown> | undefined
  const orderInfo = data?.order as Record<string, unknown> | undefined
  const paymentInfo = data?.payment as Record<string, unknown> | undefined
  const orderId = orderInfo?.order_id as string | undefined
  const paymentStatus = paymentInfo?.payment_status as string | undefined

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

  // Send order confirmation email for successful prepaid orders
  if (paymentSuccess) {
    try {
      let userEmail: string | null = null
      if (order.userId) {
        const [userRow] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1)
        userEmail = userRow?.email ?? null
      }

      if (userEmail) {
        const itemRows = await db
          .select({
            productName: products.name,
            quantity: orderItems.quantity,
            priceInr: orderItems.priceInr,
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id))

        let shippingAddressObj = {
          fullName: 'Valued Customer',
          phone: '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          pincode: '',
        }
        try {
          shippingAddressObj = JSON.parse(order.shippingAddress)
        } catch (e) {
          console.error('Failed to parse order shipping address:', e)
        }

        await sendOrderConfirmationEmail({
          email: userEmail,
          orderDetails: {
            id: order.id,
            totalInr: Number(order.totalInr),
            paymentStatus: 'paid',
            shippingAddressObj,
            items: itemRows.map(row => ({
              productName: row.productName ?? 'Unknown Product',
              quantity: row.quantity,
              priceInr: Number(row.priceInr)
            }))
          }
        })
      }
    } catch (err) {
      console.error('[callback] Failed to send order confirmation email:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
