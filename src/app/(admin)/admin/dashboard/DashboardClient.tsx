'use client'

import { useState } from 'react'
import { AdminOrder, AdminProduct } from '@/types/admin'
import { formatPrice } from '@/lib/products-data'

interface DashboardClientProps {
  orders: AdminOrder[]
  products: AdminProduct[]
  userName: string
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
  goldPale: '#EDD9B8',
  green: '#27864A',
  red: '#C0392B',
  orange: '#D97706',
  border: 'rgba(158,127,74,0.18)',
  shadowSm: '0 1px 4px rgba(26,20,16,0.06)',
  shadowMd: '0 4px 16px rgba(26,20,16,0.09)',
}

const DATA = "'Inter', system-ui, sans-serif"

const STATUS_COLORS: Record<string, string> = {
  pending: '#D97706',
  confirmed: '#9E7F4A',
  processing: '#1a3a5c',
  shipped: '#27864A',
  delivered: '#5C4F3A',
  cancelled: '#C0392B',
  refunded: '#8C7B65',
}

type Preset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'this_year', label: 'This Year' },
  { key: 'last_year', label: 'Last Year' },
]

function getPresetRange(preset: Preset): { from: Date; to: Date } {
  const now = new Date()
  const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const eod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

  switch (preset) {
    case 'today':
      return { from: sod(now), to: eod(now) }
    case 'yesterday': {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      return { from: sod(y), to: eod(y) }
    }
    case 'this_week': {
      const mon = new Date(now)
      mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      return { from: sod(mon), to: eod(now) }
    }
    case 'last_week': {
      const thisMonday = new Date(now)
      thisMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      const lastMon = new Date(thisMonday)
      lastMon.setDate(thisMonday.getDate() - 7)
      const lastSun = new Date(thisMonday)
      lastSun.setDate(thisMonday.getDate() - 1)
      return { from: sod(lastMon), to: eod(lastSun) }
    }
    case 'this_month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: eod(now) }
    case 'last_month': {
      const firstOfThis = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastOfLast = new Date(firstOfThis)
      lastOfLast.setDate(lastOfLast.getDate() - 1)
      return {
        from: new Date(lastOfLast.getFullYear(), lastOfLast.getMonth(), 1),
        to: eod(lastOfLast),
      }
    }
    case 'this_year':
      return { from: new Date(now.getFullYear(), 0, 1), to: eod(now) }
    case 'last_year':
      return {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
      }
  }
}

const PRESET_LABEL: Record<Preset, string> = {
  today: "Today's",
  yesterday: "Yesterday's",
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_year: 'This Year',
  last_year: 'Last Year',
}

export default function DashboardClient({ orders, products, userName }: DashboardClientProps) {
  const [preset, setPreset] = useState<Preset>('today')

  const { from, to } = getPresetRange(preset)
  const periodOrders = orders.filter(o => {
    const d = new Date(o.createdAt)
    return d >= from && d <= to
  })

  const periodOrderCount = periodOrders.length
  const pendingShipments = orders.filter(o =>
    ['pending', 'confirmed', 'processing'].includes(o.status)
  ).length
  const periodRevenue = periodOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalInr, 0)
  const activeListings = products.filter(p => p.isActive).length

  const recentOrders = orders.slice(0, 5)
  const label = PRESET_LABEL[preset]

  const KPICard = ({
    label: cardLabel,
    value,
    isPrice = false,
    subtitle,
  }: {
    label: string
    value: string | number
    isPrice?: boolean
    subtitle?: string
  }) => (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: '4px',
        padding: '24px',
        boxShadow: T.shadowSm,
      }}
    >
      <div
        style={{
          fontFamily: DATA,
          fontSize: '11px',
          letterSpacing: '0.08em',
          color: T.muted,
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        {cardLabel}
      </div>
      <div
        style={{
          fontFamily: DATA,
          fontSize: '28px',
          fontVariantNumeric: 'tabular-nums',
          color: isPrice ? T.gold : T.deep,
          fontWeight: 600,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div style={{ fontFamily: DATA, fontSize: '11px', color: T.light, marginTop: '6px' }}>
          {subtitle}
        </div>
      )}
    </div>
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: DATA,
              fontSize: '24px',
              color: T.deep,
              marginBottom: '4px',
              fontWeight: 500,
            }}
          >
            {greeting}, {userName.split(' ')[0]}
          </div>
          <div style={{ fontFamily: DATA, fontSize: '13px', color: T.muted }}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Preset pill buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              style={{
                fontFamily: DATA,
                fontSize: '12px',
                padding: '5px 12px',
                borderRadius: '20px',
                border: `1px solid ${preset === p.key ? T.gold : T.border}`,
                background: preset === p.key ? T.goldPale : 'transparent',
                color: preset === p.key ? T.goldDark : T.mid,
                cursor: 'pointer',
                fontWeight: preset === p.key ? 600 : 400,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        <KPICard label={`${label} Orders`} value={periodOrderCount} />
        <KPICard
          label="Pending Shipments"
          value={pendingShipments}
          subtitle="All time · unshipped"
        />
        <KPICard
          label={`${label} Revenue`}
          value={formatPrice(periodRevenue)}
          isPrice={true}
          subtitle="Delivered orders only"
        />
        <KPICard label="Active Listings" value={activeListings} subtitle="Products in catalogue" />
      </div>

      {/* Recent orders section */}
      <div style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontFamily: DATA,
            fontSize: '16px',
            color: T.deep,
            marginBottom: '16px',
            fontWeight: 500,
          }}
        >
          Recent Orders
        </div>

        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: T.shadowSm,
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: DATA,
              fontSize: '13px',
            }}
          >
            <thead>
              <tr style={{ background: T.cardAlt, borderBottom: `1px solid ${T.border}` }}>
                {['Ref', 'Customer', 'Watch', 'Amount', 'Status', 'Date'].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: i === 3 ? 'right' : 'left',
                      color: T.muted,
                      fontWeight: 500,
                      fontSize: '11px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, idx) => (
                <tr
                  key={order.id}
                  style={{
                    background: idx % 2 === 0 ? T.card : T.cardAlt,
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <td
                    style={{
                      padding: '12px 16px',
                      color: T.muted,
                      fontFamily: "'Courier New', monospace",
                      fontSize: '12px',
                    }}
                  >
                    {order.id}
                  </td>
                  <td style={{ padding: '12px 16px', color: T.deep }}>{order.customerName}</td>
                  <td style={{ padding: '12px 16px', color: T.mid }}>
                    {order.items.map(i => i.productName).join(', ')}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: T.deep,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatPrice(order.totalInr)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        color: STATUS_COLORS[order.status],
                        textTransform: 'capitalize',
                        fontWeight: 500,
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: T.muted, fontSize: '12px' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <a
          href="/admin/orders"
          style={{
            display: 'inline-block',
            marginTop: '16px',
            fontFamily: DATA,
            fontSize: '13px',
            color: T.gold,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          View all orders →
        </a>
      </div>
    </div>
  )
}
