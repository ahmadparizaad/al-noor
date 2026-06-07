'use server'

import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { eq, asc, desc, and, ilike, gte, lte, sql } from 'drizzle-orm'

export interface StoreProduct {
  id: string
  name: string
  slug: string
  category: string
  priceInr: number
  originalPriceInr: number
  stock: number
  images: string[]
  specs: Record<string, string>
  isActive: boolean
  createdAt: string
}

function parseProduct(p: typeof products.$inferSelect): StoreProduct {
  let specs: Record<string, string> = {}
  try { specs = JSON.parse(p.specs ?? '{}') } catch { /* empty */ }
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    priceInr: Number(p.priceInr),
    originalPriceInr: Number(p.originalPriceInr ?? p.priceInr),
    stock: p.stock,
    images: p.images ?? [],
    specs,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString().split('T')[0],
  }
}

export async function getAllProducts(filters?: {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'name'
}): Promise<StoreProduct[]> {
  const conditions = [eq(products.isActive, true)]

  if (filters?.category) {
    conditions.push(ilike(products.category, filters.category))
  }
  if (filters?.search) {
    conditions.push(ilike(products.name, `%${filters.search}%`))
  }
  if (filters?.minPrice != null) {
    conditions.push(gte(products.priceInr, String(filters.minPrice)))
  }
  if (filters?.maxPrice != null) {
    conditions.push(lte(products.priceInr, String(filters.maxPrice)))
  }

  let orderBy
  switch (filters?.sortBy) {
    case 'price-asc':  orderBy = asc(products.priceInr); break
    case 'price-desc': orderBy = desc(products.priceInr); break
    case 'newest':     orderBy = desc(products.createdAt); break
    case 'name':       orderBy = asc(products.name); break
    default:           orderBy = desc(products.createdAt)
  }

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(orderBy)

  return rows.map(parseProduct)
}

export async function getProductById(id: string): Promise<StoreProduct | null> {
  const rows = await db.select().from(products).where(eq(products.id, id))
  return rows[0] ? parseProduct(rows[0]) : null
}

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  const rows = await db.select().from(products).where(eq(products.slug, slug))
  return rows[0] ? parseProduct(rows[0]) : null
}

export async function getFeaturedProducts(limit = 4): Promise<StoreProduct[]> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(limit)

  return rows.map(parseProduct)
}

export async function getProductsAllIds(): Promise<string[]> {
  const rows = await db.select({ id: products.id }).from(products).where(eq(products.isActive, true))
  return rows.map(r => r.id)
}

