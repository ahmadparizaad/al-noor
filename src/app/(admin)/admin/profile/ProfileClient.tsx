'use client'

import { useState, useTransition } from 'react'
import { updateAdminName, updateAdminEmail, updateAdminPassword } from '@/lib/actions/admin-profile'

const T = {
  card:        '#FFFFFF',
  cardAlt:     '#F8F4EE',
  deep:        '#1A1410',
  mid:         '#5C4F3A',
  muted:       '#8C7B65',
  gold:        '#9E7F4A',
  goldDark:    '#7A5C2E',
  green:       '#27864A',
  red:         '#C0392B',
  border:      'rgba(158,127,74,0.18)',
  borderFocus: 'rgba(158,127,74,0.50)',
  shadowSm:    '0 1px 4px rgba(26,20,16,0.06)',
}

const DATA = "'Inter', system-ui, sans-serif"
const UI   = "'Raleway', system-ui, sans-serif"

interface Props {
  id: string
  name: string
  email: string
  createdAt: string
}

interface FieldState {
  error: string | null
  success: boolean
}

function initField(): FieldState { return { error: null, success: false } }

function FormField({
  label, name, type = 'text', defaultValue, placeholder, required = true,
  focused, onFocus, onBlur,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  focused: boolean
  onFocus: () => void
  onBlur: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: UI, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.muted, textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          height: 40,
          padding: '0 12px',
          fontFamily: DATA,
          fontSize: 13,
          color: T.deep,
          background: T.card,
          border: `1px solid ${focused ? T.borderFocus : T.border}`,
          borderRadius: 3,
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
      />
    </div>
  )
}

function StatusBanner({ state }: { state: FieldState }) {
  if (!state.error && !state.success) return null
  return (
    <div style={{
      marginTop: 12,
      padding: '9px 14px',
      borderRadius: 3,
      fontFamily: DATA,
      fontSize: 12,
      background: state.success ? 'rgba(39,134,74,0.08)' : 'rgba(192,57,43,0.08)',
      border: `1px solid ${state.success ? T.green : T.red}`,
      color: state.success ? T.green : T.red,
    }}>
      {state.success ? 'Saved successfully.' : state.error}
    </div>
  )
}

function SaveButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        marginTop: 4,
        padding: '9px 20px',
        fontFamily: UI,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        background: pending ? T.goldDark : T.gold,
        color: '#fff',
        border: 'none',
        borderRadius: 3,
        cursor: pending ? 'not-allowed' : 'pointer',
        alignSelf: 'flex-start',
      }}
    >
      {pending ? 'Saving…' : 'Save'}
    </button>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 4,
      padding: '24px 28px',
      boxShadow: T.shadowSm,
    }}>
      <div style={{ fontFamily: DATA, fontSize: 14, fontWeight: 600, color: T.deep, marginBottom: 20 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function ProfileClient({ id, name, email, createdAt }: Props) {
  const [nameFocused, setNameFocused]       = useState<string | null>(null)
  const [emailFocused, setEmailFocused]     = useState<string | null>(null)
  const [pwFocused, setPwFocused]           = useState<string | null>(null)

  const [nameState, setNameState]           = useState<FieldState>(initField())
  const [emailState, setEmailState]         = useState<FieldState>(initField())
  const [pwState, setPwState]               = useState<FieldState>(initField())

  const [namePending, startName]            = useTransition()
  const [emailPending, startEmail]          = useTransition()
  const [pwPending, startPw]                = useTransition()

  const joinedDate = new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : email[0].toUpperCase()

  function handleName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startName(async () => {
      const res = await updateAdminName(fd)
      setNameState({ error: res.error ?? null, success: !!res.success })
    })
  }

  function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startEmail(async () => {
      const res = await updateAdminEmail(fd)
      setEmailState({ error: res.error ?? null, success: !!res.success })
    })
  }

  function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startPw(async () => {
      const res = await updateAdminPassword(fd)
      setPwState({ error: res.error ?? null, success: !!res.success })
      if (res.success) (e.target as HTMLFormElement).reset()
    })
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: DATA, fontSize: 24, color: T.deep, fontWeight: 500, marginBottom: 4 }}>
          My Profile
        </div>
        <div style={{ fontFamily: DATA, fontSize: 13, color: T.muted }}>
          Manage your account details and password.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Identity card */}
        <div style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          padding: '28px 20px',
          boxShadow: T.shadowSm,
          textAlign: 'center',
        }}>
          {/* Avatar */}
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: T.gold,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: UI,
            fontSize: 24,
            fontWeight: 700,
            margin: '0 auto 16px',
          }}>
            {initials}
          </div>
          <div style={{ fontFamily: DATA, fontSize: 15, fontWeight: 600, color: T.deep, marginBottom: 4 }}>
            {name || '—'}
          </div>
          <div style={{ fontFamily: DATA, fontSize: 12, color: T.muted, marginBottom: 16, wordBreak: 'break-all' }}>
            {email}
          </div>
          <div style={{
            display: 'inline-block',
            padding: '3px 10px',
            background: 'rgba(158,127,74,0.10)',
            border: `1px solid rgba(158,127,74,0.25)`,
            borderRadius: 2,
            fontFamily: UI,
            fontSize: 10,
            letterSpacing: '0.12em',
            color: T.gold,
            fontWeight: 600,
            textTransform: 'uppercase',
          }}>
            Admin
          </div>
          <div style={{ marginTop: 20, fontFamily: DATA, fontSize: 11, color: T.muted }}>
            Member since<br />
            <span style={{ color: T.mid }}>{joinedDate}</span>
          </div>
        </div>

        {/* Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Display name */}
          <SectionCard title="Display Name">
            <form onSubmit={handleName} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FormField
                label="Full name"
                name="name"
                defaultValue={name}
                placeholder="Your name"
                focused={nameFocused === 'name'}
                onFocus={() => setNameFocused('name')}
                onBlur={() => setNameFocused(null)}
              />
              <SaveButton pending={namePending} />
              <StatusBanner state={nameState} />
            </form>
          </SectionCard>

          {/* Email */}
          <SectionCard title="Email Address">
            <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FormField
                label="New email"
                name="email"
                type="email"
                defaultValue={email}
                placeholder="admin@al-noor.co"
                focused={emailFocused === 'email'}
                onFocus={() => setEmailFocused('email')}
                onBlur={() => setEmailFocused(null)}
              />
              <FormField
                label="Confirm with current password"
                name="currentPassword"
                type="password"
                placeholder="••••••••"
                focused={emailFocused === 'epw'}
                onFocus={() => setEmailFocused('epw')}
                onBlur={() => setEmailFocused(null)}
              />
              <div style={{ fontFamily: DATA, fontSize: 11, color: T.muted }}>
                You&apos;ll need to sign in again after changing your email.
              </div>
              <SaveButton pending={emailPending} />
              <StatusBanner state={emailState} />
            </form>
          </SectionCard>

          {/* Password */}
          <SectionCard title="Change Password">
            <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FormField
                label="Current password"
                name="currentPassword"
                type="password"
                placeholder="••••••••"
                focused={pwFocused === 'current'}
                onFocus={() => setPwFocused('current')}
                onBlur={() => setPwFocused(null)}
              />
              <FormField
                label="New password"
                name="newPassword"
                type="password"
                placeholder="Min. 8 characters"
                focused={pwFocused === 'new'}
                onFocus={() => setPwFocused('new')}
                onBlur={() => setPwFocused(null)}
              />
              <FormField
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                focused={pwFocused === 'confirm'}
                onFocus={() => setPwFocused('confirm')}
                onBlur={() => setPwFocused(null)}
              />
              <SaveButton pending={pwPending} />
              <StatusBanner state={pwState} />
            </form>
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
