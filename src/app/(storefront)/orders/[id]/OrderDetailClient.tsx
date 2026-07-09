'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useLogout } from '@/hooks/useLogout'
import { formatPrice } from '@/lib/products-data'
import { UserOrderDetails, cancelOrder } from '@/lib/actions/orders'

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

const CANCELLATION_REASONS = [
  'Ordered by mistake / duplicate order',
  'Incorrect delivery address',
  'Found a better price elsewhere',
  'Expected delivery time is too long',
  'Changed my mind / want a different model',
  'Other / personal reasons',
]

interface OrderDetailClientProps {
  order: UserOrderDetails
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function OrderDetailClient({ order: initialOrder }: OrderDetailClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isMobile } = useBreakpoint()
  const { logout } = useLogout()

  const [order, setOrder] = useState<UserOrderDetails>(initialOrder)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/orders/${initialOrder.id}`)
    }
  }, [status, router, initialOrder.id])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.parchment, fontFamily: "'Raleway', sans-serif", color: T.muted }}>
        Loading…
      </div>
    )
  }

  const user = session?.user

  // Stepper Config
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded'
  const steps = [
    { key: 'confirmed', label: 'Ordered & Confirmed', date: order.createdAt },
    { key: 'processing', label: 'Processing', date: order.status !== 'pending' && order.status !== 'confirmed' ? order.updatedAt : null },
    { key: 'shipped', label: 'Shipped', date: ['shipped', 'delivered'].includes(order.status) ? order.updatedAt : null },
    { key: 'delivered', label: 'Delivered', date: order.status === 'delivered' ? order.updatedAt : null }
  ]

  let currentStep = 0
  if (order.status === 'processing') currentStep = 1
  if (order.status === 'shipped') currentStep = 2
  if (order.status === 'delivered') currentStep = 3

  // Cancellation availability: allowed only for pending, confirmed, processing status
  const canBeCancelled = ['pending', 'confirmed', 'processing'].includes(order.status)

  const handleCancelConfirm = () => {
    const finalReason = cancelReason === 'Other / personal reasons' 
      ? `Other: ${customReason.trim()}` 
      : cancelReason

    setErrorMessage(null)
    startTransition(async () => {
      const res = await cancelOrder(order.id, finalReason)
      if (res.success) {
        setSuccessMessage('Order cancelled successfully.')
        setIsCancelModalOpen(false)
        // Update local state to reflect cancellation instantly
        setOrder(prev => ({
          ...prev,
          status: 'cancelled',
          // Mirrors the server-side result: COD-only checkout means nothing was
          // collected pre-delivery, so cancellation never enters a refund state.
          paymentStatus: 'cancelled',
          updatedAt: new Date().toISOString().split('T')[0]
        }))
        router.refresh()
      } else {
        setErrorMessage(res.message)
      }
    })
  }

  const statusStyle = getStatusStyles(order.status)

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
          <Link href="/orders" style={{ color: T.muted, textDecoration: 'none' }}>My Account</Link>
          <span>›</span>
          <Link href="/orders" style={{ color: T.muted, textDecoration: 'none' }}>Orders</Link>
          <span>›</span>
          <span style={{ color: T.deep, fontWeight: 500 }}>Order Details</span>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '16px 16px 96px' : '24px 24px 60px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr', gap: isMobile ? 16 : 24, alignItems: 'flex-start' }}>
        {/* Sidebar */}
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

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/orders" style={{ textDecoration: 'none', fontSize: 18, color: T.gold, display: 'inline-flex', alignItems: 'center' }}>
                ←
              </Link>
              <h1 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: isMobile ? 24 : 32, fontStyle: 'italic', color: T.deep, margin: 0 }}>
                Order Details
              </h1>
            </div>
            {canBeCancelled && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                style={{
                  height: 36,
                  padding: '0 16px',
                  background: 'transparent',
                  color: T.red,
                  border: `1.5px solid ${T.red}`,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  borderRadius: 2,
                  cursor: 'pointer',
                  fontFamily: "'Raleway', sans-serif",
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                Cancel Order
              </button>
            )}
          </div>

          {successMessage && (
            <div style={{ padding: '12px 16px', background: '#EBF5EF', border: `1.5px solid ${T.green}`, borderRadius: 2, color: T.green, fontSize: 13, fontWeight: 600 }}>
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div style={{ padding: '12px 16px', background: '#FEF2F2', border: `1.5px solid ${T.red}`, borderRadius: 2, color: T.red, fontSize: 13, fontWeight: 600 }}>
              {errorMessage}
            </div>
          )}

          {/* Overview Info Card */}
          <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, overflow: 'hidden' }}>
            <div style={{ background: T.ivory, padding: '16px 20px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Order ID</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.deep, marginTop: 2, fontFamily: 'monospace' }}>{order.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Ordered On</div>
                  <div style={{ fontSize: 13, color: T.deep, marginTop: 2 }}>{fmtDateShort(order.createdAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Last Update</div>
                  <div style={{ fontSize: 13, color: T.deep, marginTop: 2 }}>{fmtDateShort(order.updatedAt)}</div>
                </div>
              </div>
              <div style={{ background: statusStyle.bg, color: statusStyle.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {formatStatus(order.status)}
              </div>
            </div>

            {/* Estimated delivery or Cancellation notice banner */}
            {isCancelled ? (
              <div style={{ background: '#FEF2F2', borderTop: `1px solid #FCA5A5`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>✕</span>
                <span style={{ fontSize: 13, color: T.red, fontWeight: 600 }}>
                  This order was cancelled on <strong>{fmtDateShort(order.updatedAt)}</strong>.
                  {order.paymentStatus === 'refund_pending' && ' Refund of the paid amount is being processed.'}
                  {order.paymentStatus === 'refunded' && ' Refund has been credited back to your original payment method.'}
                </span>
              </div>
            ) : (
              <div style={{ background: '#EBF5EF', borderTop: `1px solid #C3E0CC`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                <span style={{ fontSize: 13, color: T.green, fontWeight: 600 }}>
                  Expected delivery by <strong>{fmtDateShort(order.estimatedDelivery)}</strong>
                </span>
                {order.trackingNumber && (
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: T.muted }}>
                    Tracking WAYBILL: <span style={{ fontFamily: 'monospace', color: T.deep, fontWeight: 600 }}>{order.trackingNumber}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stepper Card */}
          <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, padding: isMobile ? '20px 16px' : '28px 32px' }}>
            {isCancelled ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                  ✕
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.red }}>Cancelled</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>The order was cancelled. Timepieces have been restocked.</div>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Connecting Line */}
                <div style={{ position: 'absolute', top: 20, left: '12.5%', right: '12.5%', height: 3, background: T.parchment, borderRadius: 2, zIndex: 0 }} />
                <div style={{ position: 'absolute', top: 20, left: '12.5%', width: `${(currentStep / (steps.length - 1)) * 75}%`, height: 3, background: T.gold, borderRadius: 2, zIndex: 0, transition: 'width 0.4s ease' }} />

                {/* Steps mapping */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                  {steps.map((s, idx) => {
                    const isDone = idx < currentStep
                    const isActive = idx === currentStep

                    let stepBg = T.parchment
                    let stepColor = T.muted
                    let borderStyle = `3px solid ${T.parchment}`

                    if (isDone) {
                      stepBg = T.green
                      stepColor = '#fff'
                      borderStyle = `3px solid ${T.green}`
                    } else if (isActive) {
                      stepBg = T.gold
                      stepColor = '#fff'
                      borderStyle = `3px solid ${T.gold}`
                    }

                    return (
                      <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: stepBg,
                          border: borderStyle,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: isDone ? 14 : 16,
                          fontWeight: 'bold',
                          color: stepColor,
                          boxShadow: isActive ? `0 0 0 4px ${T.goldPale}` : 'none',
                          transition: 'all 0.3s',
                        }}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <div style={{ marginTop: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: isActive || isDone ? 700 : 400, color: isActive ? T.gold : isDone ? T.green : T.light }}>
                            {s.label}
                          </div>
                          {s.date && (
                            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                              {fmtDateShort(s.date)}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Grid: Details & Address */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 20, alignItems: 'flex-start' }}>
            {/* Left side: Items & Live Updates */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Order Items */}
              <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: T.deep }}>Items in Order</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {order.items.map((item, idx) => {
                    let specsMap: Record<string, string> = {}
                    try {
                      if (item.specs) {
                        specsMap = JSON.parse(item.specs)
                      }
                    } catch (e) {
                      console.error('Failed to parse specs', e)
                    }

                    return (
                      <div
                        key={item.productId || idx}
                        style={{
                          display: 'flex',
                          gap: 16,
                          paddingBottom: idx === order.items.length - 1 ? 0 : 16,
                          borderBottom: idx === order.items.length - 1 ? 'none' : `1px solid ${T.borderLight}`,
                        }}
                      >
                        {/* Thumbnail */}
                        <div style={{ width: 80, height: 80, background: T.ivory, border: `1.5px solid ${T.border}`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {item.productImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.productImage} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <svg width="40" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="70" cy="70" r="68" fill="#C8B89A"/>
                              <circle cx="70" cy="70" r="63" fill="#9E7F4A"/>
                              <circle cx="70" cy="70" r="57" fill="#1a3a5c"/>
                              <circle cx="70" cy="70" r="4" fill="#9E7F4A"/>
                            </svg>
                          )}
                        </div>

                        {/* Product Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold }}>Al Noor</div>
                          {item.productSlug ? (
                            <Link href={`/product/${item.productSlug}`} style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, color: T.deep, textDecoration: 'none', marginTop: 2, display: 'block' }}>
                              {item.productName}
                            </Link>
                          ) : (
                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, color: T.deep, marginTop: 2 }}>{item.productName}</div>
                          )}

                          {/* Spec details line */}
                          {Object.keys(specsMap).length > 0 && (
                            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                              {specsMap['Dial Colour'] && `Dial: ${specsMap['Dial Colour']}`}
                              {specsMap['Reference'] && ` · Ref: ${specsMap['Reference']}`}
                            </div>
                          )}

                          <div style={{ fontSize: 12, color: T.mid, marginTop: 6, display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif" }}>
                            <span>Qty: {item.quantity} · Price: {formatPrice(item.priceInr)}</span>
                            <span style={{ fontWeight: 700, color: T.deep }}>{formatPrice(item.priceInr * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Delhivery Live updates */}
              {order.trackingNumber && (
                <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.deep }}>Live Shipment Status</span>
                    <span style={{ fontSize: 12, color: T.muted }}>Delhivery Express</span>
                  </div>

                  <div style={{ padding: '8px 20px 20px' }}>
                    {order.events.length === 0 ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: T.muted }}>
                        No shipment tracking scans yet. Updates will begin once Delhivery picks up the package.
                      </div>
                    ) : (
                      order.events.slice().reverse().map((ev, i) => {
                        const isLatest = i === 0
                        return (
                          <div key={i} style={{ display: 'flex', gap: 16, paddingTop: 20, position: 'relative' }}>
                            {i < order.events.length - 1 && (
                              <div style={{ position: 'absolute', left: 11, top: 36, bottom: 0, width: 2, background: T.borderLight }} />
                            )}
                            <div style={{ flexShrink: 0, marginTop: 2 }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: isLatest ? T.gold : T.parchment, border: `2px solid ${isLatest ? T.gold : T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isLatest && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                              </div>
                            </div>
                            <div style={{ flex: 1, paddingBottom: 20 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: isLatest ? 700 : 600, color: isLatest ? T.deep : T.mid }}>{ev.status}</div>
                                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    {ev.location}
                                  </div>
                                  {ev.note && <div style={{ fontSize: 12, color: T.muted, marginTop: 4, fontStyle: 'italic' }}>{ev.note}</div>}
                                </div>
                                <div style={{ fontSize: 11, color: T.light, flexShrink: 0, textAlign: 'right' }}>
                                  {fmtDate(ev.timestamp)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Address & Payment Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Shipping Address */}
              <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.deep }}>Shipping Address</h3>
                  <span style={{ fontSize: 10, fontWeight: 700, background: T.goldPale, color: T.goldDark, padding: '2px 8px', borderRadius: 10, letterSpacing: '0.05em' }}>
                    {order.shippingAddressObj.label || 'HOME'}
                  </span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: T.deep, marginBottom: 4 }}>{order.shippingAddressObj.fullName}</div>
                  <div style={{ color: T.mid }}>{order.shippingAddressObj.line1}</div>
                  {order.shippingAddressObj.line2 && <div style={{ color: T.mid }}>{order.shippingAddressObj.line2}</div>}
                  <div style={{ color: T.mid }}>{order.shippingAddressObj.city}, {order.shippingAddressObj.state} - {order.shippingAddressObj.pincode}</div>
                  <div style={{ fontWeight: 600, color: T.deep, marginTop: 8 }}>Phone: {order.shippingAddressObj.phone}</div>
                </div>
              </div>

              {/* Price Details */}
              <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, padding: '20px' }}>
                <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: T.deep }}>Price Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, borderBottom: `1px dashed ${T.border}`, paddingBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.muted }}>Items Subtotal</span>
                    <span style={{ color: T.deep, fontFamily: "'Inter', sans-serif" }}>{formatPrice(order.totalInr)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.muted }}>Delivery Charges</span>
                    <span style={{ color: T.green, fontWeight: 600 }}>FREE</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 16px 0', fontSize: 15, fontWeight: 700 }}>
                  <span style={{ color: T.deep }}>Total Amount</span>
                  <span style={{ color: T.goldDark, fontFamily: "'Inter', sans-serif" }}>{formatPrice(order.totalInr)}</span>
                </div>
                <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 14, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <span style={{ color: T.muted }}>Payment Status: </span>
                    <span style={{ fontWeight: 600, color: order.paymentStatus.includes('pending') ? T.orange : (order.paymentStatus === 'cancelled' ? T.red : T.green) }}>
                      {order.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: T.muted }}>Payment Method: </span>
                    <span style={{ fontWeight: 600, color: T.deep }}>
                      {(order.paymentStatus === 'cod_pending' || order.paymentStatus === 'cod_collected') ? 'Cash on Delivery (COD)' : 'Prepaid Payment'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          background: 'rgba(26, 20, 16, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: T.white,
            border: `1.5px solid ${T.border}`,
            borderRadius: 2,
            boxShadow: T.shadowMd,
            width: '100%',
            maxWidth: 480,
            padding: '24px',
            position: 'relative',
          }}>
            <h2 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 22, fontStyle: 'italic', color: T.deep, margin: '0 0 12px 0' }}>
              Cancel Order
            </h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20, lineHeight: 1.5 }}>
              Please select the reason for cancelling this order. This helps us improve our service. Note that cancellations are final.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {CANCELLATION_REASONS.map((reason) => (
                <label
                  key={reason}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    color: T.deep,
                    cursor: 'pointer',
                    padding: '8px 12px',
                    border: `1px solid ${cancelReason === reason ? T.gold : T.borderLight}`,
                    background: cancelReason === reason ? T.ivory : 'transparent',
                    borderRadius: 2,
                  }}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    style={{ accentColor: T.gold }}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {cancelReason === 'Other / personal reasons' && (
              <textarea
                placeholder="Please describe your reason here..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                style={{
                  width: '100%',
                  height: 72,
                  padding: '8px 12px',
                  borderRadius: 2,
                  border: `1.5px solid ${T.border}`,
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: T.deep,
                  boxSizing: 'border-box',
                  marginBottom: 20,
                  resize: 'none',
                }}
              />
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isPending}
                style={{
                  height: 38,
                  padding: '0 16px',
                  background: 'transparent',
                  color: T.mid,
                  border: `1.5px solid ${T.border}`,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  borderRadius: 2,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={isPending || (cancelReason === 'Other / personal reasons' && !customReason.trim())}
                style={{
                  height: 38,
                  padding: '0 20px',
                  background: isPending ? T.muted : T.red,
                  color: T.white,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 750,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  borderRadius: 2,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: T.shadowSm,
                }}
              >
                {isPending ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
