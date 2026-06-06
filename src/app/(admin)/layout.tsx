import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Double-check server-side even though middleware guards this route
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Admin sidebar will go here */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6 font-semibold tracking-widest text-xs uppercase text-gray-400">
          Al Noor Admin
        </div>
        <nav className="px-4 space-y-1">
          {[
            { href: '/admin/dashboard', label: 'Dashboard' },
            { href: '/admin/orders', label: 'Orders' },
            { href: '/admin/inventory', label: 'Inventory' },
            { href: '/admin/customers', label: 'Customers' },
            { href: '/admin/analytics', label: 'Analytics' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="flex-1 p-8">{children}</div>
    </div>
  )
}
