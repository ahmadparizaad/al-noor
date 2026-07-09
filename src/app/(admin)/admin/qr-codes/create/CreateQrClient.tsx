'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createQrCode } from '@/lib/actions/qr'

const T = {
  card: '#FFFFFF',
  cardAlt: '#F8F4EE',
  deep: '#1A1410',
  mid: '#5C4F3A',
  muted: '#8C7B65',
  gold: '#9E7F4A',
  red: '#C0392B',
  border: 'rgba(158,127,74,0.18)',
  shadowSm: '0 1px 4px rgba(26,20,16,0.06)',
}

const DATA = "'Inter', system-ui, sans-serif"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

export default function CreateQrClient() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [destination, setDestination] = useState('')
  const [qrColor, setQrColor] = useState('#9E7F4A')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(slugify(value))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const qr = await createQrCode({ name, slug, destination, qrColor })
        router.push(`/admin/qr-codes/${qr.id}`)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to create QR code')
      }
    })
  }

  return (
    <div style={{ fontFamily: DATA, maxWidth: '560px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '24px', color: T.deep, fontWeight: 500, marginBottom: '4px' }}>
          New QR Code
        </div>
        <div style={{ fontSize: '13px', color: T.muted }}>
          Create a dynamic QR code — its destination can be changed anytime without reprinting.
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: T.card,
          borderRadius: '6px',
          border: `1px solid ${T.border}`,
          boxShadow: T.shadowSm,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: T.mid, marginBottom: '6px' }}>
            Name
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="e.g. Packaging Insert — Spring Collection"
            style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${T.border}`, borderRadius: '4px', outline: 'none', fontFamily: DATA, color: T.deep }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: T.mid, marginBottom: '6px' }}>
            Slug
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: T.muted, fontFamily: 'monospace' }}>/r/</span>
            <input
              type="text"
              required
              maxLength={50}
              value={slug}
              onChange={e => handleSlugChange(e.target.value)}
              placeholder="spring-collection"
              style={{ flex: 1, padding: '10px 12px', fontSize: '13px', border: `1px solid ${T.border}`, borderRadius: '4px', outline: 'none', fontFamily: 'monospace', color: T.deep }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: T.mid, marginBottom: '6px' }}>
            Destination URL
          </label>
          <input
            type="url"
            required
            maxLength={500}
            value={destination}
            onChange={e => setDestination(e.target.value)}
            placeholder="https://alnoor.co/products/some-watch"
            style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: `1px solid ${T.border}`, borderRadius: '4px', outline: 'none', fontFamily: DATA, color: T.deep }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: T.mid, marginBottom: '6px' }}>
            QR Color
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="color"
              value={qrColor}
              onChange={e => setQrColor(e.target.value)}
              style={{ width: '40px', height: '32px', border: `1px solid ${T.border}`, borderRadius: '4px', cursor: 'pointer', padding: 0 }}
            />
            <input
              type="text"
              value={qrColor}
              onChange={e => setQrColor(e.target.value)}
              maxLength={7}
              style={{ width: '100px', padding: '8px 10px', fontSize: '13px', border: `1px solid ${T.border}`, borderRadius: '4px', outline: 'none', fontFamily: 'monospace', color: T.deep }}
            />
          </div>
        </div>

        {error && (
          <div style={{ fontSize: '12px', color: T.red, background: 'rgba(192,57,43,0.06)', padding: '10px 12px', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: T.gold,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Generating…' : 'Create QR Code'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/qr-codes')}
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: 'transparent',
              border: `1px solid ${T.border}`,
              borderRadius: '4px',
              color: T.mid,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
