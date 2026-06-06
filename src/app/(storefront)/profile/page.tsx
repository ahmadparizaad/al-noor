import type { Metadata } from 'next'
import { ProfileClient } from './ProfileClient'

export const metadata: Metadata = { title: 'My Profile — Al Noor' }

export default function ProfilePage() {
  return <ProfileClient />
}
