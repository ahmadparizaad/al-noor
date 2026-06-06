'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'

/**
 * Mounted once in the root layout.
 * Detects RefreshTokenExpired errors from the JWT callback and
 * silently signs the user out → /login?reason=session_expired.
 * Under normal token rotation this never fires.
 */
export function SessionGuard() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error === 'RefreshTokenExpired' || session?.error === 'RefreshTokenMissing') {
      fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
        signOut({ callbackUrl: '/login?reason=session_expired' })
      })
    }
  }, [session])

  return null
}
