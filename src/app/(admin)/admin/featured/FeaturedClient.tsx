'use client'

import { useState, useTransition } from 'react'
import { AdminProduct } from '@/types/admin'
import { AdminFeaturedProduct, saveFeaturedProduct } from '@/lib/actions/admin'
import { formatPrice } from '@/lib/products-data'
import { WatchFace } from '@/components/ui/WatchFace'
import { toCloudinaryUrl } from '@/lib/cloudinary-client'

function toThumbUrl(publicId: string, size = 80): string {
  return toCloudinaryUrl(publicId, { width: size })
}

interface FeaturedClientProps {
  products: AdminProduct[]
  initialFeatured: AdminFeaturedProduct[]
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
  borderGold: 'rgba(158,127,74,0.30)',
  shadowSm: '0 1px 4px rgba(26,20,16,0.06)',
  shadowMd: '0 4px 16px rgba(26,20,16,0.09)',
}

const DATA = "'Inter', system-ui, sans-serif"

export default function FeaturedClient({ products, initialFeatured }: FeaturedClientProps) {
  const [featured, setFeatured] = useState<AdminFeaturedProduct[]>(initialFeatured)
  const [activePosition, setActivePosition] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  // Filter products by search query (only active products can be featured)
  const availableProducts = products.filter(
    (p) =>
      p.isActive &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSelectProduct = (productId: string) => {
    if (activePosition === null) return

    const product = products.find((p) => p.id === productId)
    if (!product) return

    const newFeatured = [...featured]
    newFeatured[activePosition - 1] = {
      position: activePosition,
      productId: product.id,
      productName: product.name,
      productRef: product.ref,
      productCategory: product.category,
      productMaterial: product.material,
      productDial: product.dial,
      productPrice: product.priceInr,
      productImage: product.images[0],
      isActive: product.isActive,
    }

    setFeatured(newFeatured)
    setActivePosition(null)
    setSearchQuery('')

    startTransition(async () => {
      await saveFeaturedProduct(activePosition, productId)
    })
  }

  const handleClearSlot = (position: number) => {
    const newFeatured = [...featured]
    newFeatured[position - 1] = {
      position,
      productId: null,
    }

    setFeatured(newFeatured)

    startTransition(async () => {
      await saveFeaturedProduct(position, null)
    })
  }

  return (
    <div style={{ fontFamily: DATA }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'baseline', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '24px', color: T.deep, fontWeight: 500, marginBottom: '4px' }}>
            Featured Pieces
          </div>
          <div style={{ fontSize: '13px', color: T.muted }}>
            Select exactly 4 timepieces to showcase in the &quot;Our Finest Pieces&quot; section on the home page.
          </div>
        </div>
        {isPending && (
          <div style={{ fontSize: '12px', color: T.muted, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              backgroundColor: T.gold,
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'pulse 1.2s infinite ease-in-out'
            }} />
            Saving changes…
          </div>
        )}
      </div>

      {/* Slots Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {featured.map((slot) => {
          const hasProduct = !!slot.productId

          return (
            <div
              key={slot.position}
              style={{
                background: T.card,
                border: hasProduct ? `1px solid ${T.border}` : `2px dashed ${T.border}`,
                borderRadius: '6px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: hasProduct ? T.shadowSm : 'none',
                position: 'relative',
                minHeight: '340px',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Badge/Slot indicator */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                fontSize: '10px',
                fontWeight: 600,
                color: T.gold,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                Slot 0{slot.position}
              </div>

              {hasProduct ? (
                <>
                  {/* Live preview */}
                  <div style={{
                    marginTop: '20px',
                    marginBottom: '16px',
                    background: T.cardAlt,
                    borderRadius: '4px',
                    width: '100%',
                    height: '150px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: `1px solid rgba(158,127,74,0.08)`,
                    overflow: 'hidden',
                  }}>
                    {slot.productImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={toThumbUrl(slot.productImage, 200)}
                        alt={slot.productName || 'Watch'}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <WatchFace dial={slot.productDial ?? ''} size={110} />
                    )}
                  </div>

                  {/* Watch Information */}
                  <div style={{ width: '100%', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: T.gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                      Al Noor · {slot.productMaterial}
                    </div>
                    <div style={{ fontSize: '15px', color: T.deep, fontWeight: 500, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={slot.productName}>
                      {slot.productName}
                    </div>
                    <div style={{ fontSize: '12px', color: T.muted, marginBottom: '8px' }}>
                      {slot.productCategory}
                    </div>
                    <div style={{ fontSize: '14px', color: T.deep, fontWeight: 600 }}>
                      {formatPrice(slot.productPrice ?? 0)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: 'auto' }}>
                    <button
                      onClick={() => setActivePosition(slot.position)}
                      disabled={isPending}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: 'transparent',
                        border: `1px solid ${T.border}`,
                        borderRadius: '4px',
                        color: T.mid,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = T.cardAlt
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Change
                    </button>
                    <button
                      onClick={() => handleClearSlot(slot.position)}
                      disabled={isPending}
                      title="Clear slot"
                      style={{
                        padding: '8px',
                        fontSize: '12px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${T.border}`,
                        borderRadius: '4px',
                        color: T.red,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(192, 57, 43, 0.05)'
                        e.currentTarget.style.borderColor = T.red
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.borderColor = T.border
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <div
                  onClick={() => !isPending && setActivePosition(slot.position)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    width: '100%',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    marginTop: '20px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isPending) {
                      e.currentTarget.parentElement!.style.borderColor = T.gold
                      e.currentTarget.parentElement!.style.backgroundColor = 'rgba(158,127,74,0.02)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPending) {
                      e.currentTarget.parentElement!.style.borderColor = T.border
                      e.currentTarget.parentElement!.style.backgroundColor = T.card
                    }
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: T.cardAlt,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    color: T.gold,
                    fontSize: '20px',
                    border: `1px solid ${T.border}`,
                  }}>
                    +
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: T.mid, marginBottom: '4px' }}>
                    Assign timepiece
                  </div>
                  <div style={{ fontSize: '11px', color: T.muted, padding: '0 8px' }}>
                    No watch assigned. Will automatically fall back to recently added watch on storefront.
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Select Watch Modal */}
      {activePosition !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(26, 20, 16, 0.40)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: T.card,
            borderRadius: '6px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: T.shadowMd,
            border: `1px solid ${T.border}`,
            animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: T.deep }}>
                  Assign to Slot 0{activePosition}
                </div>
                <div style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }}>
                  Choose a watch from your active inventory
                </div>
              </div>
              <button
                onClick={() => { setActivePosition(null); setSearchQuery('') }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: T.muted,
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Search */}
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.cardAlt }}>
              <input
                type="text"
                placeholder="Search watches by name, reference, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
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

            {/* Modal List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 24px',
              minHeight: '200px',
              maxHeight: '400px',
            }}>
              {availableProducts.length > 0 ? (
                availableProducts.map((p) => {
                  const isSelectedInAnySlot = featured.some(f => f.productId === p.id)

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isSelectedInAnySlot && handleSelectProduct(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px 0',
                        borderBottom: `1px solid ${T.border}`,
                        cursor: isSelectedInAnySlot ? 'not-allowed' : 'pointer',
                        opacity: isSelectedInAnySlot ? 0.5 : 1,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelectedInAnySlot) {
                          e.currentTarget.style.backgroundColor = 'rgba(158,127,74,0.03)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <div style={{
                        background: T.cardAlt,
                        borderRadius: '3px',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid rgba(158,127,74,0.08)`,
                        overflow: 'hidden',
                      }}>
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={toThumbUrl(p.images[0], 80)}
                            alt={p.name}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <WatchFace dial={p.dial} size={44} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: T.deep, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>
                          Ref: {p.ref} · {p.category} · {p.material}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: T.deep }}>
                          {formatPrice(p.priceInr)}
                        </span>
                        {isSelectedInAnySlot && (
                          <span style={{ fontSize: '9px', fontWeight: 600, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{
                  padding: '40px 0',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: T.muted,
                }}>
                  No active watches found matching &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => { setActivePosition(null); setSearchQuery('') }}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
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
          </div>
        </div>
      )}

      {/* Simple animations injection */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
