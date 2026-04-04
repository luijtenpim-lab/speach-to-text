import React, { useEffect, useState } from 'react'

export default function Settings () {
  const [hotkeyCode, setHotkeyCode] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.voiceflow.getSetting('hotkey_rawcode').then((val) => {
      setHotkeyCode(val ? parseInt(val, 10) : 63) // 63 = fn
    })

    window.voiceflow.onKeycodeDetected((code) => {
      setHotkeyCode(code)
      setCapturing(false)
      window.voiceflow.setSetting('hotkey_rawcode', String(code))
      window.voiceflow.stopKeycodeCapture()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }, [])

  async function startCapture () {
    setCapturing(true)
    setSaved(false)
    await window.voiceflow.startKeycodeCapture()
  }

  function hotkeyLabel (code) {
    if (code === 63) return 'fn'
    if (code === null) return '—'
    return `Key ${code}`
  }

  return (
    <div>
      <h1 style={styles.heading}>Settings</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Push-to-Talk Hotkey</h2>
        <p style={styles.desc}>Hold this key to start recording. Release to inject the transcribed text.</p>
        <div style={styles.row}>
          <div style={styles.keyBadge}>
            {capturing ? 'Press any key…' : hotkeyLabel(hotkeyCode)}
          </div>
          <button
            style={{ ...styles.btn, ...(capturing ? styles.btnActive : {}) }}
            onClick={capturing ? undefined : startCapture}
          >
            {capturing ? 'Waiting…' : 'Change'}
          </button>
          {saved && <span style={styles.saved}>Saved ✓</span>}
        </div>
        <p style={styles.hint}>
          Default: <strong>fn</strong>. If fn doesn't register on your keyboard, try Right Option (⌥) or another dedicated key.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Microphone</h2>
        <p style={styles.desc}>Currently using the system default microphone.</p>
        <p style={styles.hint}>Additional microphone selection coming in a future update.</p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Language</h2>
        <p style={styles.desc}>Currently uses your macOS system language for recognition.</p>
        <p style={styles.hint}>Multi-language selection available when Whisper API is enabled.</p>
      </div>
    </div>
  )
}

const styles = {
  heading:      { fontSize: 24, fontWeight: 700, marginBottom: 32 },
  section:      { background: '#222', borderRadius: 12, padding: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 6 },
  desc:         { color: '#aaa', fontSize: 13, marginBottom: 16 },
  hint:         { color: '#555', fontSize: 12, marginTop: 12 },
  row:          { display: 'flex', alignItems: 'center', gap: 12 },
  keyBadge:     { background: '#333', border: '1px solid #555', borderRadius: 8, padding: '8px 20px', fontSize: 15, fontWeight: 600, minWidth: 100, textAlign: 'center' },
  btn:          { background: '#333', border: '1px solid #555', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, cursor: 'pointer' },
  btnActive:    { background: '#1e3a5f', borderColor: '#3b82f6' },
  saved:        { color: '#4ade80', fontSize: 13 }
}
