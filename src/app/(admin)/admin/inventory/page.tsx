import { getAdminProducts } from '@/lib/actions/admin'
import InventoryClient from './InventoryClient'

export const metadata = {
  title: 'Inventory | Al Noor Admin',
}

export default async function InventoryPage() {
  const products = await getAdminProducts()
  return <InventoryClient initialProducts={products} />
}
