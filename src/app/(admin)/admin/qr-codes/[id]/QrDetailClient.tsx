'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AdminQrCode, QrAnalytics } from '@/types/admin'
import { updateQrCode, deleteQrCode } from '@/lib/actions/qr'

interface QrDetailClientProps {
  qrCode: AdminQrCode
  analytics: QrAnalytics
}

const T = {
  card: '#FFFFFF',
  cardAlt: '#F8F4EE',
  deep: '#1A1410',
  mid: '#5C4F3A',
  muted: '#8C7B65',
  gold: '#9E7F4A',
  green: '#27864A',
  red: '#C0392B',
  border: 'rgba(158,127,74,0.18)',
  shadowSm: '0 1px 4px rgba(26,20,16,0.06)',
}

const DATA = "'Inter', system-ui, sans-serif"

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '18px 20px', boxShadow: T.shadowSm, flex: 1 }}>
      <div style={{ fontSize: '11px', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', color: T.deep, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function BreakdownList({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  const max = Math.max(1, ...items.map(i => i.count))
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '20px', boxShadow: T.shadowSm, flex: 1 }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: T.deep, marginBottom: '14px' }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ fontSize: '12px', color: T.muted }}>No data yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map(item => (
            <div key={item.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: T.mid, marginBottom: '4px' }}>
                <span>{item.name}</span>
                <span style={{ fontWeight: 600, color: T.deep }}>{item.count}</span>
              </div>
              <div style={{ height: '6px', background: T.cardAlt, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(item.count / max) * 100}%`, background: T.gold, borderRadius: '3px' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function QrDetailClient({ qrCode, analytics }: QrDetailClientProps) {
  const router = useRouter()
  const [destination, setDestination] = useState(qrCode.destination)
  const [qrColor, setQrColor] = useState(qrCode.qrColor)
  const [isActive, setIsActive] = useState(qrCode.isActive)
  const [current, setCurrent] = useState(qrCode)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const dailyMax = Math.max(1, ...analytics.dailyScans.map(d => d.count))

  function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        const updated = await updateQrCode(qrCode.id, { destination, qrColor, isActive })
        setCurrent(updated)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to update QR code')
      }
    })
  }

  function handleDelete() {
    if (!confirm('Delete this QR code? This will permanently remove it and its scan history.')) return
    startTransition(async () => {
      await deleteQrCode(qrCode.id)
      router.push('/admin/qr-codes')
    })
  }

  return (
    <div style={{ fontFamily: DATA, maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '24px', color: T.deep, fontWeight: 500, marginBottom: '4px' }}>{current.name}</div>
        <div style={{ fontSize: '12px', color: T.muted, fontFamily: 'monospace' }}>/r/{current.slug}</div>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '20px', boxShadow: T.shadowSm, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.qrPngUrl} alt={current.name} width={180} height={180} style={{ borderRadius: '4px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href={current.qrPngUrl} download style={{ fontSize: '12px', color: T.gold, textDecoration: 'none' }}>Download PNG</a>
            <a href={current.qrSvgUrl} download style={{ fontSize: '12px', color: T.gold, textDecoration: 'none' }}>Download SVG</a>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '280px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '20px', boxShadow: T.shadowSm, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: T.mid, marginBottom: '6px' }}>Destination URL</label>
            <input
              type="url"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: `1px solid ${T.border}`, borderRadius: '4px', outline: 'none', fontFamily: DATA, color: T.deep }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: T.mid, marginBottom: '6px' }}>QR Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={qrColor} onChange={e => setQrColor(e.target.value)} style={{ width: '36px', height: '30px', border: `1px solid ${T.border}`, borderRadius: '4px', cursor: 'pointer', padding: 0 }} />
              <input type="text" value={qrColor} onChange={e => setQrColor(e.target.value)} maxLength={7} style={{ width: '90px', padding: '7px 10px', fontSize: '13px', border: `1px solid ${T.border}`, borderRadius: '4px', outline: 'none', fontFamily: 'monospace', color: T.deep }} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: T.mid, cursor: 'pointer' }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            Active (scans redirect to destination)
          </label>

          {error && (
            <div style={{ fontSize: '12px', color: T.red, background: 'rgba(192,57,43,0.06)', padding: '8px 10px', borderRadius: '4px' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleSave}
              disabled={isPending}
              style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 500, backgroundColor: T.gold, color: '#fff', border: 'none', borderRadius: '4px', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 500, backgroundColor: 'transparent', border: `1px solid ${T.border}`, borderRadius: '4px', color: T.red, cursor: isPending ? 'not-allowed' : 'pointer' }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div style={{ fontSize: '16px', fontWeight: 600, color: T.deep, marginBottom: '16px' }}>Scan Analytics</div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <KpiCard label="Total Scans" value={analytics.totalScans.toLocaleString('en-IN')} />
        <KpiCard label="Today" value={analytics.todayScans.toLocaleString('en-IN')} />
        <KpiCard label="Mobile" value={analytics.deviceBreakdown.mobile.toLocaleString('en-IN')} />
        <KpiCard label="Desktop" value={analytics.deviceBreakdown.desktop.toLocaleString('en-IN')} />
        <KpiCard label="Tablet" value={analytics.deviceBreakdown.tablet.toLocaleString('en-IN')} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '20px', boxShadow: T.shadowSm, marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: T.deep, marginBottom: '14px' }}>Scans — Last 30 Days</div>
        {analytics.dailyScans.length === 0 ? (
          <div style={{ fontSize: '12px', color: T.muted }}>No scans yet</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
            {analytics.dailyScans.map(d => (
              <div key={d.date} title={`${d.date}: ${d.count}`} style={{ flex: 1, background: T.gold, borderRadius: '2px 2px 0 0', height: `${(d.count / dailyMax) * 100}%`, minHeight: '2px' }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <BreakdownList title="Browsers" items={analytics.browserBreakdown.map(b => ({ name: b.name, count: b.count }))} />
        <BreakdownList title="Operating Systems" items={analytics.osBreakdown.map(o => ({ name: o.name, count: o.count }))} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '20px', boxShadow: T.shadowSm }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: T.deep, marginBottom: '14px' }}>Top Locations</div>
        {analytics.locations.length === 0 ? (
          <div style={{ fontSize: '12px', color: T.muted }}>No location data yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {analytics.locations.map((loc, i) => (
                <tr key={`${loc.city}-${loc.country}-${i}`} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '8px 0', fontSize: '12px', color: T.mid }}>{loc.city}, {loc.country}</td>
                  <td style={{ padding: '8px 0', fontSize: '12px', color: T.deep, fontWeight: 600, textAlign: 'right' }}>{loc.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
