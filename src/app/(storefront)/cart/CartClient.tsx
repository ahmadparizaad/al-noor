'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart-store'
import { WatchFace } from '@/components/ui/WatchFace'
import { formatPrice, discount } from '@/lib/products-data'
import { useState } from 'react'
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
}

const DELIVERY_FEE  = 0        // free
const GIFT_WRAP_FEE = 2500

export function CartClient() {
  const { isMobile } = useBreakpoint()
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart()
  const [giftWrap, setGiftWrap] = useState(false)
  const [coupon, setCoupon]     = useState('')
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [savedItems, setSavedItems] = useState<number[]>([])

  const sub        = subtotal()
  const giftFee    = giftWrap ? GIFT_WRAP_FEE : 0
  const total      = sub + DELIVERY_FEE + giftFee
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  function applyCoupon() {
    if (coupon.trim().toUpperCase() === 'ALNOOR10') {
      setCouponMsg({ text: 'Coupon applied! ₹' + Math.round(sub * 0.1).toLocaleString('en-IN') + ' discount at checkout.', ok: true })
    } else {
      setCouponMsg({ text: 'Invalid coupon code.', ok: false })
    }
  }

  function toggleSave(id: number) {
    setSavedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  if (items.length === 0) {
    return (
      <PageShell>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🛒</div>
          <h2 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 28, fontStyle: 'italic', color: T.deep, marginBottom: 12 }}>Your cart is empty</h2>
          <p style={{ fontSize: 15, color: T.muted, marginBottom: 32 }}>Add timepieces from our collection to begin your order.</p>
          <Link href="/products" style={{ display: 'inline-block', background: T.gold, color: '#fff', padding: '13px 36px', borderRadius: 2, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
            Browse Watches
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 60px' }}>

        {/* Page title row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.deep }}>
            My Cart <span style={{ fontSize: 14, fontWeight: 400, color: T.muted, marginLeft: 6 }}>({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
          </h1>
          <button onClick={clearCart} style={{ fontSize: 12, color: T.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Remove all
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: isMobile ? 16 : 20, alignItems: 'flex-start' }}>

          {/* ── Left: cart items ── */}
          <div>
            {/* Delivery notice */}
            <div style={{ background: '#EBF5EF', border: '1px solid #C3E0CC', borderRadius: 2, padding: '10px 16px', marginBottom: 12, fontSize: 13, color: T.green, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h3l3 4v4h-3m-3-7H9"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/></svg>
              Free worldwide insured delivery on all Al Noor timepieces
            </div>

            {/* Cart items */}
            <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm }}>
              {items.map((item, idx) => {
                const p    = item.product
                const disc = discount(p.price, p.original)
                const isSaved = savedItems.includes(p.id)

                return (
                  <div key={p.id} style={{ display: 'flex', gap: isMobile ? 12 : 20, padding: isMobile ? '16px' : '20px 24px', borderBottom: idx < items.length - 1 ? `1px solid ${T.borderLight}` : 'none', alignItems: 'flex-start' }}>

                    {/* Watch image */}
                    <Link href={`/product/${p.id}`} style={{ flexShrink: 0, width: isMobile ? 80 : 120, height: isMobile ? 80 : 120, background: T.parchment, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.borderLight}`, textDecoration: 'none' }}>
                      <WatchFace dial={p.dial} size={isMobile ? 60 : 90} />
                    </Link>

                    {/* Item details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, marginBottom: 3 }}>Al Noor</div>
                      <Link href={`/product/${p.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: T.deep, lineHeight: 1.3, marginBottom: 3 }}>{p.name}</div>
                      </Link>
                      <div style={{ fontSize: 11, color: T.light, letterSpacing: '0.05em', marginBottom: 10 }}>{p.ref} · {p.material} · {p.dial}</div>

                      {/* In stock */}
                      <div style={{ fontSize: 12, color: T.green, fontWeight: 500, marginBottom: 12 }}>In Stock</div>

                      {/* Qty + actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        {/* Quantity stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${T.border}`, borderRadius: 2, overflow: 'hidden' }}>
                          <button
                            onClick={() => updateQuantity(p.id, item.quantity - 1)}
                            style={{ width: 32, height: 32, background: T.parchment, border: 'none', fontSize: 16, cursor: 'pointer', color: T.deep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}
                          >−</button>
                          <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 600, color: T.deep, lineHeight: '32px' }}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(p.id, item.quantity + 1)}
                            disabled={item.quantity >= 10}
                            style={{ width: 32, height: 32, background: T.parchment, border: 'none', fontSize: 16, cursor: item.quantity >= 10 ? 'not-allowed' : 'pointer', color: item.quantity >= 10 ? T.light : T.deep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}
                          >+</button>
                        </div>

                        <button onClick={() => removeItem(p.id)} style={{ fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', borderLeft: `1px solid ${T.borderLight}`, paddingLeft: 16 }}>Remove</button>
                        <button onClick={() => toggleSave(p.id)} style={{ fontSize: 13, color: isSaved ? T.gold : T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', borderLeft: `1px solid ${T.borderLight}`, paddingLeft: 16, fontWeight: isSaved ? 600 : 400 }}>
                          {isSaved ? '♥ Saved' : 'Save for later'}
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: isMobile ? 80 : 120 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.deep }}>{formatPrice(p.price * item.quantity)}</div>
                      {item.quantity > 1 && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{formatPrice(p.price)} each</div>}
                      <div style={{ fontSize: 12, color: T.light, textDecoration: 'line-through', marginTop: 4 }}>{formatPrice(p.original * item.quantity)}</div>
                      <div style={{ fontSize: 12, color: T.green, fontWeight: 600, marginTop: 2 }}>{disc}% off</div>
                    </div>
                  </div>
                )
              })}

              {/* Gift wrap */}
              <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="checkbox"
                  id="giftwrap"
                  checked={giftWrap}
                  onChange={e => setGiftWrap(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: T.gold, cursor: 'pointer' }}
                />
                <label htmlFor="giftwrap" style={{ fontSize: 13, color: T.mid, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🎁</span>
                  <span>Add premium gift wrap & handwritten note <strong style={{ color: T.deep }}>+{formatPrice(GIFT_WRAP_FEE)}</strong></span>
                </label>
              </div>
            </div>

            {/* Coupon */}
            <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, padding: '16px 24px', marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.deep, marginBottom: 12 }}>Apply Coupon</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={coupon}
                  onChange={e => { setCoupon(e.target.value); setCouponMsg(null) }}
                  style={{ flex: 1, height: 40, border: `1.5px solid ${T.border}`, borderRadius: 2, padding: '0 14px', fontSize: 13, color: T.deep, background: T.white, outline: 'none', fontFamily: 'inherit', letterSpacing: '0.05em' }}
                />
                <button
                  onClick={applyCoupon}
                  style={{ height: 40, padding: '0 24px', background: T.gold, color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer' }}
                >
                  Apply
                </button>
              </div>
              {couponMsg ? (
                <div style={{ marginTop: 8, fontSize: 12, color: couponMsg.ok ? T.green : T.red, fontWeight: 500 }}>
                  {couponMsg.ok ? '✓' : '✕'} {couponMsg.text}
                </div>
              ) : null}
              <div style={{ marginTop: 8, fontSize: 11, color: T.muted }}>Try <strong>ALNOOR10</strong> for 10% off</div>
            </div>

            {/* Offers / guarantees */}
            <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, padding: '16px 24px', marginTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 8 : 16 }}>
                {[
                  { icon: '🛡️', title: '5-Year Warranty', sub: 'Full movement coverage' },
                  { icon: '📦', title: 'Free Returns', sub: '30-day hassle-free policy' },
                  { icon: '🔒', title: 'Secure Payment', sub: 'PhonePe · Cards · UPI' },
                ].map(g => (
                  <div key={g.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: isMobile ? 4 : 6 }}>
                    <span style={{ fontSize: isMobile ? 18 : 22 }}>{g.icon}</span>
                    <span style={{ fontSize: isMobile ? 10 : 12, fontWeight: 600, color: T.deep }}>{g.title}</span>
                    <span style={{ fontSize: isMobile ? 9 : 11, color: T.muted }}>{g.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Price summary ── */}
          <div style={{ position: isMobile ? 'static' : 'sticky', top: 80 }}>
            <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.borderLight}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Price Details</div>
              </div>

              <div style={{ padding: '16px 20px' }}>
                {/* Line items */}
                {[
                  { label: `Price (${totalItems} item${totalItems !== 1 ? 's' : ''})`, value: formatPrice(items.reduce((s, i) => s + i.product.original * i.quantity, 0)) },
                  { label: 'Discount', value: `−${formatPrice(items.reduce((s, i) => s + (i.product.original - i.product.price) * i.quantity, 0))}`, green: true },
                  { label: 'Delivery Charges', value: 'FREE', green: true },
                  ...(giftWrap ? [{ label: 'Gift Wrap', value: formatPrice(GIFT_WRAP_FEE) }] : []),
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 14, color: row.green ? T.green : T.mid }}>
                    <span style={{ color: T.mid }}>{row.label}</span>
                    <span style={{ fontWeight: 500, color: row.green ? T.green : T.deep }}>{row.value}</span>
                  </div>
                ))}

                <hr style={{ border: 'none', borderTop: `1px dashed ${T.border}`, margin: '8px 0 16px' }} />

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: T.deep }}>Total Amount</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: T.deep }}>{formatPrice(total)}</span>
                </div>

                {/* Savings */}
                <div style={{ fontSize: 13, color: T.green, fontWeight: 600, textAlign: 'right', marginBottom: 20 }}>
                  You save {formatPrice(items.reduce((s, i) => s + (i.product.original - i.product.price) * i.quantity, 0))}
                </div>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  style={{ width: '100%', height: 48, background: T.gold, color: '#fff', borderRadius: 2, fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  Place Order
                </Link>

                {/* Security note */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, fontSize: 11, color: T.muted }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Safe &amp; secure checkout
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, padding: '14px 20px', marginTop: 12 }}>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Accepted Payments</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['PhonePe', 'UPI', 'Visa', 'Mastercard', 'Net Banking', 'EMI'].map(method => (
                  <span key={method} style={{ fontSize: 11, padding: '3px 10px', border: `1px solid ${T.borderLight}`, borderRadius: 2, color: T.mid, fontWeight: 500 }}>{method}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F0EBE2', fontFamily: "'Raleway', sans-serif", fontSize: 14, color: '#1A1410' }}>
      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: '#FAF7F2', borderBottom: '1px solid rgba(158,127,74,0.18)', boxShadow: '0 1px 4px rgba(26,20,16,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/" style={{ fontWeight: 600, fontSize: 15, letterSpacing: '0.35em', color: '#9E7F4A', whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none' }}>
            AL NOOR
            <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.15em', color: '#8C7B65', fontWeight: 400, marginTop: 1 }}>Luxury Watches</span>
          </Link>
          <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 28 }}>
            <Link href="/products" style={{ fontSize: 13, fontWeight: 500, color: '#5C4F3A', textDecoration: 'none' }}>All Watches</Link>
            <Link href="/cart" style={{ fontSize: 13, fontWeight: 600, color: '#9E7F4A', textDecoration: 'none' }}>Cart</Link>
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8C7B65' }}>
        <Link href="/" style={{ color: '#8C7B65', textDecoration: 'none' }}>Home</Link>
        <span style={{ color: '#B8A99A' }}>›</span>
        <Link href="/products" style={{ color: '#8C7B65', textDecoration: 'none' }}>Watches</Link>
        <span style={{ color: '#B8A99A' }}>›</span>
        <span style={{ color: '#1A1410', fontWeight: 500 }}>Cart</span>
      </div>

      {children}
    </div>
  )
}
