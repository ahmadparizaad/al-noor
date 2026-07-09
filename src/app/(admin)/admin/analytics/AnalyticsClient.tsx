'use client'

import { useState } from 'react'
import { AdminOrder, AdminProduct, RevenueMonth } from '@/types/admin'
import { formatPrice } from '@/lib/products-data'

interface AnalyticsClientProps {
  revenue: RevenueMonth[]
  orders: AdminOrder[]
  products: AdminProduct[]
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
  border: 'rgba(158,127,74,0.18)',
  borderLight: 'rgba(158,127,74,0.10)',
  shadowSm: '0 1px 4px rgba(26,20,16,0.06)',
}

const DATA = "'Inter', system-ui, sans-serif"

type Preset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'this_year', label: 'This Year' },
  { key: 'last_year', label: 'Last Year' },
  { key: 'custom', label: 'Custom' },
]

function getPresetRange(preset: Preset, customFrom: string, customTo: string): { from: Date; to: Date } {
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'yesterday': {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      return { from: startOfDay(y), to: endOfDay(y) }
    }
    case 'this_week': {
      const day = now.getDay()
      const mon = new Date(now)
      mon.setDate(now.getDate() - ((day + 6) % 7))
      return { from: startOfDay(mon), to: endOfDay(now) }
    }
    case 'last_week': {
      const day = now.getDay()
      const thisMonday = new Date(now)
      thisMonday.setDate(now.getDate() - ((day + 6) % 7))
      const lastMon = new Date(thisMonday)
      lastMon.setDate(thisMonday.getDate() - 7)
      const lastSun = new Date(thisMonday)
      lastSun.setDate(thisMonday.getDate() - 1)
      return { from: startOfDay(lastMon), to: endOfDay(lastSun) }
    }
    case 'this_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: endOfDay(now),
      }
    case 'last_month': {
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastOfLastMonth = new Date(firstOfThisMonth)
      lastOfLastMonth.setDate(lastOfLastMonth.getDate() - 1)
      return {
        from: new Date(lastOfLastMonth.getFullYear(), lastOfLastMonth.getMonth(), 1),
        to: endOfDay(lastOfLastMonth),
      }
    }
    case 'this_year':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: endOfDay(now),
      }
    case 'last_year':
      return {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
      }
    case 'custom': {
      const from = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1)
      const to = customTo ? new Date(customTo + 'T23:59:59') : endOfDay(now)
      return { from, to }
    }
  }
}

function filterOrdersByRange(orders: AdminOrder[], from: Date, to: Date): AdminOrder[] {
  return orders.filter(o => {
    const d = new Date(o.createdAt)
    return d >= from && d <= to
  })
}

const StatCard = ({
  label,
  value,
  isPrice = false,
}: {
  label: string
  value: string | number
  isPrice?: boolean
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
      {label}
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
  </div>
)

export default function AnalyticsClient({
  revenue,
  orders,
  products,
}: AnalyticsClientProps) {
  const [preset, setPreset] = useState<Preset>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const { from, to } = getPresetRange(preset, customFrom, customTo)
  const filteredOrders = filterOrdersByRange(orders, from, to)

  const totalOrders = filteredOrders.length
  const totalRevenue = filteredOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalInr, 0)
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  // Top watches by order frequency (unfiltered — all-time)
  const watchCounts: Record<string, { name: string; ref: string; count: number; revenue: number }> = {}
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!watchCounts[item.productId]) {
        watchCounts[item.productId] = { name: item.productName, ref: '', count: 0, revenue: 0 }
      }
      watchCounts[item.productId].count += item.quantity
      watchCounts[item.productId].revenue += item.priceInr * item.quantity
    })
  })
  products.forEach(p => {
    if (watchCounts[p.id]) watchCounts[p.id].ref = p.ref
  })
  const topWatches = Object.values(watchCounts).sort((a, b) => b.count - a.count).slice(0, 5)

  // Category breakdown (unfiltered)
  const categoryStats: Record<string, { count: number; revenue: number }> = {}
  products.forEach(p => {
    if (!categoryStats[p.category]) categoryStats[p.category] = { count: 0, revenue: 0 }
  })
  orders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId)
      if (product && categoryStats[product.category]) {
        categoryStats[product.category].count += item.quantity
        categoryStats[product.category].revenue += item.priceInr * item.quantity
      }
    })
  })
  const allTimeRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalInr, 0)
  const categories = Object.entries(categoryStats).map(([name, data]) => ({
    name,
    ...data,
    percentage: allTimeRevenue > 0 ? Math.round((data.revenue / allTimeRevenue) * 100) : 0,
  }))

  const maxRevenue = Math.max(...revenue.map(m => m.revenueInr), 1)

  return (
    <div>
      <div
        style={{
          fontFamily: DATA,
          fontSize: '24px',
          color: T.deep,
          marginBottom: '24px',
          fontWeight: 500,
        }}
      >
        Analytics
      </div>

      {/* Time period selector */}
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: '4px',
          padding: '16px 20px',
          marginBottom: '24px',
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
            marginBottom: '12px',
          }}
        >
          Time Period
        </div>

        {/* Preset buttons row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: preset === 'custom' ? '16px' : '0' }}>
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              style={{
                fontFamily: DATA,
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '3px',
                border: `1px solid ${preset === p.key ? T.gold : T.border}`,
                background: preset === p.key ? T.goldPale : 'transparent',
                color: preset === p.key ? T.goldDark : T.mid,
                cursor: 'pointer',
                fontWeight: preset === p.key ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range inputs */}
        {preset === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <div
                style={{
                  fontFamily: DATA,
                  fontSize: '11px',
                  color: T.muted,
                  marginBottom: '4px',
                }}
              >
                From
              </div>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                style={{
                  fontFamily: DATA,
                  fontSize: '13px',
                  padding: '7px 10px',
                  border: `1px solid ${T.border}`,
                  borderRadius: '3px',
                  color: T.deep,
                  background: T.card,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ color: T.light, marginTop: '20px' }}>—</div>
            <div>
              <div
                style={{
                  fontFamily: DATA,
                  fontSize: '11px',
                  color: T.muted,
                  marginBottom: '4px',
                }}
              >
                To
              </div>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                style={{
                  fontFamily: DATA,
                  fontSize: '13px',
                  padding: '7px 10px',
                  border: `1px solid ${T.border}`,
                  borderRadius: '3px',
                  color: T.deep,
                  background: T.card,
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        <StatCard label="Total Orders" value={totalOrders} />
        <StatCard label="Total Revenue" value={formatPrice(totalRevenue)} isPrice={true} />
        <StatCard label="Avg Order Value" value={formatPrice(avgOrderValue)} isPrice={true} />
      </div>

      {/* Revenue chart */}
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: '4px',
          padding: '24px',
          boxShadow: T.shadowSm,
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            fontFamily: DATA,
            fontSize: '16px',
            color: T.deep,
            marginBottom: '24px',
            fontWeight: 500,
          }}
        >
          Revenue by Month
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            height: '200px',
            marginBottom: '24px',
            gap: '12px',
          }}
        >
          {revenue.map(month => {
            const heightPercent = (month.revenueInr / maxRevenue) * 100
            return (
              <div
                key={month.month}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    fontFamily: DATA,
                    fontSize: '11px',
                    color: T.gold,
                    marginBottom: '8px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatPrice(month.revenueInr)}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    background: T.goldPale,
                    borderTop: `2px solid ${T.gold}`,
                    borderRadius: '2px 2px 0 0',
                  }}
                />
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', gap: '12px' }}>
          {revenue.map(month => (
            <div
              key={month.month}
              style={{
                flex: 1,
                fontFamily: DATA,
                fontSize: '11px',
                color: T.muted,
                textAlign: 'center',
              }}
            >
              {month.month.slice(0, 3)}
            </div>
          ))}
        </div>
      </div>

      {/* Top watches and category breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '40px',
        }}
      >
        {/* Top watches */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: T.shadowSm,
          }}
        >
          <div style={{ padding: '24px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: DATA, fontSize: '16px', color: T.deep, fontWeight: 500 }}>
              Top 5 Watches
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: DATA, fontSize: '13px' }}>
            <tbody>
              {topWatches.map((watch, idx) => (
                <tr
                  key={watch.name}
                  style={{
                    background: idx % 2 === 0 ? T.card : T.cardAlt,
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <td style={{ padding: '12px 16px', color: T.muted, width: '30px', fontWeight: 500 }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '12px 16px', color: T.deep }}>{watch.name}</td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: T.mid,
                      fontFamily: "'Courier New', monospace",
                      fontSize: '12px',
                    }}
                  >
                    {watch.ref}
                  </td>
                  <td style={{ padding: '12px 16px', color: T.mid, textAlign: 'right' }}>
                    {watch.count} sold
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Category breakdown */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: T.shadowSm,
          }}
        >
          <div style={{ padding: '24px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: DATA, fontSize: '16px', color: T.deep, fontWeight: 500 }}>
              Category Breakdown
            </div>
          </div>

          <div style={{ padding: '0' }}>
            {categories.map((cat, idx) => (
              <div
                key={cat.name}
                style={{
                  padding: '16px',
                  borderBottom: `1px solid ${T.border}`,
                  background: idx % 2 === 0 ? T.card : T.cardAlt,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    fontFamily: DATA,
                  }}
                >
                  <span style={{ fontSize: '13px', color: T.deep }}>{cat.name}</span>
                  <span style={{ fontSize: '12px', color: T.gold, fontVariantNumeric: 'tabular-nums' }}>
                    {cat.percentage}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: T.cardAlt,
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ height: '100%', width: `${cat.percentage}%`, background: T.gold }} />
                </div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: T.muted }}>
                  {cat.count} units sold
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
