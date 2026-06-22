'use server'

import { db } from '@/lib/db'
import { orders, orderItems, products } from '@/lib/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export interface UserOrderItem {
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  quantity: number
  priceInr: number
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
