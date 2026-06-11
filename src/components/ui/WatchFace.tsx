'use client'

import { useEffect, useState } from 'react'
import { DIAL_COLORS, type DialColor } from '@/lib/products-data'

interface WatchFaceProps {
  dial: DialColor
  size?: number
}

export function WatchFace({ dial, size = 140 }: WatchFaceProps) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 })
  const c = DIAL_COLORS[dial] ?? DIAL_COLORS['Champagne']
  const id = dial.replace(/\s/g, '')

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime({
        h: (now.getHours() % 12) * 30 + now.getMinutes() * 0.5,
        m: now.getMinutes() * 6,
        s: now.getSeconds() * 6,
      })
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const cx = size / 2
  const cy = size / 2
  const r = size / 2

  function hand(deg: number, length: number) {
    const rad = (deg - 90) * (Math.PI / 180)
    return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) }
  }

  const hourTip  = hand(time.h, r * 0.4)
  const minTip   = hand(time.m, r * 0.54)
  const secTip   = hand(time.s, r * 0.63)

  const markers = Array.from({ length: 12 }, (_, i) => {
    const deg = i * 30
    const rad = (deg - 90) * (Math.PI / 180)
    const isMain = i % 3 === 0
    const outer = r * 0.87
    const inner = isMain ? r * 0.74 : r * 0.80
    const round6 = (n: number) => Math.round(n * 1e6) / 1e6
    return {
      x1: round6(cx + outer * Math.cos(rad)),
      y1: round6(cy + outer * Math.sin(rad)),
      x2: round6(cx + inner * Math.cos(rad)),
      y2: round6(cy + inner * Math.sin(rad)),
      isMain,
    }
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`dg-${id}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </radialGradient>
      </defs>
      {/* Case */}
      <circle cx={cx} cy={cy} r={r * 0.97} fill="#C8B89A" />
      <circle cx={cx} cy={cy} r={r * 0.91} fill="#9E7F4A" />
      {/* Dial */}
      <circle cx={cx} cy={cy} r={r * 0.82} fill={`url(#dg-${id})`} />
      {/* Hour markers */}
      {markers.map((m, i) => (
        <line
          key={i}
          x1={m.x1} y1={m.y1}
          x2={m.x2} y2={m.y2}
          stroke={c.marks}
          strokeWidth={m.isMain ? 2 : 1}
          strokeLinecap="round"
        />
      ))}
      {/* Hour hand */}
      <line x1={cx} y1={cy} x2={hourTip.x} y2={hourTip.y} stroke="#9E7F4A" strokeWidth={3.5} strokeLinecap="round" />
      {/* Minute hand */}
      <line x1={cx} y1={cy} x2={minTip.x} y2={minTip.y} stroke="#9E7F4A" strokeWidth={2.5} strokeLinecap="round" />
      {/* Second hand */}
      <line x1={cx} y1={cy} x2={secTip.x} y2={secTip.y} stroke="#B8410A" strokeWidth={1.2} strokeLinecap="round" />
      {/* Center cap */}
      <circle cx={cx} cy={cy} r={r * 0.057} fill="#9E7F4A" />
      <circle cx={cx} cy={cy} r={r * 0.029} fill="#FAF7F2" />
      {/* Brand */}
      <text
        x={cx} y={cy + r * 0.33}
        textAnchor="middle"
        fontFamily="Raleway, sans-serif"
        fontSize={size * 0.036}
        fill={c.marks}
        letterSpacing="2"
      >
        AL NOOR
      </text>
    </svg>
  )
}
