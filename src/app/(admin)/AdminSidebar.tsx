'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface AdminSidebarProps {
  userName: string
}

const T = {
  sidebar: '#18120C',
  inverse: '#FAF7F2',
  mutedInv: '#B8A99A',
  gold: '#9E7F4A',
  borderGold: 'rgba(158,127,74,0.25)',
  goldPale: 'rgba(250,247,242,0.04)',
}

const UI = "'Raleway', system-ui, sans-serif"

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', accent: '#9E7F4A' },
  { href: '/admin/orders',    label: 'Orders',     accent: '#E8D5A3' },
  { href: '/admin/inventory', label: 'Inventory',  accent: '#2A2A2A' },
  { href: '/admin/featured',  label: 'Featured Pieces', accent: '#9E7F4A' },
  { href: '/admin/qr-codes',  label: 'QR Codes',  accent: '#9E7F4A' },
  { href: '/admin/customers', label: 'Customers',  accent: '#1a3a5c' },
  { href: '/admin/analytics', label: 'Analytics',  accent: '#C8A882' },
  { href: '/admin/settings',  label: 'Settings',   accent: '#8C7B65' },
  { href: '/admin/profile',   label: 'My Profile', accent: '#B8A99A' },
]

export default function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    await signOut({ redirect: false })
    router.push('/admin/login')
  }

  const isActive = (href: string) => {
    return pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
  }

  const userEmail = userName.includes('@') ? userName : userName + '@al-noorluxury.com'

  return (
    <aside
      style={{
        width: 220,
        height: '100vh',
        background: T.sidebar,
        borderRight: `1px solid ${T.borderGold}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: `1px solid ${T.borderGold}`,
        }}
      >
        <div
          style={{
            fontFamily: UI,
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: T.gold,
            fontWeight: 600,
          }}
        >
          AL NOOR
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 0 0 0' }}>
        {NAV.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                position: 'relative',
                padding: '12px 20px',
                fontSize: '12px',
                fontFamily: UI,
                letterSpacing: '0.08em',
                textDecoration: 'none',
                color: active ? T.inverse : T.mutedInv,
                background: active ? 'rgba(250,247,242,0.10)' : 'transparent',
                borderLeft: `3px solid ${active ? item.accent : 'transparent'}`,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.target as HTMLElement).style.background = T.goldPale
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.target as HTMLElement).style.background = 'transparent'
                }
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: `1px solid ${T.borderGold}`,
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: T.mutedInv,
            marginBottom: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {userEmail.length > 24 ? userEmail.substring(0, 21) + '...' : userEmail}
        </div>
        <button
          onClick={handleLogout}
          style={{
            fontSize: '12px',
            color: T.gold,
            background: 'none',
            border: 'none',
            fontFamily: UI,
            fontWeight: 500,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
