'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const T = {
  ivory:       '#FAF7F2',
  parchment:   '#F0EBE2',
  parchment2:  '#E8E0D4',
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

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface TrackingEvent {
  status: string
  location: string
  timestamp: string
  note?: string
}

interface OrderData {
  id: string
  status: OrderStatus
  paymentStatus: string
  totalInr: string
  trackingNumber?: string
  createdAt: string
  estimatedDelivery: string
  product: { name: string; ref: string; dial: string }
  address: { name: string; city: string; state: string; pincode: string }
  events: TrackingEvent[]
}

// Order status pipeline — each step has an index
const STATUS_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'confirmed',  label: 'Order Confirmed',    icon: '✓'  },
  { key: 'processing', label: 'Atelier Processing',  icon: '⚙' },
  { key: 'shipped',    label: 'Shipped',             icon: '📦' },
  { key: 'delivered',  label: 'Delivered',           icon: '🏠' },
]

function statusIndex(status: OrderStatus): number {
  const idx = STATUS_STEPS.findIndex(s => s.key === status)
  return idx === -1 ? (status === 'pending' ? 0 : 0) : idx
}

// Mock order for demo (used when DB not connected)
function mockOrder(orderId: string): OrderData {
  const created    = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  const estimated  = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) // 8 days from now

  return {
    id:                orderId,
    status:            'shipped',
    paymentStatus:     'paid',
    totalInr:          '28500',
    trackingNumber:    'DHL-AL' + orderId.slice(0, 8).toUpperCase(),
    createdAt:         created.toISOString(),
    estimatedDelivery: estimated.toISOString(),
    product: {
      name: 'Noor I Fumé Blue Tourbillon',
      ref:  'AN-001-TI-FB',
      dial: 'Fumé Blue',
    },
    address: {
      name:    'Valued Customer',
      city:    'Mumbai',
      state:   'Maharashtra',
      pincode: '400001',
    },
    events: [
      { status: 'Shipped',            location: 'Geneva, Switzerland', timestamp: new Date(Date.now() - 18 * 3600_000).toISOString(), note: 'Picked up by DHL Express' },
      { status: 'In Transit',         location: 'Dubai, UAE',          timestamp: new Date(Date.now() - 10 * 3600_000).toISOString(), note: 'Transit hub — on schedule' },
      { status: 'Customs Cleared',    location: 'Mumbai, India',       timestamp: new Date(Date.now() - 4  * 3600_000).toISOString(), note: 'Customs clearance complete' },
      { status: 'Out for Delivery',   location: 'Mumbai, Maharashtra', timestamp: new Date(Date.now() - 1  * 3600_000).toISOString(), note: 'With delivery partner' },
    ],
  }
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

function statusColor(status: OrderStatus) {
  if (status === 'delivered')  return T.green
  if (status === 'cancelled')  return T.red
  if (status === 'shipped')    return '#2563EB'
  return T.orange
}

function statusLabel(status: OrderStatus) {
  return STATUS_STEPS.find(s => s.key === status)?.label ?? status.charAt(0).toUpperCase() + status.slice(1)
}

// ── Search form shown when no orderId in URL ──
function SearchForm({ onSearch }: { onSearch: (id: string) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const { isMobile } = useBreakpoint()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) { setError('Please enter your Order ID'); return }
    setError('')
    onSearch(value.trim())
  }

  return (
    <div style={{ maxWidth: 560, margin: isMobile ? '32px auto' : '60px auto', padding: isMobile ? '0 16px 96px' : '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
      <h2 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 26, fontStyle: 'italic', color: T.deep, marginBottom: 8 }}>Track Your Order</h2>
      <p style={{ fontSize: 14, color: T.muted, marginBottom: 32, lineHeight: 1.6 }}>
        Enter your Order ID from the confirmation email to track your Al Noor timepiece.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 0, boxShadow: T.shadowMd, borderRadius: 2, overflow: 'hidden' }}>
          <input
            type="text"
            placeholder="e.g. 3f8a1b2c-..."
            value={value}
            onChange={e => { setValue(e.target.value); setError('') }}
            style={{ flex: 1, height: 48, border: `1.5px solid ${T.border}`, borderRight: 'none', borderRadius: '2px 0 0 2px', padding: '0 16px', fontSize: 14, color: T.deep, background: T.white, outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            type="submit"
            style={{ height: 48, padding: '0 28px', background: T.gold, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Track
          </button>
        </div>
        {error && <div style={{ marginTop: 8, fontSize: 12, color: T.red }}>{error}</div>}
      </form>
    </div>
  )
}

// ── Main tracking view ──
function TrackingView({ orderId }: { orderId: string }) {
  // In production this would fetch from /api/orders/[id]
  // For now use mock data so the UI is always demonstrable
  const [order] = useState<OrderData>(() => mockOrder(orderId))
  const [inputId, setInputId]   = useState(orderId)
  const [searching, setSearching] = useState(false)
  const { isMobile } = useBreakpoint()

  const currentStep = statusIndex(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '0 16px 96px' : '0 24px 80px' }}>

      {/* Search bar — track a different order */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input
          type="text"
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          placeholder="Order ID"
          style={{ flex: 1, height: 40, border: `1.5px solid ${T.border}`, borderRadius: 2, padding: '0 14px', fontSize: 13, color: T.deep, background: T.white, outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={() => window.location.href = `/track-order?orderId=${inputId.trim()}`}
          style={{ height: 40, padding: '0 24px', background: T.gold, color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Track
        </button>
      </div>

      {/* ── Order header card ── */}
      <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ background: T.parchment, padding: isMobile ? '12px 16px' : '16px 24px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Order ID</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.deep, marginTop: 2, fontFamily: 'monospace', letterSpacing: '0.03em' }}>{order.id}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Placed On</div>
            <div style={{ fontSize: 13, color: T.deep, marginTop: 2 }}>{fmtDateShort(order.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Amount Paid</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.deep, marginTop: 2 }}>₹{Number(order.totalInr).toLocaleString('en-IN')}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: isCancelled ? T.red : statusColor(order.status), display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: isCancelled ? T.red : statusColor(order.status) }}>
              {statusLabel(order.status)}
            </span>
          </div>
        </div>

        {/* Product row */}
        <div style={{ padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, background: T.parchment, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.borderLight}`, flexShrink: 0 }}>
            <svg width="40" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
              <circle cx="70" cy="70" r="68" fill="#C8B89A"/>
              <circle cx="70" cy="70" r="63" fill="#9E7F4A"/>
              <circle cx="70" cy="70" r="57" fill="#1a3a5c"/>
              <circle cx="70" cy="70" r="4" fill="#9E7F4A"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold }}>Al Noor</div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: T.deep, marginTop: 2 }}>{order.product.name}</div>
            <div style={{ fontSize: 11, color: T.light, marginTop: 2 }}>{order.product.ref}</div>
          </div>
          {!isMobile && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: T.muted }}>Delivering to</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.deep, marginTop: 2 }}>{order.address.name}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{order.address.city}, {order.address.state} {order.address.pincode}</div>
            </div>
          )}
        </div>

        {/* Estimated delivery banner */}
        {!isCancelled && (
          <div style={{ background: '#EBF5EF', borderTop: `1px solid #C3E0CC`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            <span style={{ fontSize: 13, color: T.green, fontWeight: 600 }}>
              Expected delivery by <strong>{fmtDateShort(order.estimatedDelivery)}</strong>
            </span>
            {order.trackingNumber && (
              <span style={{ marginLeft: 'auto', fontSize: 12, color: T.muted }}>
                Tracking: <span style={{ fontFamily: 'monospace', color: T.deep, fontWeight: 600 }}>{order.trackingNumber}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Progress stepper ── */}
      {!isCancelled && (
        <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, padding: isMobile ? '20px 16px' : '28px 32px', marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            {/* Connector line behind dots */}
            <div style={{ position: 'absolute', top: 20, left: '12.5%', right: '12.5%', height: 3, background: T.parchment2, borderRadius: 2, zIndex: 0 }} />
            {/* Filled portion */}
            <div style={{ position: 'absolute', top: 20, left: '12.5%', width: `${(currentStep / (STATUS_STEPS.length - 1)) * 75}%`, height: 3, background: T.gold, borderRadius: 2, zIndex: 0, transition: 'width 0.5s ease' }} />

            {/* Steps */}
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              {STATUS_STEPS.map((s, i) => {
                const done    = i < currentStep
                const active  = i === currentStep
                const future  = i > currentStep
                return (
                  <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: done ? T.green : active ? T.gold : T.parchment2,
                      border: `3px solid ${done ? T.green : active ? T.gold : T.parchment2}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: done ? 16 : 18,
                      color: done || active ? '#fff' : T.muted,
                      boxShadow: active ? `0 0 0 4px ${T.goldPale}` : 'none',
                      transition: 'all 0.3s',
                    }}>
                      {done ? '✓' : s.icon}
                    </div>
                    <div style={{ marginTop: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: active ? 700 : done ? 600 : 400, color: active ? T.gold : done ? T.green : future ? T.light : T.mid }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Shipment timeline ── */}
      <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.deep }}>Shipment Updates</span>
          {order.trackingNumber && (
            <span style={{ fontSize: 12, color: T.muted }}>
              via DHL Express · <span style={{ fontFamily: 'monospace', color: T.gold, fontWeight: 600 }}>{order.trackingNumber}</span>
            </span>
          )}
        </div>

        <div style={{ padding: '8px 24px 20px' }}>
          {order.events.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: T.muted }}>
              No tracking updates yet. Updates will appear once your order is dispatched.
            </div>
          ) : (
            order.events.slice().reverse().map((ev, i) => {
              const isLatest = i === 0
              return (
                <div key={i} style={{ display: 'flex', gap: 16, paddingTop: 20, position: 'relative' }}>
                  {/* Timeline spine */}
                  {i < order.events.length - 1 && (
                    <div style={{ position: 'absolute', left: 11, top: 36, bottom: 0, width: 2, background: T.borderLight }} />
                  )}

                  {/* Dot */}
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: isLatest ? T.gold : T.parchment2, border: `2px solid ${isLatest ? T.gold : T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isLatest && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: isLatest ? 700 : 600, color: isLatest ? T.deep : T.mid }}>{ev.status}</div>
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {ev.location}
                        </div>
                        {ev.note && <div style={{ fontSize: 12, color: T.muted, marginTop: 4, fontStyle: 'italic' }}>{ev.note}</div>}
                      </div>
                      <div style={{ fontSize: 12, color: T.light, flexShrink: 0, textAlign: 'right' }}>
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

      {/* ── Help & actions row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Delivery details */}
        <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.deep, marginBottom: 14 }}>Delivery Details</div>
          {[
            { label: 'Courier',    value: 'DHL Express' },
            { label: 'Service',    value: 'Insured Express International' },
            { label: 'Packaging',  value: 'Discreet, signature required' },
            { label: 'Insurance',  value: 'Full declared value covered' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: T.muted }}>{row.label}</span>
              <span style={{ fontWeight: 500, color: T.deep }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Help */}
        <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.deep, marginBottom: 14 }}>Need Help?</div>
          {[
            { icon: '📧', label: 'Email support', sub: 'enquire@alnoor.com', href: 'mailto:enquire@alnoor.com' },
            { icon: '🕐', label: 'Response time', sub: 'Within 2 business hours', href: null },
            { icon: '↩️', label: '30-day returns', sub: 'Hassle-free return policy', href: '#' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.deep }}>{item.label}</div>
                {item.href
                  ? <a href={item.href} style={{ fontSize: 12, color: T.gold, textDecoration: 'none' }}>{item.sub}</a>
                  : <div style={{ fontSize: 12, color: T.muted }}>{item.sub}</div>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/products" style={{ flex: 1, height: 46, background: T.gold, color: '#fff', borderRadius: 2, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Continue Shopping
        </Link>
        <a
          href={`mailto:enquire@alnoor.com?subject=Order%20${orderId}%20Enquiry`}
          style={{ flex: 1, height: 46, border: `1.5px solid ${T.gold}`, color: T.goldDark, borderRadius: 2, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          Contact Support
        </a>
      </div>
    </div>
  )
}

// ── Root client — reads URL param ──────────────────────────────────────────

function TrackOrderInner() {
  const params  = useSearchParams()
  const [orderId, setOrderId] = useState(params.get('orderId') ?? '')

  if (!orderId) {
    return <SearchForm onSearch={id => setOrderId(id)} />
  }
  return <TrackingView orderId={orderId} />
}

export function TrackOrderClient() {
  const { isMobile } = useBreakpoint()
  return (
    <div style={{ minHeight: '100vh', background: '#F0EBE2', fontFamily: "'Raleway', sans-serif", fontSize: 14, color: '#1A1410' }}>

      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: '#FAF7F2', borderBottom: '1px solid rgba(158,127,74,0.18)', boxShadow: '0 1px 4px rgba(26,20,16,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: `0 ${isMobile ? 16 : 24}px`, height: isMobile ? 56 : 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontWeight: 600, fontSize: isMobile ? 13 : 15, letterSpacing: '0.35em', color: '#9E7F4A', textDecoration: 'none' }}>
            AL NOOR
            {!isMobile && <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.15em', color: '#8C7B65', fontWeight: 400, marginTop: 1 }}>Horology · Geneva</span>}
          </Link>
          {!isMobile && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <Link href="/products" style={{ fontSize: 13, fontWeight: 500, color: '#5C4F3A', textDecoration: 'none' }}>All Watches</Link>
              <Link href="/cart" style={{ fontSize: 13, fontWeight: 500, color: '#5C4F3A', textDecoration: 'none' }}>Cart</Link>
            </nav>
          )}
        </div>
      </header>

      {/* Breadcrumb */}
      {!isMobile && (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8C7B65' }}>
          <Link href="/" style={{ color: '#8C7B65', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: '#B8A99A' }}>›</span>
          <span style={{ color: '#1A1410', fontWeight: 500 }}>Track Order</span>
        </div>
      )}

      <Suspense fallback={<div style={{ padding: 48, textAlign: 'center', color: '#8C7B65' }}>Loading…</div>}>
        <TrackOrderInner />
      </Suspense>
    </div>
  )
}
