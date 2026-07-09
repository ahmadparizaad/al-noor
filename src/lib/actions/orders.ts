'use server'

import { db } from '@/lib/db'
import { orders, orderItems, products } from '@/lib/schema'
import { eq, desc, inArray, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { trackDelhiveryShipment, cancelDelhiveryShipment } from '@/lib/delhivery'
import { notifyOrderCancelled } from '@/lib/notifications'

export interface UserOrderItem {
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  quantity: number
  priceInr: number
  specs?: string | null
}

export interface UserOrder {
  id: string
  status: string
  totalInr: number
  paymentStatus: string
  trackingNumber: string | null
  createdAt: string
  items: UserOrderItem[]
}

export interface UserOrderDetails extends UserOrder {
  shippingAddressObj: {
    fullName: string
    phone: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    label?: string
  }
  updatedAt: string
  estimatedDelivery: string
  events: Array<{ status: string; location: string; timestamp: string; note?: string }>
}

export async function getUserOrders(): Promise<UserOrder[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalInr: orders.totalInr,
      paymentStatus: orders.paymentStatus,
      trackingNumber: orders.trackingNumber,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))

  if (rows.length === 0) return []

  const orderIds = rows.map(r => r.id)

  const itemRows = await db
    .select({
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      priceInr: orderItems.priceInr,
      productName: products.name,
      productSlug: products.slug,
      productImages: products.images,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(inArray(orderItems.orderId, orderIds))

  const itemsByOrder = new Map<string, typeof itemRows>()
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? []
    list.push(item)
    itemsByOrder.set(item.orderId, list)
  }

  return rows.map(r => {
    return {
      id: r.id,
      status: r.status,
      totalInr: Number(r.totalInr),
      paymentStatus: r.paymentStatus,
      trackingNumber: r.trackingNumber,
      createdAt: r.createdAt.toISOString().split('T')[0],
      items: (itemsByOrder.get(r.id) ?? []).map(i => ({
        productId: i.productId,
        productName: i.productName ?? 'Unknown Product',
        productSlug: i.productSlug ?? '',
        productImage: i.productImages && i.productImages.length > 0 ? i.productImages[0] : null,
        quantity: i.quantity,
        priceInr: Number(i.priceInr),
      })),
    }
  })
}

export async function getOrderDetails(orderId: string): Promise<UserOrderDetails | null> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) return null

  // Check ownership
  if (order.userId !== session.user.id && session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  // Fetch items
  const itemRows = await db
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      priceInr: orderItems.priceInr,
      productName: products.name,
      productSlug: products.slug,
      productImages: products.images,
      specs: products.specs,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId))

  // Fetch Delhivery live events if tracking number exists
  let events: Array<{ status: string; location: string; timestamp: string; note?: string }> = []
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

  // Default fallback estimated delivery (7 days after order date)
  const estimatedDelivery = new Date(order.createdAt.getTime() + 7 * 24 * 3600 * 1000).toISOString()

  let shippingAddressObj = {
    fullName: 'Valued Customer',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    label: 'HOME',
  }
  try {
    shippingAddressObj = JSON.parse(order.shippingAddress)
  } catch (e) {
    console.error('Failed to parse order shipping address:', e)
  }

  return {
    id: order.id,
    status: order.status,
    totalInr: Number(order.totalInr),
    paymentStatus: order.paymentStatus,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt.toISOString().split('T')[0],
    updatedAt: order.updatedAt.toISOString().split('T')[0],
    estimatedDelivery,
    shippingAddressObj,
    events,
    items: itemRows.map(i => ({
      productId: i.productId,
      productName: i.productName ?? 'Unknown Product',
      productSlug: i.productSlug ?? '',
      productImage: i.productImages && i.productImages.length > 0 ? i.productImages[0] : null,
      quantity: i.quantity,
      priceInr: Number(i.priceInr),
      specs: i.specs,
    })),
  }
}

export async function cancelOrder(orderId: string, reason: string): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' }
  }

  console.log(`Order ${orderId} cancelled by user ${session.user.id}. Reason: ${reason}`)

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) {
    return { success: false, message: 'Order not found' }
  }

  // Check ownership
  if (order.userId !== session.user.id && session.user.role !== 'admin') {
    return { success: false, message: 'Unauthorized' }
  }

  // Check status
  if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
    return { success: false, message: `Order cannot be cancelled because it is already ${order.status}` }
  }

  // A Delhivery shipment may already be manifested (order.status === 'processing').
  // Cancel it there first — refuse the local cancellation if Delhivery won't allow it
  // (e.g. already picked up), so our DB never disagrees with the courier's.
  if (order.trackingNumber) {
    const delhiveryResult = await cancelDelhiveryShipment(order.trackingNumber)
    if (!delhiveryResult.success) {
      return { success: false, message: delhiveryResult.error || 'Could not cancel the shipment with our courier. Please contact support.' }
    }
  }

  try {
    await db.transaction(async (tx) => {
      // Update order status to cancelled. COD-only checkout: nothing was collected
      // pre-delivery, so there's no refund to process. 'refund_pending' is reserved
      // for a future prepaid/return flow and is not set here.
      await tx
        .update(orders)
        .set({
          status: 'cancelled',
          paymentStatus: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))

      // Fetch items to restock
      const items = await tx
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))

      // Restock items
      for (const item of items) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
          })
          .where(eq(products.id, item.productId))
      }
    })

    // Trigger order cancellation notifications asynchronously (both Email and WhatsApp)
    notifyOrderCancelled(orderId).catch(err => {
      console.error('[cancel-order] Failed to dispatch order cancelled notifications:', err)
    })

    return { success: true, message: 'Order cancelled successfully' }
  } catch (error) {
    console.error('Failed to cancel order:', error)
    return { success: false, message: 'Failed to cancel the order. Please try again.' }
  }
}

