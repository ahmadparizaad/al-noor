import { NextResponse } from 'next/server'
import { auth, revokeAllRefreshTokens } from '@/lib/auth'

export async function POST() {
  const session = await auth()

  if (session?.user?.id) {
    // Revoke all refresh tokens in DB — even if client's cookie is stolen,
    // the refresh token is dead and cannot be rotated into a new session.
    await revokeAllRefreshTokens(session.user.id).catch(() => {})
  }

  // Auth.js handles clearing the session cookie via signOut on the client.
  // This endpoint just ensures the DB side is cleaned up first.
  return NextResponse.json({ success: true })
}
