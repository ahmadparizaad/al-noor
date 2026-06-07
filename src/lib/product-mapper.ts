import type { Product, DialColor, Category, Material, BadgeType } from '@/lib/products-data'
import type { StoreProduct } from '@/lib/actions/products'

export function toClientProduct(p: StoreProduct, index: number): Product {
  const badge = (p.specs.Badge ?? '') as BadgeType
  return {
    id: index + 1,
    dbId: p.id,
    name: p.name,
    ref: p.specs.Reference ?? p.slug,
    category: p.category as Category,
    material: (p.specs.Material ?? '') as Material,
    dial: (p.specs['Dial Colour'] ?? '') as DialColor,
    price: p.priceInr,
    original: p.originalPriceInr,
    rating: Number(p.specs.Rating ?? 0),
    reviews: Number(p.specs.Reviews ?? 0),
    badge: badge === 'new' ? 'New' : badge === 'sale' ? 'Sale' : '',
    badgeType: badge,
    delivery: 'Free delivery',
  }
}
