import type { Metadata } from 'next'
import { TrackOrderClient } from './TrackOrderClient'

export const metadata: Metadata = { title: 'Track Your Order' }

export default function TrackOrderPage() {
  return <TrackOrderClient />
}
