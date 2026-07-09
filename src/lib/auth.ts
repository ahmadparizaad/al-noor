import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from './db'
import { users, refreshTokens, phoneOtps } from './schema'
import { eq, and, lt, isNotNull } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { createHash, randomBytes, randomUUID } from 'crypto'
import { z } from 'zod'
import type { UserRole } from '@/types'
import { checkRateLimit } from './rate-limit'

// ── Constants ────────────────────────────────────────────────────────────────
const ACCESS_TOKEN_MAX_AGE   = 30 * 60          // 30 minutes (seconds)
const REFRESH_TOKEN_MAX_AGE  = 30 * 24 * 60 * 60 // 30 days (seconds)
const REFRESH_TOKEN_REUSE_GRACE_MS = 30_000     // 30s grace for concurrent rotation races

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

async function createRefreshToken(userId: string, predecessorId?: string): Promise<string> {
  const token     = randomBytes(40).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date((nowSec() + REFRESH_TOKEN_MAX_AGE) * 1000)

  // Purge tokens that are both expired AND outside the reuse grace window
  const purgeBeforeDate = new Date(Date.now() - REFRESH_TOKEN_REUSE_GRACE_MS)
  await db
    .delete(refreshTokens)
    .where(
      and(
        eq(refreshTokens.userId, userId),
        lt(refreshTokens.expiresAt, purgeBeforeDate),
        isNotNull(refreshTokens.replacedAt),
      ),
    )
    .catch((err: unknown) => {
      console.error('[auth] Failed to purge stale refresh tokens for user', userId, err)
    })

  await db.insert(refreshTokens).values({
    id:        randomBytes(16).toString('hex'),
    userId,
    tokenHash,
    expiresAt,
  })

  // Mark predecessor as replaced now that successor is committed
  if (predecessorId) {
    await db
      .update(refreshTokens)
      .set({ replacedAt: new Date(), replacedBy: tokenHash })
      .where(eq(refreshTokens.id, predecessorId))
      .catch(() => { /* non-fatal */ })
  }

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

  // If this token was already rotated within the grace window, return the
  // successor token value from the JWT (we can't recover the raw token here,
  // but the caller already has it in their JWT — this path just means the
  // concurrent request should proceed normally using the JWT it already has).
  // We signal "already rotated but still valid" by returning a sentinel so
  // the caller can keep the existing refreshToken rather than treating it as
  // an error.
  if (existing.replacedAt !== null) {
    const msSinceReplaced = Date.now() - existing.replacedAt.getTime()
    if (msSinceReplaced <= REFRESH_TOKEN_REUSE_GRACE_MS) {
      // Within grace window — concurrent race detected, not an attack.
      // Return null so the jwt callback keeps the current token unchanged.
      return oldToken
    }
    // Outside grace window — genuine reuse attack or very stale JWT. Force re-login.
    return null
  }

  // Issue a fresh refresh token; mark old one as replaced atomically after insert
  return createRefreshToken(userId, existing.id)
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
          phone:        (user as { phone?: string }).phone,
          email:        user.email,
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

      // Issue fresh access token; update refreshToken only if it actually rotated
      return {
        ...token,
        accessExpiry:  nowSec() + ACCESS_TOKEN_MAX_AGE,
        refreshToken:  newRefreshToken, // may equal old value during grace window — that's fine
        error:         undefined,
      }
    },

    async session({ session, token }) {
      if (token) {
        session.user.id   = token.id as string
        session.user.role = token.role as UserRole
        session.user.email = token.email as string
        session.user.phone = token.phone as string | undefined
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

        // ── WhatsApp OTP Sign-In Path ──
        if (credentials && 'phone' in credentials && 'otp' in credentials) {
          const phoneCred = credentials.phone as string
          const otpCred = credentials.otp as string

          if (!phoneCred || !otpCred) return null

          const rawPhone = phoneCred.replace(/\D/g, '')
          const phone = rawPhone.startsWith('91') && rawPhone.length === 12 ? rawPhone.slice(2) : rawPhone

          const [otpRecord] = await db
            .select()
            .from(phoneOtps)
            .where(eq(phoneOtps.phone, phone))
            .limit(1)

          if (!otpRecord) return null
          if (otpRecord.expiresAt < new Date()) return null
          if (otpRecord.attempts >= 3) return null

          const hashedSubmittedOtp = createHash('sha256').update(otpCred).digest('hex')
          if (hashedSubmittedOtp !== otpRecord.otpHash) {
            await db
              .update(phoneOtps)
              .set({ attempts: otpRecord.attempts + 1 })
              .where(eq(phoneOtps.id, otpRecord.id))
            return null
          }

          // OTP is valid. Clean up the OTP record to prevent replay attacks.
          await db.delete(phoneOtps).where(eq(phoneOtps.id, otpRecord.id))

          // Check if user exists
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.phone, phone))
            .limit(1)

          if (existingUser) {
            return {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              phone: existingUser.phone,
              role: existingUser.role as UserRole,
            }
          }

          // Auto-signup customer
          const userId = randomUUID()
          const placeholderEmail = `${phone}@alnoor.co`
          await db.insert(users).values({
            id: userId,
            phone: phone,
            email: placeholderEmail,
            name: 'Guest',
            role: 'customer',
            emailVerified: new Date(),
          })

          return {
            id: userId,
            email: placeholderEmail,
            name: 'Guest',
            phone: phone,
            role: 'customer' as UserRole,
          }
        }

        // ── Standard Email/Password Sign-In Path ──
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

        // Enforce email verification for customers
        if (user.role === 'customer' && !user.emailVerified) {
          return null
        }

        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          phone: user.phone,
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
