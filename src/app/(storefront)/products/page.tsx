import type { Metadata } from 'next'
import { ProductsClient } from './ProductsClient'

export const metadata: Metadata = {
  title: 'All Watches',
  description: 'Browse the full Al Noor collection — Tourbillon, Grand Feu Enamel, Perpetual Calendar, Minute Repeater and Chronograph timepieces.',
}

export default function ProductsPage() {
  return <ProductsClient />
}
