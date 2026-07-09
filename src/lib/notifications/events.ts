export type OrderEvent = 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface EventInfo {
  statusLabel: string
  trackingNote: string
  trackingUrl?: string
}

/**
 * Centralized mapping of order event statuses to customer-facing labels,
 * tracking notes, and tracking URLs.
 */
export function getEventInfo(event: OrderEvent, trackingNumber?: string | null): EventInfo {
  let statusLabel = event.charAt(0).toUpperCase() + event.slice(1).toLowerCase()
  if (event === 'placed') {
    statusLabel = 'Confirmed'
  }

  let trackingNote = 'You can track this order in your Al Noor profile dashboard.'
  let trackingUrl: string | undefined

  if (event === 'shipped' && trackingNumber) {
    trackingUrl = `https://www.delhivery.com/track/share?waybill=${trackingNumber}`
    trackingNote = `Delhivery Waybill: ${trackingNumber}. Track at: ${trackingUrl}`
  } else if (event === 'cancelled') {
    trackingNote = 'Your order has been cancelled. No payment was collected for this order.'
  }

  return {
    statusLabel,
    trackingNote,
    trackingUrl,
  }
}
