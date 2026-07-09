import { db } from '@/lib/db'
import { users, verificationTokens } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createHash } from 'crypto'
import Link from 'next/link'

type Props = {
  searchParams: Promise<{ token?: string }>
}

const T = {
  ivory:       '#FAF7F2',
  parchment:   '#F0EBE2',
  white:       '#FFFFFF',
  gold:        '#9E7F4A',
  goldDark:    '#7A5C2E',
  deep:        '#1A1410',
  mid:         '#5C4F3A',
  muted:       '#8C7B65',
  border:      'rgba(158,127,74,0.18)',
  red:         '#C0392B',
  green:       '#27864A',
  shadowMd:    '0 4px 20px rgba(26,20,16,0.10)',
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const resolvedParams = await searchParams
  const token = resolvedParams?.token

  let success = false
  let errorMessage = ''

  if (!token) {
    errorMessage = 'Verification token is missing. Please make sure to use the full link sent to your email.'
  } else {
    try {
      const tokenHash = createHash('sha256').update(token).digest('hex')

      // Look up the token in the database
      const [tokenRow] = await db
        .select()
        .from(verificationTokens)
        .where(eq(verificationTokens.tokenHash, tokenHash))
        .limit(1)

      if (!tokenRow) {
        errorMessage = 'This verification link is invalid or has already been used.'
      } else if (tokenRow.expiresAt < new Date()) {
        errorMessage = 'This verification link has expired. Please sign up again to receive a new link.'
        // Optionally clean up expired token
        await db.delete(verificationTokens).where(eq(verificationTokens.id, tokenRow.id)).catch(() => {})
      } else {
        // Token is valid! Update the user's emailVerified status and delete the token
        await db.transaction(async (tx) => {
          await tx
            .update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.id, tokenRow.userId))

          await tx.delete(verificationTokens).where(eq(verificationTokens.id, tokenRow.id))
        })
        success = true
      }
    } catch (err) {
      console.error('[verify-email] Exception during verification:', err)
      errorMessage = 'An unexpected error occurred. Please try again later.'
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.parchment,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Brand Header */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <Link
          href="/"
          style={{
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: '0.35em',
            color: T.gold,
            textDecoration: 'none',
            fontFamily: "'Raleway', sans-serif",
          }}
        >
          AL NOOR
        </Link>
        <span
          style={{
            display: 'block',
            fontSize: 9,
            letterSpacing: '0.15em',
            color: T.muted,
            fontWeight: 400,
            marginTop: 2,
            textTransform: 'uppercase',
            fontFamily: "'Raleway', sans-serif",
          }}
        >
          Luxury Timepieces
        </span>
      </div>

      {/* Main card */}
      <div
        style={{
          width: '100%',
          maxWidth: 450,
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 2,
          boxShadow: T.shadowMd,
          padding: '48px 32px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        {success ? (
          <div>
            {/* Success Icon */}
            <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: 64, height: 64, borderRadius: '50%', border: `1.5px solid ${T.gold}`, color: T.gold, marginBottom: 24 }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h1
              style={{
                fontFamily: "'Bodoni Moda', serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 26,
                color: T.deep,
                margin: '0 0 16px 0',
              }}
            >
              Email Verified
            </h1>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: T.mid,
                lineHeight: 1.6,
                margin: '0 0 32px 0',
              }}
            >
              Thank you for verifying your email address. Your account is now fully active. You can sign in to view your profile and complete checkout.
            </p>

            <Link
              href="/login"
              style={{
                display: 'block',
                width: '100%',
                height: 48,
                lineHeight: '48px',
                background: T.gold,
                color: T.white,
                fontFamily: "'Raleway', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                textDecoration: 'none',
                borderRadius: 2,
                transition: 'background-color 0.2s',
              }}
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div>
            {/* Error Icon */}
            <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: 64, height: 64, borderRadius: '50%', border: `1.5px solid ${T.red}`, color: T.red, marginBottom: 24 }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>

            <h1
              style={{
                fontFamily: "'Bodoni Moda', serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 26,
                color: T.deep,
                margin: '0 0 16px 0',
              }}
            >
              Verification Failed
            </h1>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: T.red,
                lineHeight: 1.6,
                margin: '0 0 32px 0',
              }}
            >
              {errorMessage}
            </p>

            <Link
              href="/login"
              style={{
                display: 'block',
                width: '100%',
                height: 48,
                lineHeight: '48px',
                border: `1.5px solid ${T.border}`,
                color: T.deep,
                fontFamily: "'Raleway', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                textDecoration: 'none',
                borderRadius: 2,
                transition: 'background-color 0.2s',
              }}
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
