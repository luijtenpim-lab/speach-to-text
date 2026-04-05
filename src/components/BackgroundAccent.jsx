import React from 'react'

/**
 * BackgroundAccent — absolutely positioned techy decorative layer.
 * Sits behind all content. Uses:
 *   1. Fine dot grid covering the full area
 *   2. A radial glow bloom (top-right and bottom-left)
 *   3. SVG circuit traces with node dots — corners + center
 *   4. Large faint logo contour watermark
 */
export default function BackgroundAccent () {
  return (
    <div style={styles.root} aria-hidden="true">
      {/* Layer 1: dot grid */}
      <div style={styles.dotGrid} />

      {/* Layer 2: radial bloom glows */}
      <div style={styles.bloomTopRight} />
      <div style={styles.bloomBottomLeft} />

      {/* Layer 3: circuit traces + nodes */}
      <CircuitDecor />

      {/* Layer 4: giant faint logo contour watermark */}
      <LogoWatermark />
    </div>
  )
}

// ─── Circuit traces ───────────────────────────────────────────────────────────

function CircuitDecor () {
  return (
    <svg style={styles.circuitSvg} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="circuitBlur">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>

      {/* Top-left corner traces */}
      <g stroke="#9333EA" strokeWidth="0.8" opacity="0.25" fill="none" filter="url(#circuitBlur)">
        <line x1="0"  y1="60"  x2="80"  y2="60" />
        <line x1="80" y1="60"  x2="80"  y2="120" />
        <line x1="80" y1="120" x2="140" y2="120" />
        <line x1="140" y1="120" x2="140" y2="80" />
        <line x1="140" y1="80" x2="200" y2="80" />
        <line x1="40"  y1="0"  x2="40"  y2="40" />
        <line x1="40"  y1="40" x2="100" y2="40" />
        <line x1="100" y1="40" x2="100" y2="0"  />
        {/* Node dots */}
        <circle cx="80"  cy="60"  r="2.5" fill="#9333EA" opacity="0.6" />
        <circle cx="80"  cy="120" r="2.5" fill="#9333EA" opacity="0.5" />
        <circle cx="140" cy="120" r="2.5" fill="#9333EA" opacity="0.5" />
        <circle cx="140" cy="80"  r="2.5" fill="#9333EA" opacity="0.6" />
        <circle cx="40"  cy="40"  r="2"   fill="#B366FF" opacity="0.5" />
        <circle cx="100" cy="40"  r="2"   fill="#B366FF" opacity="0.5" />
        {/* Tiny cross marker */}
        <line x1="198" y1="78" x2="202" y2="82" strokeWidth="1" />
        <line x1="202" y1="78" x2="198" y2="82" strokeWidth="1" />
      </g>

      {/* Bottom-right corner traces */}
      <g stroke="#9333EA" strokeWidth="0.8" opacity="0.25" fill="none" filter="url(#circuitBlur)">
        <line x1="800" y1="520" x2="720" y2="520" />
        <line x1="720" y1="520" x2="720" y2="460" />
        <line x1="720" y1="460" x2="660" y2="460" />
        <line x1="660" y1="460" x2="660" y2="500" />
        <line x1="660" y1="500" x2="600" y2="500" />
        <line x1="760" y1="600" x2="760" y2="560" />
        <line x1="760" y1="560" x2="700" y2="560" />
        <line x1="700" y1="560" x2="700" y2="600" />
        {/* Node dots */}
        <circle cx="720" cy="520" r="2.5" fill="#9333EA" opacity="0.6" />
        <circle cx="720" cy="460" r="2.5" fill="#9333EA" opacity="0.5" />
        <circle cx="660" cy="460" r="2.5" fill="#9333EA" opacity="0.5" />
        <circle cx="660" cy="500" r="2.5" fill="#9333EA" opacity="0.6" />
        <circle cx="760" cy="560" r="2"   fill="#B366FF" opacity="0.5" />
        <circle cx="700" cy="560" r="2"   fill="#B366FF" opacity="0.5" />
      </g>

      {/* Top-right sparse traces */}
      <g stroke="#7E22CE" strokeWidth="0.6" opacity="0.18" fill="none">
        <line x1="800" y1="80"  x2="720" y2="80" />
        <line x1="720" y1="80"  x2="720" y2="140" />
        <line x1="720" y1="140" x2="680" y2="140" />
        <line x1="760" y1="0"   x2="760" y2="50" />
        <circle cx="720" cy="80"  r="2" fill="#9333EA" opacity="0.45" />
        <circle cx="720" cy="140" r="2" fill="#9333EA" opacity="0.35" />
        <circle cx="760" cy="50"  r="2" fill="#B366FF" opacity="0.35" />
      </g>

      {/* Horizontal scan line — barely visible */}
      <line x1="0" y1="300" x2="800" y2="300" stroke="#9333EA" strokeWidth="0.3" opacity="0.08" strokeDasharray="4 12" />
    </svg>
  )
}

// ─── Logo watermark ───────────────────────────────────────────────────────────

function LogoWatermark () {
  // Large faint mic/logo contour, positioned right side
  return (
    <svg style={styles.watermarkSvg} viewBox="0 0 200 200" fill="none">
      <defs>
        <linearGradient id="wmGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor="#9333EA" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#B366FF" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* Outer glow ring */}
      <circle cx="100" cy="80" r="70" stroke="url(#wmGrad)" strokeWidth="1" fill="none" />
      <circle cx="100" cy="80" r="60" stroke="#9333EA" strokeWidth="0.5" strokeOpacity="0.08" fill="none" />

      {/* Mic capsule — large contour */}
      <rect x="74" y="24" width="52" height="78" rx="26"
        stroke="url(#wmGrad)" strokeWidth="1.5" fill="none"
      />

      {/* Inner grille lines */}
      <line x1="74" y1="50" x2="126" y2="50" stroke="#9333EA" strokeWidth="0.6" strokeOpacity="0.1" />
      <line x1="74" y1="62" x2="126" y2="62" stroke="#9333EA" strokeWidth="0.6" strokeOpacity="0.1" />
      <line x1="74" y1="74" x2="126" y2="74" stroke="#9333EA" strokeWidth="0.6" strokeOpacity="0.1" />
      <line x1="74" y1="86" x2="126" y2="86" stroke="#9333EA" strokeWidth="0.6" strokeOpacity="0.1" />

      {/* Stand arc */}
      <path d="M50 98 C50 140 150 140 150 98"
        stroke="url(#wmGrad)" strokeWidth="1.5" fill="none" strokeLinecap="round"
      />

      {/* Pole + base */}
      <line x1="100" y1="140" x2="100" y2="160" stroke="#9333EA" strokeWidth="1.2" strokeOpacity="0.1" strokeLinecap="round" />
      <line x1="78"  y1="160" x2="122" y2="160" stroke="#9333EA" strokeWidth="1.2" strokeOpacity="0.1" strokeLinecap="round" />

      {/* Node dots */}
      <circle cx="74"  cy="24"  r="4" fill="#9333EA" fillOpacity="0.15" />
      <circle cx="126" cy="24"  r="4" fill="#9333EA" fillOpacity="0.15" />
      <circle cx="74"  cy="102" r="4" fill="#9333EA" fillOpacity="0.1" />
      <circle cx="126" cy="102" r="4" fill="#9333EA" fillOpacity="0.1" />
      <circle cx="50"  cy="98"  r="3" fill="#B366FF" fillOpacity="0.12" />
      <circle cx="150" cy="98"  r="3" fill="#B366FF" fillOpacity="0.12" />

      {/* Outer circuit tick marks */}
      <line x1="96"  cy="20" x2="104" y2="20" stroke="#9333EA" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="20"  y1="76" x2="20"  y2="84" stroke="#9333EA" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="180" y1="76" x2="180" y2="84" stroke="#9333EA" strokeWidth="0.8" strokeOpacity="0.2" />
    </svg>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  root: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
  },
  dotGrid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle, rgba(217,70,239,0.18) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
  },
  bloomTopRight: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 480,
    height: 480,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(217,70,239,0.12) 0%, transparent 70%)',
  },
  bloomBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(147,51,234,0.10) 0%, transparent 70%)',
  },
  circuitSvg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  watermarkSvg: {
    position: 'absolute',
    right: -40,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 380,
    height: 380,
    opacity: 1,
  },
}
