'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useLogout } from '@/hooks/useLogout'
import { formatPrice } from '@/lib/products-data'
import { UserOrder } from '@/lib/actions/orders'

const T = {
  ivory:       '#FAF7F2',
  parchment:   '#F0EBE2',
  white:       '#FFFFFF',
  gold:        '#9E7F4A',
  goldDark:    '#7A5C2E',
  goldPale:    '#EDD9B8',
  deep:        '#1A1410',
  mid:         '#5C4F3A',
  muted:       '#8C7B65',
  light:       '#B8A99A',
  border:      'rgba(158,127,74,0.18)',
  borderLight: 'rgba(158,127,74,0.10)',
  shadowSm:    '0 1px 4px rgba(26,20,16,0.06)',
  shadowMd:    '0 4px 16px rgba(26,20,16,0.09)',
  green:       '#27864A',
  red:         '#C0392B',
  orange:      '#D97706',
}

interface OrdersClientProps {
  initialOrders: UserOrder[]
}

function getStatusStyles(status: string) {
  switch (status.toLowerCase()) {
    case 'delivered':
      return { bg: '#EBF5EF', color: T.green }
    case 'cancelled':
    case 'refunded':
      return { bg: '#FEF2F2', color: T.red }
    case 'shipped':
      return { bg: '#EBF2FF', color: '#2563EB' }
    default: // pending, confirmed, processing
      return { bg: T.goldPale, color: T.goldDark }
  }
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isMobile } = useBreakpoint()
  const { logout } = useLogout()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/orders')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.parchment, fontFamily: "'Raleway', sans-serif", color: T.muted }}>
        Loading…
      </div>
    )
  }

  const user = session?.user

  return (
    <div style={{ minHeight: '100vh', background: T.parchment, fontFamily: "'Raleway', sans-serif", fontSize: 14, color: T.deep }}>
      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: T.ivory, borderBottom: `1px solid ${T.border}`, boxShadow: T.shadowSm }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: `0 ${isMobile ? 16 : 24}px`, height: isMobile ? 56 : 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontWeight: 600, fontSize: isMobile ? 13 : 15, letterSpacing: '0.35em', color: T.gold, textDecoration: 'none' }}>
            AL NOOR
            {!isMobile && <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.15em', color: T.muted, fontWeight: 400, marginTop: 1 }}>Luxury Watches</span>}
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 24 }}>
            {!isMobile && <Link href="/products" style={{ fontSize: 13, color: T.mid, textDecoration: 'none', fontWeight: 500 }}>All Watches</Link>}
            {!isMobile && <Link href="/orders" style={{ fontSize: 13, color: T.goldDark, textDecoration: 'none', fontWeight: 700 }}>My Orders</Link>}
            <button
              onClick={() => logout('/')}
              style={{ fontSize: 13, color: T.red, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      {!isMobile && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted }}>
          <Link href="/" style={{ color: T.muted, textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <span style={{ color: T.deep, fontWeight: 500 }}>My Account</span>
          <span>›</span>
          <span style={{ color: T.deep, fontWeight: 500 }}>Orders</span>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '16px 16px 96px' : '24px 24px 60px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr', gap: isMobile ? 16 : 24, alignItems: 'flex-start' }}>
        {/* ── Sidebar ── */}
        {!isMobile && (
          <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, overflow: 'hidden' }}>
            {/* Profile pill */}
            <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${T.borderLight}`, background: T.ivory }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.goldPale, border: `2px solid ${T.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: T.goldDark }}>
                  {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.deep }}>{user?.name ?? 'Guest'}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2, wordBreak: 'break-all' }}>{user?.email}</div>
            </div>

            {/* Nav links */}
            {[
              { label: 'My Profile',   href: '/profile',      active: false },
              { label: 'My Orders',    href: '/orders',       active: true },
              { label: 'Track Order',  href: '/track-order',  active: false },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{
                display: 'block', padding: '13px 20px',
                fontSize: 13, fontWeight: item.active ? 700 : 400,
                color: item.active ? T.goldDark : T.mid,
                borderLeft: item.active ? `3px solid ${T.gold}` : '3px solid transparent',
                background: item.active ? T.ivory : 'transparent',
                textDecoration: 'none',
                borderBottom: `1px solid ${T.borderLight}`,
              }}>
                {item.label}
              </Link>
            ))}

            <button
              onClick={() => logout('/')}
              style={{ width: '100%', padding: '13px 20px', textAlign: 'left', fontSize: 13, color: T.red, fontWeight: 500, background: 'none', border: 'none', borderLeft: '3px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Sign Out
            </button>
          </div>
        )}

        {/* ── Main content ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: isMobile ? 24 : 32, fontStyle: 'italic', color: T.deep, margin: 0 }}>
              My Orders
            </h1>
            <span style={{ fontSize: 12, color: T.muted, fontFamily: "'Inter', sans-serif" }}>
              {initialOrders.length} {initialOrders.length === 1 ? 'order' : 'orders'} placed
            </span>
          </div>

          {/* Orders list */}
          {initialOrders.length === 0 ? (
            <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, padding: '48px 24px', textAlign: 'center', boxShadow: T.shadowSm }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <h2 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 20, fontStyle: 'italic', color: T.deep, margin: '0 0 8px 0' }}>
                No orders yet
              </h2>
              <p style={{ fontSize: 13, color: T.muted, maxWidth: 360, margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                You haven&apos;t placed any orders with Al Noor. Once you purchase a timepiece, it will appear here.
              </p>
              <Link
                href="/products"
                style={{
                  display: 'inline-block',
                  height: 40,
                  lineHeight: '40px',
                  padding: '0 24px',
                  background: T.gold,
                  color: T.white,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderRadius: 2,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.goldDark }}
                onMouseLeave={(e) => { e.currentTarget.style.background = T.gold }}
              >
                Browse Timepieces
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {initialOrders.map(order => {
                const statusStyle = getStatusStyles(order.status)
                return (
                  <div
                    key={order.id}
                    style={{
                      background: T.white,
                      border: `1px solid ${T.borderLight}`,
                      borderRadius: 2,
                      boxShadow: T.shadowSm,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Order summary header */}
                    <div
                      style={{
                        background: T.ivory,
                        borderBottom: `1px solid ${T.borderLight}`,
                        padding: '16px 20px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                            Order ID
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.deep, marginTop: 2, fontFamily: 'monospace' }}>
                            {order.id}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                            Placed On
                          </div>
                          <div style={{ fontSize: 13, color: T.deep, marginTop: 2 }}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                            Total
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.deep, marginTop: 2, fontFamily: "'Inter', sans-serif" }}>
                            {formatPrice(order.totalInr)}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {formatStatus(order.status)}
                      </div>
                    </div>

                    {/* Order items */}
                    <div style={{ padding: '0 20px' }}>
                      {order.items.map((item, idx) => (
                        <div
                          key={item.productId || idx}
                          style={{
                            display: 'flex',
                            gap: 16,
                            padding: '20px 0',
                            borderBottom: idx === order.items.length - 1 ? 'none' : `1px solid ${T.borderLight}`,
                            alignItems: 'center',
                          }}
                        >
                          {/* Thumbnail */}
                          <div
                            style={{
                              width: 64,
                              height: 64,
                              background: T.ivory,
                              border: `1.5px solid ${T.border}`,
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {item.productImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <svg width="32" height="32" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="70" cy="70" r="68" fill="#C8B89A"/>
                                <circle cx="70" cy="70" r="63" fill="#9E7F4A"/>
                                <circle cx="70" cy="70" r="57" fill="#1a3a5c"/>
                                <circle cx="70" cy="70" r="4" fill="#9E7F4A"/>
                              </svg>
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold }}>
                              Al Noor
                            </div>
                            {item.productSlug ? (
                              <Link
                                href={`/product/${item.productSlug}`}
                                style={{
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: 15,
                                  fontWeight: 600,
                                  color: T.deep,
                                  textDecoration: 'none',
                                  marginTop: 2,
                                  display: 'block',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = T.gold }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = T.deep }}
                              >
                                {item.productName}
                              </Link>
                            ) : (
                              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, color: T.deep, marginTop: 2 }}>
                                {item.productName}
                              </div>
                            )}
                            <div style={{ fontSize: 12, color: T.muted, marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
                              Quantity: {item.quantity} · Price: {formatPrice(item.priceInr)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer Actions */}
                    <div
                      style={{
                        padding: '16px 20px',
                        borderTop: `1px solid ${T.borderLight}`,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 12,
                        background: '#FAF9F6',
                      }}
                    >
                      <Link
                        href={`/orders/${order.id}`}
                        style={{
                          height: 34,
                          lineHeight: '34px',
                          padding: '0 18px',
                          background: 'transparent',
                          color: T.goldDark,
                          border: `1.5px solid ${T.gold}`,
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          textDecoration: 'none',
                          borderRadius: 2,
                          textAlign: 'center',
                          display: 'inline-block',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = T.goldPale }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/track-order?orderId=${order.id}`}
                        style={{
                          height: 36,
                          lineHeight: '36px',
                          padding: '0 20px',
                          background: T.gold,
                          color: T.white,
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          textDecoration: 'none',
                          borderRadius: 2,
                          textAlign: 'center',
                          display: 'inline-block',
                          boxShadow: T.shadowSm,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = T.goldDark }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = T.gold }}
                      >
                        Track Order
                      </Link>
                      <a
                        href={`mailto:enquire@alnoor.com?subject=Enquiry regarding Order ${order.id}`}
                        style={{
                          height: 34,
                          lineHeight: '34px',
                          padding: '0 18px',
                          background: 'transparent',
                          color: T.mid,
                          border: `1.5px solid ${T.border}`,
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          textDecoration: 'none',
                          borderRadius: 2,
                          textAlign: 'center',
                          display: 'inline-block',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = T.goldDark; e.currentTarget.style.borderColor = T.goldDark }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = T.mid; e.currentTarget.style.borderColor = T.border }}
                      >
                        Need Help
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
