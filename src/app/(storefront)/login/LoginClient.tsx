'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
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

type Mode = 'login' | 'register'

function inputStyle(hasError = false): React.CSSProperties {
  return {
    width: '100%', height: 44,
    border: `1.5px solid ${hasError ? T.red : T.border}`,
    borderRadius: 2, padding: '0 14px',
    fontSize: 13, color: T.deep,
    background: T.white, outline: 'none',
    fontFamily: "'Raleway', sans-serif",
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }
}

function LoginInner() {
  const params   = useSearchParams()
  const router   = useRouter()
  const callback = params.get('callbackUrl') ?? '/profile'
  const reason   = params.get('reason')
  const { isMobile } = useBreakpoint()

  const [mode, setMode]       = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(
    reason === 'session_expired' ? 'Your session has expired. Please sign in again to continue.' : null
  )

  // Login form state
  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [regName, setRegName]         = useState('')
  const [regEmail, setRegEmail]       = useState('')
  const [regPhone, setRegPhone]       = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm]   = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signIn('credentials', {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Invalid email or password. Please try again.')
    } else {
      router.push(callback)
      router.refresh()
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (regPassword !== regConfirm) {
      setError('Passwords do not match.')
      return
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone || undefined, password: regPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Registration failed. Please try again.')
        setLoading(false)
        return
      }
      // Auto sign in after registration
      const result = await signIn('credentials', { email: regEmail, password: regPassword, redirect: false })
      setLoading(false)
      if (result?.error) {
        setSuccess('Account created! Please sign in.')
        setMode('login')
        setLoginEmail(regEmail)
      } else {
        router.push(callback)
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.parchment, fontFamily: "'Raleway', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <header style={{ background: T.ivory, borderBottom: `1px solid ${T.borderLight}`, boxShadow: T.shadowSm }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: `0 ${isMobile ? 16 : 24}px`, height: isMobile ? 56 : 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontWeight: 600, fontSize: isMobile ? 13 : 15, letterSpacing: '0.35em', color: T.gold, textDecoration: 'none' }}>
            AL NOOR
            {!isMobile && <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.15em', color: T.muted, fontWeight: 400, marginTop: 1 }}>Horology · Geneva</span>}
          </Link>
          <Link href="/products" style={{ fontSize: 13, color: T.mid, textDecoration: 'none', fontWeight: 500 }}>Browse Watches</Link>
        </div>
      </header>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 16px 96px' : '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Card */}
          <div style={{ background: T.white, borderRadius: 2, boxShadow: T.shadowMd, border: `1px solid ${T.borderLight}`, overflow: 'hidden' }}>

            {/* Logo + heading */}
            <div style={{ textAlign: 'center', padding: isMobile ? '24px 24px 20px' : '36px 40px 28px', borderBottom: `1px solid ${T.borderLight}`, background: T.ivory }}>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '0.35em', color: T.gold, marginBottom: 2 }}>AL NOOR</div>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', color: T.muted, marginBottom: 20 }}>HOROLOGY · GENEVA</div>
              <h1 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 22, fontStyle: 'italic', color: T.deep, margin: 0 }}>
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p style={{ fontSize: 13, color: T.muted, marginTop: 6, marginBottom: 0 }}>
                {mode === 'login'
                  ? 'Sign in to access your saved addresses and orders'
                  : 'Join to save addresses and track your timepieces'}
              </p>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${T.borderLight}` }}>
              {(['login', 'register'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                  style={{
                    flex: 1, height: 44, border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: mode === m ? 700 : 500,
                    color: mode === m ? T.gold : T.muted,
                    borderBottom: mode === m ? `2px solid ${T.gold}` : '2px solid transparent',
                    fontFamily: "'Raleway', sans-serif",
                    letterSpacing: '0.04em',
                    transition: 'all 0.15s',
                  }}
                >
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <div style={{ padding: isMobile ? '20px 20px 28px' : '28px 40px 36px' }}>

              {/* Alerts */}
              {error ? (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#FEF2F2', border: `1px solid ${T.red}`, borderRadius: 2, fontSize: 13, color: T.red, fontWeight: 500 }}>
                  ⚠ {error}
                </div>
              ) : null}
              {success ? (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#EBF5EF', border: `1px solid ${T.green}`, borderRadius: 2, fontSize: 13, color: T.green, fontWeight: 500 }}>
                  ✓ {success}
                </div>
              ) : null}

              {/* LOGIN FORM */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.mid, letterSpacing: '0.03em' }}>Email Address</label>
                    <input
                      type="email" placeholder="you@example.com" required
                      value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                      style={inputStyle()}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.mid, letterSpacing: '0.03em' }}>Password</label>
                    <input
                      type="password" placeholder="••••••••" required
                      value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                      style={inputStyle()}
                    />
                  </div>
                  <button
                    type="submit" disabled={loading}
                    style={{ marginTop: 4, height: 48, background: loading ? T.muted : T.gold, color: '#fff', border: 'none', borderRadius: 2, fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Raleway', sans-serif' ", transition: 'background 0.2s' }}
                  >
                    {loading ? 'Signing In…' : 'Sign In'}
                  </button>
                  <div style={{ textAlign: 'center', fontSize: 12, color: T.muted }}>
                    Don't have an account?{' '}
                    <button type="button" onClick={() => setMode('register')} style={{ color: T.gold, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                      Create one
                    </button>
                  </div>
                </form>
              )}

              {/* REGISTER FORM */}
              {mode === 'register' && (
                <form onSubmit={handleRegister} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.mid, letterSpacing: '0.03em' }}>Full Name *</label>
                    <input
                      type="text" placeholder="As on govt. ID" required
                      value={regName} onChange={e => setRegName(e.target.value)}
                      style={inputStyle()}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.mid, letterSpacing: '0.03em' }}>Email Address *</label>
                    <input
                      type="email" placeholder="you@example.com" required
                      value={regEmail} onChange={e => setRegEmail(e.target.value)}
                      style={inputStyle()}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.mid, letterSpacing: '0.03em' }}>Mobile Number (optional)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: T.mid, fontWeight: 500 }}>+91</span>
                      <input
                        type="tel" placeholder="10-digit mobile"
                        value={regPhone} maxLength={10}
                        onChange={e => setRegPhone(e.target.value.replace(/\D/g, ''))}
                        style={{ ...inputStyle(), paddingLeft: 44 }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.mid, letterSpacing: '0.03em' }}>Password *</label>
                    <input
                      type="password" placeholder="Min. 8 characters" required
                      value={regPassword} onChange={e => setRegPassword(e.target.value)}
                      style={inputStyle()}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.mid, letterSpacing: '0.03em' }}>Confirm Password *</label>
                    <input
                      type="password" placeholder="Re-enter password" required
                      value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                      style={inputStyle(regConfirm.length > 0 && regConfirm !== regPassword)}
                    />
                    {regConfirm.length > 0 && regConfirm !== regPassword ? (
                      <span style={{ fontSize: 11, color: T.red }}>Passwords don't match</span>
                    ) : null}
                  </div>
                  <button
                    type="submit" disabled={loading}
                    style={{ marginTop: 4, height: 48, background: loading ? T.muted : T.gold, color: '#fff', border: 'none', borderRadius: 2, fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Raleway', sans-serif", transition: 'background 0.2s' }}
                  >
                    {loading ? 'Creating Account…' : 'Create Account'}
                  </button>
                  <div style={{ textAlign: 'center', fontSize: 12, color: T.muted }}>
                    Already have an account?{' '}
                    <button type="button" onClick={() => setMode('login')} style={{ color: T.gold, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                      Sign in
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Guest note */}
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: T.muted }}>
            Want to check out without an account?{' '}
            <Link href="/cart" style={{ color: T.gold, fontWeight: 600, textDecoration: 'none' }}>Continue as guest →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoginClient() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0EBE2', color: '#8C7B65' }}>Loading…</div>}>
      <LoginInner />
    </Suspense>
  )
}
