import type { Metadata } from 'next'
import { HomepageClient } from '@/components/homepage/HomepageClient'

export const metadata: Metadata = {
  title: 'Al Noor — Luxury Horology · Geneva',
  description: 'Exceptional timepieces born in Geneva. Al Noor watches — where Swiss precision meets the poetry of Arabic light.',
}

export default function HomePage() {
  return <HomepageClient />
}
