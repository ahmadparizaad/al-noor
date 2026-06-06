import type { Metadata } from 'next'
import { OrderConfirmationClient } from './OrderConfirmationClient'

export const metadata: Metadata = { title: 'Order Confirmed' }

export default function OrderConfirmationPage() {
  return <OrderConfirmationClient />
}
