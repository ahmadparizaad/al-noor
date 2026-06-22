import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductById, getProductsAllIds, getAllProducts } from '@/lib/actions/products'
import { toClientProduct } from '@/lib/product-mapper'
import { formatPrice, discount } from '@/lib/products-data'
import { getCatalogueOptions } from '@/lib/actions/catalogue'
import { PDPClient } from './PDPClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const p = await getProductById(id)
  if (!p) return { title: 'Watch Not Found' }
  const client = toClientProduct(p, 0)
  return {
    title: p.name,
    description: `${p.category} · ${client.material} · ${client.dial} dial. ${formatPrice(p.priceInr)} — ${discount(p.priceInr, p.originalPriceInr)}% off.`,
  }
}

export async function generateStaticParams() {
  const ids = await getProductsAllIds()
  return ids.map(id => ({ id }))
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const [p, allDb, catalogue] = await Promise.all([
    getProductById(id),
    getAllProducts(),
    getCatalogueOptions(),
  ])
  if (!p) notFound()
  const clientProduct = toClientProduct(p, 0)
  const allProducts = allDb.map((q, i) => toClientProduct(q, i))
  return (
    <PDPClient
      product={clientProduct}
      allProducts={allProducts}
      materials={catalogue.material}
      dialOptions={catalogue.dial}
    />
  )
}
