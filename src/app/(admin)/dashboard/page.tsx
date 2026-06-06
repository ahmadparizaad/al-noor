import { auth } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-500">Welcome back, {session?.user?.name ?? session?.user?.email}</p>
    </div>
  )
}
