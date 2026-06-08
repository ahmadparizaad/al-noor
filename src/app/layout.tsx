import type { Metadata } from 'next'
import { Bodoni_Moda, Inter, Raleway } from 'next/font/google'
import { Providers } from '@/components/auth/Providers'
import './globals.css'
// EB Garamond and Amiri are homepage-only — loaded in (storefront)/layout.tsx if needed

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-bodoni',
  style: ['normal', 'italic'],
  display: 'swap',
})

// Primary font for all product/commerce pages — Flipkart-style screen readability
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Al Noor | Luxury Watches',
    template: '%s | Al Noor',
  },
  description: 'Premium luxury watches at honest prices. Al Noor, 100% original timepieces with fast insured delivery.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodoniModa.variable} ${inter.variable} ${raleway.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
