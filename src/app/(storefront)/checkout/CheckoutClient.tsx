'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart-store'
import { WatchFace } from '@/components/ui/WatchFace'
import { formatPrice, discount } from '@/lib/products-data'
import { useSession } from 'next-auth/react'
import { useBreakpoint } from '@/hooks/useBreakpoint'

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
  green:       '#27864A',
  red:         '#C0392B',
}

type Step = 'address' | 'review'

interface Address {
  fullName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
}

interface SavedAddress extends Address {
  id: string
  label: string
  isDefault: boolean
}

const EMPTY_ADDRESS: Address = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' }

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
]

function validate(addr: Address): Partial<Record<keyof Address, string>> {
  const e: Partial<Record<keyof Address, string>> = {}
  if (!addr.fullName.trim() || addr.fullName.trim().length < 2)   e.fullName = 'Enter full name'
  if (!/^[6-9]\d{9}$/.test(addr.phone))                          e.phone    = 'Enter valid 10-digit mobile number'
  if (!addr.line1.trim() || addr.line1.trim().length < 5)         e.line1    = 'Enter complete address'
  if (!addr.city.trim())                                          e.city     = 'Enter city'
  if (!addr.state)                                                e.state    = 'Select state'
  if (!/^\d{6}$/.test(addr.pincode))                             e.pincode  = 'Enter valid 6-digit pincode'
  return e
}

export function CheckoutClient() {
  const { isMobile } = useBreakpoint()
  const { items, subtotal, clearCart } = useCart()
  const { data: session, status: authStatus } = useSession()

  const [step, setStep]             = useState<Step>('address')
  const [address, setAddress]       = useState<Address>(EMPTY_ADDRESS)
  const [errors, setErrors]         = useState<Partial<Record<keyof Address, string>>>({})
  const [loading, setLoading]       = useState(false)
  const [apiError, setApiError]     = useState<string | null>(null)

  // Saved addresses (logged-in users)
  const [savedAddresses, setSavedAddresses]     = useState<SavedAddress[]>([])
  const [selectedAddrId, setSelectedAddrId]     = useState<string | null>(null)
  const [showNewForm, setShowNewForm]           = useState(false)
  const [loadingSaved, setLoadingSaved]         = useState(false)
  const [saveToAccount, setSaveToAccount]       = useState(false)

  const isLoggedIn = authStatus === 'authenticated'

  const sub        = subtotal()
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const total      = sub

  // Load saved addresses for logged-in users
  useEffect(() => {
    if (!isLoggedIn) return
    setLoadingSaved(true)
    fetch('/api/user/addresses')
      .then(r => r.json())
      .then((data: SavedAddress[]) => {
        setSavedAddresses(data)
        const def = data.find(a => a.isDefault) ?? data[0]
        if (def) {
          setSelectedAddrId(def.id)
          setAddress({ fullName: def.fullName, phone: def.phone, line1: def.line1, line2: def.line2 ?? '', city: def.city, state: def.state, pincode: def.pincode })
          setShowNewForm(false)
        } else {
          setShowNewForm(true)
        }
      })
      .catch(() => setShowNewForm(true))
      .finally(() => setLoadingSaved(false))
  }, [isLoggedIn])

  function selectSavedAddress(addr: SavedAddress) {
    setSelectedAddrId(addr.id)
    setAddress({ fullName: addr.fullName, phone: addr.phone, line1: addr.line1, line2: addr.line2 ?? '', city: addr.city, state: addr.state, pincode: addr.pincode })
    setShowNewForm(false)
    setErrors({})
  }

  function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(address)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep('review')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handlePlaceOrder() {
    setLoading(true)
    setApiError(null)
    try {
      // Optionally save new address to account
      if (isLoggedIn && showNewForm && saveToAccount) {
        await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...address, label: 'HOME', isDefault: savedAddresses.length === 0 }),
        })
      }

      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          items: items.map(i => ({ productId: i.product.id.toString(), quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.redirectUrl) {
        setApiError(data.error ?? 'Payment initiation failed. Please try again.')
        setLoading(false)
        return
      }
      clearCart()
      window.location.href = data.redirectUrl
    } catch {
      setApiError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <PageShell step={step}>
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 24, fontStyle: 'italic', color: T.deep, marginBottom: 12 }}>Your cart is empty</h2>
          <Link href="/products" style={{ display: 'inline-block', background: T.gold, color: '#fff', padding: '12px 32px', borderRadius: 2, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', marginTop: 8 }}>Browse Watches</Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell step={step}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 16px 80px' : '0 24px 60px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: isMobile ? 16 : 24, alignItems: 'flex-start' }}>

        {/* ── Left column ── */}
        <div>

          {/* Step 1: Address */}
          {step === 'address' && (
            <div>
              {/* Login nudge for guests */}
              {!isLoggedIn && authStatus !== 'loading' ? (
                <div style={{ background: T.ivory, border: `1px solid ${T.borderLight}`, borderRadius: 2, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ fontSize: 13, color: T.mid }}>
                    <strong style={{ color: T.deep }}>Have an account?</strong> Sign in to use your saved addresses.
                  </div>
                  <Link href="/login?callbackUrl=/checkout" style={{ fontSize: 12, fontWeight: 700, color: T.gold, textDecoration: 'none', whiteSpace: 'nowrap', border: `1px solid ${T.gold}`, borderRadius: 2, padding: '5px 14px' }}>
                    Sign In
                  </Link>
                </div>
              ) : null}

              {/* Saved addresses picker (logged-in) */}
              {isLoggedIn ? (
                <SectionCard title="1  Delivery Address">
                  {loadingSaved ? (
                    <div style={{ color: T.muted, fontSize: 13 }}>Loading your addresses…</div>
                  ) : (
                    <>
                      {/* Existing addresses */}
                      {savedAddresses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                          {savedAddresses.map(addr => (
                            <label
                              key={addr.id}
                              style={{
                                display: 'flex', gap: 14, padding: '14px 16px', cursor: 'pointer',
                                border: `1.5px solid ${selectedAddrId === addr.id && !showNewForm ? T.gold : T.borderLight}`,
                                borderRadius: 2,
                                background: selectedAddrId === addr.id && !showNewForm ? '#FFFDF8' : T.white,
                              }}
                            >
                              <input
                                type="radio" name="savedAddr"
                                checked={selectedAddrId === addr.id && !showNewForm}
                                onChange={() => selectSavedAddress(addr)}
                                style={{ marginTop: 2, accentColor: T.gold, flexShrink: 0 }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, background: T.goldPale, color: T.goldDark, padding: '2px 8px', borderRadius: 10, letterSpacing: '0.06em' }}>{addr.label}</span>
                                  {addr.isDefault ? <span style={{ fontSize: 10, fontWeight: 600, color: T.green }}>Default</span> : null}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.deep }}>{addr.fullName}</div>
                                <div style={{ fontSize: 12, color: T.mid, marginTop: 2, lineHeight: 1.6 }}>
                                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} – {addr.pincode}
                                </div>
                                <div style={{ fontSize: 12, color: T.muted }}>+91 {addr.phone}</div>
                              </div>
                            </label>
                          ))}

                          {/* Add new option */}
                          <label style={{ display: 'flex', gap: 14, padding: '12px 16px', cursor: 'pointer', border: `1.5px solid ${showNewForm ? T.gold : T.borderLight}`, borderRadius: 2 }}>
                            <input type="radio" name="savedAddr" checked={showNewForm} onChange={() => { setShowNewForm(true); setSelectedAddrId(null); setAddress(EMPTY_ADDRESS) }} style={{ marginTop: 2, accentColor: T.gold }} />
                            <span style={{ fontSize: 13, color: T.gold, fontWeight: 600 }}>+ Add a new address</span>
                          </label>
                        </div>
                      ) : null}

                      {/* New address form */}
                      {showNewForm ? <AddressForm address={address} setAddress={setAddress} errors={errors} isMobile={isMobile} /> : null}

                      {/* Save to account toggle (only when adding new) */}
                      {showNewForm ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.mid, cursor: 'pointer', margin: '12px 0' }}>
                          <input type="checkbox" checked={saveToAccount} onChange={e => setSaveToAccount(e.target.checked)} style={{ accentColor: T.gold }} />
                          Save this address to my account
                        </label>
                      ) : null}

                      <button
                        onClick={handleAddressSubmit}
                        style={{ marginTop: 8, height: 48, padding: '0 40px', background: T.gold, color: '#fff', border: 'none', borderRadius: 2, fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Continue to Review →
                      </button>
                    </>
                  )}
                </SectionCard>
              ) : null}

              {/* Guest address form */}
              {!isLoggedIn ? (
                <form onSubmit={handleAddressSubmit} noValidate>
                  <SectionCard title="1  Delivery Address">
                    <AddressForm address={address} setAddress={setAddress} errors={errors} isMobile={isMobile} />
                    <button
                      type="submit"
                      style={{ marginTop: 8, height: 48, padding: '0 40px', background: T.gold, color: '#fff', border: 'none', borderRadius: 2, fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Continue to Review →
                    </button>
                  </SectionCard>
                </form>
              ) : null}
            </div>
          )}

          {/* Step 2: Review & Pay */}
          {step === 'review' && (
            <div>
              {/* Address summary — editable */}
              <SectionCard title="1  Delivery Address" action={{ label: 'Change', onClick: () => setStep('address') }}>
                <div style={{ fontSize: 14, color: T.deep, lineHeight: 1.8 }}>
                  <strong>{address.fullName}</strong>&nbsp;
                  <span style={{ background: T.parchment, fontSize: 11, padding: '2px 8px', borderRadius: 10, color: T.muted, fontWeight: 500 }}>HOME</span><br />
                  {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
                  {address.city}, {address.state} – {address.pincode}<br />
                  <span style={{ color: T.muted, fontSize: 13 }}>+91 {address.phone}</span>
                </div>
              </SectionCard>

              {/* Order items */}
              <SectionCard title="2  Order Summary" style={{ marginTop: 16 }}>
                {items.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', gap: 16, paddingBottom: 16, marginBottom: 16, borderBottom: `1px solid ${T.borderLight}` }}>
                    <div style={{ width: 72, height: 72, background: T.parchment, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${T.borderLight}` }}>
                      <WatchFace dial={item.product.dial} size={56} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: T.deep, lineHeight: 1.3, marginBottom: 2 }}>{item.product.name}</div>
                      <div style={{ fontSize: 11, color: T.light }}>Qty: {item.quantity} · {item.product.material}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.deep }}>{formatPrice(item.product.price * item.quantity)}</div>
                      <div style={{ fontSize: 11, color: T.green }}>{discount(item.product.price, item.product.original)}% off</div>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, paddingTop: 4, fontSize: 15 }}>
                  <span style={{ color: T.muted }}>Total ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
                  <strong style={{ color: T.deep, fontSize: 18 }}>{formatPrice(total)}</strong>
                </div>
              </SectionCard>

              {/* Payment method */}
              <SectionCard title="3  Payment" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: `2px solid ${T.gold}`, borderRadius: 4, background: '#FFFDF8', marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#5f259f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="white" opacity="0.2"/>
                      <path d="M8 8h4.5C14.43 8 16 9.57 16 11.5S14.43 15 12.5 15H11v3H8V8zm3 5h1.5c.83 0 1.5-.67 1.5-1.5S13.33 10 12.5 10H11v3z" fill="white"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.deep }}>PhonePe</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>UPI · Cards · Net Banking · Wallets — all in one checkout</div>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.gold}`, background: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                  </div>
                </div>

                {[
                  { name: 'Credit / Debit Card', sub: 'Available via PhonePe checkout' },
                  { name: 'Net Banking', sub: 'All major banks supported' },
                  { name: 'EMI', sub: 'No-cost EMI available on select cards' },
                ].map(m => (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', border: `1px solid ${T.borderLight}`, borderRadius: 4, marginBottom: 8, opacity: 0.55, cursor: 'not-allowed' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.light}` }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.deep }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{m.sub}</div>
                    </div>
                  </div>
                ))}

                {apiError ? (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#FEF2F2', border: `1px solid ${T.red}`, borderRadius: 2, fontSize: 13, color: T.red, fontWeight: 500 }}>
                    ⚠ {apiError}
                  </div>
                ) : null}

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  style={{ marginTop: 20, width: '100%', height: 52, background: loading ? T.muted : '#5f259f', color: '#fff', border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s', fontFamily: 'inherit' }}
                >
                  {loading ? <><Spinner /> Redirecting to PhonePe…</> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Pay {formatPrice(total)} via PhonePe</>}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, fontSize: 11, color: T.muted }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Secured by PhonePe · 256-bit SSL encryption
                </div>
              </SectionCard>
            </div>
          )}
        </div>

        {/* ── Right: order summary ── */}
        <div style={{ position: isMobile ? 'static' : 'sticky', top: 80 }}>
          <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Price Details</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {[
                { label: `Price (${totalItems} item${totalItems !== 1 ? 's' : ''})`, value: formatPrice(items.reduce((s, i) => s + i.product.original * i.quantity, 0)) },
                { label: 'Discount', value: `−${formatPrice(items.reduce((s, i) => s + (i.product.original - i.product.price) * i.quantity, 0))}`, green: true },
                { label: 'Delivery', value: 'FREE', green: true },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: T.mid }}>{row.label}</span>
                  <span style={{ fontWeight: 500, color: row.green ? T.green : T.deep }}>{row.value}</span>
                </div>
              ))}
              <hr style={{ border: 'none', borderTop: `1px dashed ${T.border}`, margin: '8px 0 14px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: T.deep }}>Total Amount</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: T.deep }}>{formatPrice(total)}</span>
              </div>
              <div style={{ fontSize: 13, color: T.green, fontWeight: 600, textAlign: 'right' }}>
                You save {formatPrice(items.reduce((s, i) => s + (i.product.original - i.product.price) * i.quantity, 0))}
              </div>
            </div>
          </div>

          {/* Cart items mini */}
          <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, marginTop: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>Items in your order</div>
            {items.map(item => (
              <div key={item.product.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, background: T.parchment, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WatchFace dial={item.product.dial} size={36} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.deep, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.deep, flexShrink: 0 }}>{formatPrice(item.product.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: T.muted, lineHeight: 2 }}>
            {['🛡️  5-Year Warranty included', '📦  Free insured worldwide delivery', '↩️  30-day hassle-free returns'].map(g => (
              <div key={g}>{g}</div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

// ── Address form (shared between guest and logged-in new address) ──────────────

function AddressForm({ address, setAddress, errors, isMobile }: {
  address: Address
  setAddress: React.Dispatch<React.SetStateAction<Address>>
  errors: Partial<Record<keyof Address, string>>
  isMobile?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <Field label="Full Name *" error={errors.fullName}>
          <input type="text" placeholder="As on govt. ID" value={address.fullName} onChange={e => setAddress(a => ({ ...a, fullName: e.target.value }))} style={iStyle(!!errors.fullName)} />
        </Field>
        <Field label="Mobile Number *" error={errors.phone}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#5C4F3A', fontWeight: 500 }}>+91</span>
            <input type="tel" placeholder="10-digit mobile" value={address.phone} maxLength={10} onChange={e => setAddress(a => ({ ...a, phone: e.target.value.replace(/\D/g, '') }))} style={{ ...iStyle(!!errors.phone), paddingLeft: 44 }} />
          </div>
        </Field>
      </div>
      <Field label="Address (House No, Building, Street) *" error={errors.line1}>
        <input type="text" placeholder="Flat / House No, Building, Street, Area" value={address.line1} onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))} style={iStyle(!!errors.line1)} />
      </Field>
      <Field label="Landmark / Area (Optional)">
        <input type="text" placeholder="Near landmark, locality" value={address.line2} onChange={e => setAddress(a => ({ ...a, line2: e.target.value }))} style={iStyle(false)} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 160px', gap: 16 }}>
        <Field label="City / District *" error={errors.city}>
          <input type="text" placeholder="City" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} style={iStyle(!!errors.city)} />
        </Field>
        <Field label="State *" error={errors.state}>
          <select value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} style={{ ...iStyle(!!errors.state), color: address.state ? '#1A1410' : '#B8A99A' }}>
            <option value="">Select State</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Pincode *" error={errors.pincode}>
          <input type="text" placeholder="6 digits" value={address.pincode} maxLength={6} onChange={e => setAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))} style={iStyle(!!errors.pincode)} />
        </Field>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function iStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%', height: 42,
    border: `1.5px solid ${hasError ? '#C0392B' : 'rgba(158,127,74,0.25)'}`,
    borderRadius: 2, padding: '0 14px',
    fontSize: 13, color: '#1A1410', background: '#FFFFFF',
    outline: 'none', fontFamily: "'Raleway', sans-serif",
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  }
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#5C4F3A', letterSpacing: '0.03em' }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#C0392B', fontWeight: 500 }}>{error}</span>}
    </div>
  )
}

function PageShell({ children, step }: { children: React.ReactNode; step: Step }) {
  const { isMobile } = useBreakpoint()
  const steps = [{ key: 'address', label: 'Address' }, { key: 'review', label: 'Review & Pay' }]
  return (
    <div style={{ minHeight: '100vh', background: '#F0EBE2', fontFamily: "'Raleway', sans-serif", fontSize: 14, color: '#1A1410' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: '#FAF7F2', borderBottom: '1px solid rgba(158,127,74,0.18)', boxShadow: '0 1px 4px rgba(26,20,16,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: isMobile ? 56 : 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Link href="/" style={{ fontWeight: 600, fontSize: isMobile ? 12 : 15, letterSpacing: '0.3em', color: '#9E7F4A', textDecoration: 'none', flexShrink: 0 }}>
            AL NOOR
            {!isMobile && <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.15em', color: '#8C7B65', fontWeight: 400, marginTop: 1 }}>Horology · Geneva</span>}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {steps.map((s, i) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
                  <div style={{ width: isMobile ? 22 : 26, height: isMobile ? 22 : 26, borderRadius: '50%', background: step === s.key ? '#9E7F4A' : (i < steps.findIndex(x => x.key === step) ? '#27864A' : '#E8E0D4'), color: step === s.key || i < steps.findIndex(x => x.key === step) ? '#fff' : '#8C7B65', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                    {i < steps.findIndex(x => x.key === step) ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: step === s.key ? 700 : 400, color: step === s.key ? '#1A1410' : '#8C7B65' }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && <div style={{ width: isMobile ? 20 : 40, height: 1, background: '#E8E0D4', margin: isMobile ? '0 6px' : '0 12px' }} />}
              </div>
            ))}
          </div>
          <Link href="/cart" style={{ fontSize: isMobile ? 11 : 13, color: '#9E7F4A', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>← Cart</Link>
        </div>
      </header>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8C7B65' }}>
        <Link href="/" style={{ color: '#8C7B65', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link href="/cart" style={{ color: '#8C7B65', textDecoration: 'none' }}>Cart</Link>
        <span>›</span>
        <span style={{ color: '#1A1410', fontWeight: 500 }}>Checkout</span>
      </div>
      {children}
    </div>
  )
}

function SectionCard({ title, children, action, style: extraStyle }: { title: string; children: React.ReactNode; action?: { label: string; onClick: () => void }; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(158,127,74,0.10)', borderRadius: 2, boxShadow: '0 1px 4px rgba(26,20,16,0.06)', ...extraStyle }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(158,127,74,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1410' }}>{title}</span>
        {action ? <button onClick={action.onClick} style={{ fontSize: 13, color: '#9E7F4A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{action.label}</button> : null}
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  )
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
    </svg>
  )
}
