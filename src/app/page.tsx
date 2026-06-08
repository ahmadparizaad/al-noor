import type { Metadata } from 'next'
import { HomepageClient } from '@/components/homepage/HomepageClient'
import { getFeaturedProducts } from '@/lib/actions/products'
import { toClientProduct } from '@/lib/product-mapper'

export const metadata: Metadata = {
  title: 'Al Noor | Luxury Watches',
  description: 'Exceptional timepieces born in Geneva. Al Noor watches, where Swiss precision meets the poetry of Arabic light.',
}

export default async function HomePage() {
  const dbFeatured = await getFeaturedProducts(4)
  const featured = dbFeatured.map((p, i) => toClientProduct(p, i))
  return <HomepageClient featured={featured} />
}
