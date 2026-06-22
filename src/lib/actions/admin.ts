'use server'

import { db } from '@/lib/db'
import { products, orders, orderItems, users, featuredProducts } from '@/lib/schema'
import { eq, desc, asc, sql, sum, count, and, gte, lte } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { AdminOrder, AdminCustomer, AdminProduct, RevenueMonth } from '@/types/admin'
import { createDelhiveryShipment } from '@/lib/delhivery'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') throw new Error('Unauthorized')
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  await requireAdmin()

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalInr: orders.totalInr,
      paymentStatus: orders.paymentStatus,
      trackingNumber: orders.trackingNumber,
      shippingAddress: orders.shippingAddress,
      createdAt: orders.createdAt,
      customerName: users.name,
      customerEmail: users.email,
      customerPhone: users.phone,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))

  const orderIds = rows.map(r => r.id)
  const itemRows = orderIds.length > 0
    ? await db
        .select({
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          priceInr: orderItems.priceInr,
          productName: products.name,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(sql`${orderItems.orderId} = ANY(ARRAY[${sql.raw(orderIds.map(id => `'${id}'`).join(','))}]::text[])`)
    : []

  const itemsByOrder = new Map<string, typeof itemRows>()
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? []
    list.push(item)
    itemsByOrder.set(item.orderId, list)
  }

  return rows.map(r => {
    let addr: AdminOrder['shippingAddress']
    try { addr = JSON.parse(r.shippingAddress) } catch { addr = { fullName: '', line1: '', city: '', state: '', pincode: '', phone: '' } }

    return {
      id: r.id,
      customerName: r.customerName ?? 'Guest',
      customerEmail: r.customerEmail ?? '',
      customerPhone: r.customerPhone ?? undefined,
      status: r.status,
      totalInr: Number(r.totalInr),
      paymentStatus: r.paymentStatus,
      trackingNumber: r.trackingNumber ?? undefined,
      shippingAddress: addr,
      createdAt: r.createdAt.toISOString().split('T')[0],
      items: (itemsByOrder.get(r.id) ?? []).map(i => ({
        productId: i.productId,
        productName: i.productName ?? 'Unknown Product',
        quantity: i.quantity,
        priceInr: Number(i.priceInr),
      })),
    }
  })
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  await requireAdmin()

  const rows = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt))

  return rows.map(p => {
    let specs: Record<string, string> = {}
    try { specs = JSON.parse(p.specs ?? '{}') } catch { /* empty */ }

    return {
      id: p.id,
      name: p.name,
      ref: specs.Reference ?? p.slug,
      category: p.category,
      material: specs.Material ?? '',
      dial: specs['Dial Colour'] ?? '',
      priceInr: Number(p.priceInr),
      originalPriceInr: Number(p.originalPriceInr ?? p.priceInr),
      stock: p.stock,
      isActive: p.isActive,
      badge: specs.Badge ?? '',
      images: p.images ?? [],
    }
  })
}

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  await requireAdmin()

  const customerOrders = await db
    .select({
      userId: orders.userId,
      orderId: orders.id,
      totalInr: orders.totalInr,
      status: orders.status,
      createdAt: orders.createdAt,
      customerName: users.name,
      customerEmail: users.email,
      customerPhone: users.phone,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))

  const map = new Map<string, AdminCustomer>()

  for (const row of customerOrders) {
    const key = row.userId ?? row.customerEmail ?? 'guest'
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: row.customerName ?? 'Guest',
        email: row.customerEmail ?? '',
        phone: row.customerPhone ?? undefined,
        ordersCount: 0,
        totalSpentInr: 0,
        lastOrderDate: row.createdAt.toISOString().split('T')[0],
        recentOrders: [],
      })
    }
    const c = map.get(key)!
    c.ordersCount += 1
    c.totalSpentInr += Number(row.totalInr)
    const dateStr = row.createdAt.toISOString().split('T')[0]
    if (dateStr > c.lastOrderDate) c.lastOrderDate = dateStr
    c.recentOrders.push({ id: row.orderId, totalInr: Number(row.totalInr), status: row.status, createdAt: dateStr })
  }

  return Array.from(map.values())
}

export async function getAdminRevenue(): Promise<RevenueMonth[]> {
  await requireAdmin()

  const rows = await db.execute(sql`
    SELECT
      TO_CHAR(created_at, 'Month') AS month,
      DATE_TRUNC('month', created_at) AS month_start,
      SUM(total_inr)::numeric AS revenue_inr,
      COUNT(*) AS orders_count
    FROM orders
    WHERE payment_status = 'success'
      AND created_at >= NOW() - INTERVAL '6 months'
    GROUP BY month, month_start
    ORDER BY month_start ASC
  `)

  return (rows as unknown as Array<{ month: string; revenue_inr: string; orders_count: string }>).map(r => ({
    month: r.month.trim(),
    revenueInr: Number(r.revenue_inr),
    ordersCount: Number(r.orders_count),
  }))
}

export async function updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
  await requireAdmin()
  
  let trackingToSave = trackingNumber

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)

  const isTransitioning = order && order.status !== 'processing' && order.status !== 'shipped'

  if (order && (status === 'processing' || status === 'shipped') && isTransitioning && !order.trackingNumber && !trackingNumber) {
    try {
      const shippingAddr = JSON.parse(order.shippingAddress)

      // Fetch order items to get product details
      const items = await db
        .select({
          productName: products.name,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderId))

      const productNames = items.map(i => `${i.productName} (x${i.quantity})`).join(', ')

      const result = await createDelhiveryShipment({
        orderId: order.id,
        consigneeName: shippingAddr.fullName,
        consigneePhone: shippingAddr.phone,
        consigneeAddress: `${shippingAddr.line1} ${shippingAddr.line2 || ''}`,
        consigneePincode: shippingAddr.pincode,
        consigneeCity: shippingAddr.city,
        consigneeState: shippingAddr.state,
        totalAmount: Number(order.totalInr),
        paymentType: order.paymentStatus === 'paid' ? 'Prepaid' : 'COD',
        productName: productNames || 'Luxury Watch',
      })

      if (result.success && result.waybill) {
        trackingToSave = result.waybill
      } else {
        console.error('Failed to create Delhivery shipment:', result.error)
      }
    } catch (err) {
      console.error('Error during automatic Delhivery shipment creation:', err)
    }
  }

  await db.update(orders).set({
    status: status as never,
    ...(trackingToSave && { trackingNumber: trackingToSave }),
    updatedAt: new Date()
  }).where(eq(orders.id, orderId))

  revalidatePath('/admin/orders')
  revalidatePath('/admin/dashboard')

  return { success: true, trackingNumber: trackingToSave }
}

export async function updateProductStock(productId: string, stock: number) {
  await requireAdmin()
  await db.update(products).set({ stock }).where(eq(products.id, productId))
  revalidatePath('/admin/inventory')
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  await requireAdmin()
  await db.update(products).set({ isActive }).where(eq(products.id, productId))
  revalidatePath('/admin/inventory')
}

interface ProductPayload {
  name: string
  ref: string
  category: string
  material: string
  dial: string
  priceInr: number
  originalPriceInr: number
  stock: number
  badge: string
  isActive: boolean
  images: string[]
}

function buildSlug(name: string, id: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + id.slice(-6)
}

export async function createProduct(payload: ProductPayload): Promise<{ id: string }> {
  await requireAdmin()
  const id = `PROD-${Date.now()}`
  const specs = JSON.stringify({
    Reference: payload.ref,
    Material: payload.material,
    'Dial Colour': payload.dial,
    ...(payload.badge ? { Badge: payload.badge } : {}),
  })
  await db.insert(products).values({
    id,
    name: payload.name,
    slug: buildSlug(payload.name, id),
    category: payload.category,
    priceInr: String(payload.priceInr),
    originalPriceInr: String(payload.originalPriceInr),
    stock: payload.stock,
    images: payload.images,
    specs,
    isActive: payload.isActive,
  })
  revalidatePath('/admin/inventory')
  revalidatePath('/products')
  return { id }
}

export async function updateProduct(productId: string, payload: ProductPayload): Promise<void> {
  await requireAdmin()
  const specs = JSON.stringify({
    Reference: payload.ref,
    Material: payload.material,
    'Dial Colour': payload.dial,
    ...(payload.badge ? { Badge: payload.badge } : {}),
  })
  await db.update(products).set({
    name: payload.name,
    category: payload.category,
    priceInr: String(payload.priceInr),
    originalPriceInr: String(payload.originalPriceInr),
    stock: payload.stock,
    images: payload.images,
    specs,
    isActive: payload.isActive,
  }).where(eq(products.id, productId))
  revalidatePath('/admin/inventory')
  revalidatePath('/products')
}

export async function deleteProduct(productId: string): Promise<void> {
  await requireAdmin()
  await db.delete(products).where(eq(products.id, productId))
  revalidatePath('/admin/inventory')
  revalidatePath('/products')
}

export interface AdminFeaturedProduct {
  position: number
  productId: string | null
  productName?: string
  productRef?: string
  productCategory?: string
  productMaterial?: string
  productDial?: string
  productPrice?: number
  productImage?: string
  isActive?: boolean
}

export async function getAdminFeaturedProducts(): Promise<AdminFeaturedProduct[]> {
  await requireAdmin()

  // Get current featured products
  const rows = await db
    .select({
      position: featuredProducts.position,
      productId: featuredProducts.productId,
      productName: products.name,
      productSpecs: products.specs,
      productCategory: products.category,
      productPrice: products.priceInr,
      productImages: products.images,
      isActive: products.isActive,
    })
    .from(featuredProducts)
    .leftJoin(products, eq(featuredProducts.productId, products.id))
    .orderBy(asc(featuredProducts.position))

  // Create slots for 1, 2, 3, 4
  const slots: AdminFeaturedProduct[] = Array.from({ length: 4 }, (_, i) => ({
    position: i + 1,
    productId: null,
  }))

  for (const row of rows) {
    if (row.position >= 1 && row.position <= 4) {
      let specs: Record<string, string> = {}
      try {
        if (row.productSpecs) specs = JSON.parse(row.productSpecs)
      } catch { /* empty */ }

      slots[row.position - 1] = {
        position: row.position,
        productId: row.productId,
        productName: row.productName ?? undefined,
        productRef: specs.Reference ?? undefined,
        productCategory: row.productCategory ?? undefined,
        productMaterial: specs.Material ?? undefined,
        productDial: specs['Dial Colour'] ?? undefined,
        productPrice: row.productPrice ? Number(row.productPrice) : undefined,
        productImage: row.productImages?.[0] ?? undefined,
        isActive: row.isActive ?? undefined,
      }
    }
  }

  return slots
}

export async function saveFeaturedProduct(position: number, productId: string | null): Promise<void> {
  await requireAdmin()

  if (position < 1 || position > 4) {
    throw new Error('Invalid position')
  }

  if (productId === null) {
    // Clear the slot
    await db.delete(featuredProducts).where(eq(featuredProducts.position, position))
  } else {
    // Upsert the slot
    const existing = await db
      .select()
      .from(featuredProducts)
      .where(eq(featuredProducts.position, position))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(featuredProducts)
        .set({ productId, updatedAt: new Date() })
        .where(eq(featuredProducts.position, position))
    } else {
      await db.insert(featuredProducts).values({
        position,
        productId,
      })
    }
  }

  revalidatePath('/')
  revalidatePath('/admin/featured')
}

