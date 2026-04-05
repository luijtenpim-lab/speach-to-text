import React, { useEffect, useState, useRef } from 'react'

const DEFAULTS = ['Hey VoiceFlow', 'VoiceFlow']

const C = {
  surface:      '#141414',
  border:       'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(217,70,239,0.4)',
  text1:        '#FFFFFF',
  text2:        '#C8C8C8',
  text3:        '#888888',
}

export default function Agent () {
  const [commands, setCommands] = useState(DEFAULTS)
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    window.voiceflow.getSetting('agent_commands').then(val => {
      if (val) setCommands(JSON.parse(val))
    })
  }, [])

  async function persist (updated) {
    setCommands(updated)
    await window.voiceflow.setSetting('agent_commands', JSON.stringify(updated))
  }

  function addCommand () {
    const trimmed = input.trim()
    if (!trimmed || commands.includes(trimmed)) return
    persist([...commands, trimmed])
    setInput('')
    inputRef.current?.focus()
  }

  function removeCommand (cmd) {
    persist(commands.filter(c => c !== cmd))
  }

  function handleKeyDown (e) {
    if (e.key === 'Enter') addCommand()
  }

  function resetToDefaults () {
    persist(DEFAULTS)
    setInput('')
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Agent</h1>
        <p style={styles.subheading}>Configure voice commands to activate your AI agent</p>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardIconWrap}><AgentGlyph /></div>
          <div style={{ flex: 1 }}>
            <div style={styles.cardTitle}>Activation Commands</div>
            <div style={styles.cardDesc}>Speak these phrases to trigger your AI agent during recording</div>
          </div>
          <button style={styles.resetBtn} onClick={resetToDefaults}>Reset defaults</button>
        </div>

        {commands.length > 0 && (
          <div style={styles.tags}>
            {commands.map(cmd => (
              <div key={cmd} style={styles.tag}>
                <span style={styles.tagDot} />
                <span>{cmd}</span>
                <button style={styles.tagRemove} onClick={() => removeCommand(cmd)}><XIcon /></button>
              </div>
            ))}
          </div>
        )}

        <div style={styles.inputRow}>
          <input
            ref={inputRef}
            style={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a command (e.g. Hey Voxa)"
          />
          <button
            style={{ ...styles.addBtn, ...(input.trim() ? styles.addBtnActive : {}) }}
            onClick={addCommand}
          >
            <PlusIcon active={!!input.trim()} />
          </button>
        </div>
      </div>

      <div style={styles.infoBox}>
        <div style={styles.infoIcon}><InfoIcon /></div>
        <div>
          <div style={styles.infoTitle}>How activation commands work</div>
          <p style={styles.infoText}>
            While recording is active, Voxa listens for your activation commands in the
            transcript. When detected, it triggers special actions like starting a new session
            or activating an AI response. Commands are case-insensitive.
          </p>
        </div>
      </div>
    </div>
  )
}

function AgentGlyph () {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 22,7 22,17 12,22 2,17 2,7"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>
}
function XIcon () {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}
function PlusIcon ({ active }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#4A5580'} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function InfoIcon () {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8" strokeWidth="2.5"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
}

const styles = {
  page:         { maxWidth: 680 },
  header:       { marginBottom: 28 },
  heading:      { fontSize: 26, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em', color: C.text1 },
  subheading:   { color: C.text3, fontSize: 13 },

  card:         { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 14 },
  cardHeader:   { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 10, background: 'rgba(217,70,239,0.15)', border: '1px solid rgba(217,70,239,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D946EF', flexShrink: 0, marginTop: 2 },
  cardTitle:    { fontWeight: 700, fontSize: 15, marginBottom: 4, color: C.text1 },
  cardDesc:     { color: C.text3, fontSize: 13, lineHeight: 1.5 },
  resetBtn:     { background: 'none', border: 'none', color: C.text3, fontSize: 12, cursor: 'pointer', flexShrink: 0, textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.15)' },

  tags:         { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag:          { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(217,70,239,0.15)', border: '1px solid rgba(217,70,239,0.4)', borderRadius: 50, padding: '8px 12px 8px 14px', fontSize: 13, fontWeight: 600, color: '#DDD6FF' },
  tagDot:       { width: 6, height: 6, borderRadius: '50%', background: '#9333EA', flexShrink: 0, boxShadow: '0 0 5px #9333EA' },
  tagRemove:    { background: 'none', border: 'none', color: '#6B7DB0', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', marginLeft: 2 },

  inputRow:     { display: 'flex', gap: 10 },
  input:        { flex: 1, background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: C.text1, fontSize: 14, outline: 'none' },
  addBtn:       { width: 46, height: 46, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' },
  addBtnActive: { background: 'linear-gradient(135deg, #9333EA, #D946EF)', border: 'none', boxShadow: '0 0 14px rgba(217,70,239,0.5)' },

  infoBox:      { display: 'flex', gap: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' },
  infoIcon:     { color: '#9333EA', flexShrink: 0, marginTop: 1 },
  infoTitle:    { fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#C4B5FD' },
  infoText:     { color: C.text3, fontSize: 13, lineHeight: 1.65, margin: 0 },
}
