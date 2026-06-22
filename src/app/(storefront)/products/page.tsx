import type { Metadata } from 'next'
import { getAllProducts } from '@/lib/actions/products'
import { toClientProduct } from '@/lib/product-mapper'
import { getCatalogueOptions } from '@/lib/actions/catalogue'
import { ProductsClient } from './ProductsClient'

export const metadata: Metadata = {
  title: 'All Watches',
  description: 'Browse the full Al Noor collection — Tourbillon, Grand Feu Enamel, Perpetual Calendar, Minute Repeater and Chronograph timepieces.',
}

export default async function ProductsPage() {
  const [dbProducts, catalogue] = await Promise.all([
    getAllProducts(),
    getCatalogueOptions(),
  ])
  const products = dbProducts.map((p, i) => toClientProduct(p, i))
  return (
    <ProductsClient
      products={products}
      categories={catalogue.category}
      materials={catalogue.material}
      dials={catalogue.dial}
    />
  )
}
