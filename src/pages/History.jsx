import React, { useEffect, useState, useCallback } from 'react'

const C = {
  surface:      '#141414',
  border:       'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(217,70,239,0.4)',
  text1:        '#FFFFFF',
  text2:        '#C8C8C8',
  text3:        '#888888',
}

export default function History () {
  const [sessions, setSessions] = useState([])
  const [copiedId, setCopiedId] = useState(null)

  const load = useCallback(() => {
    window.voiceflow.getSessions({ limit: 100 }).then(setSessions)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete (id) {
    await window.voiceflow.deleteSession(id)
    load()
  }

  function handleCopy (id, text) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>History</h1>
          <p style={styles.subheading}>Your transcription history — stored locally on this device</p>
        </div>
        <div style={styles.privacyBadge}>
          <LockIcon /> Local only
        </div>
      </div>

      {sessions.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}><MicEmptyIcon /></div>
          <div style={styles.emptyTitle}>No transcriptions yet</div>
          <div style={styles.emptyDesc}>Hold the hotkey or use the record button to start dictating</div>
        </div>
      ) : (
        <div style={styles.list}>
          {sessions.map((s) => (
            <div key={s.id} style={styles.row}>
              <div style={styles.rowMeta}>
                <span style={styles.time}>{formatDate(s.created_at)}</span>
                {s.app_name && <span style={styles.appTag}>{s.app_name}</span>}
                <span style={styles.wordCount}>{s.word_count} words</span>
              </div>
              <div style={styles.text}>{s.text}</div>
              <div style={styles.actions}>
                <button
                  style={{ ...styles.btn, ...(copiedId === s.id ? styles.btnCopied : {}) }}
                  onClick={() => handleCopy(s.id, s.text)}
                >
                  {copiedId === s.id ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
                </button>
                <button
                  style={{ ...styles.btn, ...styles.btnDelete }}
                  onClick={() => handleDelete(s.id)}
                >
                  <TrashIcon /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate (iso) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function LockIcon () {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
}
function CopyIcon () {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
}
function CheckIcon () {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>
}
function TrashIcon () {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
}
function MicEmptyIcon () {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/></svg>
}

const styles = {
  page:         { maxWidth: 760 },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  heading:      { fontSize: 26, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em', color: C.text1 },
  subheading:   { color: C.text3, fontSize: 13 },
  privacyBadge: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(217,70,239,0.12)', border: '1px solid rgba(217,70,239,0.3)', borderRadius: 50, padding: '6px 12px', fontSize: 12, color: '#C4B5FD', fontWeight: 600, flexShrink: 0, marginTop: 4 },

  emptyState:   { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 },
  emptyIcon:    { width: 68, height: 68, borderRadius: '50%', background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3, marginBottom: 8 },
  emptyTitle:   { fontSize: 16, fontWeight: 600, color: C.text2 },
  emptyDesc:    { fontSize: 13, color: C.text3, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 },

  list:         { display: 'flex', flexDirection: 'column', gap: 10 },
  row:          { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' },
  rowMeta:      { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 },
  time:         { fontSize: 12, color: C.text3, fontVariantNumeric: 'tabular-nums' },
  appTag:       { fontSize: 11, background: 'rgba(217,70,239,0.15)', border: '1px solid rgba(217,70,239,0.3)', borderRadius: 4, padding: '2px 8px', color: '#C4B5FD', fontWeight: 600 },
  wordCount:    { fontSize: 11, color: C.text3, marginLeft: 'auto' },
  // Transcript text — clearly readable
  text:         { fontSize: 14, color: C.text2, lineHeight: 1.7, marginBottom: 14 },
  actions:      { display: 'flex', gap: 8 },
  btn:          { display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 12px', color: C.text3, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnCopied:    { background: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.35)', color: '#34D399' },
  btnDelete:    { color: '#F87171' },
}
