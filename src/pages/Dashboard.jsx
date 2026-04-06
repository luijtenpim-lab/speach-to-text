import React, { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard () {
  const [stats, setStats]       = useState(null)
  const [recording, setRecording] = useState(false)
  const [liveText, setLiveText] = useState('')

  useEffect(() => {
    window.voiceflow.getDashboardStats().then(setStats)
    window.voiceflow.onRecordingStart(() => setRecording(true))
    window.voiceflow.onRecordingStop(() => { setRecording(false); setLiveText('') })
    window.voiceflow.onTranscript((text) => setLiveText(text))
  }, [])

  function handleMouseDown () { window.voiceflow.startRecording() }
  function handleMouseUp ()   { window.voiceflow.stopRecording() }

  if (!stats) return <div style={{ color: '#4A5580' }}>Loading…</div>

  const timeSavedHours = (stats.totalWords / 40 / 60).toFixed(1)

  return (
    <div style={styles.page}>
      {/* Recording overlay — covers the dashboard while active */}
      {recording && (
        <RecordingOverlay liveText={liveText} onStop={handleMouseUp} />
      )}

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

        {/* Record button card */}
        <div style={styles.recordCard}>
          <div style={styles.cardTitle}>Record</div>
          <div style={styles.recordCenter}>
            <button
              style={styles.recordBtnWrap}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={recording ? handleMouseUp : undefined}
            >
              <div style={styles.recordRing}>
                <div style={{ color: '#4A5580' }}><MicIcon /></div>
              </div>
            </button>
            <div style={styles.recordLabel}>Hold to record</div>
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

// ─── Recording overlay ────────────────────────────────────────────────────────

const BARS = [0.4, 0.7, 1.0, 0.6, 0.85, 0.5, 0.9, 0.65, 0.75, 0.45, 0.8, 0.55]
const DELAYS = [0, 0.18, 0.09, 0.27, 0.05, 0.22, 0.14, 0.31, 0.02, 0.19, 0.11, 0.25]

function RecordingOverlay ({ liveText, onStop }) {
  return (
    <div style={ov.backdrop}>
      {/* Radial bloom */}
      <div style={ov.bloom1} />
      <div style={ov.bloom2} />

      <div style={ov.card}>
        {/* Animated waveform */}
        <div style={ov.waveRow}>
          {BARS.map((h, i) => (
            <div
              key={i}
              style={{
                ...ov.bar,
                animationDelay: `${DELAYS[i]}s`,
                '--bar-h': `${Math.round(h * 52)}px`,
              }}
            />
          ))}
        </div>

        {/* Pulsing mic button */}
        <div style={ov.micWrap}>
          <div style={ov.pulse1} />
          <div style={ov.pulse2} />
          <div style={ov.micCircle}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7" />
              <line x1="12" y1="17" x2="12" y2="21" />
              <line x1="8"  y1="21" x2="16" y2="21" />
            </svg>
          </div>
        </div>

        {/* Status */}
        <div style={ov.statusRow}>
          <span style={ov.liveDot} />
          <span style={ov.liveLabel}>RECORDING</span>
        </div>

        {/* Live transcript */}
        <div style={ov.transcriptBox}>
          <p style={ov.transcriptText}>{liveText || 'Listening…'}</p>
        </div>

        {/* Stop button */}
        <button style={ov.stopBtn} onMouseUp={onStop}>
          Release to stop
        </button>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 8px; }
          50%       { height: var(--bar-h, 32px); }
        }
        @keyframes ov-pulse1 {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes ov-pulse2 {
          0%   { transform: scale(1);   opacity: 0.35; }
          100% { transform: scale(3);   opacity: 0; }
        }
      `}</style>
    </div>
  )
}

const ov = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    background: 'rgba(8,8,8,0.92)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloom1: {
    position: 'absolute',
    top: '10%', left: '50%',
    transform: 'translateX(-50%)',
    width: 500, height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(217,70,239,0.18) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  bloom2: {
    position: 'absolute',
    bottom: '10%', left: '30%',
    width: 300, height: 300,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(147,51,234,0.14) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28,
    width: 360,
  },

  // Waveform
  waveRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    height: 60,
  },
  bar: {
    width: 4,
    height: 8,
    borderRadius: 3,
    background: 'linear-gradient(180deg, #D946EF, #9333EA)',
    boxShadow: '0 0 6px rgba(217,70,239,0.6)',
    animation: 'wave 0.9s ease-in-out infinite',
  },

  // Mic
  micWrap: {
    position: 'relative',
    width: 100, height: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse1: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '2px solid rgba(217,70,239,0.6)',
    animation: 'ov-pulse1 1.6s ease-out infinite',
  },
  pulse2: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '2px solid rgba(217,70,239,0.4)',
    animation: 'ov-pulse2 1.6s ease-out infinite 0.4s',
  },
  micCircle: {
    width: 80, height: 80,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #9333EA, #D946EF)',
    boxShadow: '0 0 40px rgba(217,70,239,0.6), 0 0 80px rgba(147,51,234,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Status row
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    display: 'inline-block',
    width: 8, height: 8,
    borderRadius: '50%',
    background: '#D946EF',
    boxShadow: '0 0 8px #D946EF',
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.14em',
    color: '#D946EF',
  },

  // Transcript
  transcriptBox: {
    width: '100%',
    minHeight: 64,
    background: 'rgba(20,20,20,0.8)',
    border: '1px solid rgba(217,70,239,0.25)',
    borderRadius: 14,
    padding: '14px 18px',
    textAlign: 'center',
  },
  transcriptText: {
    margin: 0,
    fontSize: 15,
    color: '#E9D5FF',
    lineHeight: 1.6,
    fontStyle: 'italic',
  },

  // Stop button
  stopBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '10px 28px',
    color: '#888',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  border:       'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(217,70,239,0.4)',
  text1:        '#FFFFFF',
  text2:        '#C8C8C8',
  text3:        '#888888',
}

const styles = {
  page:         { maxWidth: 900, position: 'relative' },
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
  recordRing:   {
    width: 92, height: 92,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.1)',
    background: '#0D0D0D',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.22s',
  },
  recordLabel:  { fontSize: 12, color: C.text3, fontWeight: 500 },

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
