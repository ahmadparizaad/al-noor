'use client'

import { useState } from 'react'
import { useCatalogue } from '@/lib/catalogue-context'

const T = {
  card: '#FFFFFF',
  cardAlt: '#F8F4EE',
  deep: '#1A1410',
  mid: '#5C4F3A',
  muted: '#8C7B65',
  gold: '#9E7F4A',
  red: '#C0392B',
  border: 'rgba(158,127,74,0.18)',
  borderGold: 'rgba(158,127,74,0.30)',
  shadowSm: '0 1px 4px rgba(26,20,16,0.06)',
}

const DATA = "'Inter', system-ui, sans-serif"
const UI = "'Raleway', system-ui, sans-serif"

interface TagListProps {
  title: string
  description: string
  items: string[]
  onAdd: (value: string) => void
  onRemove: (value: string) => void
  placeholder: string
  minItems?: number
}

function TagList({ title, description, items, onAdd, onRemove, placeholder, minItems = 1 }: TagListProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    const val = input.trim()
    if (!val) return
    if (items.map(i => i.toLowerCase()).includes(val.toLowerCase())) {
      setError('Already exists.')
      return
    }
    onAdd(val)
    setInput('')
    setError(null)
  }

  const handleRemove = (item: string) => {
    if (items.length <= minItems) {
      setError(`At least ${minItems} item must remain.`)
      return
    }
    setError(null)
    onRemove(item)
  }

  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: '4px',
        padding: '24px',
        boxShadow: T.shadowSm,
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontFamily: DATA, fontSize: '15px', fontWeight: 600, color: T.deep, marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ fontFamily: DATA, fontSize: '12px', color: T.muted }}>
          {description}
        </div>
      </div>

      {/* Tag chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', minHeight: '36px' }}>
        {items.map(item => (
          <div
            key={item}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px 5px 12px',
              background: T.cardAlt,
              border: `1px solid ${T.border}`,
              borderRadius: '3px',
              fontFamily: DATA,
              fontSize: '13px',
              color: T.deep,
            }}
          >
            {item}
            <button
              onClick={() => handleRemove(item)}
              title={`Remove ${item}`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: T.muted,
                fontSize: '15px',
                lineHeight: 1,
                padding: '0 2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add input */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setError(null) }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontFamily: DATA,
            fontSize: '13px',
            border: `1px solid ${T.border}`,
            borderRadius: '3px',
            color: T.deep,
            outline: 'none',
            background: T.card,
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            padding: '8px 16px',
            fontFamily: UI,
            fontSize: '12px',
            letterSpacing: '0.06em',
            fontWeight: 600,
            background: T.gold,
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Add
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '8px', fontFamily: DATA, fontSize: '12px', color: T.red }}>
          {error}
        </div>
      )}
    </div>
  )
}

export default function SettingsClient() {
  const { categories, materials, dialOptions, badges, setCategories, setMaterials, setDialOptions, setBadges, saving } = useCatalogue()

  const makeHandlers = (items: string[], setItems: (v: string[]) => void) => ({
    onAdd: (val: string) => setItems([...items, val]),
    onRemove: (val: string) => setItems(items.filter(i => i !== val)),
  })

  return (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <div>
          <div style={{ fontFamily: DATA, fontSize: '24px', color: T.deep, fontWeight: 500, marginBottom: '4px' }}>
            Catalogue Settings
          </div>
          <div style={{ fontFamily: DATA, fontSize: '13px', color: T.muted }}>
            Manage the options available when adding or editing watches in Inventory.
          </div>
        </div>
        {saving && (
          <div style={{ fontFamily: DATA, fontSize: '12px', color: T.muted, marginLeft: 'auto' }}>
            Saving…
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <TagList
          title="Categories"
          description="Watch complication types shown in the inventory form and on product pages."
          items={categories}
          placeholder="e.g. Skeleton"
          minItems={1}
          {...makeHandlers(categories, setCategories)}
        />

        <TagList
          title="Materials"
          description="Case and bracelet materials available for selection in the inventory form."
          items={materials}
          placeholder="e.g. Stainless Steel"
          minItems={1}
          {...makeHandlers(materials, setMaterials)}
        />

        <TagList
          title="Dial Colours"
          description="Dial colour options. Each value drives the live WatchFace preview on the product detail page."
          items={dialOptions}
          placeholder="e.g. Emerald Green"
          minItems={1}
          {...makeHandlers(dialOptions, setDialOptions)}
        />

        <TagList
          title="Badges"
          description="Promotional labels shown on product cards and in the inventory table."
          items={badges}
          placeholder="e.g. limited"
          minItems={0}
          {...makeHandlers(badges, setBadges)}
        />
      </div>
    </div>
  )
}
