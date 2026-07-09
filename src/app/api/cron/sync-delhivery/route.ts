import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { orders } from '@/lib/schema'
import { and, eq, isNotNull, or } from 'drizzle-orm'
import { trackDelhiveryShipment } from '@/lib/delhivery'

function isAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[Delhivery Sync] CRON_SECRET is not set — refusing all requests')
    return false
  }

  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(authHeader || '')
  // timingSafeEqual throws if buffer lengths differ, so length-check first —
  // this length check leaks length but not content, an acceptable tradeoff for a bearer token.
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

type OrderStatus = typeof orders.$inferSelect['status']

// Delhivery's status strings aren't a fixed enum in their docs — match loosely on
// the substrings they're known to use in scan/status payloads.
function mapDelhiveryStatus(status: string): OrderStatus | null {
  const s = status.toLowerCase()
  if (s.includes('delivered')) return 'delivered'
  if (s.includes('rto') || s.includes('cancel')) return 'cancelled'
  if (s.includes('transit') || s.includes('dispatch') || s.includes('out for delivery') || s.includes('pickup')) return 'shipped'
  console.warn(`[Delhivery Sync] Unrecognized Delhivery status string, leaving order status untouched: "${status}"`)
  return null
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activeOrders = await db
    .select({ id: orders.id, status: orders.status, trackingNumber: orders.trackingNumber })
    .from(orders)
    .where(
      and(
        isNotNull(orders.trackingNumber),
        or(eq(orders.status, 'processing'), eq(orders.status, 'shipped'))
      )
    )

  const results = { checked: activeOrders.length, updated: 0, errors: 0 }

  for (const order of activeOrders) {
    try {
      const tracking = await trackDelhiveryShipment(order.trackingNumber!)
      if (!tracking) continue

      const mapped = mapDelhiveryStatus(tracking.status)
      if (!mapped || mapped === order.status) continue

      await db.update(orders)
        .set({
          status: mapped,
          // Delhivery collects cash at the delivery event under the COD-only flow.
          ...(mapped === 'delivered' ? { paymentStatus: 'cod_collected' } : {}),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))

      results.updated++
    } catch (err) {
      console.error(`[Delhivery Sync] Failed to sync order ${order.id}:`, err)
      results.errors++
    }
  }

  return NextResponse.json(results)
}
