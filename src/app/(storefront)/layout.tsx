import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: { template: '%s | Al Noor', default: 'Al Noor — Luxury Timepieces' },
  description: 'Handcrafted luxury watches from Al Noor.',
  openGraph: { siteName: 'Al Noor', type: 'website' },
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main>{children}</main>
      <BottomNav />
      {process.env.NEXT_PUBLIC_GA4_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA4_ID} />
      )}
    </>
  )
}
