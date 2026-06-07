'use client'

import { CatalogueProvider } from '@/lib/catalogue-context'

interface Props {
  children: React.ReactNode
  initial: {
    categories: string[]
    materials: string[]
    dialOptions: string[]
    badges: string[]
  }
}

export default function AdminProviders({ children, initial }: Props) {
  return <CatalogueProvider initial={initial}>{children}</CatalogueProvider>
}
