import React from 'react'

/**
 * VocaLogo — the Voxa brand mark.
 *
 * Props:
 *  size      — pixel size of the mark (default 32)
 *  variant   — 'mark'        → just the icon
 *              'full'        → icon + "Voxa" wordmark side by side
 *              'stacked'     → icon above wordmark
 *  glow      — bool, add drop-shadow glow (default true)
 *  color     — 'gradient' | 'white' | 'mono'
 */
export default function VocaLogo ({
  size = 32,
  variant = 'mark',
  glow = true,
  color = 'gradient',
}) {
  const s = size
  const glowFilter = glow
    ? 'drop-shadow(0 0 10px rgba(217,70,239,0.9)) drop-shadow(0 0 24px rgba(147,51,234,0.5))'
    : 'none'

  const mark = (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill="none"
      style={{ filter: glowFilter, display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="vocaMarkGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#9333EA" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
        <linearGradient id="vocaMarkGradWhite" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E4CFFF" />
        </linearGradient>
      </defs>

      {/* Background pill */}
      <rect x="0" y="0" width="32" height="32" rx="9"
        fill={color === 'gradient' ? 'url(#vocaMarkGrad)' : color === 'white' ? '#fff' : '#9333EA'}
      />

      {/* Mic capsule body */}
      <rect
        x="11" y="5" width="10" height="14" rx="5"
        stroke="white" strokeWidth="1.8" fill="none"
      />

      {/* Capsule inner grille lines */}
      <line x1="11" y1="10" x2="21" y2="10" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="11" y1="13" x2="21" y2="13" stroke="white" strokeWidth="1" strokeOpacity="0.4" />

      {/* Stand arc */}
      <path
        d="M7 16 C7 23.5 25 23.5 25 16"
        stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"
      />

      {/* Stand pole + base */}
      <line x1="16" y1="23.5" x2="16" y2="27"  stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="27"   x2="20" y2="27"   stroke="white" strokeWidth="1.8" strokeLinecap="round" />

      {/* Circuit nodes — techy dots at key corners */}
      <circle cx="11" cy="5"  r="1.4" fill="white" fillOpacity="0.9" />
      <circle cx="21" cy="5"  r="1.4" fill="white" fillOpacity="0.9" />
      <circle cx="11" cy="19" r="1.4" fill="white" fillOpacity="0.7" />
      <circle cx="21" cy="19" r="1.4" fill="white" fillOpacity="0.7" />
      <circle cx="7"  cy="16" r="1.2" fill="white" fillOpacity="0.5" />
      <circle cx="25" cy="16" r="1.2" fill="white" fillOpacity="0.5" />
      <circle cx="16" cy="27" r="1.2" fill="white" fillOpacity="0.5" />
    </svg>
  )

  const wordmark = (
    <svg
      viewBox="0 0 68 22"
      height={Math.round(s * 0.55)}
      fill="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="vocaWordGrad" x1="0" y1="0" x2="64" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#C084FC" />
          <stop offset="100%" stopColor="#F0ABFC" />
        </linearGradient>
      </defs>
      <text
        x="0" y="17"
        fontFamily="-apple-system, 'Inter', BlinkMacSystemFont, sans-serif"
        fontSize="19"
        fontWeight="800"
        letterSpacing="-0.04em"
        fill={color === 'white' ? 'white' : 'url(#vocaWordGrad)'}
      >
        Voxa
      </text>
    </svg>
  )

  if (variant === 'mark') return mark

  if (variant === 'full') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(s * 0.32) }}>
        {mark}
        {wordmark}
      </div>
    )
  }

  // stacked
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(s * 0.2) }}>
      {mark}
      {wordmark}
    </div>
  )
}
