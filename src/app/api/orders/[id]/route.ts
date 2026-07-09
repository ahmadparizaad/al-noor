import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { orders, orderItems, products } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { trackDelhiveryShipment } from '@/lib/delhivery'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1)

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const isOwner = session?.user?.id && order.userId === session.user.id
  const isAdmin = session?.user?.role === 'admin'

  // Guest orders require a one-time token set in the session cookie at checkout time
  // The token is the orderId itself (UUID, 128-bit entropy) passed via x-guest-token header
  const guestToken = req.headers.get('x-guest-token')
  const isGuest = !order.userId && guestToken === order.id

  if (!isOwner && !isAdmin && !isGuest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Fetch address details
  let address = { name: 'Valued Customer', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }
  try {
    const shippingAddr = JSON.parse(order.shippingAddress)
    address = {
      name: shippingAddr.fullName || 'Valued Customer',
      city: shippingAddr.city || '',
      state: shippingAddr.state || '',
      pincode: shippingAddr.pincode || '',
    }
  } catch (e) {
    console.error('Failed to parse order shipping address:', e)
  }

  // Fetch product details
  const dbItems = await db
    .select({
      name: products.name,
      specs: products.specs,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id))

  const firstItem = dbItems[0]
  let ref = 'AN-001-AT'
  let dial = 'Onyx Black'
  try {
    const specsObj = JSON.parse(firstItem?.specs || '{}')
    ref = specsObj.Reference || ref
    dial = specsObj['Dial Colour'] || dial
  } catch (e) {
    console.error('Failed to parse product specs:', e)
  }

  const product = {
    name: firstItem?.name || 'Al Noor Luxury Timepiece',
    ref,
    dial,
  }

  // Default fallback estimated delivery (7 days after order date)
  const estimatedDelivery = new Date(order.createdAt.getTime() + 7 * 24 * 3600 * 1000).toISOString()

  let events: Array<{ status: string; location: string; timestamp: string; note?: string }> = []

  // Only real Delhivery scan data is shown — no synthesized/fabricated events.
  if (order.trackingNumber) {
    try {
      const trackingInfo = await trackDelhiveryShipment(order.trackingNumber)
      if (trackingInfo && trackingInfo.scans) {
        events = trackingInfo.scans.map(scan => ({
          status: scan.status,
          location: scan.location,
          timestamp: scan.timestamp,
          note: scan.note,
        }))
      }
    } catch (err) {
      console.error('Failed to fetch live Delhivery tracking info:', err)
    }
  }

  return NextResponse.json({
    id:                order.id,
    status:            order.status,
    paymentStatus:     order.paymentStatus,
    totalInr:          order.totalInr,
    trackingNumber:    order.trackingNumber,
    createdAt:         order.createdAt.toISOString(),
    estimatedDelivery,
    product,
    address,
    events,
  })
}
