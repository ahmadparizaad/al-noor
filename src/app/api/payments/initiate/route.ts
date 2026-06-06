import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { initiatePayment } from '@/lib/phonepe'
import { checkoutSchema } from '@/lib/validations'
import { db } from '@/lib/db'
import { orders, orderItems, products } from '@/lib/schema'
import { eq, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const session = await auth()

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Create order and order items in parallel
  await Promise.all([
    db.insert(orders).values({
      id: orderId,
      userId: session?.user?.id,
      status: 'pending',
      totalInr: totalInr.toFixed(2),
      shippingAddress: JSON.stringify(address),
      phonePeTransactionId: transactionId,
      paymentStatus: 'pending',
    }),
    db.insert(orderItems).values(
      items.map(item => ({
        id: randomUUID(),
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        priceInr: dbProducts.find(p => p.id === item.productId)!.priceInr,
      }))
    ),
  ])

  const result = await initiatePayment({
    transactionId,
    amountPaise: Math.round(totalInr * 100),
    userId: session?.user?.id ?? `guest_${orderId}`,
    redirectUrl: `${appUrl}/order-confirmation?orderId=${orderId}`,
    callbackUrl: `${appUrl}/api/payments/callback`,
  })

  if (!result.success) {
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 502 })
  }

  const redirectUrl = result.data?.instrumentResponse?.redirectInfo?.url
  return NextResponse.json({ redirectUrl, orderId })
}
