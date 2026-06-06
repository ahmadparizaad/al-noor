import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from './db'
import { users, refreshTokens } from './schema'
import { eq, and, lt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'crypto'
import { z } from 'zod'
import type { UserRole } from '@/types'
import { checkRateLimit } from './rate-limit'

// ── Constants ────────────────────────────────────────────────────────────────
const ACCESS_TOKEN_MAX_AGE  = 30 * 60          // 30 minutes (seconds)
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 // 30 days (seconds)

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000)
}

async function createRefreshToken(userId: string): Promise<string> {
  const token     = randomBytes(40).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date((nowSec() + REFRESH_TOKEN_MAX_AGE) * 1000)

  // Purge expired tokens for this user before inserting (keep table lean)
  await db
    .delete(refreshTokens)
    .where(and(eq(refreshTokens.userId, userId), lt(refreshTokens.expiresAt, new Date())))
    .catch((err: unknown) => {
      console.error('[auth] Failed to purge expired refresh tokens for user', userId, err)
    })

  await db.insert(refreshTokens).values({
    id:        randomBytes(16).toString('hex'),
    userId,
    tokenHash,
    expiresAt,
  })

  return token
}

async function rotateRefreshToken(oldToken: string, userId: string): Promise<string | null> {
  const oldHash = hashToken(oldToken)

  const [existing] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, oldHash), eq(refreshTokens.userId, userId)))
    .limit(1)

  if (!existing) return null                       // token not found — force re-login
  if (existing.expiresAt < new Date()) return null  // token expired — force re-login

  // Delete the old token (one-time use rotation)
  await db.delete(refreshTokens).where(eq(refreshTokens.id, existing.id))

  // Issue a fresh refresh token
  return createRefreshToken(userId)
}

// ── Auth.js config ───────────────────────────────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: REFRESH_TOKEN_MAX_AGE, // cookie lifetime matches refresh token
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // ── Initial sign-in: user object is populated ──────────────────────────
      if (user) {
        const refreshToken = await createRefreshToken(user.id as string)
        return {
          ...token,
          id:           user.id,
          role:         (user as { role?: string }).role,
          accessExpiry: nowSec() + ACCESS_TOKEN_MAX_AGE,
          refreshToken,
        }
      }

      // ── Subsequent calls: check if access token is still valid ─────────────
      const accessExpiry  = token.accessExpiry as number | undefined
      const refreshToken  = token.refreshToken as string | undefined
      const userId        = token.id as string | undefined

      // Access token still valid — return as-is (no DB hit)
      if (accessExpiry && nowSec() < accessExpiry) {
        return token
      }

      // Access token expired — silently rotate via refresh token
      if (!refreshToken || !userId) return { ...token, error: 'RefreshTokenMissing' }

      const newRefreshToken = await rotateRefreshToken(refreshToken, userId)

      if (!newRefreshToken) {
        // Refresh token invalid/expired — user must log in again
        return { ...token, error: 'RefreshTokenExpired' }
      }

      // Issue fresh access token + refresh token
      return {
        ...token,
        accessExpiry:  nowSec() + ACCESS_TOKEN_MAX_AGE,
        refreshToken:  newRefreshToken,
        error:         undefined,
      }
    },

    async session({ session, token }) {
      if (token) {
        session.user.id   = token.id as string
        session.user.role = token.role as UserRole
        // Surface the error so client can handle forced re-login
        session.error = token.error as typeof session.error
      }
      return session
    },
  },

  providers: [
    Credentials({
      async authorize(credentials, req) {
        // Rate limit: 10 login attempts per IP per 15 minutes
        const ip = (req as unknown as { headers?: Headers }).headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
        const rl = checkRateLimit({ key: `login:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 })
        if (!rl.allowed) return null  // Auth.js converts null → CredentialsSignin error

        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1)

        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          role:  user.role as UserRole,
        }
      },
    }),
  ],
})

// ── Utility: revoke all refresh tokens for a user (on logout) ────────────────
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))
}
