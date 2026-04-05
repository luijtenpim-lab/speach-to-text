import React, { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

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

  function handleMouseDown () { window.voiceflow.startRecording() }
  function handleMouseUp () { window.voiceflow.stopRecording() }

  if (!stats) return <div style={{ color: '#4A5580' }}>Loading…</div>

  const timeSavedHours = (stats.totalWords / 40 / 60).toFixed(1)

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Dashboard</h1>
          <p style={styles.subheading}>Your voice productivity at a glance</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={styles.statRow}>
        <StatCard label="TOTAL WORDS"   value={stats.totalWords.toLocaleString()} unit="words" accent="#9333EA" icon={<WordsIcon />} />
        <StatCard label="TIME SAVED"    value={timeSavedHours}                    unit="hrs"   accent="#6366F1" icon={<TimeIcon />} />
        <StatCard label="DICTATED INTO" value={String(stats.topApps.length || 0)} unit="apps"  accent="#8B5CF6" icon={<AppsIcon />} />
      </div>

      {/* Main grid */}
      <div style={styles.grid}>
        {/* Chart */}
        <div style={styles.chartCard}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.cardTitle}>Usage — Last 7 Days</div>
              <div style={styles.cardSubtitle}>Words transcribed per day</div>
            </div>
          </div>
          <div style={{ height: 180, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#D946EF" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#9333EA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date"
                  stroke="transparent" axisLine={false} tickLine={false}
                  tick={{ fill: '#4A5580', fontSize: 11 }}
                />
                <YAxis
                  stroke="transparent" axisLine={false} tickLine={false}
                  tick={{ fill: '#4A5580', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ background: '#0D0D0D', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 10, color: '#EEEEFF', fontSize: 13 }}
                  labelStyle={{ color: '#8B96C8', marginBottom: 4 }}
                  cursor={{ stroke: 'rgba(124,58,237,0.3)', strokeWidth: 1 }}
                />
                <Area
                  type="monotone" dataKey="words"
                  stroke="#9333EA" strokeWidth={2.5}
                  fill="url(#chartGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#F0ABFC', stroke: '#141414', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Record */}
        <div style={styles.recordCard}>
          <div style={styles.cardTitle}>Record</div>
          <div style={styles.recordCenter}>
            <button
              style={styles.recordBtnWrap}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={recording ? handleMouseUp : undefined}
            >
              {/* Outer pulse ring */}
              {recording && <div style={styles.pulseRing} />}
              <div style={{ ...styles.recordRing, ...(recording ? styles.recordRingActive : {}) }}>
                <div style={{ color: recording ? '#C4B5FD' : '#4A5580' }}>
                  {recording ? <StopIcon /> : <MicIcon />}
                </div>
              </div>
            </button>
            <div style={styles.recordLabel}>
              {recording ? 'Release to stop' : 'Hold to record'}
            </div>
            {recording && (
              <div style={styles.liveBox}>
                <div style={styles.liveRow}>
                  <span style={styles.liveDot} />
                  <span style={styles.liveTag}>LIVE</span>
                </div>
                <div style={styles.liveText}>{liveText || 'Listening…'}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top apps */}
      {stats.topApps.length > 0 && (
        <div style={styles.appsCard}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.cardTitle}>Most Used Apps</div>
              <div style={styles.cardSubtitle}>Where you dictate most</div>
            </div>
          </div>
          <div style={styles.appList}>
            {stats.topApps.slice(0, 5).map(({ app_name, words }, i) => {
              const max = stats.topApps[0].words
              const pct = Math.round((words / max) * 100)
              return (
                <div key={app_name} style={styles.appRow}>
                  <div style={styles.appRank}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.appName}>{app_name || 'Unknown'}</div>
                    <div style={styles.appBar}>
                      <div style={{ ...styles.appBarFill, width: `${pct}%` }} />
                    </div>
                  </div>
                  <div style={styles.appWords}>
                    {words.toLocaleString()} <span style={styles.appUnit}>words</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard ({ label, value, unit, accent, icon }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background: accent + '28', color: accent }}>
        {icon}
      </div>
      <div>
        <div style={styles.statLabel}>{label}</div>
        <div style={styles.statValue}>
          {value}
          <span style={styles.statUnit}> {unit}</span>
        </div>
      </div>
      <div style={{ ...styles.statBar, background: accent }} />
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function MicIcon () {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8"  y1="21" x2="16" y2="21" />
    </svg>
  )
}

function StopIcon () {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="3" />
    </svg>
  )
}

function WordsIcon () {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 10h16M4 14h10" />
    </svg>
  )
}

function TimeIcon () {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

function AppsIcon () {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  surface:      '#141414',
  surfaceHigh:  '#1C1C1C',
  border:       'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(217,70,239,0.4)',
  text1:        '#FFFFFF',
  text2:        '#C8C8C8',
  text3:        '#888888',
  accent:       '#D946EF',
}

const styles = {
  page:         { maxWidth: 900 },
  header:       { marginBottom: 28 },
  heading:      { fontSize: 26, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em', color: C.text1 },
  subheading:   { color: C.text3, fontSize: 13 },

  statRow:      { display: 'flex', gap: 14, marginBottom: 18 },
  statCard:     { flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' },
  statIcon:     { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel:    { fontSize: 11, fontWeight: 700, color: C.text3, letterSpacing: '0.07em', marginBottom: 5, textTransform: 'uppercase' },
  statValue:    { fontSize: 28, fontWeight: 700, color: C.text1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' },
  statUnit:     { fontSize: 13, fontWeight: 400, color: C.text2 },
  statBar:      { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2 },

  grid:         { display: 'grid', gridTemplateColumns: '1fr 270px', gap: 14, marginBottom: 14 },

  chartCard:    { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 },
  recordCard:   { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column' },

  cardHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle:    { fontWeight: 600, fontSize: 15, color: C.text1, marginBottom: 2 },
  cardSubtitle: { color: C.text3, fontSize: 12 },

  recordCenter: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 16 },
  recordBtnWrap:{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 0, userSelect: 'none' },
  pulseRing:    {
    position: 'absolute',
    inset: -8,
    borderRadius: '50%',
    border: '2px solid rgba(124,58,237,0.4)',
    animation: 'pulse 1.4s ease-out infinite',
  },
  recordRing:   {
    width: 92,
    height: 92,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.1)',
    background: '#0D0D0D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.22s',
  },
  recordRingActive: {
    border: '2px solid #9333EA',
    background: '#1A1020',
    boxShadow: '0 0 0 8px rgba(124,58,237,0.15), 0 0 28px rgba(124,58,237,0.35)',
  },
  recordLabel:  { fontSize: 12, color: C.text3, fontWeight: 500 },

  liveBox:      { width: '100%', background: '#0D0D0D', borderRadius: 10, padding: '10px 14px', border: `1px solid ${C.borderAccent}` },
  liveRow:      { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  liveDot:      { display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#9333EA', boxShadow: '0 0 7px #9333EA' },
  liveTag:      { fontSize: 10, fontWeight: 700, color: '#D946EF', letterSpacing: '0.08em' },
  liveText:     { fontSize: 13, color: '#C4B5FD', lineHeight: 1.55, fontStyle: 'italic' },

  appsCard:     { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 },
  appList:      { marginTop: 16, display: 'flex', flexDirection: 'column', gap: 13 },
  appRow:       { display: 'flex', alignItems: 'center', gap: 14 },
  appRank:      { width: 18, color: C.text3, fontSize: 12, fontWeight: 600, flexShrink: 0, textAlign: 'right' },
  appName:      { fontSize: 13, fontWeight: 500, color: C.text2, marginBottom: 5 },
  appBar:       { height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  appBarFill:   { height: '100%', background: 'linear-gradient(90deg, #9333EA, #D946EF)', borderRadius: 2, transition: 'width 0.4s' },
  appWords:     { fontSize: 13, fontWeight: 600, color: C.text2, flexShrink: 0, minWidth: 80, textAlign: 'right' },
  appUnit:      { fontWeight: 400, color: C.text3 },
}
