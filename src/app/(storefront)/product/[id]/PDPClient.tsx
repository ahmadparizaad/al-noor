'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WatchFace } from '@/components/ui/WatchFace'
import { DIAL_OPTIONS, MATERIALS, formatPrice, discount, type Product, type DialColor, type Material } from '@/lib/products-data'
import { buildSpecs, REVIEWS } from '@/lib/pdp-data'
import { useCart } from '@/lib/cart-store'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { toCloudinaryUrl } from '@/lib/cloudinary-client'

function toImageUrl(src: string): string {
  return toCloudinaryUrl(src)
}

const T = {
  ivory:       '#FAF7F2',
  parchment:   '#F0EBE2',
  parchment2:  '#E8E0D4',
  white:       '#FFFFFF',
  gold:        '#9E7F4A',
  goldDark:    '#7A5C2E',
  goldPale:    '#EDD9B8',
  deep:        '#1A1410',
  mid:         '#5C4F3A',
  muted:       '#8C7B65',
  light:       '#B8A99A',
  border:      'rgba(158,127,74,0.18)',
  borderLight: 'rgba(158,127,74,0.10)',
  shadowSm:    '0 1px 4px rgba(26,20,16,0.06)',
  shadowMd:    '0 4px 16px rgba(26,20,16,0.09)',
  green:       '#27864A',
  red:         '#C0392B',
}

export function PDPClient({
  product: initial,
  allProducts = [],
  materials = MATERIALS,
  dialOptions = DIAL_OPTIONS,
}: {
  product: Product
  allProducts?: Product[]
  materials?: string[]
  dialOptions?: string[]
}) {
  const { isMobile, isTablet } = useBreakpoint()
  const [activeDial, setActiveDial]         = useState<DialColor>(initial.dial)
  const [activeMaterial, setActiveMaterial] = useState<Material>(initial.material)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const imageUrls = (initial.images ?? []).map(img => toImageUrl(img)).filter(Boolean)
  const hasImages = imageUrls.length > 0
  const [qty, setQty]                       = useState(1)
  const [wished, setWished]                 = useState(false)
  const [cartAdded, setCartAdded]           = useState(false)
  const [toast, setToast]                   = useState<string | null>(null)
  const [helpfulVotes, setHelpfulVotes]     = useState<Record<number, boolean>>({})
  const { addItem } = useCart()
  const router = useRouter()

  const p = initial

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  function handleAddToCart() {
    if (cartAdded) {
      router.push('/cart')
      return
    }
    addItem(p, qty)
    setCartAdded(true)
    showToast(`Added to cart: ${p.name.split(' ').slice(0, 3).join(' ')}`)
  }

  const disc = discount(p.price, p.original)
  const specs = buildSpecs(p)

  // Related: same category, excluding self
  const related = allProducts
    .filter(q => q.id !== p.id && q.category === p.category)
    .slice(0, 5)
  const relatedFinal = related.length >= 3 ? related : allProducts.filter(q => q.id !== p.id).slice(0, 5)

  const ratingBars: [number, number][] = [[5, 0.72], [4, 0.18], [3, 0.06], [2, 0.02], [1, 0.02]]

  return (
    <div style={{ minHeight: '100vh', background: T.parchment, fontFamily: "'Raleway', sans-serif", fontSize: 14, color: T.deep }}>

      {/* ── Nav ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: T.ivory, borderBottom: `1px solid ${T.border}`, boxShadow: T.shadowSm }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px', height: isMobile ? 56 : 64, display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24 }}>
          <Link href="/" style={{ fontWeight: 600, fontSize: isMobile ? 13 : 15, letterSpacing: '0.35em', color: T.gold, whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none' }}>
            AL NOOR
            {!isMobile && <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.15em', color: T.muted, fontWeight: 400, marginTop: 1 }}>Luxury Watches</span>}
          </Link>
          {!isMobile ? (
            <div style={{ flex: 1, maxWidth: 560, position: 'relative' }}>
              <input type="text" placeholder="Search watches, collections, references…" style={{ width: '100%', height: 40, border: `1.5px solid ${T.border}`, borderRadius: 2, padding: '0 44px 0 14px', fontSize: 13, color: T.deep, background: T.white, outline: 'none' }} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 44, background: T.gold, borderRadius: '0 2px 2px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
              </div>
            </div>
          ) : null}
          <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 28, flexShrink: 0 }}>
            {!isMobile && <Link href="/" style={{ fontSize: 13, fontWeight: 500, color: T.mid, textDecoration: 'none' }}>Home</Link>}
            <Link href="/products" style={{ fontSize: 13, fontWeight: 500, color: T.mid, textDecoration: 'none' }}>{isMobile ? '← Watches' : 'All Watches'}</Link>
            {!isMobile && <a href="https://wa.me/919067960830" target="_blank" rel="noopener noreferrer" style={{ background: T.gold, color: T.ivory, padding: '8px 20px', borderRadius: 2, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>Enquire</a>}
          </nav>
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      {!isMobile ? (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted }}>
          <Link href="/" style={{ color: T.muted, textDecoration: 'none' }}>Home</Link>
          <span style={{ color: T.light }}>›</span>
          <Link href="/products" style={{ color: T.muted, textDecoration: 'none' }}>Watches</Link>
          <span style={{ color: T.light }}>›</span>
          <span style={{ color: T.deep, fontWeight: 500 }}>{p.name}</span>
        </div>
      ) : null}

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '0 0 80px' : '0 24px 60px' }}>

        {/* ── top section: stacks on mobile ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '380px 1fr 300px', gap: isMobile ? 0 : 24, alignItems: 'flex-start' }}>

          {/* ── Image column ── */}
          <div style={{ position: isMobile ? 'static' : 'sticky', top: 80, padding: isMobile ? '16px 16px 0' : 0 }}>
            {/* Main image */}
            <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: hasImages ? 0 : 32, position: 'relative', overflow: 'hidden' }}>
              {hasImages ? (
                <Image
                  src={imageUrls[activeImageIdx]}
                  alt={`${initial.name} — image ${activeImageIdx + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 380px"
                  priority={activeImageIdx === 0}
                />
              ) : (
                <>
                  <WatchFace dial={activeDial} size={280} />
                  <div style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 10, color: T.muted, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>
                    Live dial
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {hasImages ? (
                imageUrls.map((url, idx) => (
                  <button
                    key={url}
                    onClick={() => setActiveImageIdx(idx)}
                    style={{ width: 64, height: 64, background: T.white, border: `2px solid ${activeImageIdx === idx ? T.gold : T.borderLight}`, borderRadius: 2, cursor: 'pointer', padding: 0, overflow: 'hidden', position: 'relative', flexShrink: 0 }}
                  >
                    <Image src={url} alt={`Thumbnail ${idx + 1}`} fill style={{ objectFit: 'cover' }} sizes="64px" />
                  </button>
                ))
              ) : (
                dialOptions.map(dial => (
                  <button
                    key={dial}
                    onClick={() => setActiveDial(dial)}
                    title={dial}
                    style={{ width: 64, height: 64, background: T.white, border: `2px solid ${activeDial === dial ? T.gold : T.borderLight}`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 6, transition: 'border-color 0.2s' }}
                  >
                    <WatchFace dial={dial} size={50} />
                  </button>
                ))
              )}
            </div>

            {/* Actions row */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: T.muted }}>
              {[
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill={wished ? T.red : 'none'} stroke={wished ? T.red : 'currentColor'} strokeWidth="1.8"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>, label: wished ? 'Wishlisted' : 'Wishlist', action: () => { setWished(w => !w); showToast(wished ? 'Removed from wishlist' : '♥ Added to wishlist') } },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>, label: 'Share', action: () => showToast('Link copied!') },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="7" width="6" height="14" rx="1"/><rect x="16" y="5" width="6" height="16" rx="1"/></svg>, label: 'Compare', action: () => showToast('Comparing watches…') },
              ].map(({ icon, label, action }) => (
                <button key={label} onClick={action} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}>{icon}{label}</button>
              ))}
            </div>
          </div>

          {/* ── Info column ── */}
          <div style={{ padding: isMobile ? '16px' : '4px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gold, marginBottom: 6 }}>Al Noor · Geneva</div>
            <h1 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 26, fontWeight: 400, fontStyle: 'italic', color: T.deep, lineHeight: 1.3, marginBottom: 4 }}>{p.name}</h1>
            <div style={{ fontSize: 11, color: T.light, letterSpacing: '0.08em', marginBottom: 14 }}>{p.ref} · {p.category} · {p.material}</div>

            {/* Rating row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: `1px solid ${T.borderLight}`, marginBottom: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: T.green, color: '#fff', borderRadius: 3, padding: '3px 8px', fontSize: 13, fontWeight: 700 }}>
                {p.rating} <StarIcon size={11} />
              </span>
              <span style={{ fontSize: 13, color: T.muted }}>({p.reviews.toLocaleString()} ratings)</span>
              <span style={{ color: T.borderLight }}>|</span>
              <span style={{ fontSize: 12, color: T.green, fontWeight: 500 }}>Verified Atelier</span>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: T.deep }}>{formatPrice(p.price)}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, color: T.light, textDecoration: 'line-through' }}>{formatPrice(p.original)}</span>
                <span style={{ fontSize: 16, color: T.green, fontWeight: 600 }}>{disc}% off</span>
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Inclusive of all taxes · Free worldwide shipping</div>
            </div>

            {/* Offers */}
            <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.deep, marginBottom: 10 }}>Available Offers</div>
              {[
                { title: 'Private Client Benefit', body: 'Complimentary engraving on all timepieces.' },
                { title: 'Heritage Package', body: 'Complimentary Al Noor watch roll and certificate of authenticity with every order.' },
                { title: '5-Year Warranty', body: 'Full movement service covered by Al Noor Atelier, Geneva.' },
              ].map(offer => (
                <div key={offer.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: T.mid, marginBottom: 8, lineHeight: 1.4 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: T.goldPale, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <svg viewBox="0 0 10 10" width="10" height="10" fill={T.goldDark}><path d="M5 1l1.2 2.5L9 4 7 6l.5 3L5 7.7 2.5 9 3 6 1 4l2.8-.5z"/></svg>
                  </div>
                  <span><strong style={{ color: T.deep, fontWeight: 600 }}>{offer.title}:</strong> {offer.body}</span>
                </div>
              ))}
            </div>

            {/* Case material variant */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.deep, marginBottom: 8 }}>
                Case Material <span style={{ fontWeight: 400, color: T.muted, marginLeft: 6 }}>— {activeMaterial}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {materials.map(mat => (
                  <button key={mat} onClick={() => { setActiveMaterial(mat); showToast(`Selected: ${mat}`) }}
                    style={{ padding: '7px 16px', borderRadius: 2, border: `1.5px solid ${activeMaterial === mat ? T.gold : T.border}`, fontSize: 12, fontWeight: activeMaterial === mat ? 600 : 500, color: activeMaterial === mat ? T.goldDark : T.mid, background: activeMaterial === mat ? T.goldPale : T.white, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dial colour variant */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.deep, marginBottom: 8 }}>
                Dial Colour <span style={{ fontWeight: 400, color: T.muted, marginLeft: 6 }}>— {activeDial}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {dialOptions.map(dial => (
                  <button key={dial} onClick={() => setActiveDial(dial)}
                    style={{ padding: '7px 16px', borderRadius: 2, border: `1.5px solid ${activeDial === dial ? T.gold : T.border}`, fontSize: 12, fontWeight: activeDial === dial ? 600 : 500, color: activeDial === dial ? T.goldDark : T.mid, background: activeDial === dial ? T.goldPale : T.white, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {dial}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 16, marginBottom: 20 }}>
              {[
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.8"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h3l3 4v4h-3m-3-7H9"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/></svg>, text: <><strong style={{ color: T.deep }}>Free Delivery</strong> — Arrives within 7–14 business days via insured courier.</> },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>, text: <>Delivery to <strong style={{ color: T.deep }}>worldwide destinations</strong> — Insured, discreet packaging</> },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.8"><path d="M9 14l-4-4 4-4m6 8l4-4-4-4"/></svg>, text: <><strong style={{ color: T.deep }}>30-Day Returns</strong> — Hassle-free return policy.</> },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12, fontSize: 13, color: T.mid }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}>{row.icon}</div>
                  <span>{row.text}</span>
                </div>
              ))}
            </div>

            {/* Seller */}
            <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 16, marginBottom: 20, fontSize: 13, color: T.mid }}>
              Sold by <a href="#" style={{ color: T.gold, fontWeight: 500 }}>Al Noor Atelier, Geneva</a> ·{' '}
              <span style={{ color: T.green, fontWeight: 500 }}>98.7% Positive Ratings</span>
            </div>

            {/* Description */}
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: T.mid, lineHeight: 1.7 }}>
              <p style={{ marginBottom: 10 }}>The <strong style={{ color: T.deep, fontFamily: "'Raleway', sans-serif", fontSize: 13, fontWeight: 600 }}>{p.name}</strong> exemplifies Al Noor's commitment to the fusion of Islamic geometric heritage and Swiss horological mastery. Crafted in {p.material} and featuring a {p.dial} dial, this {p.category.toLowerCase()} is a testament to over two thousand hours of hand-finishing at our Geneva atelier.</p>
              <p style={{ marginBottom: 10 }}>The movement, calibre {p.ref.replace(/-/g, '.')}, is assembled by a single watchmaker across fourteen weeks. The dial's geometry derives directly from the eight-point star tessellations of ninth-century Andalusian architecture.</p>
              <p>Every Al Noor timepiece ships with a certificate of provenance, leather watch roll, and a handwritten note from the atelier chief. A five-year full service warranty is included as standard.</p>
            </div>
          </div>

          {/* ── Buy Box ── */}
          <div style={{ position: isMobile ? 'static' : 'sticky', top: 80, padding: isMobile ? '0 16px 16px' : 0 }}>
            <div style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, padding: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.deep, marginBottom: 4 }}>{formatPrice(p.price)}</div>
              <div style={{ fontSize: 13, color: T.green, fontWeight: 600, marginBottom: 16 }}>{disc}% off · Save {formatPrice(p.original - p.price)}</div>

              <div style={{ fontSize: 14, fontWeight: 600, color: T.green, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                In Stock — Ready to dispatch
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 13, color: T.mid }}>
                Qty:
                <select value={qty} onChange={e => setQty(Number(e.target.value))} style={{ border: `1px solid ${T.border}`, borderRadius: 2, padding: '5px 10px', fontFamily: 'inherit', fontSize: 13, color: T.deep, background: T.white, cursor: 'pointer' }}>
                  {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <button
                onClick={handleAddToCart}
                style={{ width: '100%', height: 44, background: cartAdded ? T.goldDark : T.gold, color: '#fff', borderRadius: 2, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, transition: 'background 0.2s' }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zm0 0h12M16 10a4 4 0 01-8 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                {cartAdded ? 'Go to Cart' : 'Add to Cart'}
              </button>

              <button
                onClick={() => {
                  const text = `Hello Al Noor, I would like to enquire about ${p.name} (Ref: ${p.ref}).`;
                  window.open(`https://wa.me/919067960830?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                }}
                style={{ width: '100%', height: 44, background: T.parchment, color: T.goldDark, border: `1.5px solid ${T.gold}`, borderRadius: 2, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 16, transition: 'all 0.2s' }}
              >
                Enquire to Buy
              </button>

              <hr style={{ border: 'none', borderTop: `1px solid ${T.borderLight}`, margin: '0 0 16px' }} />

              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.8 }}>
                <strong style={{ color: T.deep }}>Sold by</strong> Al Noor Atelier<br />
                <strong style={{ color: T.deep }}>Ships from</strong> Geneva, Switzerland<br />
                <strong style={{ color: T.deep }}>Payment</strong> Cash on Delivery (COD) via Delhivery<br />
                <strong style={{ color: T.deep }}>Warranty</strong> 5 Years — Al Noor Service
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 11, color: T.muted, borderTop: `1px solid ${T.borderLight}`, paddingTop: 14 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Secure, insured &amp; discreet delivery
              </div>
            </div>
          </div>
        </div>

        {/* ── Specs Table ── */}
        <Section title="Technical Specifications" isMobile={isMobile}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {Object.entries(specs).map(([key, val]) => (
                <tr key={key} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                  <td style={{ padding: '11px 16px', fontSize: 13, verticalAlign: 'top', width: isMobile ? 120 : 220, color: T.muted, fontWeight: 500, background: T.parchment, whiteSpace: isMobile ? 'normal' : 'nowrap' }}>{key}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, verticalAlign: 'top', color: T.deep, background: T.white }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ── Reviews ── */}
        <Section title="Customer Reviews" isMobile={isMobile}>
          {/* Overview */}
          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', padding: 20, background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, marginBottom: 20 }}>
            <div style={{ textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 52, fontWeight: 700, color: T.deep, lineHeight: 1 }}>{p.rating.toFixed(1)}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 2, margin: '6px 0 4px' }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <svg key={i} viewBox="0 0 12 12" width="16" height="16" fill={i < Math.floor(p.rating) ? '#f0a500' : '#ddd'}>
                    <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5" />
                  </svg>
                ))}
              </div>
              <div style={{ fontSize: 12, color: T.muted }}>{p.reviews.toLocaleString()} ratings</div>
            </div>
            <div style={{ flex: 1 }}>
              {ratingBars.map(([star, pct]) => (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ width: 30, color: T.mid, textAlign: 'right', flexShrink: 0 }}>{star}★</span>
                  <div style={{ flex: 1, height: 6, background: T.parchment2, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct * 100}%`, background: T.green, borderRadius: 3 }} />
                  </div>
                  <span style={{ width: 30, color: T.muted, flexShrink: 0 }}>{Math.round(p.reviews * pct)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review cards */}
          {REVIEWS.map((r, i) => (
            <div key={i} style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, padding: '18px 20px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.goldPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: T.goldDark, flexShrink: 0 }}>{r.init}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.deep }}>{r.name}</div>
                  <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                    {Array.from({ length: 5 }, (_, j) => (
                      <svg key={j} viewBox="0 0 12 12" width="12" height="12" fill={j < r.rating ? '#f0a500' : '#ddd'}><polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5" /></svg>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: T.light }}>{r.date}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: T.green, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg viewBox="0 0 12 12" width="12" height="12" fill={T.green}><path d="M10 3L5 8.5 2 5.5" stroke={T.green} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                  Verified Purchase
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.deep, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: T.mid, lineHeight: 1.6 }}>{r.body}</div>
              <div style={{ marginTop: 10, fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 12 }}>
                Was this helpful?
                {[{ emoji: '👍', label: `Yes (${helpfulVotes[i] ? r.helpful + 1 : r.helpful})`, key: true }, { emoji: '👎', label: 'No', key: false }].map(btn => (
                  <button key={String(btn.key)} onClick={() => { setHelpfulVotes(v => ({ ...v, [i]: btn.key })); showToast('Thank you for your feedback') }}
                    style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4, border: `1px solid ${T.borderLight}`, borderRadius: 2, padding: '3px 10px', background: 'none', cursor: 'pointer' }}>
                    {btn.emoji} {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Section>

        {/* ── Related products ── */}
        <Section title="Similar Timepieces" isMobile={isMobile}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 12 }}>
            {relatedFinal.map(q => (
              <Link key={q.id} href={`/product/${q.dbId ?? q.id}`} style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: 2, boxShadow: T.shadowSm, overflow: 'hidden', textDecoration: 'none', color: T.deep, display: 'block', transition: 'box-shadow 0.2s, transform 0.2s' }}>
                <div style={{ aspectRatio: '1', background: T.parchment, position: 'relative', overflow: 'hidden' }}>
                  {q.images?.[0] ? (
                    <Image src={toImageUrl(q.images[0])} alt={q.name} fill style={{ objectFit: 'cover' }} sizes="200px" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                      <WatchFace dial={q.dial} size={90} />
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 13, color: T.deep, marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.deep }}>{formatPrice(q.price)}</div>
                  <div style={{ fontSize: 11, color: T.green, fontWeight: 500 }}>{discount(q.price, q.original)}% off</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Toast ── */}
      {toast ? (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: T.deep, color: T.ivory, padding: '10px 24px', borderRadius: 2, fontSize: 13, fontWeight: 500, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      ) : null}
    </div>
  )
}

function Section({ title, children, isMobile }: { title: string; children: React.ReactNode; isMobile?: boolean }) {
  return (
    <div style={{ marginTop: 28, padding: isMobile ? '0 16px' : 0 }}>
      <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: '#1A1410', paddingBottom: 12, borderBottom: '2px solid #9E7F4A', marginBottom: 16, letterSpacing: '0.02em' }}>{title}</div>
      {children}
    </div>
  )
}

function StarIcon({ size = 11 }: { size?: number }) {
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} fill="#fff">
      <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5" />
    </svg>
  )
}
