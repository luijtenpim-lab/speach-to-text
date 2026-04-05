import React, { useEffect, useState } from 'react'
import VocaLogo from '../components/VocaLogo'

const C = {
  surface:  '#141414',
  border:   'rgba(255,255,255,0.07)',
  text1:    '#FFFFFF',
  text2:    '#C8C8C8',
  text3:    '#888888',
}

const STEPS = [
  {
    key:  'microphone',
    label: 'Microphone Access',
    desc:  'Voca needs microphone access to hear your voice and transcribe speech.',
    how:   'System Settings → Privacy & Security → Microphone → enable Voca',
    icon:  <MicIcon />,
  },
  {
    key:  'accessibility',
    label: 'Accessibility Access',
    desc:  'Voca needs Accessibility access to inject transcribed text into other apps.',
    how:   'System Settings → Privacy & Security → Accessibility → + → select Voca',
    icon:  <AccessIcon />,
  },
]

export default function Onboarding ({ onComplete }) {
  const [statuses, setStatuses] = useState({ microphone: 'checking', accessibility: 'checking' })

  async function checkAll () {
    const perms = await window.voiceflow.checkPermissions()
    setStatuses({
      microphone:    perms.microphone    === 'granted' ? 'granted' : 'denied',
      accessibility: perms.accessibility === 'granted' ? 'granted' : 'denied',
    })
  }

  useEffect(() => {
    checkAll()
    const id = setInterval(checkAll, 2000)
    return () => clearInterval(id)
  }, [])

  const allGranted = statuses.microphone === 'granted' && statuses.accessibility === 'granted'

  async function finish () {
    await window.voiceflow.setSetting('onboarding_complete', 'true')
    onComplete()
  }

  return (
    <div style={styles.page}>
      {/* Subtle radial bloom */}
      <div style={styles.bloom} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <VocaLogo size={36} variant="full" glow />
        </div>

        <h1 style={styles.title}>Set up Voxa</h1>
        <p style={styles.subtitle}>Grant the two required permissions below to start dictating into any app.</p>

        {/* Permission steps */}
        <div style={styles.steps}>
          {STEPS.map(({ key, label, desc, how, icon }) => {
            const granted = statuses[key] === 'granted'
            return (
              <div key={key} style={{ ...styles.step, ...(granted ? styles.stepGranted : {}) }}>
                <div style={{ ...styles.stepIcon, ...(granted ? styles.stepIconGranted : {}) }}>
                  {granted ? <CheckIcon /> : icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.stepTitle}>{label}</div>
                  <div style={styles.stepDesc}>{desc}</div>
                  {!granted && statuses[key] !== 'checking' && (
                    <div style={styles.howTo}>{how}</div>
                  )}
                </div>
                <div style={{
                  ...styles.statusBadge,
                  ...(granted ? styles.badgeGranted : styles.badgeDenied),
                }}>
                  {statuses[key] === 'checking' ? 'Checking…' : granted ? 'Granted' : 'Required'}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <button
          style={{ ...styles.btn, ...(allGranted ? styles.btnReady : styles.btnWaiting) }}
          onClick={allGranted ? finish : undefined}
          disabled={!allGranted}
        >
          {allGranted ? 'Continue to Voxa →' : 'Waiting for permissions…'}
        </button>

        <p style={styles.note}>Permissions are checked automatically every 2 seconds</p>
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function MicIcon () {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
}

function AccessIcon () {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="5" r="2"/><path d="M6 9h12M12 9v6M9 21l3-6 3 6"/></svg>
}

function CheckIcon () {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page:         { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: '#080808' },
  bloom:        { position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,70,239,0.14) 0%, transparent 70%)', pointerEvents: 'none' },
  card:         { position: 'relative', zIndex: 1, width: '100%', maxWidth: 500, background: C.surface, border: `1px solid rgba(217,70,239,0.2)`, borderRadius: 20, padding: 36, boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(217,70,239,0.12)' },
  logoRow:      { marginBottom: 28 },
  title:        { fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em', color: C.text1 },
  subtitle:     { color: C.text3, fontSize: 13, marginBottom: 28, lineHeight: 1.6 },

  steps:        { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 },
  step:         { display: 'flex', alignItems: 'flex-start', gap: 14, background: '#0E0F28', border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px', transition: 'all 0.2s' },
  stepGranted:  { border: '1px solid rgba(217,70,239,0.35)', background: 'rgba(217,70,239,0.08)', boxShadow: '0 0 0 1px rgba(217,70,239,0.15)' },
  stepIcon:     { width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3, flexShrink: 0 },
  stepIconGranted: { background: 'rgba(217,70,239,0.15)', border: '1px solid rgba(217,70,239,0.3)', color: '#F0ABFC' },
  stepTitle:    { fontWeight: 700, fontSize: 14, marginBottom: 4, color: C.text1 },
  stepDesc:     { color: C.text3, fontSize: 12, lineHeight: 1.55 },
  howTo:        { marginTop: 8, fontSize: 12, color: '#B0B8E0', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '6px 10px', fontFamily: '"JetBrains Mono","SF Mono",monospace', lineHeight: 1.6 },
  statusBadge:  { borderRadius: 50, padding: '4px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap', alignSelf: 'flex-start' },
  badgeGranted: { background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.3)' },
  badgeDenied:  { background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' },

  btn:          { width: '100%', padding: '14px 0', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', marginBottom: 12 },
  btnReady:     { background: 'linear-gradient(135deg, #9333EA, #D946EF)', color: '#fff', boxShadow: '0 0 28px rgba(217,70,239,0.65)' },
  btnWaiting:   { background: 'rgba(255,255,255,0.06)', color: C.text3, cursor: 'not-allowed' },
  note:         { textAlign: 'center', color: C.text3, fontSize: 12 },
}
