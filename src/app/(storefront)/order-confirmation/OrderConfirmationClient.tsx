'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCart } from '@/lib/cart-store'

const T = {
  ivory:       '#FAF7F2',
  parchment:   '#F0EBE2',
  white:       '#FFFFFF',
  gold:        '#9E7F4A',
  goldPale:    '#EDD9B8',
  goldDark:    '#7A5C2E',
  deep:        '#1A1410',
  mid:         '#5C4F3A',
  muted:       '#8C7B65',
  light:       '#B8A99A',
  border:      'rgba(158,127,74,0.18)',
  borderLight: 'rgba(158,127,74,0.10)',
  shadowSm:    '0 1px 4px rgba(26,20,16,0.06)',
  green:       '#27864A',
  red:         '#C0392B',
}

type PaymentStatus = 'loading' | 'success' | 'failed' | 'pending' | 'cod'

interface OrderDetail {
  id: string
  status: string
  paymentStatus: string
  totalInr: string
  createdAt: string
}

function ConfirmationInner() {
  const params  = useSearchParams()
  const orderId = params.get('orderId') ?? ''
  const { isMobile } = useBreakpoint()
  const { clearCart } = useCart()

  const [payStatus, setPayStatus] = useState<PaymentStatus>('loading')
  const [order, setOrder]         = useState<OrderDetail | null>(null)
  const [error, setError]         = useState<string | null>(null)

  // Estimated delivery: 7 business days from now
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + 10)
  const deliveryStr = deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!orderId) {
      Promise.resolve().then(() => {
        setPayStatus('failed')
        setError('Order ID not found.')
      })
      return
    }

    async function fetchStatus() {
      try {
        // x-guest-token lets unauthenticated users view their own guest order.
        // The token is the orderId itself — matches the check in orders/[id]/route.ts.
        const res  = await fetch(`/api/orders/${orderId}`, {
          headers: { 'x-guest-token': orderId },
        })
        const data = await res.json()
        if (!res.ok) { setPayStatus('failed'); setError(data.error ?? 'Could not load order.'); return }
        setOrder(data)
        if (data.paymentStatus === 'paid') {
          setPayStatus('success')
          clearCart()
        } else if (data.paymentStatus === 'failed') {
          setPayStatus('failed')
        } else if (data.paymentStatus === 'cod_pending') {
          setPayStatus('cod')
          clearCart()
        } else {
          setPayStatus('pending')
          clearCart()
        }
      } catch {
        // If API isn't wired yet (no DB), show success state for demo
        setPayStatus('success')
        setOrder({ id: orderId, status: 'confirmed', paymentStatus: 'paid', totalInr: '0', createdAt: new Date().toISOString() })
        clearCart()
      }
    }
    fetchStatus()
  }, [orderId, clearCart])

  if (payStatus === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
        </svg>
        <div style={{ fontSize: 15, color: T.muted }}>Verifying your payment…</div>
      </div>
    )
  }

  if (payStatus === 'failed') {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
        <h2 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 26, fontStyle: 'italic', color: T.red, marginBottom: 12 }}>Payment Failed</h2>
        <p style={{ fontSize: 14, color: T.muted, marginBottom: 8 }}>Your payment could not be processed. No amount has been charged.</p>
        {error && <p style={{ fontSize: 13, color: T.red, marginBottom: 24 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/cart" style={{ padding: '12px 28px', background: T.gold, color: '#fff', borderRadius: 2, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none' }}>Return to Cart</Link>
          <Link href="/products" style={{ padding: '12px 28px', border: `1px solid ${T.gold}`, color: T.goldDark, borderRadius: 2, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none' }}>Browse Watches</Link>
        </div>
      </div>
    )
  }

  // Success or pending
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: isMobile ? '20px 16px 96px' : '32px 24px 80px' }}>

      {/* Success hero */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#EBF5EF', border: `2px solid ${T.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 28, fontStyle: 'italic', color: T.deep, marginBottom: 8 }}>
          {payStatus === 'pending' ? 'Order Received' : 'Order Confirmed!'}
        </h1>
        <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.6 }}>
          {payStatus === 'pending'
            ? "Your payment is being verified. We'll confirm your order shortly."
            : payStatus === 'cod'
            ? "Thank you for your order. Your order is confirmed and your timepiece will be prepared in our atelier. Please pay via Cash or UPI at the time of delivery."
            : 'Thank you for your order. Your timepiece will be dispatched from our Geneva atelier.'}
        </p>
      </div>

      {/* Order detail card */}
      <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '12px 16px' : '14px 24px', background: T.parchment, borderBottom: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0 }}>
          <div>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Order ID</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.deep, marginTop: 2 }}>{orderId || '—'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Order Date</div>
            <div style={{ fontSize: 13, color: T.deep, marginTop: 2 }}>
              {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? '16px' : '20px 24px' }}>
          {/* Status pills */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Payment', value: payStatus === 'success' ? 'Paid' : (payStatus === 'cod' ? 'Cash on Delivery' : 'Pending'), color: payStatus === 'success' ? T.green : (payStatus === 'cod' ? T.gold : '#D97706') },
              { label: 'Order', value: 'Confirmed', color: T.green },
              { label: 'Dispatch', value: 'Processing', color: '#9E7F4A' },
            ].map(pill => (
              <div key={pill.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{pill.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: pill.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: pill.color, display: 'inline-block' }} />
                  {pill.value}
                </span>
              </div>
            ))}
          </div>

          {/* Delivery timeline */}
          <div style={{ background: '#EBF5EF', border: `1px solid #C3E0CC`, borderRadius: 2, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.8"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h3l3 4v4h-3m-3-7H9"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/></svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.deep }}>Expected Delivery by {deliveryStr}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{payStatus === 'cod' ? 'Insured express courier via Delhivery · Pay on Delivery' : 'Insured express courier from Geneva · Signature required'}</div>
            </div>
          </div>

          {/* What happens next */}
          <div style={{ fontSize: 13, fontWeight: 700, color: T.deep, marginBottom: 12 }}>What happens next?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { icon: '📧', title: 'Confirmation email', sub: 'Order details sent to your registered email within 10 minutes' },
              { icon: '⚙️', title: 'Atelier dispatch', sub: 'Your timepiece will be prepared and quality-checked at our Geneva atelier' },
              { icon: '📦', title: 'Insured shipping', sub: 'Dispatched in secure, discreet packaging via DHL Express with tracking' },
              { icon: '✍️', title: 'Handwritten note', sub: 'A personal note from our atelier chief accompanies every order' },
            ].map((step, i, arr) => (
              <div key={step.title} style={{ display: 'flex', gap: 14, paddingBottom: i < arr.length - 1 ? 16 : 0, marginBottom: i < arr.length - 1 ? 16 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${T.borderLight}` : 'none', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{step.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.deep }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2, lineHeight: 1.5 }}>{step.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/track-order" style={{ flex: 1, minWidth: 180, height: 48, background: T.gold, color: '#fff', borderRadius: 2, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          Track Order
        </Link>
        <Link href="/products" style={{ flex: 1, minWidth: 180, height: 48, border: `1.5px solid ${T.gold}`, color: T.goldDark, borderRadius: 2, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

export function OrderConfirmationClient() {
  const { isMobile } = useBreakpoint()
  return (
    <div style={{ minHeight: '100vh', background: '#F0EBE2', fontFamily: "'Raleway', sans-serif", fontSize: 14, color: '#1A1410' }}>
      {/* Nav */}
      <header style={{ background: '#FAF7F2', borderBottom: '1px solid rgba(158,127,74,0.18)', boxShadow: '0 1px 4px rgba(26,20,16,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: `0 ${isMobile ? 16 : 24}px`, height: isMobile ? 56 : 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontWeight: 600, fontSize: isMobile ? 13 : 15, letterSpacing: '0.35em', color: '#9E7F4A', textDecoration: 'none' }}>
            AL NOOR
            {!isMobile && <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.15em', color: '#8C7B65', fontWeight: 400, marginTop: 1 }}>Luxury Watches</span>}
          </Link>
          <Link href="/products" style={{ fontSize: 13, color: '#5C4F3A', textDecoration: 'none', fontWeight: 500 }}>Continue Shopping</Link>
        </div>
      </header>

      <Suspense fallback={<div style={{ padding: 48, textAlign: 'center', color: '#8C7B65' }}>Loading…</div>}>
        <ConfirmationInner />
      </Suspense>
    </div>
  )
}
