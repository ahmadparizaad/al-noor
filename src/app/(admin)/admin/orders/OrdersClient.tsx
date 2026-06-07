'use client'

import { Fragment, useState } from 'react'
import { AdminOrder, OrderStatus } from '@/types/admin'
import { formatPrice } from '@/lib/products-data'

type DatePreset = 'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom'

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'All Time' },
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

function getDateRange(preset: DatePreset, customFrom: string, customTo: string): { from: Date | null; to: Date | null } {
  if (preset === 'all') return { from: null, to: null }

  const now = new Date()
  const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const eod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

  switch (preset) {
    case 'today': return { from: sod(now), to: eod(now) }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { from: sod(y), to: eod(y) }
    }
    case 'this_week': {
      const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      return { from: sod(mon), to: eod(now) }
    }
    case 'last_week': {
      const thisMonday = new Date(now); thisMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      const lastMon = new Date(thisMonday); lastMon.setDate(thisMonday.getDate() - 7)
      const lastSun = new Date(thisMonday); lastSun.setDate(thisMonday.getDate() - 1)
      return { from: sod(lastMon), to: eod(lastSun) }
    }
    case 'this_month': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: eod(now) }
    case 'last_month': {
      const firstOfThis = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastOfLast = new Date(firstOfThis); lastOfLast.setDate(lastOfLast.getDate() - 1)
      return { from: new Date(lastOfLast.getFullYear(), lastOfLast.getMonth(), 1), to: eod(lastOfLast) }
    }
    case 'this_year': return { from: new Date(now.getFullYear(), 0, 1), to: eod(now) }
    case 'last_year': return {
      from: new Date(now.getFullYear() - 1, 0, 1),
      to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
    }
    case 'custom': {
      const from = customFrom ? sod(new Date(customFrom)) : null
      const to = customTo ? eod(new Date(customTo)) : null
      return { from, to }
    }
  }
}

interface OrdersClientProps {
  initialOrders: AdminOrder[]
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
  border: 'rgba(158,127,74,0.18)',
  borderGold: 'rgba(158,127,74,0.25)',
  shadowSm: '0 1px 4px rgba(26,20,16,0.06)',
  shadowMd: '0 4px 16px rgba(26,20,16,0.09)',
}

const DATA = "'Inter', system-ui, sans-serif"
const UI = "'Raleway', system-ui, sans-serif"

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#D97706',
  confirmed: '#9E7F4A',
  processing: '#1a3a5c',
  shipped: '#27864A',
  delivered: '#5C4F3A',
  cancelled: '#C0392B',
  refunded: '#8C7B65',
}

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders)
  const [editingStatus, setEditingStatus] = useState<{ [key: string]: OrderStatus }>({})
  const [trackingNumbers, setTrackingNumbers] = useState<{ [key: string]: string }>({})

  const { from, to } = getDateRange(datePreset, customFrom, customTo)

  const filteredOrders = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false
    if (from || to) {
      const d = new Date(o.createdAt)
      if (from && d < from) return false
      if (to && d > to) return false
    }
    return true
  })

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setEditingStatus(prev => ({ ...prev, [orderId]: newStatus }))
  }

  const handleTrackingChange = (orderId: string, value: string) => {
    setTrackingNumbers(prev => ({ ...prev, [orderId]: value }))
  }

  const handleSaveOrder = (orderId: string) => {
    const newStatus = editingStatus[orderId]
    const newTracking = trackingNumbers[orderId]

    if (newStatus) {
      setOrders(orders.map(o =>
        o.id === orderId
          ? { ...o, status: newStatus, trackingNumber: newTracking || o.trackingNumber }
          : o
      ))
    }

    setEditingStatus(prev => {
      const newState = { ...prev }
      delete newState[orderId]
      return newState
    })
  }

  const FilterTab = ({ label, status }: { label: string; status: OrderStatus | 'all' }) => (
    <button
      onClick={() => setFilter(status)}
      style={{
        padding: '8px 16px',
        marginRight: '8px',
        marginBottom: '16px',
        fontFamily: DATA,
        fontSize: '13px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: filter === status ? T.deep : T.muted,
        borderBottom: filter === status ? `2px solid ${T.gold}` : 'none',
        fontWeight: filter === status ? 500 : 400,
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontFamily: DATA,
            fontSize: '24px',
            color: T.deep,
            marginBottom: '20px',
            fontWeight: 500,
          }}
        >
          Orders
        </div>

        {/* Date preset bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', alignItems: 'center' }}>
          {DATE_PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => setDatePreset(p.key)}
              style={{
                fontFamily: DATA,
                fontSize: '12px',
                padding: '5px 12px',
                borderRadius: '20px',
                border: `1px solid ${datePreset === p.key ? T.gold : T.border}`,
                background: datePreset === p.key ? '#EDD9B8' : 'transparent',
                color: datePreset === p.key ? T.goldDark : T.mid,
                cursor: 'pointer',
                fontWeight: datePreset === p.key ? 600 : 400,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {datePreset === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontFamily: DATA, fontSize: '11px', color: T.muted, marginBottom: '4px' }}>From</div>
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
            <div style={{ color: T.light, marginTop: '18px' }}>—</div>
            <div>
              <div style={{ fontFamily: DATA, fontSize: '11px', color: T.muted, marginBottom: '4px' }}>To</div>
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

        {/* Status filter tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <FilterTab label="All" status="all" />
          <FilterTab label="Pending" status="pending" />
          <FilterTab label="Confirmed" status="confirmed" />
          <FilterTab label="Processing" status="processing" />
          <FilterTab label="Shipped" status="shipped" />
          <FilterTab label="Delivered" status="delivered" />
          <FilterTab label="Cancelled" status="cancelled" />
        </div>
      </div>

      {/* Orders table */}
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
            <tr
              style={{
                background: T.cardAlt,
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  color: T.muted,
                  fontWeight: 500,
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Ref
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  color: T.muted,
                  fontWeight: 500,
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Customer
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  color: T.muted,
                  fontWeight: 500,
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Watches
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  color: T.muted,
                  fontWeight: 500,
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Amount
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  color: T.muted,
                  fontWeight: 500,
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  color: T.muted,
                  fontWeight: 500,
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, idx) => (
              <Fragment key={order.id}>
                <tr

                  style={{
                    background: idx % 2 === 0 ? T.card : T.cardAlt,
                    borderBottom: `1px solid ${T.border}`,
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
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
                  <td
                    style={{
                      padding: '12px 16px',
                      color: T.deep,
                    }}
                  >
                    {order.customerName}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: T.mid,
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
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
                    <span style={{ color: STATUS_COLORS[order.status], textTransform: 'capitalize', fontWeight: 500 }}>
                      {order.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: T.muted,
                      fontSize: '12px',
                    }}
                  >
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>

                {/* Expanded detail panel */}
                {expandedId === order.id && (
                  <tr
                    key={`${order.id}-detail`}
                    style={{
                      background: T.cardAlt,
                      borderBottom: `2px solid ${T.border}`,
                    }}
                  >
                    <td colSpan={6} style={{ padding: '24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        {/* Left: Shipping & Items */}
                        <div>
                          <div
                            style={{
                              fontFamily: DATA,
                              fontSize: '12px',
                              color: T.muted,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '8px',
                            }}
                          >
                            Shipping Address
                          </div>
                          <div
                            style={{
                              fontFamily: DATA,
                              fontSize: '13px',
                              color: T.deep,
                              lineHeight: 1.6,
                              marginBottom: '24px',
                            }}
                          >
                            {order.shippingAddress.fullName}
                            <br />
                            {order.shippingAddress.line1}
                            {order.shippingAddress.line2 && (
                              <>
                                <br />
                                {order.shippingAddress.line2}
                              </>
                            )}
                            <br />
                            {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                            {order.shippingAddress.pincode}
                            <br />
                            {order.shippingAddress.phone}
                          </div>

                          <div
                            style={{
                              fontFamily: DATA,
                              fontSize: '12px',
                              color: T.muted,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '8px',
                            }}
                          >
                            Items
                          </div>
                          <div
                            style={{
                              fontFamily: DATA,
                              fontSize: '13px',
                            }}
                          >
                            {order.items.map((item, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  color: T.mid,
                                  paddingBottom: '8px',
                                }}
                              >
                                <span>
                                  {item.productName} × {item.quantity}
                                </span>
                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                  {formatPrice(item.priceInr * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: Status & Tracking */}
                        <div>
                          <div
                            style={{
                              fontFamily: DATA,
                              fontSize: '12px',
                              color: T.muted,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '8px',
                            }}
                          >
                            Update Status
                          </div>
                          <select
                            value={editingStatus[order.id] || order.status}
                            onChange={e =>
                              handleStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              fontFamily: DATA,
                              fontSize: '13px',
                              border: `1px solid ${T.border}`,
                              borderRadius: '4px',
                              background: T.card,
                              color: T.deep,
                              marginBottom: '16px',
                              cursor: 'pointer',
                            }}
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>

                          {(editingStatus[order.id] === 'shipped' ||
                            editingStatus[order.id] === 'delivered' ||
                            (order.status === 'shipped' && !editingStatus[order.id]) ||
                            (order.status === 'delivered' && !editingStatus[order.id])) && (
                            <>
                              <div
                                style={{
                                  fontFamily: DATA,
                                  fontSize: '12px',
                                  color: T.muted,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  marginBottom: '8px',
                                }}
                              >
                                Tracking Number
                              </div>
                              <input
                                type="text"
                                value={trackingNumbers[order.id] || order.trackingNumber || ''}
                                onChange={e => handleTrackingChange(order.id, e.target.value)}
                                placeholder="Enter tracking number"
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  fontFamily: DATA,
                                  fontSize: '13px',
                                  border: `1px solid ${T.border}`,
                                  borderRadius: '4px',
                                  background: T.card,
                                  color: T.deep,
                                  marginBottom: '16px',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </>
                          )}

                          <button
                            onClick={() => handleSaveOrder(order.id)}
                            style={{
                              padding: '8px 16px',
                              fontFamily: DATA,
                              fontSize: '13px',
                              background: T.gold,
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
