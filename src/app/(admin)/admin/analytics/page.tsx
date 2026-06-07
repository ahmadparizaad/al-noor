import { getAdminRevenue, getAdminOrders, getAdminProducts } from '@/lib/actions/admin'
import AnalyticsClient from './AnalyticsClient'

export const metadata = {
  title: 'Analytics | Al Noor Admin',
}

export default async function AnalyticsPage() {
  const [revenue, orders, products] = await Promise.all([
    getAdminRevenue(),
    getAdminOrders(),
    getAdminProducts(),
  ])
  return <AnalyticsClient revenue={revenue} orders={orders} products={products} />
}
