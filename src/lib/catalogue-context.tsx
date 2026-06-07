'use client'

import { createContext, useContext, useState, useTransition } from 'react'
import { saveCatalogueList, type CatalogueType } from '@/lib/actions/catalogue'

export interface CatalogueContextValue {
  categories: string[]
  materials: string[]
  dialOptions: string[]
  badges: string[]
  setCategories: (v: string[]) => void
  setMaterials: (v: string[]) => void
  setDialOptions: (v: string[]) => void
  setBadges: (v: string[]) => void
  saving: boolean
}

const CatalogueContext = createContext<CatalogueContextValue | null>(null)

interface InitialData {
  categories: string[]
  materials: string[]
  dialOptions: string[]
  badges: string[]
}

export function CatalogueProvider({ initial, children }: { initial: InitialData; children: React.ReactNode }) {
  const [categories, setCategories] = useState<string[]>(initial.categories)
  const [materials, setMaterials]   = useState<string[]>(initial.materials)
  const [dialOptions, setDialOptions] = useState<string[]>(initial.dialOptions)
  const [badges, setBadges]         = useState<string[]>(initial.badges)
  const [saving, startSave]         = useTransition()

  function persist(type: CatalogueType, values: string[], setter: (v: string[]) => void) {
    setter(values)
    startSave(async () => {
      await saveCatalogueList(type, values)
    })
  }

  return (
    <CatalogueContext.Provider value={{
      categories,
      materials,
      dialOptions,
      badges,
      setCategories: (v) => persist('category', v, setCategories),
      setMaterials:  (v) => persist('material', v, setMaterials),
      setDialOptions:(v) => persist('dial',     v, setDialOptions),
      setBadges:     (v) => persist('badge',    v, setBadges),
      saving,
    }}>
      {children}
    </CatalogueContext.Provider>
  )
}

export function useCatalogue(): CatalogueContextValue {
  const ctx = useContext(CatalogueContext)
  if (!ctx) throw new Error('useCatalogue must be used inside CatalogueProvider')
  return ctx
}
