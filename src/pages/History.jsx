import React, { useEffect, useState, useCallback } from 'react'

export default function History () {
  const [sessions, setSessions] = useState([])

  const load = useCallback(() => {
    window.voiceflow.getSessions({ limit: 100 }).then(setSessions)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete (id) {
    await window.voiceflow.deleteSession(id)
    load()
  }

  function handleCopy (text) {
    navigator.clipboard.writeText(text)
  }

  return (
    <div>
      <h1 style={styles.heading}>History</h1>
      <div style={styles.privacyNote}>
        🔒 Transcriptions are stored locally on your device.
      </div>

      {sessions.length === 0 ? (
        <div style={styles.empty}>No transcriptions yet. Hold the hotkey and start speaking.</div>
      ) : (
        sessions.map((s) => (
          <div key={s.id} style={styles.row}>
            <div style={styles.meta}>
              <span style={styles.time}>{formatDate(s.created_at)}</span>
              {s.app_name && <span style={styles.app}>{s.app_name}</span>}
              <span style={styles.words}>{s.word_count} words</span>
            </div>
            <div style={styles.text}>{s.text}</div>
            <div style={styles.actions}>
              <button style={styles.btn} onClick={() => handleCopy(s.text)}>Copy</button>
              <button style={{ ...styles.btn, color: '#f87171' }} onClick={() => handleDelete(s.id)}>Delete</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function formatDate (iso) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const styles = {
  heading:     { fontSize: 24, fontWeight: 700, marginBottom: 16 },
  privacyNote: { background: '#1e3a1e', border: '1px solid #2d5a2d', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#86efac', marginBottom: 24 },
  empty:       { color: '#555', marginTop: 60, textAlign: 'center' },
  row:         { background: '#222', borderRadius: 10, padding: 16, marginBottom: 12 },
  meta:        { display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' },
  time:        { fontSize: 12, color: '#666' },
  app:         { fontSize: 12, background: '#333', borderRadius: 4, padding: '2px 8px', color: '#aaa' },
  words:       { fontSize: 12, color: '#555' },
  text:        { fontSize: 14, color: '#ddd', lineHeight: 1.5, marginBottom: 10 },
  actions:     { display: 'flex', gap: 8 },
  btn:         { background: 'none', border: '1px solid #333', borderRadius: 6, padding: '4px 12px', color: '#aaa', fontSize: 12, cursor: 'pointer' }
}
