/**
 * Creates or promotes an admin user in the database.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts <email> <password>
 *
 * Examples:
 *   npx tsx scripts/seed-admin.ts admin@al-noor.co MySecurePassword123
 *
 * If the email already exists, the script promotes that user to admin
 * and (optionally) updates their password if a new one is provided.
 */

import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { users } from '../src/lib/schema'
import { eq } from 'drizzle-orm'

const email    = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('Usage: npx tsx scripts/seed-admin.ts <email> <password>')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set.')
  console.error('Run: export DATABASE_URL="your-neon-connection-string"')
  process.exit(1)
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters.')
  process.exit(1)
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const db  = drizzle(sql)

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (existing.length > 0) {
    const user = existing[0]
    const passwordHash = await bcrypt.hash(password, 12)

    await db
      .update(users)
      .set({ role: 'admin', passwordHash })
      .where(eq(users.id, user.id))

    console.log(`✓ User "${email}" promoted to admin with updated password.`)
    console.log(`  User ID: ${user.id}`)
  } else {
    const id           = randomBytes(16).toString('hex')
    const passwordHash = await bcrypt.hash(password, 12)

    await db.insert(users).values({
      id,
      email,
      name:         'Admin',
      passwordHash,
      role:         'admin',
    })

    console.log(`✓ Admin user created.`)
    console.log(`  Email:   ${email}`)
    console.log(`  User ID: ${id}`)
  }

  console.log('\nYou can now log in at /login with these credentials.')
}

main().catch(err => {
  console.error('Error:', err.message)
  console.error('Full error:', JSON.stringify(err, null, 2))
  process.exit(1)
})
