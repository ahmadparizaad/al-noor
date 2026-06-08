'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { WatchFace } from '@/components/ui/WatchFace'
import {
  CATEGORIES, MATERIALS, DIAL_OPTIONS,
  formatPrice, discount,
  type Category, type Material, type DialColor, type Product,
} from '@/lib/products-data'
import { useCart } from '@/lib/cart-store'
import { useBreakpoint } from '@/hooks/useBreakpoint'

type SortKey = 'relevance' | 'popularity' | 'price-asc' | 'price-desc' | 'newest'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'relevance',  label: 'Relevance'        },
  { key: 'popularity', label: 'Popularity'        },
  { key: 'price-asc',  label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'newest',     label: 'Newest First'      },
]

interface Filters {
  categories: Category[]
  materials: Material[]
  dials: DialColor[]
  minRating: number | null
  priceMax: number
}

const INITIAL_FILTERS: Filters = {
  categories: [],
  materials: [],
  dials: [],
  minRating: null,
  priceMax: 130000,
}

export function ProductsClient({ products: allProducts }: { products: Product[] }) {
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState<SortKey>('relevance')
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS)
  const [wished, setWished]   = useState<Set<number>>(new Set())
  const [toast, setToast]     = useState<string | null>(null)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const { addItem, totalItems } = useCart()
  const { isMobile, isTablet } = useBreakpoint()
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(['category', 'price', 'material', 'dial', 'rating'])
  )

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  function toggleGroup(key: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleCategory(cat: Category) {
    setFilters(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }))
  }

  function toggleMaterial(mat: Material) {
    setFilters(f => ({
      ...f,
      materials: f.materials.includes(mat)
        ? f.materials.filter(m => m !== mat)
        : [...f.materials, mat],
    }))
  }

  function toggleDial(dial: DialColor) {
    setFilters(f => ({
      ...f,
      dials: f.dials.includes(dial)
        ? f.dials.filter(d => d !== dial)
        : [...f.dials, dial],
    }))
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS)
    showToast('All filters cleared')
  }

  const activeChips = useMemo(() => {
    const chips: { label: string; clear: () => void }[] = []
    filters.categories.forEach(c => chips.push({ label: c, clear: () => toggleCategory(c) }))
    filters.materials.forEach(m => chips.push({ label: m, clear: () => toggleMaterial(m) }))
    filters.dials.forEach(d => chips.push({ label: d, clear: () => toggleDial(d) }))
    if (filters.minRating) chips.push({
      label: `${filters.minRating}★ & above`,
      clear: () => setFilters(f => ({ ...f, minRating: null }))
    })
    if (filters.priceMax < 130000) chips.push({
      label: `Up to ₹${filters.priceMax.toLocaleString('en-IN')}`,
      clear: () => setFilters(f => ({ ...f, priceMax: 130000 }))
    })
    return chips
  }, [filters])

  const filtered = useMemo(() => {
    let list: Product[] = [...allProducts]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.ref.toLowerCase().includes(q) ||
        p.dial.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q)
      )
    }

    if (filters.categories.length) list = list.filter(p => filters.categories.includes(p.category))
    if (filters.materials.length)  list = list.filter(p => filters.materials.includes(p.material))
    if (filters.dials.length)      list = list.filter(p => filters.dials.includes(p.dial))
    if (filters.minRating)         list = list.filter(p => p.rating >= filters.minRating!)
    list = list.filter(p => p.price <= filters.priceMax)

    switch (sort) {
      case 'popularity': list.sort((a, b) => b.reviews - a.reviews);   break
      case 'price-asc':  list.sort((a, b) => a.price - b.price);       break
      case 'price-desc': list.sort((a, b) => b.price - a.price);       break
      case 'newest':     list.sort((a, b) => b.id - a.id);             break
    }

    return list
  }, [search, filters, sort])

  const toggleWish = useCallback((id: number, name: string, e: React.MouseEvent) => {
    e.preventDefault()
    setWished(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); showToast('Removed from wishlist') }
      else              { next.add(id);    showToast('♥ Added to wishlist')   }
      return next
    })
  }, [])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allProducts.forEach(p => { counts[p.category] = (counts[p.category] ?? 0) + 1 })
    return counts
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#F0EBE2', fontFamily: "'Raleway', sans-serif" }}>

      {/* ── Nav ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: '#FAF7F2', borderBottom: '1px solid rgba(158,127,74,0.18)', boxShadow: '0 1px 4px rgba(26,20,16,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px', height: isMobile ? 56 : 64, display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24 }}>
          <Link href="/" style={{ fontWeight: 600, fontSize: isMobile ? 13 : 15, letterSpacing: '0.35em', color: '#9E7F4A', whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none' }}>
            AL NOOR
            {!isMobile && <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.15em', color: '#8C7B65', fontWeight: 400, marginTop: 1 }}>Luxury Watches</span>}
          </Link>

          {/* Search */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder={isMobile ? 'Search watches…' : 'Search watches, collections, references…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', height: isMobile ? 36 : 40, border: '1.5px solid rgba(158,127,74,0.18)', borderRadius: 2, padding: '0 44px 0 14px', fontSize: 13, color: '#1A1410', background: '#fff', outline: 'none' }}
            />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: '#9E7F4A', borderRadius: '0 2px 2px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/></svg>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 28, flexShrink: 0 }}>
            {!isMobile && <Link href="/" style={{ fontSize: 13, fontWeight: 500, color: '#5C4F3A', letterSpacing: '0.04em', textDecoration: 'none' }}>Home</Link>}
            {!isMobile && <Link href="/products" style={{ fontSize: 13, fontWeight: 500, color: '#9E7F4A', letterSpacing: '0.04em', textDecoration: 'none' }}>Watches</Link>}
            <Link href="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#5C4F3A' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              {totalItems() > 0 ? (
                <span style={{ position: 'absolute', top: -6, right: -8, background: '#9E7F4A', color: '#fff', borderRadius: '50%', width: 17, height: 17, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {totalItems()}
                </span>
              ) : null}
            </Link>
            {!isMobile && <a href="mailto:enquire@alnoor.com" style={{ background: '#9E7F4A', color: '#FAF7F2', padding: '8px 20px', borderRadius: 2, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>Enquire</a>}
          </nav>
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8C7B65' }}>
        <Link href="/" style={{ color: '#8C7B65', textDecoration: 'none' }}>Home</Link>
        <span style={{ color: '#B8A99A' }}>›</span>
        <span style={{ color: '#1A1410', fontWeight: 500 }}>Luxury Timepieces</span>
      </div>

      {/* ── Mobile filter bar ── */}
      {isMobile ? (
        <div style={{ padding: '0 16px 10px', display: 'flex', gap: 10 }}>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            style={{ flex: 1, height: 40, border: '1.5px solid rgba(158,127,74,0.25)', borderRadius: 2, background: '#fff', fontSize: 13, fontWeight: 600, color: '#5C4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            Filters {activeChips.length > 0 ? `(${activeChips.length})` : ''}
          </button>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            style={{ flex: 1, height: 40, border: '1.5px solid rgba(158,127,74,0.25)', borderRadius: 2, background: '#fff', fontSize: 13, color: '#1A1410', padding: '0 12px', cursor: 'pointer', outline: 'none' }}
          >
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      ) : null}

      {/* ── Mobile filter drawer ── */}
      {isMobile && filterDrawerOpen ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={() => setFilterDrawerOpen(false)} />
          <div style={{ width: 300, background: '#fff', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(158,127,74,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1410' }}>Filters</span>
              <div style={{ display: 'flex', gap: 12 }}>
                {activeChips.length > 0 ? <button onClick={clearFilters} style={{ fontSize: 12, color: '#9E7F4A', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>Clear All</button> : null}
                <button onClick={() => setFilterDrawerOpen(false)} style={{ fontSize: 20, lineHeight: 1, color: '#8C7B65', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            <FilterGroup label="Category" open={openGroups.has('category')} onToggle={() => toggleGroup('category')}>
              {CATEGORIES.map(cat => <FilterOption key={`drawer-cat-${cat}`} label={cat} count={categoryCounts[cat] ?? 0} checked={filters.categories.includes(cat)} onChange={() => toggleCategory(cat)} />)}
            </FilterGroup>
            <FilterGroup label="Price" open={openGroups.has('price')} onToggle={() => toggleGroup('price')}>
              <div style={{ padding: '4px 0 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5C4F3A', marginBottom: 10, fontWeight: 500 }}>
                  <span>₹0</span><span>₹{filters.priceMax.toLocaleString('en-IN')}</span>
                </div>
                <input type="range" min={20000} max={130000} step={5000} value={filters.priceMax} onChange={e => setFilters(f => ({ ...f, priceMax: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#9E7F4A', cursor: 'pointer' }} />
              </div>
            </FilterGroup>
            <FilterGroup label="Case Material" open={openGroups.has('material')} onToggle={() => toggleGroup('material')}>
              {MATERIALS.map(mat => <FilterOption key={`drawer-mat-${mat}`} label={mat} checked={filters.materials.includes(mat)} onChange={() => toggleMaterial(mat)} />)}
            </FilterGroup>
            <FilterGroup label="Dial Colour" open={openGroups.has('dial')} onToggle={() => toggleGroup('dial')}>
              {DIAL_OPTIONS.map(dial => <FilterOption key={`drawer-dial-${dial}`} label={dial} checked={filters.dials.includes(dial)} onChange={() => toggleDial(dial)} />)}
            </FilterGroup>
            <FilterGroup label="Rating" open={openGroups.has('rating')} onToggle={() => toggleGroup('rating')}>
              {[4, 3].map(r => (
                <label key={`drawer-rating-${r}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
                  <input type="radio" name="rating-drawer" checked={filters.minRating === r} onChange={() => setFilters(f => ({ ...f, minRating: f.minRating === r ? null : r }))} style={{ accentColor: '#9E7F4A', cursor: 'pointer' }} />
                  <StarRow count={r} /><span style={{ fontSize: 13, color: '#5C4F3A' }}>& above</span>
                </label>
              ))}
            </FilterGroup>
            <div style={{ padding: 16, borderTop: '1px solid rgba(158,127,74,0.10)', position: 'sticky', bottom: 0, background: '#fff' }}>
              <button onClick={() => setFilterDrawerOpen(false)} style={{ width: '100%', height: 44, background: '#9E7F4A', color: '#fff', border: 'none', borderRadius: 2, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em' }}>
                Show {filtered.length} Result{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Page body ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '0 16px 80px' : '0 24px 48px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── Sidebar (desktop/tablet only) ── */}
        {!isMobile ? <aside style={{ width: isTablet ? 200 : 240, flexShrink: 0, position: 'sticky', top: 76, background: '#fff', border: '1px solid rgba(158,127,74,0.10)', borderRadius: 2, boxShadow: '0 1px 4px rgba(26,20,16,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(158,127,74,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1410' }}>Filters</span>
            {activeChips.length > 0 ? (
              <button onClick={clearFilters} style={{ fontSize: 12, color: '#9E7F4A', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>Clear All</button>
            ) : null}
          </div>

          {/* Category */}
          <FilterGroup label="Category" open={openGroups.has('category')} onToggle={() => toggleGroup('category')}>
            {CATEGORIES.map(cat => (
              <FilterOption
                key={`sidebar-cat-${cat}`}
                label={cat}
                count={categoryCounts[cat] ?? 0}
                checked={filters.categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
            ))}
          </FilterGroup>

          {/* Price */}
          <FilterGroup label="Price" open={openGroups.has('price')} onToggle={() => toggleGroup('price')}>
            <div style={{ padding: '4px 0 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5C4F3A', marginBottom: 10, fontWeight: 500 }}>
                <span>₹0</span>
                <span>₹{filters.priceMax.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={20000}
                max={130000}
                step={5000}
                value={filters.priceMax}
                onChange={e => setFilters(f => ({ ...f, priceMax: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#9E7F4A', cursor: 'pointer' }}
              />
            </div>
          </FilterGroup>

          {/* Case Material */}
          <FilterGroup label="Case Material" open={openGroups.has('material')} onToggle={() => toggleGroup('material')}>
            {MATERIALS.map(mat => (
              <FilterOption
                key={`sidebar-mat-${mat}`}
                label={mat}
                checked={filters.materials.includes(mat)}
                onChange={() => toggleMaterial(mat)}
              />
            ))}
          </FilterGroup>

          {/* Dial Colour */}
          <FilterGroup label="Dial Colour" open={openGroups.has('dial')} onToggle={() => toggleGroup('dial')}>
            {DIAL_OPTIONS.map(dial => (
              <FilterOption
                key={`sidebar-dial-${dial}`}
                label={dial}
                checked={filters.dials.includes(dial)}
                onChange={() => toggleDial(dial)}
              />
            ))}
          </FilterGroup>

          {/* Rating */}
          <FilterGroup label="Rating" open={openGroups.has('rating')} onToggle={() => toggleGroup('rating')}>
            {[4, 3].map(r => (
              <label key={`sidebar-rating-${r}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="rating"
                  checked={filters.minRating === r}
                  onChange={() => setFilters(f => ({ ...f, minRating: f.minRating === r ? null : r }))}
                  style={{ accentColor: '#9E7F4A', cursor: 'pointer' }}
                />
                <StarRow count={r} />
                <span style={{ fontSize: 13, color: '#5C4F3A' }}>& above</span>
              </label>
            ))}
          </FilterGroup>
        </aside> : null}

        {/* ── Main ── */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* Sort bar (desktop/tablet only — mobile uses dropdown above) */}
          {!isMobile ? (
            <div style={{ background: '#fff', border: '1px solid rgba(158,127,74,0.10)', borderRadius: 2, padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 0, marginBottom: 12, boxShadow: '0 1px 4px rgba(26,20,16,0.06)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1410', marginRight: 20, whiteSpace: 'nowrap' }}>Sort By</span>
              <div style={{ display: 'flex', flex: 1, overflowX: 'auto' }}>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    style={{
                      padding: '0 16px',
                      height: 52,
                      fontSize: 13,
                      fontWeight: sort === opt.key ? 600 : 500,
                      color: sort === opt.key ? '#9E7F4A' : '#5C4F3A',
                      background: 'none',
                      border: 'none',
                      borderBottom: `3px solid ${sort === opt.key ? '#9E7F4A' : 'transparent'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8C7B65', whiteSpace: 'nowrap' }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#8C7B65', marginBottom: 8 }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </div>
          )}

          {/* Active filter chips */}
          {activeChips.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {activeChips.map((chip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid rgba(158,127,74,0.18)', borderRadius: 20, padding: '4px 12px 4px 14px', fontSize: 12, color: '#5C4F3A', fontWeight: 500 }}>
                  {chip.label}
                  <button onClick={chip.clear} style={{ width: 16, height: 16, borderRadius: '50%', background: '#E8E0D4', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: 10, color: '#8C7B65' }}>✕</button>
                </div>
              ))}
            </div>
          ) : null}

          {/* Product Grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#8C7B65' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⌚</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1A1410', marginBottom: 8 }}>No watches found</div>
              <div style={{ fontSize: 13 }}>Try adjusting your filters or search query</div>
              <button onClick={clearFilters} style={{ marginTop: 20, padding: '10px 24px', background: '#9E7F4A', color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.06em' }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 8 : 12 }}>
              {filtered.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wished={wished.has(p.id)}
                  onWish={(e) => toggleWish(p.id, p.name, e)}
                  onCart={() => { addItem(p); showToast(`Added to cart: ${p.name.split(' ').slice(0, 3).join(' ')}…`) }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast ? (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1A1410', color: '#FAF7F2', padding: '10px 24px', borderRadius: 2, fontSize: 13, fontWeight: 500, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      ) : null}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function FilterGroup({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(158,127,74,0.10)' }}>
      <div onClick={onToggle} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1410', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ width: 10, height: 10, borderRight: '1.5px solid #8C7B65', borderBottom: '1.5px solid #8C7B65', transform: open ? 'rotate(45deg)' : 'rotate(-135deg)', transition: 'transform 0.2s', marginTop: open ? -3 : 3 }} />
      </div>
      {open && <div style={{ padding: '4px 20px 14px' }}>{children}</div>}
    </div>
  )
}

function FilterOption({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 15, height: 15, accentColor: '#9E7F4A', cursor: 'pointer', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#5C4F3A', flex: 1 }}>{label}</span>
      {count !== undefined && <span style={{ fontSize: 11, color: '#B8A99A' }}>{count}</span>}
    </label>
  )
}

function StarRow({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 12 12" width="13" height="13" fill={i < count ? '#f0a500' : '#ddd'}>
          <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5" />
        </svg>
      ))}
    </div>
  )
}

function ProductCard({ product: p, wished, onWish, onCart }: {
  product: Product
  wished: boolean
  onWish: (e: React.MouseEvent) => void
  onCart: () => void
}) {
  const disc = discount(p.price, p.original)
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={`/product/${p.dbId ?? p.id}`}
      style={{
        background: '#fff',
        border: '1px solid rgba(158,127,74,0.10)',
        borderRadius: 2,
        boxShadow: hovered ? '0 8px 32px rgba(26,20,16,0.12)' : '0 1px 4px rgba(26,20,16,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow 0.2s, transform 0.2s',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        color: '#1A1410',
        textDecoration: 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Badge */}
      {p.badge ? (
        <div style={{ position: 'absolute', top: 10, left: 10, background: p.badgeType === 'new' ? '#27864A' : p.badgeType === 'sale' ? '#C0392B' : '#9E7F4A', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 1, zIndex: 3 }}>
          {p.badge}
        </div>
      ) : null}

      {/* Wishlist */}
      <button
        onClick={onWish}
        aria-label="Add to wishlist"
        style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', zIndex: 3, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s', border: 'none', cursor: 'pointer' }}
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill={wished ? '#C0392B' : 'none'} stroke={wished ? '#C0392B' : '#8C7B65'} strokeWidth="1.8">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>

      {/* Image */}
      <div style={{ width: '100%', aspectRatio: '1', background: '#F0EBE2', position: 'relative', overflow: 'hidden' }}>
        {p.images?.[0] ? (
          <Image
            src={p.images[0]}
            alt={p.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <WatchFace dial={p.dial} size={140} />
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5, borderTop: '1px solid rgba(158,127,74,0.10)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9E7F4A' }}>Al Noor</div>
        <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, fontWeight: 500, color: '#1A1410', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {p.name}
        </div>
        <div style={{ fontSize: 10, color: '#B8A99A', letterSpacing: '0.06em' }}>{p.ref} · {p.material}</div>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#27864A', color: '#fff', borderRadius: 3, padding: '2px 6px', fontSize: 11, fontWeight: 700 }}>
            {p.rating}
            <svg viewBox="0 0 12 12" width="9" height="9" fill="#fff"><polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5" /></svg>
          </span>
          <span style={{ fontSize: 11, color: '#B8A99A' }}>({p.reviews.toLocaleString()})</span>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1410' }}>{formatPrice(p.price)}</span>
          <span style={{ fontSize: 12, color: '#B8A99A', textDecoration: 'line-through' }}>{formatPrice(p.original)}</span>
          <span style={{ fontSize: 12, color: '#27864A', fontWeight: 600 }}>{disc}% off</span>
        </div>

        {/* Delivery */}
        <div style={{ fontSize: 11, color: '#8C7B65' }}>
          <strong style={{ color: '#27864A', fontWeight: 600 }}>{p.delivery}</strong> by tomorrow
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={(e) => { e.preventDefault(); onCart() }}
            style={{ flex: 1, height: 36, background: '#9E7F4A', color: '#fff', borderRadius: 2, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zm0 0h12M16 10a4 4 0 01-8 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
            Add
          </button>
          <button
            onClick={(e) => { e.preventDefault(); window.location.href = `/product/${p.id}` }}
            style={{ flex: 1, height: 36, background: '#F0EBE2', color: '#7A5C2E', border: '1px solid #9E7F4A', borderRadius: 2, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </Link>
  )
}
