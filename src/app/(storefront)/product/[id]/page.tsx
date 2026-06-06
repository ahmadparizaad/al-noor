import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PRODUCTS, formatPrice, discount } from '@/lib/products-data'
import { PDPClient } from './PDPClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = PRODUCTS.find(p => p.id === Number(id))
  if (!product) return { title: 'Watch Not Found' }
  return {
    title: product.name,
    description: `${product.category} · ${product.material} · ${product.dial} dial. ${formatPrice(product.price)} — ${discount(product.price, product.original)}% off.`,
  }
}

export function generateStaticParams() {
  return PRODUCTS.map(p => ({ id: String(p.id) }))
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const product = PRODUCTS.find(p => p.id === Number(id))
  if (!product) notFound()
  return <PDPClient product={product} />
}
