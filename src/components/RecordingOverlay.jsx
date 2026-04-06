import React, { useState, useEffect } from 'react'

const BARS  = 16
const DELAY = (i) => `${(i * 0.07).toFixed(2)}s`
const HEIGHT = (i) => {
  // varied max heights for a natural waveform shape
  const shape = [0.4, 0.6, 0.85, 1.0, 0.9, 0.7, 0.95, 0.8, 0.75, 0.95, 0.7, 0.9, 1.0, 0.85, 0.6, 0.4]
  return Math.round(shape[i % shape.length] * 34)
}

export default function RecordingOverlay () {
  const [text, setText]       = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!window.voiceflow) return
    window.voiceflow.onRecordingStart(() => { setText(''); setVisible(true) })
    window.voiceflow.onRecordingStop(()  => { setVisible(false); setText('') })
    window.voiceflow.onTranscript((t)   => setText(t))
  }, [])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes wav {
          0%, 100% { height: 3px;   opacity: 0.4; }
          50%       { height: var(--h); opacity: 1;   }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      <div style={s.pill}>
        {/* Glow layer */}
        <div style={s.glow} />

        {/* Dot + label */}
        <div style={s.left}>
          <span style={s.dot} />
        </div>

        {/* Waveform bars */}
        <div style={s.wave}>
          {Array.from({ length: BARS }).map((_, i) => (
            <div
              key={i}
              style={{
                ...s.bar,
                '--h': `${HEIGHT(i)}px`,
                animationDelay: DELAY(i),
              }}
            />
          ))}
        </div>

        {/* Live text */}
        <div style={s.textWrap}>
          <span style={s.text}>{text || 'Listening…'}</span>
        </div>
      </div>
    </>
  )
}

const s = {
  pill: {
    position:       'fixed',
    bottom:         0,
    left:           0,
    right:          0,
    margin:         '0 auto',
    width:          '100%',
    height:         '100%',
    display:        'flex',
    alignItems:     'center',
    gap:            10,
    padding:        '0 18px',
    background:     'rgba(10,10,10,0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border:         '1px solid rgba(217,70,239,0.35)',
    borderRadius:   40,
    boxShadow:      '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(217,70,239,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
    overflow:       'hidden',
    position:       'relative',
  },
  glow: {
    position:       'absolute',
    top:            '-50%',
    left:           '30%',
    width:          200,
    height:         120,
    background:     'radial-gradient(ellipse, rgba(217,70,239,0.18) 0%, transparent 70%)',
    pointerEvents:  'none',
  },
  left: {
    display:        'flex',
    alignItems:     'center',
    flexShrink:     0,
  },
  dot: {
    display:        'inline-block',
    width:          8,
    height:         8,
    borderRadius:   '50%',
    background:     '#D946EF',
    boxShadow:      '0 0 8px #D946EF',
    animation:      'blink 1.2s ease-in-out infinite',
  },
  wave: {
    display:        'flex',
    alignItems:     'center',
    gap:            3,
    flexShrink:     0,
  },
  bar: {
    width:          3,
    height:         3,
    borderRadius:   2,
    background:     'linear-gradient(180deg, #D946EF, #9333EA)',
    boxShadow:      '0 0 4px rgba(217,70,239,0.5)',
    animation:      'wav 0.8s ease-in-out infinite',
  },
  textWrap: {
    flex:           1,
    overflow:       'hidden',
    minWidth:       0,
  },
  text: {
    display:        'block',
    fontSize:       13,
    fontFamily:     '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
    fontWeight:     500,
    color:          '#E9D5FF',
    whiteSpace:     'nowrap',
    overflow:       'hidden',
    textOverflow:   'ellipsis',
    fontStyle:      'italic',
  },
}
