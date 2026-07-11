'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

const T = {
  sidebar:    '#18120C',
  canvas:     '#1F1710',
  card:       '#251D15',
  gold:       '#9E7F4A',
  goldDark:   '#7A5C2E',
  goldPale:   '#EDD9B8',
  inverse:    '#FAF7F2',
  muted:      '#8C7B65',
  light:      '#B8A99A',
  border:     'rgba(158,127,74,0.20)',
  borderFocus:'rgba(158,127,74,0.60)',
  red:        '#C0392B',
  inputBg:    '#160F09',
}

const UI = "'Raleway', system-ui, sans-serif"

function AdminLoginInner() {
  const params   = useSearchParams()
  const router   = useRouter()
  const callback = params.get('callbackUrl') ?? '/admin/dashboard'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [focused, setFocused]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('Invalid credentials.')
    } else {
      router.push(callback)
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: T.canvas,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: UI,
    }}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 24px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 13, letterSpacing: '0.3em', color: T.gold, fontWeight: 600, marginBottom: 4 }}>
            AL NOOR
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', color: T.muted }}>
            ADMIN
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 3,
          padding: '32px 28px 36px',
        }}>
          <h1 style={{
            fontSize: 15,
            fontWeight: 600,
            color: T.inverse,
            margin: '0 0 24px',
            letterSpacing: '0.04em',
          }}>
            Sign in
          </h1>

          {error && (
            <div style={{
              marginBottom: 20,
              padding: '10px 14px',
              background: 'rgba(192,57,43,0.12)',
              border: `1px solid ${T.red}`,
              borderRadius: 2,
              fontSize: 12,
              color: T.red,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                required
                placeholder="admin@al-noorluxury.com"
                style={{
                  height: 42,
                  background: T.inputBg,
                  border: `1px solid ${focused === 'email' ? T.borderFocus : T.border}`,
                  borderRadius: 2,
                  padding: '0 12px',
                  fontSize: 13,
                  color: T.inverse,
                  outline: 'none',
                  fontFamily: UI,
                  transition: 'border-color 0.15s',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                required
                placeholder="••••••••"
                style={{
                  height: 42,
                  background: T.inputBg,
                  border: `1px solid ${focused === 'password' ? T.borderFocus : T.border}`,
                  borderRadius: 2,
                  padding: '0 12px',
                  fontSize: 13,
                  color: T.inverse,
                  outline: 'none',
                  fontFamily: UI,
                  transition: 'border-color 0.15s',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                height: 44,
                background: loading ? T.goldDark : T.gold,
                color: '#fff',
                border: 'none',
                borderRadius: 2,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: UI,
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Back to store */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ fontSize: 11, color: T.muted, textDecoration: 'none', letterSpacing: '0.04em' }}>
            ← Back to store
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginClient() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1F1710' }} />}>
      <AdminLoginInner />
    </Suspense>
  )
}
