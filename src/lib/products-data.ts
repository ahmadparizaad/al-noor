export type DialColor = 'Fumé Blue' | 'Champagne' | 'Onyx Black' | 'Grand Feu Ivory' | 'Sandstone'
export type Category = 'Tourbillon' | 'Grand Feu Enamel' | 'Perpetual Calendar' | 'Minute Repeater' | 'Chronograph'
export type Material = 'Grade-5 Titanium' | '18k Rose Gold' | '18k White Gold' | 'Platinum 950'
export type BadgeType = 'new' | 'sale' | ''

export interface Product {
  id: number
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
}

export const PRODUCTS: Product[] = [
  { id: 1,  name: 'Noor I Fumé Blue Tourbillon',      ref: 'AN-001-TI-FB', category: 'Tourbillon',        material: 'Grade-5 Titanium', dial: 'Fumé Blue',      price: 28500,  original: 32000,  rating: 4.8, reviews: 124, badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 2,  name: 'Noor II Champagne Perpetual',       ref: 'AN-002-TI-CH', category: 'Perpetual Calendar', material: 'Grade-5 Titanium', dial: 'Champagne',      price: 31200,  original: 35000,  rating: 4.7, reviews: 98,  badge: 'New',  badgeType: 'new',  delivery: 'Free delivery' },
  { id: 3,  name: 'Noor III Onyx Grand Tourbillon',    ref: 'AN-003-TI-ON', category: 'Tourbillon',        material: 'Grade-5 Titanium', dial: 'Onyx Black',     price: 34800,  original: 40000,  rating: 4.9, reviews: 211, badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 4,  name: 'Lumière I Grand Feu Enamel',        ref: 'AN-004-RG-GF', category: 'Grand Feu Enamel',  material: '18k Rose Gold',    dial: 'Grand Feu Ivory',price: 48500,  original: 55000,  rating: 4.6, reviews: 57,  badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 5,  name: 'Lumière II Sandstone Repeater',     ref: 'AN-005-RG-SS', category: 'Minute Repeater',   material: '18k Rose Gold',    dial: 'Sandstone',      price: 62000,  original: 72000,  rating: 4.8, reviews: 43,  badge: 'Sale', badgeType: 'sale', delivery: 'Free delivery' },
  { id: 6,  name: 'Sahara Perpetual Champagne',        ref: 'AN-006-WG-CH', category: 'Perpetual Calendar', material: '18k White Gold',   dial: 'Champagne',      price: 44200,  original: 50000,  rating: 4.5, reviews: 76,  badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 7,  name: 'Qibla Chronograph Onyx',            ref: 'AN-007-TI-ON', category: 'Chronograph',       material: 'Grade-5 Titanium', dial: 'Onyx Black',     price: 26800,  original: 30000,  rating: 4.4, reviews: 182, badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 8,  name: 'Hilal Tourbillon Blue',             ref: 'AN-008-PT-FB', category: 'Tourbillon',        material: 'Platinum 950',     dial: 'Fumé Blue',      price: 88000,  original: 98000,  rating: 5.0, reviews: 29,  badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 9,  name: 'Noor IV Sandstone Enamel',          ref: 'AN-009-RG-SS', category: 'Grand Feu Enamel',  material: '18k Rose Gold',    dial: 'Sandstone',      price: 52500,  original: 60000,  rating: 4.7, reviews: 61,  badge: 'New',  badgeType: 'new',  delivery: 'Free delivery' },
  { id: 10, name: 'Fajr Champagne Tourbillon',         ref: 'AN-010-WG-CH', category: 'Tourbillon',        material: '18k White Gold',   dial: 'Champagne',      price: 71000,  original: 80000,  rating: 4.8, reviews: 38,  badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 11, name: 'Dusk Chronograph Fumé',             ref: 'AN-011-TI-FB', category: 'Chronograph',       material: 'Grade-5 Titanium', dial: 'Fumé Blue',      price: 24500,  original: 28000,  rating: 4.3, reviews: 144, badge: 'Sale', badgeType: 'sale', delivery: 'Free delivery' },
  { id: 12, name: 'Miraj Perpetual Onyx',              ref: 'AN-012-PT-ON', category: 'Perpetual Calendar', material: 'Platinum 950',     dial: 'Onyx Black',     price: 94000,  original: 105000, rating: 4.9, reviews: 22,  badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 13, name: 'Zuhur Grand Feu Ivory',             ref: 'AN-013-RG-GF', category: 'Grand Feu Enamel',  material: '18k Rose Gold',    dial: 'Grand Feu Ivory',price: 57000,  original: 65000,  rating: 4.6, reviews: 49,  badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 14, name: 'Noor V Titanium Sandstone',         ref: 'AN-014-TI-SS', category: 'Tourbillon',        material: 'Grade-5 Titanium', dial: 'Sandstone',      price: 36500,  original: 42000,  rating: 4.7, reviews: 87,  badge: 'New',  badgeType: 'new',  delivery: 'Free delivery' },
  { id: 15, name: 'Ishq Repeater Champagne',           ref: 'AN-015-WG-CH', category: 'Minute Repeater',   material: '18k White Gold',   dial: 'Champagne',      price: 79500,  original: 90000,  rating: 4.8, reviews: 31,  badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 16, name: 'Raha Chronograph Onyx',             ref: 'AN-016-TI-ON', category: 'Chronograph',       material: 'Grade-5 Titanium', dial: 'Onyx Black',     price: 22800,  original: 26000,  rating: 4.2, reviews: 196, badge: 'Sale', badgeType: 'sale', delivery: 'Free delivery' },
  { id: 17, name: 'Badr Tourbillon Fumé',              ref: 'AN-017-PT-FB', category: 'Tourbillon',        material: 'Platinum 950',     dial: 'Fumé Blue',      price: 96500,  original: 110000, rating: 5.0, reviews: 18,  badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 18, name: 'Layl Enamel Sandstone',             ref: 'AN-018-RG-SS', category: 'Grand Feu Enamel',  material: '18k Rose Gold',    dial: 'Sandstone',      price: 61000,  original: 70000,  rating: 4.6, reviews: 44,  badge: '',     badgeType: '',     delivery: 'Free delivery' },
  { id: 19, name: 'Hayat Perpetual Blue',              ref: 'AN-019-WG-FB', category: 'Perpetual Calendar', material: '18k White Gold',   dial: 'Fumé Blue',      price: 47000,  original: 53500,  rating: 4.5, reviews: 65,  badge: 'New',  badgeType: 'new',  delivery: 'Free delivery' },
  { id: 20, name: 'Nur Repeater Grand Feu',            ref: 'AN-020-PT-GF', category: 'Minute Repeater',   material: 'Platinum 950',     dial: 'Grand Feu Ivory',price: 115000, original: 130000, rating: 4.9, reviews: 14,  badge: '',     badgeType: '',     delivery: 'Free delivery' },
]

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
