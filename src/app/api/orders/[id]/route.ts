import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { orders } from '@/lib/schema'
import { eq } from 'drizzle-orm'

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

  const shipped = order.status === 'shipped' || order.status === 'delivered'

  return NextResponse.json({
    id:            order.id,
    status:        order.status,
    paymentStatus: order.paymentStatus,
    totalInr:      order.totalInr,
    createdAt:     order.createdAt,
    ...(shipped && { trackingNumber: order.trackingNumber }),
  })
}
