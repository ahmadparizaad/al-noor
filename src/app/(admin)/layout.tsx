import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminProviders from './AdminProviders'
import { getCatalogueOptions } from '@/lib/actions/catalogue'

const T = { canvas: '#FAF7F2' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/admin/login')
  }

  const catalogue = await getCatalogueOptions()
  const userName = session.user.name ?? session.user.email ?? 'Admin'

  return (
    <AdminProviders initial={{
      categories: catalogue.category,
      materials:  catalogue.material,
      dialOptions: catalogue.dial,
      badges:     catalogue.badge,
    }}>
      <div style={{ display: 'flex', minHeight: '100vh', background: T.canvas }}>
        <AdminSidebar userName={userName} />
        <main style={{ flex: 1, marginLeft: 220, padding: '32px', overflowY: 'auto', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </AdminProviders>
  )
}
