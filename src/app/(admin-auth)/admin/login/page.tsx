import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminLoginClient from './AdminLoginClient'

export const metadata = { title: 'Admin Login | Al Noor' }

export default async function AdminLoginPage() {
  const session = await auth()
  if (session?.user?.role === 'admin') redirect('/admin/dashboard')
  return <AdminLoginClient />
}
