import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getOrderDetails } from '@/lib/actions/orders'
import { OrderDetailClient } from './OrderDetailClient'

export const metadata: Metadata = { title: 'Order Details — Al Noor' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/orders`)
  }

  const { id } = await params
  const order = await getOrderDetails(id)

  if (!order) {
    notFound()
  }

  return <OrderDetailClient order={order} />
}
