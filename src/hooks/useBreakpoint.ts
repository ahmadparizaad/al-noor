'use client'

import { useState, useEffect } from 'react'

interface Breakpoint {
  isMobile: boolean   // < 768px
  isTablet: boolean   // 768px – 1023px
  isDesktop: boolean  // >= 1024px
}

function getBreakpoint(width: number): Breakpoint {
  return {
    isMobile:  width < 768,
    isTablet:  width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  }
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window !== 'undefined'
      ? getBreakpoint(window.innerWidth)
      : { isMobile: false, isTablet: false, isDesktop: true }
  )

  useEffect(() => {
    function onResize() {
      setBp(getBreakpoint(window.innerWidth))
    }
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return bp
}
