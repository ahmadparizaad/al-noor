import { getAdminCustomers } from '@/lib/actions/admin'
import CustomersClient from './CustomersClient'

export const metadata = {
  title: 'Customers | Al Noor Admin',
}

export default async function CustomersPage() {
  const customers = await getAdminCustomers()
  return <CustomersClient initialCustomers={customers} />
}
