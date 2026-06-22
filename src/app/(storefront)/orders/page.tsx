import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserOrders } from '@/lib/actions/orders'
import { OrdersClient } from './OrdersClient'

export const metadata: Metadata = { title: 'My Orders — Al Noor' }

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/orders')
  }

  const orders = await getUserOrders()

  return <OrdersClient initialOrders={orders} />
}
