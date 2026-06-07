'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { WatchFace } from '@/components/ui/WatchFace'
import { formatPrice, type DialColor, type Product } from '@/lib/products-data'
import { useCart } from '@/lib/cart-store'
import { useSession } from 'next-auth/react'
import { useLogout } from '@/hooks/useLogout'

const DISPLAY = "'Bodoni Moda', Georgia, serif"
const BODY    = "'EB Garamond', Georgia, serif"
const UI      = "'Raleway', system-ui, sans-serif"
const ARABIC  = "'Amiri', Georgia, serif"

const CATEGORIES: { label: string; sub: string; dial: DialColor; count: number }[] = [
  { label: 'Tourbillon',         sub: 'The pinnacle of watchmaking',    dial: 'Fumé Blue',       count: 6 },
  { label: 'Grand Feu Enamel',   sub: 'Fired at 900°C, born luminous', dial: 'Grand Feu Ivory', count: 4 },
  { label: 'Perpetual Calendar', sub: 'A century without adjustment',   dial: 'Champagne',       count: 5 },
  { label: 'Minute Repeater',    sub: 'Time expressed through sound',   dial: 'Sandstone',       count: 3 },
  { label: 'Chronograph',        sub: 'Precision engineered for speed', dial: 'Onyx Black',      count: 5 },
]

const PILLARS = [
  { num: '01', title: '100% Original',    body: 'Every watch we sell is genuine — sourced directly, verified before it reaches you.' },
  { num: '02', title: 'Best Price',       body: 'Up to 45% off on all watches. No hidden costs, no compromise on authenticity.' },
  { num: '03', title: 'Insured Delivery', body: 'Fast shipping with full insurance, discreet packaging, and signature on arrival.' },
  { num: '04', title: 'Easy Returns',     body: '30 days, no questions. We believe a watch must feel right on your wrist.' },
]

const TESTIMONIALS = [
  { name: 'Arjun M.',   city: 'Mumbai',    text: "Got my watch at almost half the price I'd seen elsewhere. 100% genuine, delivered fast. Al Noor is my go-to now.",                              stars: 5, product: 'Verified Buyer' },
  { name: 'Fatima R.',  city: 'Hyderabad', text: 'I was skeptical ordering a luxury watch online. Al Noor changed that — from the call confirmation to unboxing, everything was perfect.',       stars: 5, product: 'Verified Buyer' },
  { name: 'Vikram S.',  city: 'Delhi',     text: 'Best prices I found anywhere in India. The watch arrived in pristine condition, exactly as shown. Highly recommend.',                           stars: 5, product: 'Verified Buyer' },
]

export function HomepageClient({ featured = [] }: { featured?: Product[] }) {
  const { totalItems } = useCart()
  const { data: session } = useSession()
  const { logout } = useLogout()
  const [navScrolled, setNavScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navTextColor  = navScrolled ? 'text-mid' : 'text-ivory'
  const navIconStroke = navScrolled ? '#1A1410' : '#FAF7F2'

  return (
    <div className="min-h-screen bg-ivory text-deep overflow-x-hidden">

      {/* ── Font imports (homepage-only) ── */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* ══════════════════════════════════════════
          NAV
      ══════════════════════════════════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'bg-ivory/97 border-b border-gold/18 shadow-[0_2px_20px_rgba(26,20,16,0.08)] backdrop-blur-md' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-350 mx-auto px-6 md:px-8 h-18 flex items-center justify-between relative">

          {/* Wordmark */}
          <Link href="/" className="no-underline flex flex-col leading-none">
            <span className="text-gold font-bold tracking-[0.4em] text-[17px]" style={{ fontFamily: UI }}>AL NOOR</span>
            <span className="text-gold-dark tracking-widest text-[13px] mt-px" style={{ fontFamily: ARABIC }}>النور</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-9">
            {[
              { href: '/products',                             label: 'Collections' },
              { href: '/products?category=Tourbillon',        label: 'Tourbillons' },
              { href: '/products?category=Grand+Feu+Enamel',  label: 'Grand Feu' },
              { href: '/track-order',                          label: 'Track Order' },
            ].map(l => (
              <Link key={l.href} href={l.href} className={`nav-link text-[12px] font-semibold tracking-widest uppercase no-underline transition-colors ${navTextColor}`} style={{ fontFamily: UI }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-5">
            {/* Auth — desktop only */}
            <div className="hidden md:flex items-center gap-4">
              {session?.user ? (
                <>
                  <Link href="/account" className={`text-[12px] font-semibold tracking-[0.08em] no-underline ${navTextColor}`} style={{ fontFamily: UI }}>
                    {session.user.name?.split(' ')[0] ?? 'Account'}
                  </Link>
                  <button onClick={() => logout('/')} className={`text-[12px] font-medium bg-transparent border-none cursor-pointer tracking-[0.06em] ${navScrolled ? 'text-muted-warm' : 'text-ivory/70'}`} style={{ fontFamily: UI }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" className={`text-[12px] font-semibold tracking-[0.08em] no-underline ${navTextColor}`} style={{ fontFamily: UI }}>
                  Sign In
                </Link>
              )}
            </div>

            {/* Cart */}
            <Link href="/cart" className="relative no-underline">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={navIconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {totalItems() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gold text-white text-[9px] font-bold rounded-full flex items-center justify-center" style={{ fontFamily: UI }}>
                  {totalItems()}
                </span>
              )}
            </Link>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 bg-transparent border-none cursor-pointer"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-px transition-all duration-300 ${navScrolled ? 'bg-deep' : 'bg-ivory'} ${menuOpen ? 'rotate-45 translate-y-1.75' : ''}`} />
              <span className={`block w-5 h-px transition-all duration-300 ${navScrolled ? 'bg-deep' : 'bg-ivory'} ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-px transition-all duration-300 ${navScrolled ? 'bg-deep' : 'bg-ivory'} ${menuOpen ? '-rotate-45 -translate-y-1.75' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-screen' : 'max-h-0'} ${navScrolled ? 'bg-ivory/97 backdrop-blur-md' : 'bg-dark/95 backdrop-blur-md'}`}>
          <div className="px-6 py-5 flex flex-col gap-0">
            {[
              { href: '/products',                            label: 'Collections' },
              { href: '/products?category=Tourbillon',       label: 'Tourbillons' },
              { href: '/products?category=Grand+Feu+Enamel', label: 'Grand Feu' },
              { href: '/track-order',                         label: 'Track Order' },
              { href: '/login',                               label: 'Sign In' },
            ].map(l => (
              <Link
                key={l.href} href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`text-[13px] font-semibold tracking-widest uppercase no-underline py-3 border-b border-gold/10 ${navScrolled ? 'text-mid' : 'text-ivory'}`}
                style={{ fontFamily: UI }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          TICKER TAPE
      ══════════════════════════════════════════ */}
      <div className="fixed top-18 left-0 right-0 z-40 bg-gold h-8 flex items-center overflow-hidden">
        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="inline-block animate-ticker">
            {Array(4).fill(null).map((_, i) => (
              <span key={i} className="text-white text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ fontFamily: UI }}>
                &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Free Worldwide Insured Delivery&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;100% Original Watches&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Up to 45% Off&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;30-Day Free Returns&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Best Price Guaranteed
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden pt-26"
        style={{ background: 'linear-gradient(165deg, #0D0B09 0%, #1F1A14 45%, #2A1F12 100%)' }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(158,127,74,0.08) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(158,127,74,0.05) 0%, transparent 50%)' }} />
        {/* Decorative lines */}
        <div className="absolute top-[15%] left-[5%] w-px h-[35%]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(158,127,74,0.3), transparent)' }} />
        <div className="absolute top-[20%] right-[5%] w-px h-[25%]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(158,127,74,0.2), transparent)' }} />

        <div className="w-full max-w-350 mx-auto px-5 md:px-8 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">

          {/* Left: text */}
          <div>
            <div className="animate-fade-up text-[28px] opacity-90 mb-5 text-gold tracking-[0.08em]" style={{ fontFamily: ARABIC }}>
              النور — ضوء لا ينطفئ
            </div>

            <h1 className="animate-fade-up text-ivory font-bold italic leading-[1.05] m-0 mb-2 tracking-[-0.01em] text-[clamp(2.8rem,6vw,5.5rem)]" style={{ fontFamily: DISPLAY }}>
              Luxury Watches,
            </h1>
            <h1 className="animate-fade-up-d1 text-gold font-normal leading-[1.05] m-0 mb-8 tracking-[-0.01em] text-[clamp(2.8rem,6vw,5.5rem)]" style={{ fontFamily: DISPLAY }}>
              Real Prices.
            </h1>

            <p className="animate-fade-up-d2 italic text-ivory/72 leading-[1.75] max-w-110 mb-12 text-[clamp(1rem,1.6vw,1.25rem)]" style={{ fontFamily: BODY }}>
              Premium timepieces at honest prices — walk into our store or order online.
              Every watch 100% original, every sale backed by our guarantee.
            </p>

            <div className="animate-fade-up-d3 flex gap-4 flex-wrap">
              <Link href="/products" className="inline-block no-underline text-dark bg-gold px-10 py-4 text-[12px] font-bold tracking-[0.18em] uppercase rounded-[1px] transition-all hover:bg-gold-dark">
                Shop Now
              </Link>
              <Link href="/products" className="inline-block no-underline text-ivory border border-ivory/30 px-9 py-4 text-[12px] font-semibold tracking-[0.14em] uppercase rounded-[1px] transition-all hover:border-ivory/60">
                Browse Collection
              </Link>
            </div>

            <div className="flex gap-6 md:gap-10 mt-12 md:mt-14 pt-8 md:pt-10 border-t border-gold/20">
              {[
                { n: '45%',  label: 'Off All Watches' },
                { n: '100%', label: 'Original Pieces' },
                { n: '5★',   label: 'Customer Rating' },
              ].map(s => (
                <div key={s.n}>
                  <div className="text-gold font-bold italic text-[28px] leading-none" style={{ fontFamily: DISPLAY }}>{s.n}</div>
                  <div className="text-ivory/45 text-[10px] font-semibold tracking-[0.12em] uppercase mt-1" style={{ fontFamily: UI }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: store image */}
          <div className="animate-fade-in-d flex justify-center items-center pb-24">
            <div className="w-[110%] md:w-[115%] rounded-sm overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(158,127,74,0.2)]">
              <Image
                src="/image.png"
                alt="Al Noor Luxury Watches Store"
                width={1200}
                height={800}
                className="w-full h-auto block"
                priority
              />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-ivory/40 text-[9px] font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: UI }}>Discover</span>
          <div className="w-px h-12 animate-shimmer" style={{ background: 'linear-gradient(to bottom, rgba(158,127,74,0.6), transparent)' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURED WATCHES
      ══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-5 md:px-8 bg-ivory">
        <div className="max-w-350 mx-auto">

          <div className="flex items-end justify-between mb-12 md:mb-16">
            <div>
              <p className="text-gold text-[10px] font-bold tracking-[0.25em] uppercase mb-3" style={{ fontFamily: UI }}>Highest Rated</p>
              <h2 className="text-deep italic leading-[1.1] m-0 text-[clamp(2rem,4vw,3.5rem)]" style={{ fontFamily: DISPLAY }}>Our Finest Pieces</h2>
            </div>
            <Link href="/products" className="text-gold no-underline text-[11px] font-bold tracking-[0.14em] uppercase pb-0.5 border-b border-gold whitespace-nowrap mb-2" style={{ fontFamily: UI }}>
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((product, idx) => (
              <Link key={product.id} href={`/product/${product.dbId ?? product.id}`} className="product-card no-underline block" style={{ animation: `fadeUp .7s ${idx * 0.1}s cubic-bezier(.22,.68,0,1.2) both` }}>
                <div className="bg-white border border-gold/10 rounded-xs overflow-hidden shadow-[0_2px_12px_rgba(26,20,16,0.05)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(26,20,16,0.12)] hover:-translate-y-1">
                  {/* Watch display */}
                  <div className="bg-parchment py-9 flex justify-center items-center relative overflow-hidden">
                    <div className="absolute top-3.5 left-3.5 text-ivory bg-deep/75 text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-[1px]" style={{ fontFamily: UI }}>
                      {product.category}
                    </div>
                    {product.badge && (
                      <div className={`absolute top-3.5 right-3.5 text-white text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-[1px] ${product.badgeType === 'sale' ? 'bg-danger' : 'bg-gold'}`} style={{ fontFamily: UI }}>
                        {product.badge}
                      </div>
                    )}
                    <div className="card-watch">
                      <WatchFace dial={product.dial} size={150} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="px-5 pt-5 pb-6">
                    <div className="text-gold text-[9px] font-bold tracking-[0.12em] uppercase mb-1.5" style={{ fontFamily: UI }}>
                      Al Noor · {product.material}
                    </div>
                    <div className="text-deep italic text-[16px] leading-[1.3] mb-3" style={{ fontFamily: DISPLAY }}>
                      {product.name}
                    </div>
                    <div className="flex items-center gap-1 mb-3.5">
                      <span className="text-gold text-[11px]">{'★'.repeat(Math.floor(product.rating))}</span>
                      <span className="text-muted-warm text-[11px]" style={{ fontFamily: UI }}>({product.reviews})</span>
                    </div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-deep text-[16px] font-bold" style={{ fontFamily: UI }}>{formatPrice(product.price)}</span>
                      <span className="text-light-warm text-[12px] line-through" style={{ fontFamily: UI }}>{formatPrice(product.original)}</span>
                    </div>
                    <div className="text-success text-[11px] font-semibold mt-0.5" style={{ fontFamily: UI }}>
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
      <section className="relative py-16 md:py-24 px-5 md:px-8 bg-dark overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-0.75" style={{ background: 'linear-gradient(to bottom, transparent, #9E7F4A, transparent)' }} />

        <div className="max-w-350 mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-24 items-center">
          {/* Text */}
          <div>
            <p className="text-gold text-[10px] font-bold tracking-[0.28em] uppercase mb-5" style={{ fontFamily: UI }}>Our Heritage</p>
            <h2 className="text-ivory italic leading-[1.15] mb-7 text-[clamp(2rem,3.5vw,3rem)]" style={{ fontFamily: DISPLAY }}>
              Born from the<br />Arabic word for Light
            </h2>
            <p className="text-ivory/65 text-[18px] leading-[1.85] mb-5" style={{ fontFamily: BODY }}>
              Al Noor — النور — means the light. It is both a name and a philosophy.
              Every watch we carry reflects this idea: that time, truly measured, illuminates life.
            </p>
            <p className="text-ivory/50 text-[18px] italic leading-[1.85] mb-10" style={{ fontFamily: BODY }}>
              We bring premium timepieces to discerning buyers — each piece genuine,
              each price honest, each delivery protected.
            </p>
            <Link href="/products" className="inline-flex items-center gap-2 text-gold no-underline text-[11px] font-bold tracking-[0.18em] uppercase border-b border-gold pb-1" style={{ fontFamily: UI }}>
              Discover the Collection
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9E7F4A" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          {/* Watch cluster — hidden on mobile */}
          <div className="hidden md:flex justify-center items-center relative h-90">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <WatchFace dial="Onyx Black" size={200} />
            </div>
            <div className="absolute top-5 right-5 z-20 opacity-70">
              <WatchFace dial="Champagne" size={110} />
            </div>
            <div className="absolute bottom-5 left-5 z-20 opacity-65">
              <WatchFace dial="Fumé Blue" size={100} />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-75 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(158,127,74,0.08) 0%, transparent 70%)' }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CATEGORY TILES
      ══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-5 md:px-8 bg-parchment">
        <div className="max-w-350 mx-auto">
          <div className="text-center mb-14 md:mb-16">
            <p className="text-gold text-[10px] font-bold tracking-[0.25em] uppercase mb-3" style={{ fontFamily: UI }}>Shop by Complication</p>
            <h2 className="text-deep italic m-0 text-[clamp(2rem,4vw,3.5rem)]" style={{ fontFamily: DISPLAY }}>Find Your Movement</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat, idx) => (
              <Link key={cat.label} href={`/products?category=${encodeURIComponent(cat.label)}`} className="cat-tile no-underline" style={{ animation: `fadeUp .7s ${idx * 0.08}s cubic-bezier(.22,.68,0,1.2) both` }}>
                <div className="bg-white border border-gold/10 rounded-xs px-5 pt-8 pb-6 text-center shadow-[0_1px_8px_rgba(26,20,16,0.04)] transition-all duration-300 hover:shadow-[0_6px_24px_rgba(26,20,16,0.09)] hover:-translate-y-0.5">
                  <div className="cat-watch inline-block mb-5">
                    <WatchFace dial={cat.dial} size={100} />
                  </div>
                  <div className="text-deep italic text-[15px] leading-[1.3] mb-2" style={{ fontFamily: DISPLAY }}>{cat.label}</div>
                  <div className="text-muted-warm text-[10px] leading-normal mb-3" style={{ fontFamily: UI }}>{cat.sub}</div>
                  <div className="text-gold text-[10px] font-bold tracking-widest" style={{ fontFamily: UI }}>{cat.count} pieces →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CRAFTSMANSHIP PILLARS
      ══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-5 md:px-8 bg-ivory">
        <div className="max-w-350 mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-gold text-[10px] font-bold tracking-[0.25em] uppercase mb-3" style={{ fontFamily: UI }}>Why Al Noor</p>
            <h2 className="text-deep italic m-0 text-[clamp(2rem,4vw,3.5rem)]" style={{ fontFamily: DISPLAY }}>Our Promise to You</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
            {PILLARS.map((p, idx) => (
              <div
                key={p.num}
                className={`px-8 py-10 ${idx > 0 ? 'border-t sm:border-t-0 sm:border-l border-gold/10' : ''}`}
                style={{ animation: `fadeUp .7s ${idx * 0.1}s cubic-bezier(.22,.68,0,1.2) both` }}
              >
                <div className="text-gold-pale font-bold italic text-[40px] leading-none mb-5" style={{ fontFamily: DISPLAY }}>{p.num}</div>
                <div className="text-deep text-[13px] font-bold tracking-[0.06em] uppercase mb-3" style={{ fontFamily: UI }}>{p.title}</div>
                <div className="text-mid text-[16px] leading-[1.75]" style={{ fontFamily: BODY }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-5 md:px-8 bg-dark">
        <div className="max-w-350 mx-auto">
          <div className="text-center mb-14 md:mb-16">
            <p className="text-gold text-[10px] font-bold tracking-[0.25em] uppercase mb-3" style={{ fontFamily: UI }}>Owners Speak</p>
            <h2 className="text-ivory italic m-0 text-[clamp(2rem,4vw,3rem)]" style={{ fontFamily: DISPLAY }}>Those Who Wear the Light</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={t.name}
                className="bg-ivory/4 border border-gold/15 rounded-xs px-8 py-9"
                style={{ animation: `fadeUp .7s ${idx * 0.12}s cubic-bezier(.22,.68,0,1.2) both` }}
              >
                <div className="text-gold text-[14px] tracking-[2px] mb-5">{'★'.repeat(t.stars)}</div>
                <p className="text-ivory/80 text-[18px] italic leading-[1.8] mb-7" style={{ fontFamily: BODY }}>"{t.text}"</p>
                <div className="border-t border-gold/15 pt-5">
                  <div className="text-ivory text-[12px] font-bold tracking-[0.06em]" style={{ fontFamily: UI }}>{t.name}</div>
                  <div className="text-muted-warm text-[10px] mt-0.5" style={{ fontFamily: UI }}>{t.city}</div>
                  <div className="text-gold text-[10px] mt-1.5 tracking-wider" style={{ fontFamily: UI }}>{t.product}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BAND
      ══════════════════════════════════════════ */}
      <section className="py-16 md:py-20 px-5 md:px-8 bg-gold text-center">
        <div className="max-w-175 mx-auto">
          <div className="text-deep/25 text-[32px] mb-3" style={{ fontFamily: ARABIC }}>النور</div>
          <h2 className="text-dark italic m-0 mb-4 text-[clamp(2rem,4vw,3rem)]" style={{ fontFamily: DISPLAY }}>Your Timepiece Awaits</h2>
          <p className="text-dark/65 text-[18px] leading-[1.7] mb-10" style={{ fontFamily: BODY }}>
            Premium watches at honest prices.<br />Shop online or visit our store today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/products" className="inline-block no-underline text-white bg-dark px-11 py-4 text-[12px] font-bold tracking-[0.18em] uppercase rounded-[1px] transition-opacity hover:opacity-80" style={{ fontFamily: UI }}>
              Shop Now
            </Link>
            <Link href="/track-order" className="inline-block no-underline text-dark border-[1.5px] border-dark px-9 py-4 text-[12px] font-semibold tracking-[0.14em] uppercase rounded-[1px] transition-opacity hover:opacity-70" style={{ fontFamily: UI }}>
              Track Your Order
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="bg-dark px-5 md:px-8 pt-16 md:pt-20 pb-10 text-ivory/50">
        <div className="max-w-350 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-14 mb-14 md:mb-16">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="text-gold font-bold text-[16px] tracking-[0.4em] mb-0.5" style={{ fontFamily: UI }}>AL NOOR</div>
              <div className="text-gold-dark text-[16px] mb-5" style={{ fontFamily: ARABIC }}>النور</div>
              <p className="text-[15px] italic leading-[1.7] max-w-70" style={{ fontFamily: BODY }}>
                Premium watches at honest prices. 100% original, every piece verified before it reaches you.
              </p>
            </div>

            {/* Collections */}
            <div>
              <div className="text-ivory text-[10px] font-bold tracking-[0.2em] uppercase mb-5" style={{ fontFamily: UI }}>Collections</div>
              {['All Watches', 'Tourbillon', 'Grand Feu Enamel', 'Perpetual Calendar', 'Chronograph'].map(l => (
                <Link key={l} href={`/products${l !== 'All Watches' ? `?category=${encodeURIComponent(l)}` : ''}`}
                  className="block text-ivory/45 no-underline text-[12px] mb-2.5 tracking-[0.04em] hover:text-ivory/80 transition-colors" style={{ fontFamily: UI }}>
                  {l}
                </Link>
              ))}
            </div>

            {/* Support */}
            <div>
              <div className="text-ivory text-[10px] font-bold tracking-[0.2em] uppercase mb-5" style={{ fontFamily: UI }}>Support</div>
              {[
                { label: 'Track Order',    href: '/track-order' },
                { label: 'My Account',     href: '/account' },
                { label: 'My Orders',      href: '/orders' },
                { label: 'Returns Policy', href: '/products' },
                { label: 'Contact Us',     href: 'mailto:care@alnoor.com' },
              ].map(l => (
                <Link key={l.label} href={l.href}
                  className="block text-ivory/45 no-underline text-[12px] mb-2.5 tracking-[0.04em] hover:text-ivory/80 transition-colors" style={{ fontFamily: UI }}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Contact */}
            <div>
              <div className="text-ivory text-[10px] font-bold tracking-[0.2em] uppercase mb-5" style={{ fontFamily: UI }}>Visit Us</div>
              <div className="text-[12px] leading-[1.9] text-ivory/45" style={{ fontFamily: UI }}>
                Azad Nagar, Akbar Ashrafi<br />
                Masjid Ke Kone Par<br />
                Jilani Chowk<br /><br />
                <a href="tel:9067960830" className="text-gold no-underline hover:opacity-80">9067960830</a><br />
                <span className="text-[11px]">MD Zeeshan</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gold/12 pt-7 flex flex-col sm:flex-row justify-between items-center gap-3 flex-wrap">
            <span className="text-[11px] tracking-[0.06em]" style={{ fontFamily: UI }}>
              © {new Date().getFullYear()} Al Noor Luxury Watches. All rights reserved.
            </span>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Sale', 'Authenticity'].map(l => (
                <span key={l} className="text-[11px] tracking-[0.06em] cursor-pointer hover:text-ivory/80 transition-colors" style={{ fontFamily: UI }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
