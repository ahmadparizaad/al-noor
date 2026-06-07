'use client'

import { Fragment, useState } from 'react'
import { AdminProduct } from '@/types/admin'
import { formatPrice } from '@/lib/products-data'
import { useCatalogue } from '@/lib/catalogue-context'

interface InventoryClientProps {
  initialProducts: AdminProduct[]
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
  green: '#27864A',
  red: '#C0392B',
  orange: '#D97706',
  border: 'rgba(158,127,74,0.18)',
  borderGold: 'rgba(158,127,74,0.35)',
  shadowSm: '0 1px 4px rgba(26,20,16,0.06)',
  shadowMd: '0 4px 24px rgba(26,20,16,0.14)',
}

const DATA = "'Inter', system-ui, sans-serif"
const UI = "'Raleway', system-ui, sans-serif"

type FilterType = 'all' | 'active' | 'inactive' | 'sale'

interface ProductForm {
  name: string
  ref: string
  category: string
  material: string
  dial: string
  priceInr: string
  originalPriceInr: string
  stock: string
  badge: string
  isActive: boolean
}

const EMPTY_FORM: ProductForm = {
  name: '',
  ref: '',
  category: '',
  material: '',
  dial: '',
  priceInr: '',
  originalPriceInr: '',
  stock: '1',
  badge: '',
  isActive: true,
}

function productToForm(p: AdminProduct): ProductForm {
  return {
    name: p.name,
    ref: p.ref,
    category: p.category,
    material: p.material,
    dial: p.dial,
    priceInr: String(p.priceInr),
    originalPriceInr: String(p.originalPriceInr),
    stock: String(p.stock),
    badge: p.badge,
    isActive: p.isActive,
  }
}

export default function InventoryClient({ initialProducts }: InventoryClientProps) {
  const { categories, materials, dialOptions, badges } = useCatalogue()
  const [filter, setFilter] = useState<FilterType>('all')
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts)
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [stockInput, setStockInput] = useState<string>('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [statusConfirm, setStatusConfirm] = useState<string | null>(null)

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'create' | 'edit'>('create')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true
    if (filter === 'active') return p.isActive
    if (filter === 'inactive') return !p.isActive
    if (filter === 'sale') return p.badge === 'sale'
    return true
  })

  // --- Stock inline edit ---
  const handleStockEdit = (id: string, currentStock: number) => {
    setEditingStockId(id)
    setStockInput(String(currentStock))
  }

  const handleStockSave = (id: string) => {
    const newStock = parseInt(stockInput, 10)
    if (!isNaN(newStock) && newStock >= 0) {
      setProducts(products.map(p => (p.id === id ? { ...p, stock: newStock } : p)))
    }
    setEditingStockId(null)
    setStockInput('')
  }

  // --- Status toggle with confirmation ---
  const confirmToggle = (id: string) => {
    setDeleteConfirmId(null)
    setStatusConfirm(statusConfirm === id ? null : id)
  }

  const handleToggleActive = (id: string) => {
    setProducts(products.map(p => (p.id === id ? { ...p, isActive: !p.isActive } : p)))
    setStatusConfirm(null)
  }

  // --- Delete ---
  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id))
    setDeleteConfirmId(null)
  }

  // --- Panel open/close ---
  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      category: categories[0] ?? '',
      material: materials[0] ?? '',
      dial: dialOptions[0] ?? '',
    })
    setFormError(null)
    setPanelMode('create')
    setEditingProductId(null)
    setPanelOpen(true)
  }

  const openEdit = (product: AdminProduct) => {
    setForm(productToForm(product))
    setFormError(null)
    setPanelMode('edit')
    setEditingProductId(product.id)
    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
    setFormError(null)
  }

  const setField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // --- Validation & save ---
  const handleSubmit = () => {
    if (!form.name.trim()) { setFormError('Watch name is required.'); return }
    if (!form.ref.trim()) { setFormError('Reference number is required.'); return }
    const price = parseInt(form.priceInr, 10)
    const original = parseInt(form.originalPriceInr, 10)
    const stock = parseInt(form.stock, 10)
    if (isNaN(price) || price <= 0) { setFormError('Price must be a positive number.'); return }
    if (isNaN(original) || original <= 0) { setFormError('Original price must be a positive number.'); return }
    if (original < price) { setFormError('Original price should be ≥ selling price.'); return }
    if (isNaN(stock) || stock < 0) { setFormError('Stock must be 0 or more.'); return }

    const productData = {
      name: form.name.trim(),
      ref: form.ref.trim(),
      category: form.category,
      material: form.material,
      dial: form.dial,
      priceInr: price,
      originalPriceInr: original,
      stock,
      badge: form.badge,
      isActive: form.isActive,
    }

    if (panelMode === 'create') {
      setProducts(prev => [{ id: `PROD-${Date.now()}`, ...productData }, ...prev])
    } else if (editingProductId) {
      setProducts(products.map(p => p.id === editingProductId ? { ...p, ...productData } : p))
    }

    closePanel()
  }

  // --- Sub-components ---
  const FilterTab = ({ label, value }: { label: string; value: FilterType }) => (
    <button
      onClick={() => setFilter(value)}
      style={{
        padding: '8px 16px',
        marginRight: '8px',
        marginBottom: '16px',
        fontFamily: DATA,
        fontSize: '13px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: filter === value ? T.deep : T.muted,
        borderBottom: filter === value ? `2px solid ${T.gold}` : 'none',
        fontWeight: filter === value ? 500 : 400,
      }}
    >
      {label}
    </button>
  )

  const Label = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: DATA, fontSize: '11px', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontWeight: 500 }}>
      {children}
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontFamily: DATA,
    fontSize: '13px',
    border: `1px solid ${T.border}`,
    borderRadius: '3px',
    background: T.card,
    color: T.deep,
    boxSizing: 'border-box',
    outline: 'none',
  }

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

  return (
    <div style={{ position: 'relative' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: DATA, fontSize: '24px', color: T.deep, marginBottom: '20px', fontWeight: 500 }}>
            Inventory
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <FilterTab label="All" value="all" />
            <FilterTab label="Active" value="active" />
            <FilterTab label="Inactive" value="inactive" />
            <FilterTab label="On Sale" value="sale" />
          </div>
        </div>

        <button
          onClick={openCreate}
          style={{
            padding: '10px 20px',
            fontFamily: UI,
            fontSize: '12px',
            letterSpacing: '0.08em',
            background: T.gold,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontWeight: 600,
            flexShrink: 0,
            marginTop: '4px',
          }}
        >
          + Add Watch
        </button>
      </div>

      {/* Products table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '4px', overflow: 'hidden', boxShadow: T.shadowSm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: DATA, fontSize: '13px' }}>
          <thead>
            <tr style={{ background: T.cardAlt, borderBottom: `1px solid ${T.border}` }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: T.muted, fontWeight: 500, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Watch</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: T.muted, fontWeight: 500, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Ref</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: T.muted, fontWeight: 500, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: T.muted, fontWeight: 500, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Dial</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', color: T.muted, fontWeight: 500, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Price</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: T.muted, fontWeight: 500, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Stock</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: T.muted, fontWeight: 500, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: T.muted, fontWeight: 500, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, idx) => (
              <Fragment key={product.id}>
                <tr
                  style={{
                    background: idx % 2 === 0 ? T.card : T.cardAlt,
                    borderBottom: (deleteConfirmId === product.id || statusConfirm === product.id) ? 'none' : `1px solid ${T.border}`,
                  }}
                >
                  <td style={{ padding: '12px 16px', color: T.deep, fontWeight: 500 }}>
                    {product.name}
                    {product.badge && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        background: product.badge === 'sale' ? T.orange : T.gold,
                        color: '#fff',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {product.badge}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: T.muted, fontFamily: "'Courier New', monospace", fontSize: '12px' }}>
                    {product.ref}
                  </td>
                  <td style={{ padding: '12px 16px', color: T.mid }}>{product.category}</td>
                  <td style={{ padding: '12px 16px', color: T.mid, fontSize: '12px' }}>{product.dial}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: T.deep, fontVariantNumeric: 'tabular-nums' }}>
                    {formatPrice(product.priceInr)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {editingStockId === product.id ? (
                      <input
                        type="number"
                        value={stockInput}
                        onChange={e => setStockInput(e.target.value)}
                        onBlur={() => handleStockSave(product.id)}
                        onKeyDown={e => e.key === 'Enter' && handleStockSave(product.id)}
                        autoFocus
                        min="0"
                        style={{ width: '52px', padding: '4px 8px', fontFamily: DATA, fontSize: '13px', border: `1px solid ${T.gold}`, borderRadius: '3px', textAlign: 'center', outline: 'none' }}
                      />
                    ) : (
                      <span
                        onClick={() => handleStockEdit(product.id, product.stock)}
                        title="Click to edit"
                        style={{
                          cursor: 'pointer',
                          color: product.stock === 0 ? T.red : T.deep,
                          fontVariantNumeric: 'tabular-nums',
                          borderBottom: `1px dashed ${T.border}`,
                          paddingBottom: '1px',
                        }}
                      >
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => confirmToggle(product.id)}
                      style={{
                        padding: '4px 12px',
                        fontFamily: DATA,
                        fontSize: '12px',
                        background: 'transparent',
                        color: product.isActive ? T.green : T.muted,
                        border: `1px solid ${product.isActive ? T.green : T.border}`,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      {product.isActive ? '● Active' : '○ Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => { setDeleteConfirmId(null); setStatusConfirm(null); openEdit(product) }}
                        style={{ padding: '4px 12px', fontFamily: DATA, fontSize: '12px', background: 'transparent', color: T.gold, border: `1px solid ${T.borderGold}`, borderRadius: '3px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { setStatusConfirm(null); setDeleteConfirmId(deleteConfirmId === product.id ? null : product.id) }}
                        style={{ padding: '4px 12px', fontFamily: DATA, fontSize: '12px', background: 'transparent', color: T.red, border: `1px solid rgba(192,57,43,0.25)`, borderRadius: '3px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Status toggle confirmation */}
                {statusConfirm === product.id && (
                  <tr key={`${product.id}-status`} style={{ background: product.isActive ? 'rgba(192,57,43,0.04)' : 'rgba(39,134,74,0.04)', borderBottom: `1px solid ${T.border}` }}>
                    <td colSpan={8} style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontFamily: DATA, fontSize: '13px', color: product.isActive ? T.red : T.green, fontWeight: 500 }}>
                          {product.isActive
                            ? `Deactivate "${product.name}"? It will be hidden from the storefront.`
                            : `Activate "${product.name}"? It will become visible on the storefront.`}
                        </span>
                        <button
                          onClick={() => handleToggleActive(product.id)}
                          style={{
                            padding: '6px 16px',
                            fontFamily: DATA,
                            fontSize: '12px',
                            background: product.isActive ? T.red : T.green,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {product.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
                        </button>
                        <button
                          onClick={() => setStatusConfirm(null)}
                          style={{ padding: '6px 16px', fontFamily: DATA, fontSize: '12px', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: '3px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Delete confirmation */}
                {deleteConfirmId === product.id && (
                  <tr key={`${product.id}-delete`} style={{ background: 'rgba(192,57,43,0.04)', borderBottom: `1px solid ${T.border}` }}>
                    <td colSpan={8} style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontFamily: DATA, fontSize: '13px', color: T.red, fontWeight: 500 }}>
                          Delete "{product.name}"? This cannot be undone.
                        </span>
                        <button
                          onClick={() => handleDelete(product.id)}
                          style={{ padding: '6px 16px', fontFamily: DATA, fontSize: '12px', background: T.red, color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          style={{ padding: '6px 16px', fontFamily: DATA, fontSize: '12px', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: '3px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', fontFamily: DATA, fontSize: '13px', color: T.muted }}>
            No watches found for this filter.
          </div>
        )}
      </div>

      {/* Slide-in panel backdrop */}
      {panelOpen && (
        <div
          onClick={closePanel}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,20,16,0.32)', zIndex: 40 }}
        />
      )}

      {/* Slide-in panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: panelOpen ? 0 : '-500px',
          width: '460px',
          height: '100vh',
          background: T.card,
          boxShadow: T.shadowMd,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transition: 'right 0.25s cubic-bezier(0.4,0,0.2,1)',
          overflowY: 'auto',
        }}
      >
        {/* Panel header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontFamily: DATA, fontSize: '18px', fontWeight: 600, color: T.deep }}>
            {panelMode === 'create' ? 'Add Watch' : 'Edit Watch'}
          </div>
          <button onClick={closePanel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '22px', lineHeight: 1, padding: '4px' }}>
            ×
          </button>
        </div>

        {/* Panel form */}
        <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div>
            <Label>Watch Name</Label>
            <input style={inputStyle} value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Noor I Fumé Blue Tourbillon" />
          </div>

          <div>
            <Label>Reference Number</Label>
            <input style={inputStyle} value={form.ref} onChange={e => setField('ref', e.target.value)} placeholder="e.g. AN-021-TI-FB" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Label>Category</Label>
              <select style={selectStyle} value={form.category} onChange={e => setField('category', e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Material</Label>
              <select style={selectStyle} value={form.material} onChange={e => setField('material', e.target.value)}>
                {materials.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label>Dial Colour</Label>
            <select style={selectStyle} value={form.dial} onChange={e => setField('dial', e.target.value)}>
              {dialOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div style={{ marginTop: '6px', fontSize: '11px', color: T.muted, fontFamily: DATA }}>
              Controls the live dial preview on the product detail page.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Label>Selling Price (₹)</Label>
              <input style={inputStyle} type="number" min="0" value={form.priceInr} onChange={e => setField('priceInr', e.target.value)} placeholder="28500" />
            </div>
            <div>
              <Label>MRP / Original Price (₹)</Label>
              <input style={inputStyle} type="number" min="0" value={form.originalPriceInr} onChange={e => setField('originalPriceInr', e.target.value)} placeholder="32000" />
              <div style={{ marginTop: '4px', fontSize: '10px', color: T.muted, fontFamily: DATA }}>Must be ≥ selling price</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Label>Stock</Label>
              <input style={inputStyle} type="number" min="0" value={form.stock} onChange={e => setField('stock', e.target.value)} placeholder="1" />
            </div>
            <div>
              <Label>Badge</Label>
              <select style={selectStyle} value={form.badge} onChange={e => setField('badge', e.target.value)}>
                <option value="">None</option>
                {badges.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setField('isActive', !form.isActive)}
              style={{
                width: '42px',
                height: '24px',
                background: form.isActive ? T.green : 'rgba(158,127,74,0.25)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: form.isActive ? '21px' : '3px',
                width: '18px',
                height: '18px',
                background: '#fff',
                borderRadius: '50%',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
            <span style={{ fontFamily: DATA, fontSize: '13px', color: form.isActive ? T.green : T.muted }}>
              {form.isActive ? 'Active — visible on storefront' : 'Inactive — hidden from storefront'}
            </span>
          </div>

          {formError && (
            <div style={{ padding: '10px 14px', background: 'rgba(192,57,43,0.08)', border: `1px solid rgba(192,57,43,0.25)`, borderRadius: '3px', fontFamily: DATA, fontSize: '13px', color: T.red }}>
              {formError}
            </div>
          )}
        </div>

        {/* Panel footer */}
        <div style={{ padding: '20px 28px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: '12px', flexShrink: 0 }}>
          <button
            onClick={handleSubmit}
            style={{ flex: 1, padding: '10px', fontFamily: UI, fontSize: '13px', letterSpacing: '0.06em', fontWeight: 600, background: T.gold, color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
          >
            {panelMode === 'create' ? 'Add Watch' : 'Save Changes'}
          </button>
          <button
            onClick={closePanel}
            style={{ padding: '10px 20px', fontFamily: DATA, fontSize: '13px', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: '3px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
