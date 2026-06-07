import type { Metadata } from 'next'
import { getAllProducts } from '@/lib/actions/products'
import { toClientProduct } from '@/lib/product-mapper'
import { ProductsClient } from './ProductsClient'

export const metadata: Metadata = {
  title: 'All Watches',
  description: 'Browse the full Al Noor collection — Tourbillon, Grand Feu Enamel, Perpetual Calendar, Minute Repeater and Chronograph timepieces.',
}

export default async function ProductsPage() {
  const dbProducts = await getAllProducts()
  const products = dbProducts.map((p, i) => toClientProduct(p, i))
  return <ProductsClient products={products} />
}
