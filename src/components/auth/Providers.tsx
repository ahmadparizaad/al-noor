'use client'

import { SessionProvider } from 'next-auth/react'
import { SessionGuard } from './SessionGuard'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Re-fetch session when window regains focus and every 5 min
      // This is how Flipkart keeps the session fresh in background tabs
      refetchOnWindowFocus
      refetchInterval={5 * 60}
    >
      <SessionGuard />
      {children}
    </SessionProvider>
  )
}
