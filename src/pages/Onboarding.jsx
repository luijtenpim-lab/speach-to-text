import React, { useEffect, useState } from 'react'

const STEPS = [
  {
    key: 'microphone',
    label: 'Microphone Access',
    description: 'VoiceFlow needs microphone access to hear your voice.',
    how: 'System Settings → Privacy & Security → Microphone → enable VoiceFlow'
  },
  {
    key: 'accessibility',
    label: 'Accessibility Access',
    description: 'VoiceFlow needs Accessibility access to type into other apps.',
    how: 'System Settings → Privacy & Security → Accessibility → + → select VoiceFlow'
  }
]

export default function Onboarding ({ onComplete }) {
  const [statuses, setStatuses] = useState({ microphone: 'checking', accessibility: 'checking' })

  async function checkAll () {
    const perms = await window.voiceflow.checkPermissions()
    setStatuses({
      microphone:    perms.microphone === 'granted' ? 'granted' : 'denied',
      accessibility: perms.accessibility === 'granted' ? 'granted' : 'denied'
    })
  }

  useEffect(() => {
    checkAll()
    const interval = setInterval(checkAll, 2000)
    return () => clearInterval(interval)
  }, [])

  const allGranted = statuses.microphone === 'granted' && statuses.accessibility === 'granted'

  async function finish () {
    await window.voiceflow.setSetting('onboarding_complete', 'true')
    onComplete()
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Welcome to VoiceFlow</h1>
      <p style={styles.sub}>Grant the following permissions to get started.</p>

      {STEPS.map(({ key, label, description, how }) => (
        <div key={key} style={{ ...styles.card, borderColor: statuses[key] === 'granted' ? '#4ade80' : '#555' }}>
          <div style={styles.row}>
            <span style={{ fontSize: 22 }}>{statuses[key] === 'granted' ? '✅' : '🔒'}</span>
            <div style={{ flex: 1, marginLeft: 16 }}>
              <div style={styles.cardTitle}>{label}</div>
              <div style={styles.cardDesc}>{description}</div>
              {statuses[key] !== 'granted' && <div style={styles.hint}>{how}</div>}
            </div>
            <span style={{ color: statuses[key] === 'granted' ? '#4ade80' : '#f87171', fontSize: 13, fontWeight: 600 }}>
              {statuses[key] === 'granted' ? 'Granted' : 'Required'}
            </span>
          </div>
        </div>
      ))}

      <button
        style={{ ...styles.btn, opacity: allGranted ? 1 : 0.4, cursor: allGranted ? 'pointer' : 'not-allowed' }}
        onClick={allGranted ? finish : undefined}
        disabled={!allGranted}
      >
        Continue →
      </button>
    </div>
  )
}

const styles = {
  page:      { maxWidth: 560, margin: '60px auto' },
  title:     { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  sub:       { color: '#aaa', marginBottom: 32 },
  card:      { border: '1px solid #555', borderRadius: 12, padding: 20, marginBottom: 16, background: '#222' },
  row:       { display: 'flex', alignItems: 'flex-start' },
  cardTitle: { fontWeight: 600, marginBottom: 4 },
  cardDesc:  { color: '#aaa', fontSize: 13, marginBottom: 4 },
  hint:      { fontSize: 12, color: '#666', fontStyle: 'italic' },
  btn:       { marginTop: 24, padding: '12px 32px', background: '#4ade80', color: '#000', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700 }
}
