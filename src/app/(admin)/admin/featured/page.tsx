import { getAdminProducts, getAdminFeaturedProducts } from '@/lib/actions/admin'
import FeaturedClient from './FeaturedClient'

export const dynamic = 'force-dynamic'

export default async function FeaturedPage() {
  const [products, featured] = await Promise.all([
    getAdminProducts(),
    getAdminFeaturedProducts(),
  ])

  return <FeaturedClient products={products} initialFeatured={featured} />
}
