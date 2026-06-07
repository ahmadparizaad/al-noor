import { getAdminOrders } from '@/lib/actions/admin'
import OrdersClient from './OrdersClient'

export const metadata = {
  title: 'Orders | Al Noor Admin',
}

export default async function OrdersPage() {
  const orders = await getAdminOrders()
  return <OrdersClient initialOrders={orders} />
}
