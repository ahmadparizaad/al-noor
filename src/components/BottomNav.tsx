'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-store'

const navItems = [
  {
    label: 'Home',
    href: '/',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Products',
    href: '/products',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 1.8} />
        <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 1.8} />
        <rect x="3" y="14" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 1.8} />
        <rect x="14" y="14" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 1.8} />
      </svg>
    ),
  },
  {
    label: 'Cart',
    href: '/cart',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const totalItems = useCart(s => s.totalItems())

  return (
    <>
      {/* Spacer so content doesn't hide behind nav on mobile */}
      <div className="h-16 md:hidden" />

      <div className="group fixed bottom-0 left-0 right-0 z-50">
        {/* Invisible trigger zone at the very bottom (20px height) */}
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-transparent" />

        <nav className="transform translate-y-0 md:translate-y-full md:group-hover:translate-y-0 focus-within:translate-y-0 transition-transform duration-300 ease-out bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
            {navItems.map(({ label, href, icon }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href)

              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                    active ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  <span className="relative">
                    {icon(active)}
                    {label === 'Cart' && totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </span>
                  <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                    {label}
                  </span>
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-blue-600" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
