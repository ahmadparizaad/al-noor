import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkoutSchema } from '@/lib/validations'
import { db } from '@/lib/db'
import { orders, orderItems, products } from '@/lib/schema'
import { inArray, sql, eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { notifyOrderPlaced } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    const details = process.env.NODE_ENV === 'development' ? parsed.error.flatten() : undefined
    return NextResponse.json({ error: 'Invalid request', ...(details && { details }) }, { status: 400 })
  }

  const { address, items } = parsed.data
  const productIds = items.map(i => i.productId)

  // Fetch products server-side — never trust client-sent prices
  const dbProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds))

  if (dbProducts.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more products not found' }, { status: 404 })
  }

  // Verify stock
  for (const item of items) {
    const product = dbProducts.find(p => p.id === item.productId)!
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 409 })
    }
  }

  // Calculate total server-side
  const totalInr = items.reduce((sum, item) => {
    const product = dbProducts.find(p => p.id === item.productId)!
    return sum + Number(product.priceInr) * item.quantity
  }, 0)

  const transactionId = `AL${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`
  const orderId = randomUUID()
  // This route currently only creates cash-on-delivery orders (no prepaid path is wired up yet).
  const orderPaymentStatus = 'cod_pending'

  // Create order, order items and decrement stock in a transaction to prevent foreign key violations
  await db.transaction(async (tx) => {
    await tx.insert(orders).values({
      id: orderId,
      userId: session?.user?.id,
      status: 'confirmed',
      totalInr: totalInr.toFixed(2),
      shippingAddress: JSON.stringify(address),
      phonePeTransactionId: transactionId,
      paymentStatus: orderPaymentStatus,
    })

    await tx.insert(orderItems).values(
      items.map(item => ({
        id: randomUUID(),
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        priceInr: dbProducts.find(p => p.id === item.productId)!.priceInr,
      }))
    )

    // Decrement stock for the ordered items
    for (const item of items) {
      await tx
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
        })
        .where(eq(products.id, item.productId))
    }
  })

  // Send order confirmation email and WhatsApp notifications asynchronously
  notifyOrderPlaced(orderId).catch((err) => {
    console.error('[initiate] Failed to dispatch order placed notifications:', err)
  })

  // Delhivery shipment creation is a manual admin action (see updateOrderStatus in
  // src/lib/actions/admin.ts) — an admin reviews the order before it ships.
  return NextResponse.json({ success: true, orderId })
}
