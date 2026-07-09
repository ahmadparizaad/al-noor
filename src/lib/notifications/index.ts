import { db } from '@/lib/db'
import { orders, users, orderItems, products } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import {
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendOrderStatusUpdateEmail,
} from '@/lib/email'
import {
  sendWhatsAppOrderConfirmation,
  sendWhatsAppOrderStatusUpdate,
} from '@/lib/whatsapp'
import { dispatch } from './dispatch'
import { getEventInfo, OrderEvent } from './events'

/**
 * Loads order, user, and order items with product titles from the database.
 */
async function getOrderDetailsForNotification(orderId: string) {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!order) {
      console.error(`[notify] Order ${orderId} not found in DB`)
      return null
    }

    const [user] = order.userId
      ? await db.select().from(users).where(eq(users.id, order.userId)).limit(1)
      : [null]

    const items = await db
      .select({
        productName: products.name,
        quantity: orderItems.quantity,
        priceInr: orderItems.priceInr,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId))

    return {
      order,
      user,
      items: items.map(item => ({
        productName: item.productName || 'Unknown Product',
        quantity: item.quantity,
        priceInr: Number(item.priceInr),
      })),
    }
  } catch (err) {
    console.error(`[notify] Error fetching order details for notification ${orderId}:`, err)
    return null
  }
}

/**
 * Sends order placed notifications (email confirmation + WhatsApp confirmation).
 */
export async function notifyOrderPlaced(orderId: string): Promise<void> {
  const data = await getOrderDetailsForNotification(orderId)
  if (!data) return

  const { order, user, items } = data

  let shippingAddressObj: any = {}
  try {
    shippingAddressObj = JSON.parse(order.shippingAddress)
  } catch (err) {
    console.error(`[notify] Failed to parse shipping address JSON for order ${orderId}:`, err)
  }

  const customerName = shippingAddressObj.fullName || user?.name || 'Customer'
  const phone = shippingAddressObj.phone || user?.phone || null
  const email = user?.email || null

  const sends: Array<{
    channel: 'email' | 'whatsapp'
    send: () => Promise<{ success: boolean; error?: string }>
  }> = []

  if (email) {
    sends.push({
      channel: 'email',
      send: () =>
        sendOrderConfirmationEmail({
          email,
          orderDetails: {
            id: order.id,
            totalInr: Number(order.totalInr),
            paymentStatus: order.paymentStatus,
            shippingAddressObj: {
              fullName: shippingAddressObj.fullName || customerName,
              phone: shippingAddressObj.phone || '',
              line1: shippingAddressObj.line1 || '',
              line2: shippingAddressObj.line2,
              city: shippingAddressObj.city || '',
              state: shippingAddressObj.state || '',
              pincode: shippingAddressObj.pincode || '',
            },
            items,
          },
        }),
    })
  }

  if (phone) {
    const itemsSummary = items
      .map(item => `${item.productName} (x${item.quantity})`)
      .join(', ')

    sends.push({
      channel: 'whatsapp',
      send: () =>
        sendWhatsAppOrderConfirmation(phone, {
          id: order.id,
          totalInr: Number(order.totalInr),
          shippingName: customerName,
          itemsSummary,
        }),
    })
  }

  if (sends.length > 0) {
    await dispatch(sends)
  }
}

/**
 * Sends order status update notifications.
 */
export async function notifyOrderStatusChanged(
  orderId: string,
  event: OrderEvent,
  trackingNumberOverride?: string | null
): Promise<void> {
  if (event === 'cancelled') {
    return notifyOrderCancelled(orderId)
  }

  const data = await getOrderDetailsForNotification(orderId)
  if (!data) return

  const { order, user } = data

  let shippingAddressObj: any = {}
  try {
    shippingAddressObj = JSON.parse(order.shippingAddress)
  } catch (err) {
    console.error(`[notify] Failed to parse shipping address JSON for order ${orderId}:`, err)
  }

  const customerName = shippingAddressObj.fullName || user?.name || 'Customer'
  const phone = shippingAddressObj.phone || user?.phone || null
  const email = user?.email || null
  const trackingNumber = trackingNumberOverride || order.trackingNumber

  const sends: Array<{
    channel: 'email' | 'whatsapp'
    send: () => Promise<{ success: boolean; error?: string }>
  }> = []

  if (email) {
    sends.push({
      channel: 'email',
      send: () =>
        sendOrderStatusUpdateEmail({
          email,
          orderId: order.id,
          status: event,
          trackingNumber,
          customerName,
        }),
    })
  }

  if (phone) {
    sends.push({
      channel: 'whatsapp',
      send: () =>
        sendWhatsAppOrderStatusUpdate(phone, {
          id: order.id,
          status: event,
          trackingNumber,
        }),
    })
  }

  if (sends.length > 0) {
    await dispatch(sends)
  }
}

/**
 * Sends order cancellation notifications.
 */
export async function notifyOrderCancelled(orderId: string): Promise<void> {
  const data = await getOrderDetailsForNotification(orderId)
  if (!data) return

  const { order, user } = data

  let shippingAddressObj: any = {}
  try {
    shippingAddressObj = JSON.parse(order.shippingAddress)
  } catch (err) {
    console.error(`[notify] Failed to parse shipping address JSON for order ${orderId}:`, err)
  }

  const customerName = shippingAddressObj.fullName || user?.name || 'Customer'
  const phone = shippingAddressObj.phone || user?.phone || null
  const email = user?.email || null

  const sends: Array<{
    channel: 'email' | 'whatsapp'
    send: () => Promise<{ success: boolean; error?: string }>
  }> = []

  if (email) {
    sends.push({
      channel: 'email',
      send: () =>
        sendOrderCancellationEmail({
          email,
          orderId: order.id,
          customerName,
        }),
    })
  }

  if (phone) {
    sends.push({
      channel: 'whatsapp',
      send: () =>
        sendWhatsAppOrderStatusUpdate(phone, {
          id: order.id,
          status: 'cancelled',
        }),
    })
  }

  if (sends.length > 0) {
    await dispatch(sends)
  }
}
