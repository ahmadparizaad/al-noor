import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export const metadata = { title: 'My Profile — Al Noor Admin' }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') redirect('/admin/login')

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user) redirect('/admin/login')

  return (
    <ProfileClient
      id={user.id}
      name={user.name ?? ''}
      email={user.email}
      createdAt={user.createdAt.toISOString()}
    />
  )
}
