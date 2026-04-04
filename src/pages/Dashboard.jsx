import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard () {
  const [stats, setStats] = useState(null)
  const [recording, setRecording] = useState(false)
  const [liveText, setLiveText] = useState('')

  useEffect(() => {
    window.voiceflow.getDashboardStats().then(setStats)

    window.voiceflow.onRecordingStart(() => setRecording(true))
    window.voiceflow.onRecordingStop(() => { setRecording(false); setLiveText('') })
    window.voiceflow.onTranscript((text) => setLiveText(text))
  }, [])

  function handleMouseDown () {
    window.voiceflow.startRecording()
  }

  function handleMouseUp () {
    window.voiceflow.stopRecording()
  }

  if (!stats) return <div style={{ color: '#aaa' }}>Loading…</div>

  const timeSavedHours = (stats.totalWords / 40 / 60).toFixed(1)

  return (
    <div>
      <h1 style={styles.heading}>Dashboard</h1>

      {/* Record button */}
      <div style={styles.recordSection}>
        <button
          style={{ ...styles.recordBtn, ...(recording ? styles.recordBtnActive : {}) }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={recording ? handleMouseUp : undefined}
        >
          {recording ? '⏹ Release to stop' : '🎙 Hold to record'}
        </button>
        {recording && liveText && (
          <div style={styles.liveText}>{liveText}</div>
        )}
        {recording && !liveText && (
          <div style={styles.listening}>Listening…</div>
        )}
      </div>

      <div style={styles.cardRow}>
        <StatCard label="Total Words" value={stats.totalWords.toLocaleString()} unit="words" />
        <StatCard label="Time Saved" value={timeSavedHours} unit="hours" />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Usage — Last 7 Days</h2>
        <div style={{ height: 220, background: '#222', borderRadius: 12, padding: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.weeklyData}>
              <XAxis dataKey="date" stroke="#555" tick={{ fill: '#777', fontSize: 11 }} />
              <YAxis stroke="#555" tick={{ fill: '#777', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#333', border: 'none', borderRadius: 8 }} />
              <Line type="monotone" dataKey="words" stroke="#4ade80" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.topApps.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Most Used Apps</h2>
          {stats.topApps.map(({ app_name, words }) => (
            <div key={app_name} style={styles.appRow}>
              <span>{app_name || 'Unknown'}</span>
              <span style={{ color: '#4ade80' }}>{words.toLocaleString()} words</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard ({ label, value, unit }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={styles.cardValue}>{value} <span style={styles.cardUnit}>{unit}</span></div>
    </div>
  )
}

const styles = {
  heading:         { fontSize: 24, fontWeight: 700, marginBottom: 24 },
  recordSection:   { marginBottom: 32 },
  recordBtn:       { padding: '16px 40px', fontSize: 16, fontWeight: 700, background: '#222', border: '2px solid #444', borderRadius: 50, color: '#fff', cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none' },
  recordBtnActive: { background: '#7f1d1d', borderColor: '#f87171', color: '#fca5a5' },
  liveText:        { marginTop: 12, fontSize: 14, color: '#ddd', fontStyle: 'italic' },
  listening:       { marginTop: 12, fontSize: 13, color: '#555' },
  cardRow:         { display: 'flex', gap: 16, marginBottom: 32 },
  card:            { flex: 1, background: '#222', borderRadius: 12, padding: 24 },
  cardLabel:       { color: '#aaa', fontSize: 13, marginBottom: 8 },
  cardValue:       { fontSize: 32, fontWeight: 700, color: '#4ade80' },
  cardUnit:        { fontSize: 14, color: '#aaa', fontWeight: 400 },
  section:         { marginBottom: 32 },
  sectionTitle:    { fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#ccc' },
  appRow:          { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2a2a2a', fontSize: 14 }
}
