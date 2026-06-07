import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  try {
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    console.log('Tables in database:')
    if (result.length === 0) {
      console.log('  (none — database is empty, tables need to be created)')
    } else {
      result.forEach(r => console.log(' ', r.table_name))
    }
  } catch (err) {
    console.error('Connection/query error:', err)
  }
}

main()
