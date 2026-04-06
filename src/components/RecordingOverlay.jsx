import React, { useState, useEffect } from 'react'

const BARS   = 16
const DELAYS = [0, .12, .05, .19, .08, .24, .03, .16, .11, .22, .06, .18, .02, .14, .09, .21]
const HEIGHTS = [14, 24, 38, 52, 46, 30, 54, 40, 36, 52, 28, 44, 54, 38, 22, 12]

export default function RecordingOverlay () {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!window.voiceflow) return
    window.voiceflow.onRecordingStart(() => setVisible(true))
    window.voiceflow.onRecordingStop(()  => setVisible(false))
  }, [])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes wav {
          0%, 100% { height: 3px; opacity: 0.35; }
          50%       { height: var(--h); opacity: 1; }
        }
      `}</style>

      <div style={s.root}>
        {BARS.map((_, i) => (
          <div
            key={i}
            style={{
              ...s.bar,
              '--h': `${HEIGHTS[i]}px`,
              animationDelay: `${DELAYS[i]}s`,
            }}
          />
        ))}
      </div>
    </>
  )
}

const s = {
  root: {
    width:       '100%',
    height:      '100%',
    display:     'flex',
    alignItems:  'center',
    justifyContent: 'center',
    gap:         5,
    background:  'transparent',
  },
  bar: {
    width:       4,
    borderRadius: 3,
    background:  'linear-gradient(180deg, #D946EF, #9333EA)',
    boxShadow:   '0 0 6px rgba(217,70,239,0.7)',
    animation:   'wav 0.85s ease-in-out infinite',
  },
}
