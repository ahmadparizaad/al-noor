'use server'

import { db } from '@/lib/db'
import { catalogueOptions } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { randomBytes } from 'crypto'
import { CATEGORIES, MATERIALS, DIAL_OPTIONS } from '@/lib/products-data'

export type CatalogueType = 'category' | 'material' | 'dial' | 'badge'

const DEFAULTS: Record<CatalogueType, string[]> = {
  category: [...CATEGORIES],
  material: [...MATERIALS],
  dial:     [...DIAL_OPTIONS],
  badge:    ['new', 'sale'],
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') throw new Error('Unauthorized')
}

export async function getCatalogueOptions(): Promise<Record<CatalogueType, string[]>> {
  const rows = await db
    .select({ type: catalogueOptions.type, value: catalogueOptions.value })
    .from(catalogueOptions)
    .orderBy(asc(catalogueOptions.sortOrder))

  const result: Record<CatalogueType, string[]> = { category: [], material: [], dial: [], badge: [] }

  for (const row of rows) {
    const t = row.type as CatalogueType
    if (result[t]) result[t].push(row.value)
  }

  // If DB is empty (first run), seed from defaults and return them
  const isEmpty = rows.length === 0
  if (isEmpty) {
    await seedCatalogueDefaults()
    return { ...DEFAULTS }
  }

  return result
}

async function seedCatalogueDefaults() {
  const inserts = Object.entries(DEFAULTS).flatMap(([type, values]) =>
    values.map((value, i) => ({
      id:        randomBytes(8).toString('hex'),
      type,
      value,
      sortOrder: i,
    }))
  )
  await db.insert(catalogueOptions).values(inserts).onConflictDoNothing()
}

export async function saveCatalogueList(type: CatalogueType, values: string[]) {
  await requireAdmin()

  // Replace all rows for this type atomically in a transaction
  await db.transaction(async (tx) => {
    await tx.delete(catalogueOptions).where(eq(catalogueOptions.type, type))

    if (values.length > 0) {
      await tx.insert(catalogueOptions).values(
        values.map((value, i) => ({
          id:        randomBytes(8).toString('hex'),
          type,
          value,
          sortOrder: i,
        }))
      )
    }
  })
}
