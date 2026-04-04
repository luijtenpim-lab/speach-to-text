import React, { useState, useEffect } from 'react'

export default function RecordingOverlay () {
  const [text, setText] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!window.voiceflow) return

    window.voiceflow.onRecordingStart(() => {
      setText('')
      setVisible(true)
    })

    window.voiceflow.onRecordingStop(() => {
      setVisible(false)
      setText('')
    })

    window.voiceflow.onTranscript((partial) => {
      setText(partial)
    })
  }, [])

  if (!visible) return null

  return (
    <div style={styles.pill}>
      <span style={styles.dot} />
      <span style={styles.text}>{text || 'Listening…'}</span>
    </div>
  )
}

const styles = {
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 40,
    padding: '10px 20px',
    maxWidth: 380,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#f87171',
    marginRight: 10,
    flexShrink: 0
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}
