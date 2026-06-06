'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
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
  border:      'rgba(158,127,74,0.25)',
  borderLight: 'rgba(158,127,74,0.10)',
  shadowSm:    '0 1px 4px rgba(26,20,16,0.06)',
  shadowMd:    '0 4px 20px rgba(26,20,16,0.10)',
  red:         '#C0392B',
  green:       '#27864A',
}

interface SavedAddress {
  id: string
  label: string
  fullName: string
  phone: string
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
]

const EMPTY_FORM = { label: 'HOME' as 'HOME'|'WORK'|'OTHER', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false }

function inputStyle(hasError = false): React.CSSProperties {
  return {
    width: '100%', height: 42, border: `1.5px solid ${hasError ? T.red : T.border}`,
    borderRadius: 2, padding: '0 14px', fontSize: 13, color: T.deep,
    background: T.white, outline: 'none', fontFamily: "'Raleway', sans-serif",
    boxSizing: 'border-box',
  }
}

function validate(f: typeof EMPTY_FORM) {
  const e: Partial<Record<keyof typeof EMPTY_FORM, string>> = {}
  if (!f.fullName.trim() || f.fullName.trim().length < 2) e.fullName = 'Enter full name'
  if (!/^[6-9]\d{9}$/.test(f.phone))                     e.phone    = 'Enter valid 10-digit mobile'
  if (!f.line1.trim() || f.line1.trim().length < 5)       e.line1    = 'Enter complete address'
  if (!f.city.trim())                                     e.city     = 'Enter city'
  if (!f.state)                                           e.state    = 'Select state'
  if (!/^\d{6}$/.test(f.pincode))                        e.pincode  = 'Enter 6-digit pincode'
  return e
}

export function ProfileClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isMobile } = useBreakpoint()

  const [addresses, setAddresses]   = useState<SavedAddress[]>([])
  const [loadingAddr, setLoadingAddr] = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [errors, setErrors]         = useState<Partial<Record<keyof typeof EMPTY_FORM, string>>>({})
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)

  const fetchAddresses = useCallback(async () => {
    setLoadingAddr(true)
    try {
      const res  = await fetch('/api/user/addresses')
      const data = await res.json()
      if (res.ok) setAddresses(data)
    } finally {
      setLoadingAddr(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/account')
    if (status === 'authenticated')  fetchAddresses()
  }, [status, router, fetchAddresses])

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSaving(true)
    setFormError(null)
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error ?? 'Failed to save address'); setSaving(false); return }
      await fetchAddresses()
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this address?')) return
    await fetch(`/api/user/addresses/${id}`, { method: 'DELETE' })
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/user/addresses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    })
    await fetchAddresses()
  }

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
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: T.ivory, borderBottom: `1px solid ${T.borderLight}`, boxShadow: T.shadowSm }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: `0 ${isMobile ? 16 : 24}px`, height: isMobile ? 56 : 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontWeight: 600, fontSize: isMobile ? 13 : 15, letterSpacing: '0.35em', color: T.gold, textDecoration: 'none' }}>
            AL NOOR
            {!isMobile && <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.15em', color: T.muted, fontWeight: 400, marginTop: 1 }}>Horology · Geneva</span>}
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 24 }}>
            {!isMobile && <Link href="/products" style={{ fontSize: 13, color: T.mid, textDecoration: 'none', fontWeight: 500 }}>All Watches</Link>}
            {!isMobile && <Link href="/orders" style={{ fontSize: 13, color: T.mid, textDecoration: 'none', fontWeight: 500 }}>My Orders</Link>}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
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
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '12px 16px 96px' : '0 24px 60px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr', gap: isMobile ? 16 : 24, alignItems: 'flex-start' }}>

        {/* ── Sidebar ── */}
        {!isMobile && <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, overflow: 'hidden' }}>
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
            { label: 'My Profile',   href: '/account',      active: true },
            { label: 'My Orders',    href: '/orders',       active: false },
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
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{ width: '100%', padding: '13px 20px', textAlign: 'left', fontSize: 13, color: T.red, fontWeight: 500, background: 'none', border: 'none', borderLeft: '3px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Sign Out
          </button>
        </div>}

        {/* ── Main content ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Profile info card */}
          <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm }}>
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.deep }}>Profile Information</span>
            </div>
            <div style={{ padding: isMobile ? '16px' : '20px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
              {[
                { label: 'Full Name',  value: user?.name ?? '—' },
                { label: 'Email',      value: user?.email ?? '—' },
                { label: 'Role',       value: user?.role === 'admin' ? 'Administrator' : 'Customer' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 14, color: T.deep }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved addresses card */}
          <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm }}>
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.deep }}>Saved Addresses</span>
              {!showForm ? (
                <button
                  onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setErrors({}); setFormError(null) }}
                  style={{ fontSize: 13, color: T.gold, fontWeight: 600, background: 'none', border: `1px solid ${T.gold}`, borderRadius: 2, padding: '5px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  + Add New
                </button>
              ) : null}
            </div>

            <div style={{ padding: '20px 24px' }}>

              {/* Add address form */}
              {showForm && (
                <form onSubmit={handleSaveAddress} noValidate style={{ background: T.ivory, border: `1px solid ${T.borderLight}`, borderRadius: 2, padding: '20px', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.deep, marginBottom: 16 }}>New Address</div>

                  {formError && (
                    <div style={{ marginBottom: 12, padding: '9px 12px', background: '#FEF2F2', border: `1px solid ${T.red}`, borderRadius: 2, fontSize: 12, color: T.red }}>
                      ⚠ {formError}
                    </div>
                  )}

                  {/* Label selector */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {(['HOME', 'WORK', 'OTHER'] as const).map(l => (
                      <button
                        key={l} type="button"
                        onClick={() => setForm(f => ({ ...f, label: l }))}
                        style={{
                          padding: '5px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                          border: `1.5px solid ${form.label === l ? T.gold : T.border}`,
                          background: form.label === l ? T.goldPale : T.white,
                          color: form.label === l ? T.goldDark : T.muted,
                          borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: T.mid }}>Full Name *</label>
                      <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} style={inputStyle(!!errors.fullName)} placeholder="As on govt. ID" />
                      {errors.fullName && <span style={{ fontSize: 11, color: T.red }}>{errors.fullName}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: T.mid }}>Mobile *</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: T.mid }}>+91</span>
                        <input type="tel" value={form.phone} maxLength={10} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} style={{ ...inputStyle(!!errors.phone), paddingLeft: 40 }} placeholder="10-digit" />
                      </div>
                      {errors.phone && <span style={{ fontSize: 11, color: T.red }}>{errors.phone}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.mid }}>Address Line 1 *</label>
                    <input type="text" value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} style={inputStyle(!!errors.line1)} placeholder="Flat / House, Building, Street" />
                    {errors.line1 && <span style={{ fontSize: 11, color: T.red }}>{errors.line1}</span>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.mid }}>Landmark / Area (optional)</label>
                    <input type="text" value={form.line2} onChange={e => setForm(f => ({ ...f, line2: e.target.value }))} style={inputStyle()} placeholder="Near landmark, locality" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 130px', gap: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: T.mid }}>City *</label>
                      <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle(!!errors.city)} placeholder="City" />
                      {errors.city && <span style={{ fontSize: 11, color: T.red }}>{errors.city}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: T.mid }}>State *</label>
                      <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} style={{ ...inputStyle(!!errors.state), color: form.state ? T.deep : T.light }}>
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && <span style={{ fontSize: 11, color: T.red }}>{errors.state}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: T.mid }}>Pincode *</label>
                      <input type="text" value={form.pincode} maxLength={6} onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))} style={inputStyle(!!errors.pincode)} placeholder="6 digits" />
                      {errors.pincode && <span style={{ fontSize: 11, color: T.red }}>{errors.pincode}</span>}
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.mid, cursor: 'pointer', marginBottom: 16 }}>
                    <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} style={{ accentColor: T.gold }} />
                    Set as default address
                  </label>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" disabled={saving} style={{ height: 40, padding: '0 28px', background: saving ? T.muted : T.gold, color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      {saving ? 'Saving…' : 'Save Address'}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setErrors({}) }} style={{ height: 40, padding: '0 20px', background: 'none', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Address list */}
              {loadingAddr ? (
                <div style={{ color: T.muted, fontSize: 13 }}>Loading addresses…</div>
              ) : addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: T.muted }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>No saved addresses</div>
                  <div style={{ fontSize: 12 }}>Add a delivery address to speed up checkout</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {addresses.map(addr => (
                    <div key={addr.id} style={{ border: `1.5px solid ${addr.isDefault ? T.gold : T.borderLight}`, borderRadius: 2, padding: '16px 20px', position: 'relative', background: addr.isDefault ? '#FFFDF8' : T.white }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', background: T.goldPale, color: T.goldDark, padding: '2px 8px', borderRadius: 10 }}>{addr.label}</span>
                        {addr.isDefault && (
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', background: '#EBF5EF', color: T.green, padding: '2px 8px', borderRadius: 10 }}>DEFAULT</span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.deep, marginBottom: 4 }}>{addr.fullName}</div>
                      <div style={{ fontSize: 13, color: T.mid, lineHeight: 1.7 }}>
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                        {addr.city}, {addr.state} – {addr.pincode}<br />
                        <span style={{ color: T.muted }}>+91 {addr.phone}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        {!addr.isDefault ? (
                          <button onClick={() => handleSetDefault(addr.id)} style={{ fontSize: 12, color: T.gold, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                            Set as Default
                          </button>
                        ) : null}
                        <button onClick={() => handleDelete(addr.id)} style={{ fontSize: 12, color: T.red, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
