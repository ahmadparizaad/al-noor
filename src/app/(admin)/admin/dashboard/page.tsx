import { auth } from '@/lib/auth'
import { getAdminOrders, getAdminProducts } from '@/lib/actions/admin'
import DashboardClient from './DashboardClient'

export const metadata = {
  title: 'Dashboard | Al Noor Admin',
}

export default async function DashboardPage() {
  const [session, orders, products] = await Promise.all([
    auth(),
    getAdminOrders(),
    getAdminProducts(),
  ])
  const userName = session?.user?.name ?? session?.user?.email ?? 'Admin'

  return (
    <DashboardClient
      orders={orders}
      products={products}
      userName={userName}
    />
  )
}
