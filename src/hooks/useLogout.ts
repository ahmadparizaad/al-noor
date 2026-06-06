'use client'

import { signOut } from 'next-auth/react'
import { useCallback, useState } from 'react'

export function useLogout() {
  const [loading, setLoading] = useState(false)

  const logout = useCallback(async (redirectTo = '/login') => {
    setLoading(true)
    try {
      // Revoke refresh tokens server-side first
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      // Always clear client session regardless of server response
      await signOut({ callbackUrl: redirectTo, redirect: true })
    }
  }, [])

  return { logout, loading }
}
