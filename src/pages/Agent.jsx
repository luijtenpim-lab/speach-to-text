import React, { useEffect, useState, useRef } from 'react'

const DEFAULTS = ['Hey VoiceFlow', 'VoiceFlow']

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
      <h1 style={styles.title}>Agent Settings</h1>
      <p style={styles.subtitle}>Configure voice commands to activate your AI agent</p>

      <div style={styles.card}>
        {/* Card header */}
        <div style={styles.cardHeader}>
          <div>
            <div style={styles.cardTitle}>Activation Commands</div>
            <div style={styles.cardDesc}>
              Add voice commands to activate your agent. For example: "Hey VoiceFlow" or "VoiceFlow"
            </div>
          </div>
          <button style={styles.resetBtn} onClick={resetToDefaults}>
            Reset to Defaults
          </button>
        </div>

        {/* Command tags */}
        {commands.length > 0 && (
          <div style={styles.tags}>
            {commands.map(cmd => (
              <div key={cmd} style={styles.tag}>
                <span>{cmd}</span>
                <button style={styles.tagRemove} onClick={() => removeCommand(cmd)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div style={styles.inputRow}>
          <input
            ref={inputRef}
            style={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new command (e.g., 'Hey VoiceFlow')"
          />
          <button
            style={{ ...styles.addBtn, ...(input.trim() ? styles.addBtnActive : {}) }}
            onClick={addCommand}
          >
            +
          </button>
        </div>
      </div>

      {/* Info box */}
      <div style={styles.infoBox}>
        <div style={styles.infoIcon}>💡</div>
        <div>
          <div style={styles.infoTitle}>How it works</div>
          <p style={styles.infoText}>
            While recording is active, VoiceFlow listens for your activation commands in the
            transcript. When detected, it can trigger special actions like starting a new
            recording session or activating an AI response. Commands are case-insensitive.
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page:        { maxWidth: 780 },
  title:       { fontSize: 26, fontWeight: 700, marginBottom: 6 },
  subtitle:    { color: '#666', fontSize: 14, marginBottom: 28 },

  card:        { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: 24, marginBottom: 20 },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardTitle:   { fontWeight: 700, fontSize: 16, marginBottom: 5 },
  cardDesc:    { color: '#666', fontSize: 13 },
  resetBtn:    { background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', flexShrink: 0, marginLeft: 16, paddingTop: 2 },

  tags:        { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  tag:         { display: 'flex', alignItems: 'center', gap: 8, background: '#a3e635', color: '#111', borderRadius: 50, padding: '8px 14px 8px 18px', fontSize: 14, fontWeight: 600 },
  tagRemove:   { background: 'none', border: 'none', color: '#111', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center' },

  inputRow:    { display: 'flex', gap: 10 },
  input:       { flex: 1, background: '#111', border: '1px solid #333', borderRadius: 10, padding: '13px 16px', color: '#fff', fontSize: 14, outline: 'none' },
  addBtn:      { width: 48, height: 48, borderRadius: 10, background: '#2a2a2a', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' },
  addBtnActive:{ background: '#4a7c2f', color: '#fff' },

  infoBox:     { display: 'flex', gap: 16, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: 20 },
  infoIcon:    { fontSize: 22, flexShrink: 0 },
  infoTitle:   { fontWeight: 600, fontSize: 14, marginBottom: 6 },
  infoText:    { color: '#666', fontSize: 13, lineHeight: 1.6 },
}
