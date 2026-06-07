'use client'

import { useState } from 'react'
import { AdminCustomer } from '@/types/admin'
import { formatPrice } from '@/lib/products-data'

interface CustomersClientProps {
  initialCustomers: AdminCustomer[]
}

const T = {
  card: '#FFFFFF',
  cardAlt: '#F8F4EE',
  deep: '#1A1410',
  mid: '#5C4F3A',
  muted: '#8C7B65',
  light: '#B8A99A',
  gold: '#9E7F4A',
  border: 'rgba(158,127,74,0.18)',
  shadowSm: '0 1px 4px rgba(26,20,16,0.06)',
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

export default function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredCustomers = initialCustomers.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
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
          Customers
        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '300px',
            padding: '8px 12px',
            fontFamily: DATA,
            fontSize: '13px',
            border: `1px solid ${T.border}`,
            borderRadius: '4px',
            background: T.card,
            color: T.deep,
          }}
        />
      </div>

      {/* Customers table */}
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
                Name
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
                Email
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
                Phone
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  color: T.muted,
                  fontWeight: 500,
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Orders
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
                Total Spent
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
                Last Order
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer, idx) => (
              <>
                <tr
                  key={customer.id}
                  style={{
                    background: idx % 2 === 0 ? T.card : T.cardAlt,
                    borderBottom: `1px solid ${T.border}`,
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setExpandedId(expandedId === customer.id ? null : customer.id)
                  }
                >
                  <td
                    style={{
                      padding: '12px 16px',
                      color: T.deep,
                    }}
                  >
                    {customer.name}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: T.mid,
                    }}
                  >
                    {customer.email}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: T.mid,
                    }}
                  >
                    {customer.phone || '-'}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      color: T.deep,
                    }}
                  >
                    {customer.ordersCount}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: T.deep,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatPrice(customer.totalSpentInr)}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: T.muted,
                      fontSize: '12px',
                    }}
                  >
                    {new Date(customer.lastOrderDate).toLocaleDateString('en-IN')}
                  </td>
                </tr>

                {/* Expanded order history */}
                {expandedId === customer.id && (
                  <tr
                    key={`${customer.id}-detail`}
                    style={{
                      background: T.cardAlt,
                      borderBottom: `2px solid ${T.border}`,
                    }}
                  >
                    <td colSpan={6} style={{ padding: '24px' }}>
                      <div
                        style={{
                          fontFamily: DATA,
                          fontSize: '12px',
                          color: T.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '16px',
                        }}
                      >
                        Recent Orders
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '16px',
                        }}
                      >
                        {customer.recentOrders.map((order, i) => (
                          <div
                            key={i}
                            style={{
                              background: T.card,
                              border: `1px solid ${T.border}`,
                              borderRadius: '3px',
                              padding: '12px',
                            }}
                          >
                            <div
                              style={{
                                fontFamily: "'Courier New', monospace",
                                fontSize: '11px',
                                color: T.muted,
                                marginBottom: '8px',
                              }}
                            >
                              {order.id}
                            </div>
                            <div
                              style={{
                                fontFamily: DATA,
                                fontSize: '13px',
                                color: T.deep,
                                fontVariantNumeric: 'tabular-nums',
                                marginBottom: '8px',
                              }}
                            >
                              {formatPrice(order.totalInr)}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '8px',
                              }}
                            >
                              <div
                                style={{
                                  width: '2px',
                                  height: '12px',
                                  background: STATUS_COLORS[order.status],
                                  borderRadius: '1px',
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: T.mid,
                                  textTransform: 'capitalize',
                                }}
                              >
                                {order.status}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: T.muted,
                              }}
                            >
                              {new Date(order.createdAt).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
