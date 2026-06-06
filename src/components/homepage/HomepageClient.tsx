'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { WatchFace } from '@/components/ui/WatchFace'
import { PRODUCTS, formatPrice, type DialColor } from '@/lib/products-data'
import { useCart } from '@/lib/cart-store'
import { useSession } from 'next-auth/react'
import { useLogout } from '@/hooks/useLogout'

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  ivory:       '#FAF7F2',
  parchment:   '#F0EBE2',
  parchment2:  '#E8E0D4',
  deep:        '#1A1410',
  mid:         '#5C4F3A',
  muted:       '#8C7B65',
  light:       '#B8A99A',
  gold:        '#9E7F4A',
  goldDark:    '#7A5C2E',
  goldPale:    '#EDD9B8',
  border:      'rgba(158,127,74,0.18)',
  borderLight: 'rgba(158,127,74,0.10)',
  white:       '#FFFFFF',
  dark:        '#0D0B09',
  darkMid:     '#1F1A14',
}

// ── Font helpers ──────────────────────────────────────────────────────────────
// Homepage zone: Bodoni Moda (display) + EB Garamond (body) + Raleway (UI) + Amiri (Arabic)
// These fonts are loaded as @font-face by next/font — reference by family name directly
const DISPLAY  = "'Bodoni Moda', Georgia, serif"
const BODY     = "'EB Garamond', Georgia, serif"
const UI       = "'Raleway', system-ui, sans-serif"
const ARABIC   = "'Amiri', Georgia, serif"

// ── Featured products (top 4 by rating) ──────────────────────────────────────
const FEATURED = [...PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, 4)

// ── Category tiles ────────────────────────────────────────────────────────────
const CATEGORIES: { label: string; sub: string; dial: DialColor; count: number }[] = [
  { label: 'Tourbillon',         sub: 'The pinnacle of watchmaking',    dial: 'Fumé Blue',       count: 6 },
  { label: 'Grand Feu Enamel',   sub: 'Fired at 900°C, born luminous', dial: 'Grand Feu Ivory', count: 4 },
  { label: 'Perpetual Calendar', sub: 'A century without adjustment',   dial: 'Champagne',       count: 5 },
  { label: 'Minute Repeater',    sub: 'Time expressed through sound',   dial: 'Sandstone',       count: 3 },
  { label: 'Chronograph',        sub: 'Precision engineered for speed', dial: 'Onyx Black',      count: 5 },
]

// ── Craftsmanship pillars ─────────────────────────────────────────────────────
const PILLARS = [
  { num: '01', title: 'Geneva Atelier', body: 'Every movement assembled by hand in our workshops, where the Rhône meets the Arve.' },
  { num: '02', title: '5-Year Warranty', body: 'Unconditional servicing and movement replacement. Precision protected, forever.' },
  { num: '03', title: 'Insured Delivery', body: 'DHL Express with full insurance, discreet packaging, signature on arrival.' },
  { num: '04', title: 'Free Returns', body: '30 days, no questions. We believe a watch must feel right on your wrist.' },
]

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Arjun M.', city: 'Mumbai', text: 'The Noor III arrived in impeccable packaging. The tourbillon movement is visible and breathtaking. Worth every rupee.', stars: 5, product: 'Noor III Onyx Grand Tourbillon' },
  { name: 'Fatima R.', city: 'Hyderabad', text: 'I was skeptical ordering a watch of this value online. Al Noor changed that — from the call confirmation to unboxing.', stars: 5, product: 'Lumière I Grand Feu Enamel' },
  { name: 'Vikram S.', city: 'Delhi', text: 'The Hilal Tourbillon is simply the finest thing I own. The fumé blue dial shifts under light like water.', stars: 5, product: 'Hilal Tourbillon Blue' },
]

export function HomepageClient() {
  const { totalItems } = useCart()
  const { data: session } = useSession()
  const { logout } = useLogout()
  const [navScrolled, setNavScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  // Sticky nav shadow on scroll
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: T.ivory, color: T.deep, overflowX: 'hidden' }}>

      {/* ── GLOBAL FONT IMPORTS (homepage-only) ── */}
      {/* EB Garamond and Amiri aren't in root layout — load them here */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');

        @keyframes fadeUp   { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes shimmer  { 0%,100% { opacity:0.5 } 50% { opacity:1 } }
        @keyframes pulse    { 0%,100% { transform:scale(1) } 50% { transform:scale(1.04) } }
        @keyframes scrollX  { from { transform:translateX(0) } to { transform:translateX(-50%) } }

        .hero-headline    { animation: fadeUp 1.1s cubic-bezier(.22,.68,0,1.2) both }
        .hero-sub         { animation: fadeUp 1.1s .22s cubic-bezier(.22,.68,0,1.2) both }
        .hero-ctas        { animation: fadeUp 1.1s .4s cubic-bezier(.22,.68,0,1.2) both }
        .hero-watch       { animation: fadeIn 1.6s .3s ease both }
        .section-reveal   { animation: fadeUp .9s cubic-bezier(.22,.68,0,1.2) both }

        .product-card:hover .card-watch { transform: scale(1.06); transition: transform .4s ease }
        .product-card .card-watch       { transition: transform .4s ease }
        .cat-tile:hover .cat-watch      { transform: scale(1.1) rotate(-3deg); transition: transform .5s ease }
        .cat-tile .cat-watch            { transition: transform .5s ease }
        .nav-link::after { content:''; display:block; height:1px; background:#9E7F4A; transform:scaleX(0); transition:transform .2s; transform-origin:left }
        .nav-link:hover::after { transform:scaleX(1) }

        .ticker-wrap { overflow:hidden; white-space:nowrap }
        .ticker-inner { display:inline-block; animation: scrollX 28s linear infinite }
      `}</style>

      {/* ══════════════════════════════════════════
          NAV
      ══════════════════════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        background: navScrolled ? 'rgba(250,247,242,0.97)' : 'transparent',
        borderBottom: navScrolled ? `1px solid ${T.border}` : '1px solid transparent',
        boxShadow: navScrolled ? '0 2px 20px rgba(26,20,16,0.08)' : 'none',
        backdropFilter: navScrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.35s ease',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Wordmark */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontFamily: UI, fontWeight: 700, fontSize: 17, letterSpacing: '0.4em', color: T.gold }}>AL NOOR</span>
            <span style={{ fontFamily: ARABIC, fontSize: 13, color: T.goldDark, letterSpacing: '0.1em', marginTop: 1 }}>النور</span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {[
              { href: '/products', label: 'Collections' },
              { href: '/products?category=Tourbillon', label: 'Tourbillons' },
              { href: '/products?category=Grand+Feu+Enamel', label: 'Grand Feu' },
              { href: '/track-order', label: 'Track Order' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="nav-link" style={{ fontFamily: UI, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: navScrolled ? T.mid : T.ivory, textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {session?.user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Link href="/account" style={{ fontFamily: UI, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: navScrolled ? T.mid : T.ivory, textDecoration: 'none' }}>
                  {session.user.name?.split(' ')[0] ?? 'Account'}
                </Link>
                <button onClick={() => logout('/')} style={{ fontFamily: UI, fontSize: 12, fontWeight: 500, color: navScrolled ? T.muted : 'rgba(250,247,242,0.7)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em' }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" style={{ fontFamily: UI, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: navScrolled ? T.mid : T.ivory, textDecoration: 'none' }}>
                Sign In
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" style={{ position: 'relative', textDecoration: 'none' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={navScrolled ? T.deep : T.ivory} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {totalItems() > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, background: T.gold, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: UI }}>
                  {totalItems()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          TICKER TAPE
      ══════════════════════════════════════════ */}
      <div style={{ position: 'fixed', top: 72, left: 0, right: 0, zIndex: 490, background: T.gold, height: 32, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div className="ticker-wrap" style={{ width: '100%' }}>
          <div className="ticker-inner">
            {Array(4).fill(null).map((_, i) => (
              <span key={i} style={{ fontFamily: UI, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#fff' }}>
                &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Free Worldwide Insured Delivery&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;5-Year Movement Warranty&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Handcrafted in Geneva&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;30-Day Free Returns&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Certified Authentic
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section ref={heroRef} style={{
        minHeight: '100vh',
        background: `linear-gradient(165deg, ${T.dark} 0%, ${T.darkMid} 45%, #2A1F12 100%)`,
        display: 'flex', alignItems: 'center',
        paddingTop: 104,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(158,127,74,0.08) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(158,127,74,0.05) 0%, transparent 50%)', pointerEvents: 'none' }} />

        {/* Decorative thin lines */}
        <div style={{ position: 'absolute', top: '15%', left: '5%', width: 1, height: '35%', background: 'linear-gradient(to bottom, transparent, rgba(158,127,74,0.3), transparent)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '5%', width: 1, height: '25%', background: 'linear-gradient(to bottom, transparent, rgba(158,127,74,0.2), transparent)' }} />

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '60px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', width: '100%' }}>

          {/* Left: text */}
          <div>
            {/* Arabic eyebrow */}
            <div className="hero-headline" style={{ fontFamily: ARABIC, fontSize: 28, color: T.gold, letterSpacing: '0.08em', marginBottom: 20, opacity: 0.9 }}>
              النور — ضوء لا ينطفئ
            </div>

            {/* Main headline */}
            <h1 className="hero-headline" style={{ fontFamily: DISPLAY, fontSize: 'clamp(3rem, 6vw, 5.5rem)', fontStyle: 'italic', fontWeight: 700, color: T.ivory, lineHeight: 1.05, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
              Time, Cast
            </h1>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(3rem, 6vw, 5.5rem)', fontWeight: 400, color: T.gold, lineHeight: 1.05, margin: '0 0 32px', letterSpacing: '-0.01em', animation: 'fadeUp 1.1s .1s cubic-bezier(.22,.68,0,1.2) both' }}>
              in Light.
            </h1>

            {/* Subheading */}
            <p className="hero-sub" style={{ fontFamily: BODY, fontSize: 'clamp(1rem, 1.6vw, 1.25rem)', fontStyle: 'italic', color: 'rgba(250,247,242,0.72)', lineHeight: 1.75, maxWidth: 440, marginBottom: 48 }}>
              Each Al Noor timepiece emerges from our Geneva atelier — hand-assembled,
              enamel-fired, and destined for a single wrist. Fewer than 400 pieces per year.
            </p>

            {/* CTAs */}
            <div className="hero-ctas" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/products" style={{
                fontFamily: UI, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: T.dark, background: T.gold,
                padding: '16px 40px', borderRadius: 1, textDecoration: 'none',
                display: 'inline-block',
                transition: 'background 0.2s, transform 0.15s',
              }}>
                Explore the Collection
              </Link>
              <Link href="/products?category=Tourbillon" style={{
                fontFamily: UI, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: T.ivory, border: '1px solid rgba(250,247,242,0.3)',
                padding: '16px 36px', borderRadius: 1, textDecoration: 'none',
                display: 'inline-block',
                transition: 'border-color 0.2s',
              }}>
                View Tourbillons
              </Link>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 40, marginTop: 56, paddingTop: 40, borderTop: '1px solid rgba(158,127,74,0.2)' }}>
              {[
                { n: '<400', label: 'Pieces / Year' },
                { n: '1978', label: 'Est. Geneva' },
                { n: '5★', label: 'Certified Rating' },
              ].map(s => (
                <div key={s.n}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 28, fontStyle: 'italic', color: T.gold, fontWeight: 700 }}>{s.n}</div>
                  <div style={{ fontFamily: UI, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(250,247,242,0.45)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero watch display */}
          <div className="hero-watch" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            {/* Glow ring */}
            <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(158,127,74,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', border: '1px solid rgba(158,127,74,0.15)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 390, height: 390, borderRadius: '50%', border: '1px solid rgba(158,127,74,0.07)', pointerEvents: 'none' }} />

            {/* Main watch */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <WatchFace dial="Fumé Blue" size={280} />
            </div>

            {/* Floating product badge */}
            <div style={{
              position: 'absolute', bottom: 30, right: -20, zIndex: 3,
              background: 'rgba(26,20,16,0.85)', backdropFilter: 'blur(12px)',
              border: `1px solid ${T.border}`, borderRadius: 2,
              padding: '14px 20px', minWidth: 200,
            }}>
              <div style={{ fontFamily: UI, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gold, marginBottom: 4 }}>Noor III · Featured</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 15, fontStyle: 'italic', color: T.ivory }}>Grand Tourbillon</div>
              <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: T.gold, marginTop: 6 }}>{formatPrice(34800)}</div>
              <Link href="/product/3" style={{ fontFamily: UI, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.light, textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>View Details →</Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: UI, fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,247,242,0.4)' }}>Discover</span>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(158,127,74,0.6), transparent)', animation: 'shimmer 2s ease-in-out infinite' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURED WATCHES
      ══════════════════════════════════════════ */}
      <section style={{ padding: '100px 32px', background: T.ivory }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 60 }}>
            <div>
              <p style={{ fontFamily: UI, fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: T.gold, marginBottom: 12 }}>
                Highest Rated
              </p>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontStyle: 'italic', color: T.deep, margin: 0, lineHeight: 1.1 }}>
                Our Finest Pieces
              </h2>
            </div>
            <Link href="/products" style={{ fontFamily: UI, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gold, textDecoration: 'none', paddingBottom: 2, borderBottom: `1px solid ${T.gold}`, whiteSpace: 'nowrap', marginBottom: 8 }}>
              View All →
            </Link>
          </div>

          {/* Product grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {FEATURED.map((product, idx) => (
              <Link key={product.id} href={`/product/${product.id}`} className="product-card" style={{ textDecoration: 'none', display: 'block', animation: `fadeUp .7s ${idx * 0.1}s cubic-bezier(.22,.68,0,1.2) both` }}>
                <div style={{
                  background: T.white, border: `1px solid ${T.borderLight}`,
                  borderRadius: 2, overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(26,20,16,0.05)',
                  transition: 'box-shadow .3s ease, transform .3s ease',
                }}>
                  {/* Watch display */}
                  <div style={{ background: T.parchment, padding: '36px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    {/* Category badge */}
                    <div style={{ position: 'absolute', top: 14, left: 14, fontFamily: UI, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(26,20,16,0.75)', color: T.ivory, padding: '3px 10px', borderRadius: 1 }}>
                      {product.category}
                    </div>
                    {product.badge && (
                      <div style={{ position: 'absolute', top: 14, right: 14, fontFamily: UI, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: product.badgeType === 'sale' ? '#C0392B' : T.gold, color: '#fff', padding: '3px 10px', borderRadius: 1 }}>
                        {product.badge}
                      </div>
                    )}
                    <div className="card-watch">
                      <WatchFace dial={product.dial} size={150} />
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '20px 20px 24px' }}>
                    <div style={{ fontFamily: UI, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, marginBottom: 6 }}>
                      Al Noor · {product.material}
                    </div>
                    <div style={{ fontFamily: DISPLAY, fontSize: 16, fontStyle: 'italic', color: T.deep, lineHeight: 1.3, marginBottom: 12 }}>
                      {product.name}
                    </div>

                    {/* Stars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
                      <span style={{ color: T.gold, fontSize: 11 }}>{'★'.repeat(Math.floor(product.rating))}</span>
                      <span style={{ fontFamily: UI, fontSize: 11, color: T.muted }}>({product.reviews})</span>
                    </div>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontFamily: UI, fontSize: 16, fontWeight: 700, color: T.deep }}>{formatPrice(product.price)}</span>
                      <span style={{ fontFamily: UI, fontSize: 12, color: T.light, textDecoration: 'line-through' }}>{formatPrice(product.original)}</span>
                    </div>
                    <div style={{ fontFamily: UI, fontSize: 11, color: '#27864A', fontWeight: 600, marginTop: 2 }}>
                      {Math.round((1 - product.price / product.original) * 100)}% off · Free delivery
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BRAND STORY — DARK BAND
      ══════════════════════════════════════════ */}
      <section style={{ background: T.dark, padding: '100px 32px', position: 'relative', overflow: 'hidden' }}>
        {/* Gold accent line */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(to bottom, transparent, ${T.gold}, transparent)` }} />

        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 100, alignItems: 'center' }}>
          {/* Text */}
          <div>
            <p style={{ fontFamily: UI, fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: T.gold, marginBottom: 20 }}>
              Our Heritage
            </p>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontStyle: 'italic', color: T.ivory, lineHeight: 1.15, marginBottom: 28 }}>
              Born from the<br />Arabic word for Light
            </h2>
            <p style={{ fontFamily: BODY, fontSize: 18, color: 'rgba(250,247,242,0.65)', lineHeight: 1.85, marginBottom: 20 }}>
              Al Noor — النور — means the light. It is both a name and a philosophy.
              Every watch we make carries this idea: that time, truly measured, illuminates life.
            </p>
            <p style={{ fontFamily: BODY, fontSize: 18, fontStyle: 'italic', color: 'rgba(250,247,242,0.5)', lineHeight: 1.85, marginBottom: 40 }}>
              Founded in Geneva in 1978 by master watchmaker Hassan Al-Rashid, our atelier
              produces fewer than 400 movements per year. Each one signed. Each one numbered.
            </p>
            <Link href="/products" style={{ fontFamily: UI, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gold, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${T.gold}`, paddingBottom: 4 }}>
              Discover the Collection
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          {/* Watch cluster */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: 360 }}>
            {/* Large center */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 3 }}>
              <WatchFace dial="Onyx Black" size={200} />
            </div>
            {/* Small orbiting */}
            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 2, opacity: 0.7 }}>
              <WatchFace dial="Champagne" size={110} />
            </div>
            <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 2, opacity: 0.65 }}>
              <WatchFace dial="Fumé Blue" size={100} />
            </div>
            {/* Glow */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(158,127,74,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CATEGORY TILES
      ══════════════════════════════════════════ */}
      <section style={{ padding: '100px 32px', background: T.parchment }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: UI, fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: T.gold, marginBottom: 12 }}>
              Shop by Complication
            </p>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontStyle: 'italic', color: T.deep, margin: 0 }}>
              Find Your Movement
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {CATEGORIES.map((cat, idx) => (
              <Link key={cat.label} href={`/products?category=${encodeURIComponent(cat.label)}`} className="cat-tile" style={{ textDecoration: 'none', animation: `fadeUp .7s ${idx * 0.08}s cubic-bezier(.22,.68,0,1.2) both` }}>
                <div style={{
                  background: T.white, border: `1px solid ${T.borderLight}`,
                  borderRadius: 2, padding: '32px 20px 24px',
                  textAlign: 'center',
                  boxShadow: '0 1px 8px rgba(26,20,16,0.04)',
                  transition: 'box-shadow .3s, transform .3s',
                }}>
                  <div className="cat-watch" style={{ display: 'inline-block', marginBottom: 20 }}>
                    <WatchFace dial={cat.dial} size={100} />
                  </div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, fontStyle: 'italic', color: T.deep, lineHeight: 1.3, marginBottom: 8 }}>
                    {cat.label}
                  </div>
                  <div style={{ fontFamily: UI, fontSize: 10, color: T.muted, lineHeight: 1.5, marginBottom: 12 }}>
                    {cat.sub}
                  </div>
                  <div style={{ fontFamily: UI, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: T.gold }}>
                    {cat.count} pieces →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CRAFTSMANSHIP PILLARS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '100px 32px', background: T.ivory }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <p style={{ fontFamily: UI, fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: T.gold, marginBottom: 12 }}>
              Why Al Noor
            </p>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontStyle: 'italic', color: T.deep, margin: 0 }}>
              Crafted Without Compromise
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
            {PILLARS.map((p, idx) => (
              <div key={p.num} style={{ padding: '40px 36px', borderLeft: idx > 0 ? `1px solid ${T.borderLight}` : 'none', animation: `fadeUp .7s ${idx * 0.1}s cubic-bezier(.22,.68,0,1.2) both` }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 40, fontStyle: 'italic', color: T.goldPale, fontWeight: 700, lineHeight: 1, marginBottom: 20 }}>
                  {p.num}
                </div>
                <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.deep, marginBottom: 12 }}>
                  {p.title}
                </div>
                <div style={{ fontFamily: BODY, fontSize: 16, color: T.mid, lineHeight: 1.75 }}>
                  {p.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '100px 32px', background: T.dark }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: UI, fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: T.gold, marginBottom: 12 }}>
              Owners Speak
            </p>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(2rem, 4vw, 3rem)', fontStyle: 'italic', color: T.ivory, margin: 0 }}>
              Those Who Wear the Light
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {TESTIMONIALS.map((t, idx) => (
              <div key={t.name} style={{
                background: 'rgba(250,247,242,0.04)', border: `1px solid rgba(158,127,74,0.15)`,
                borderRadius: 2, padding: '36px 32px',
                animation: `fadeUp .7s ${idx * 0.12}s cubic-bezier(.22,.68,0,1.2) both`,
              }}>
                {/* Stars */}
                <div style={{ color: T.gold, fontSize: 14, marginBottom: 20, letterSpacing: 2 }}>{'★'.repeat(t.stars)}</div>
                {/* Quote */}
                <p style={{ fontFamily: BODY, fontSize: 18, fontStyle: 'italic', color: 'rgba(250,247,242,0.8)', lineHeight: 1.8, marginBottom: 28 }}>
                  "{t.text}"
                </p>
                {/* Author */}
                <div style={{ borderTop: '1px solid rgba(158,127,74,0.15)', paddingTop: 20 }}>
                  <div style={{ fontFamily: UI, fontSize: 12, fontWeight: 700, color: T.ivory, letterSpacing: '0.06em' }}>{t.name}</div>
                  <div style={{ fontFamily: UI, fontSize: 10, color: T.muted, marginTop: 2 }}>{t.city}</div>
                  <div style={{ fontFamily: UI, fontSize: 10, color: T.gold, marginTop: 6, letterSpacing: '0.05em' }}>{t.product}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BAND
      ══════════════════════════════════════════ */}
      <section style={{ padding: '80px 32px', background: T.gold, textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontFamily: ARABIC, fontSize: 32, color: 'rgba(26,20,16,0.25)', marginBottom: 12 }}>النور</div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(2rem, 4vw, 3rem)', fontStyle: 'italic', color: T.dark, margin: '0 0 16px' }}>
            Your Timepiece Awaits
          </h2>
          <p style={{ fontFamily: BODY, fontSize: 18, color: 'rgba(26,20,16,0.65)', lineHeight: 1.7, marginBottom: 40 }}>
            Fewer than 400 movements leave our atelier each year.<br/>Once a piece is gone, it is gone.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" style={{ fontFamily: UI, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#fff', background: T.dark, padding: '16px 44px', borderRadius: 1, textDecoration: 'none' }}>
              Shop Now
            </Link>
            <Link href="/track-order" style={{ fontFamily: UI, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.dark, border: `1.5px solid ${T.dark}`, padding: '16px 36px', borderRadius: 1, textDecoration: 'none' }}>
              Track Your Order
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ background: T.dark, padding: '72px 32px 40px', color: 'rgba(250,247,242,0.5)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 60, marginBottom: 60 }}>

            {/* Brand column */}
            <div>
              <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 16, letterSpacing: '0.4em', color: T.gold, marginBottom: 2 }}>AL NOOR</div>
              <div style={{ fontFamily: ARABIC, fontSize: 16, color: T.goldDark, marginBottom: 20 }}>النور</div>
              <p style={{ fontFamily: BODY, fontSize: 15, fontStyle: 'italic', lineHeight: 1.7, maxWidth: 280 }}>
                Handcrafted Swiss timepieces. Fewer than 400 movements per year. Each one signed by the master.
              </p>
            </div>

            {/* Collections */}
            <div>
              <div style={{ fontFamily: UI, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.ivory, marginBottom: 20 }}>Collections</div>
              {['All Watches', 'Tourbillon', 'Grand Feu Enamel', 'Perpetual Calendar', 'Chronograph'].map(l => (
                <Link key={l} href={`/products${l !== 'All Watches' ? `?category=${encodeURIComponent(l)}` : ''}`} style={{ display: 'block', fontFamily: UI, fontSize: 12, color: 'rgba(250,247,242,0.45)', textDecoration: 'none', marginBottom: 10, letterSpacing: '0.04em', transition: 'color .2s' }}>
                  {l}
                </Link>
              ))}
            </div>

            {/* Support */}
            <div>
              <div style={{ fontFamily: UI, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.ivory, marginBottom: 20 }}>Support</div>
              {[
                { label: 'Track Order', href: '/track-order' },
                { label: 'My Account', href: '/account' },
                { label: 'My Orders', href: '/orders' },
                { label: 'Returns Policy', href: '/products' },
                { label: 'Contact Us', href: 'mailto:care@alnoor.com' },
              ].map(l => (
                <Link key={l.label} href={l.href} style={{ display: 'block', fontFamily: UI, fontSize: 12, color: 'rgba(250,247,242,0.45)', textDecoration: 'none', marginBottom: 10, letterSpacing: '0.04em' }}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Contact */}
            <div>
              <div style={{ fontFamily: UI, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.ivory, marginBottom: 20 }}>Atelier</div>
              <div style={{ fontFamily: UI, fontSize: 12, lineHeight: 1.9, color: 'rgba(250,247,242,0.45)' }}>
                Rue du Rhône 48<br />
                CH-1204 Geneva<br />
                Switzerland<br /><br />
                <a href="mailto:care@alnoor.com" style={{ color: T.gold, textDecoration: 'none' }}>care@alnoor.com</a><br />
                <span style={{ fontSize: 11 }}>Mon–Fri · 10:00–18:00 CET</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(158,127,74,0.12)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontFamily: UI, fontSize: 11, letterSpacing: '0.06em' }}>
              © {new Date().getFullYear()} Al Noor Horology. All rights reserved.
            </span>
            <div style={{ display: 'flex', gap: 24 }}>
              {['Privacy Policy', 'Terms of Sale', 'Authenticity'].map(l => (
                <span key={l} style={{ fontFamily: UI, fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
