export type DialColor = string
export type Category = string
export type Material = string
export type BadgeType = 'new' | 'sale' | ''

export interface Product {
  id: number
  dbId?: string   // actual database UUID, used for server-side operations
  name: string
  ref: string
  category: Category
  material: Material
  dial: DialColor
  price: number
  original: number
  rating: number
  reviews: number
  badge: string
  badgeType: BadgeType
  delivery: string
  images?: string[]
}

export const DIAL_COLORS: Record<DialColor, { bg1: string; bg2: string; accent: string; marks: string }> = {
  'Fumé Blue':       { bg1: '#1a3a5c', bg2: '#0d1f33', accent: '#4a8ab5', marks: 'rgba(180,210,235,0.6)' },
  'Champagne':       { bg1: '#e8d5a3', bg2: '#c9a96e', accent: '#9e7f4a', marks: 'rgba(90,60,20,0.5)'    },
  'Onyx Black':      { bg1: '#1a1a1a', bg2: '#0a0a0a', accent: '#9e7f4a', marks: 'rgba(200,175,110,0.7)' },
  'Grand Feu Ivory': { bg1: '#faf3e0', bg2: '#e8d9b8', accent: '#9e7f4a', marks: 'rgba(90,60,20,0.5)'    },
  'Sandstone':       { bg1: '#c8a882', bg2: '#a07850', accent: '#7a5c2e', marks: 'rgba(250,240,220,0.6)'  },
}

export const CATEGORIES: Category[] = ['Tourbillon', 'Grand Feu Enamel', 'Perpetual Calendar', 'Minute Repeater', 'Chronograph']
export const MATERIALS: Material[] = ['Grade-5 Titanium', '18k Rose Gold', '18k White Gold', 'Platinum 950']
export const DIAL_OPTIONS: DialColor[] = ['Fumé Blue', 'Champagne', 'Onyx Black', 'Grand Feu Ivory', 'Sandstone']

export function formatPrice(p: number) {
  return '₹' + p.toLocaleString('en-IN')
}

export function discount(price: number, original: number) {
  return Math.round((original - price) / original * 100)
}
