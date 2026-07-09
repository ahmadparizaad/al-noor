'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AdminQrCode } from '@/types/admin'
import { deleteQrCode } from '@/lib/actions/qr'

interface QrCodesClientProps {
  qrCodes: AdminQrCode[]
}

const T = {
  card: '#FFFFFF',
  cardAlt: '#F8F4EE',
  deep: '#1A1410',
  mid: '#5C4F3A',
  muted: '#8C7B65',
  light: '#B8A99A',
  gold: '#9E7F4A',
  goldDark: '#7A5C2E',
  green: '#27864A',
  red: '#C0392B',
  border: 'rgba(158,127,74,0.18)',
  shadowSm: '0 1px 4px rgba(26,20,16,0.06)',
}

const DATA = "'Inter', system-ui, sans-serif"

export default function QrCodesClient({ qrCodes }: QrCodesClientProps) {
  const [list, setList] = useState<AdminQrCode[]>(qrCodes)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = list.filter(
    qr =>
      qr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qr.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qr.destination.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function handleDelete(id: string) {
    if (!confirm('Delete this QR code? This will permanently remove it and its scan history.')) return

    setDeletingId(id)
    startTransition(async () => {
      await deleteQrCode(id)
      setList(prev => prev.filter(qr => qr.id !== id))
      setDeletingId(null)
    })
  }

  return (
    <div style={{ fontFamily: DATA }}>
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '24px', color: T.deep, fontWeight: 500, marginBottom: '4px' }}>
            QR Codes
          </div>
          <div style={{ fontSize: '13px', color: T.muted }}>
            Manage dynamic QR codes — change destinations without reprinting.
          </div>
        </div>
        <Link
          href="/admin/qr-codes/create"
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: T.gold,
            color: '#fff',
            borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          + New QR Code
        </Link>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by name, slug, or destination..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '360px',
            padding: '10px 14px',
            fontSize: '13px',
            border: `1px solid ${T.border}`,
            borderRadius: '4px',
            outline: 'none',
            fontFamily: DATA,
            color: T.deep,
          }}
        />
      </div>

      <div style={{ background: T.card, borderRadius: '6px', border: `1px solid ${T.border}`, boxShadow: T.shadowSm, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.cardAlt, borderBottom: `1px solid ${T.border}` }}>
              {['QR', 'Name', 'Slug', 'Destination', 'Scans', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(qr => (
              <tr key={qr.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '12px 16px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr.qrPngUrl} alt={qr.name} width={40} height={40} style={{ borderRadius: '3px', border: `1px solid ${T.border}` }} />
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: T.deep, fontWeight: 500 }}>
                  <Link href={`/admin/qr-codes/${qr.id}`} style={{ color: T.deep, textDecoration: 'none' }}>
                    {qr.name}
                  </Link>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: T.muted, fontFamily: 'monospace' }}>
                  /r/{qr.slug}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: T.mid, maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={qr.destination}>
                  {qr.destination}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: T.deep, fontWeight: 600 }}>
                  {qr.scanCount.toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '3px',
                    color: qr.isActive ? T.green : T.red,
                    background: qr.isActive ? 'rgba(39,134,74,0.08)' : 'rgba(192,57,43,0.08)',
                  }}>
                    {qr.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleDelete(qr.id)}
                    disabled={isPending && deletingId === qr.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: T.red,
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: DATA,
                    }}
                  >
                    {isPending && deletingId === qr.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', fontSize: '13px', color: T.muted }}>
            No QR codes found.
          </div>
        )}
      </div>
    </div>
  )
}
