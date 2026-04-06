import React, { useState, useEffect, useRef } from 'react'

const BARS    = 16
const MAX_H   = [14, 26, 40, 54, 46, 32, 56, 42, 38, 54, 30, 46, 56, 40, 24, 14]
const SPEEDS  = [1.1, 0.9, 1.3, 0.8, 1.0, 1.2, 0.85, 1.15, 0.95, 1.05, 1.25, 0.88, 0.92, 1.18, 1.0, 1.1]
const OFFSETS = [0, 0.8, 0.3, 1.1, 0.5, 1.4, 0.2, 0.9, 0.6, 1.3, 0.1, 0.7, 1.0, 0.4, 1.2, 0.6]

export default function RecordingOverlay () {
  const [visible, setVisible]   = useState(false)
  const [heights, setHeights]   = useState(BARS.map ? Array(BARS).fill(3) : Array(16).fill(3))
  const rafRef                  = useRef(null)
  const startRef                = useRef(null)

  useEffect(() => {
    if (!window.voiceflow) return
    window.voiceflow.onRecordingStart(() => setVisible(true))
    window.voiceflow.onRecordingStop(()  => setVisible(false))
  }, [])

  // Drive animation with rAF when visible
  useEffect(() => {
    if (!visible) {
      cancelAnimationFrame(rafRef.current)
      setHeights(Array(16).fill(3))
      return
    }

    startRef.current = performance.now()

    function tick (now) {
      const t = (now - startRef.current) / 1000
      setHeights(
        Array.from({ length: 16 }, (_, i) => {
          const wave = (Math.sin(t * SPEEDS[i] * Math.PI * 2 + OFFSETS[i]) + 1) / 2
          return Math.max(3, Math.round(wave * MAX_H[i]))
        })
      )
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [visible])

  if (!visible) return null

  return (
    <div style={s.root}>
      {heights.map((h, i) => (
        <div key={i} style={{ ...s.bar, height: h }} />
      ))}
    </div>
  )
}

const s = {
  root: {
    width:          '100%',
    height:         '100%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            5,
    background:     'transparent',
  },
  bar: {
    width:       4,
    borderRadius: 3,
    background:  'linear-gradient(180deg, #D946EF, #9333EA)',
    boxShadow:   '0 0 8px rgba(217,70,239,0.8)',
    transition:  'height 0.06s ease',
  },
}
