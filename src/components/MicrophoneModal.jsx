import React, { useEffect, useState } from 'react'

const C = {
  bg:      '#0D0D0D',
  surface: '#141414',
  deep:    '#0D0D0D',
  border:  'rgba(255,255,255,0.07)',
  text1:   '#FFFFFF',
  text2:   '#C8C8C8',
  text3:   '#888888',
}

export default function MicrophoneModal ({ onClose }) {
  const [devices, setDevices] = useState([])
  const [selected, setSelected] = useState('default')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.voiceflow.getSetting('microphone_id').then(v => { if (v) setSelected(v) })

    navigator.mediaDevices.enumerateDevices()
      .then(all => {
        const mics = all.filter(d => d.kind === 'audioinput')
        if (mics.length > 0 && !mics[0].label) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              stream.getTracks().forEach(t => t.stop())
              return navigator.mediaDevices.enumerateDevices()
            })
            .then(all2 => { setDevices(all2.filter(d => d.kind === 'audioinput')); setLoading(false) })
        } else {
          setDevices(mics)
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [])

  async function save () {
    await window.voiceflow.setSetting('microphone_id', selected)
    const label = devices.find(d => d.deviceId === selected)?.label || 'Default'
    await window.voiceflow.setSetting('microphone_label', label)
    onClose()
  }

  return (
    <div style={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}><MicIcon /></div>
          <div>
            <h2 style={styles.title}>Select Microphone</h2>
            <p style={styles.subtitle}>Choose the microphone Voxa uses to capture your voice</p>
          </div>
        </div>

        {/* List */}
        <div style={styles.body}>
          {loading ? (
            <div style={styles.empty}>Detecting microphones…</div>
          ) : devices.length === 0 ? (
            <div style={styles.empty}>No microphones found. Check your system audio settings.</div>
          ) : (
            <div style={styles.list}>
              <DeviceItem
                label="Auto-detect"
                desc="Use the system default microphone"
                selected={selected === 'default'}
                onClick={() => setSelected('default')}
              />
              {devices.map(d => (
                <DeviceItem
                  key={d.deviceId}
                  label={d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                  selected={selected === d.deviceId}
                  onClick={() => setSelected(d.deviceId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={save}>Save and close</button>
        </div>
      </div>
    </div>
  )
}

function DeviceItem ({ label, desc, selected, onClick }) {
  return (
    <div
      style={{ ...styles.item, ...(selected ? styles.itemSelected : {}) }}
      onClick={onClick}
    >
      <div style={{ ...styles.radio, ...(selected ? styles.radioOn : {}) }}>
        {selected && <div style={styles.radioDot} />}
      </div>
      <div>
        <div style={styles.itemLabel}>{label}</div>
        {desc && <div style={styles.itemDesc}>{desc}</div>}
      </div>
    </div>
  )
}

function MicIcon () {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
}

const styles = {
  backdrop:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' },
  modal:     { background: C.bg, border: '1px solid rgba(217,70,239,0.2)', borderRadius: 18, width: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(217,70,239,0.15)' },
  header:    { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '24px 26px 20px', borderBottom: `1px solid ${C.border}` },
  headerIcon:{ width: 40, height: 40, borderRadius: 10, background: 'rgba(217,70,239,0.14)', border: '1px solid rgba(217,70,239,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA', flexShrink: 0, marginTop: 2 },
  title:     { fontSize: 18, fontWeight: 700, marginBottom: 3, color: C.text1, letterSpacing: '-0.01em' },
  subtitle:  { color: C.text3, fontSize: 13 },
  body:      { overflowY: 'auto', padding: '16px 18px', flex: 1 },
  list:      { display: 'flex', flexDirection: 'column', gap: 8 },
  item:      { display: 'flex', alignItems: 'center', gap: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' },
  itemSelected: { border: '1px solid rgba(217,70,239,0.45)', background: 'rgba(217,70,239,0.12)', boxShadow: '0 0 0 1px rgba(217,70,239,0.2)' },
  itemLabel: { fontSize: 14, fontWeight: 500, color: C.text1 },
  itemDesc:  { fontSize: 12, color: C.text3, marginTop: 2 },
  radio:     { width: 20, height: 20, borderRadius: '50%', border: 'rgba(255,255,255,0.15) solid 2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' },
  radioOn:   { border: '2px solid #D946EF', boxShadow: '0 0 8px rgba(217,70,239,0.5)' },
  radioDot:  { width: 8, height: 8, borderRadius: '50%', background: '#D946EF' },
  empty:     { color: C.text3, fontSize: 13, padding: '28px 8px', textAlign: 'center' },
  footer:    { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: `1px solid ${C.border}` },
  cancelBtn: { background: 'none', border: `1px solid ${C.border}`, borderRadius: 9, padding: '10px 20px', color: C.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  saveBtn:   { background: 'linear-gradient(135deg, #9333EA, #D946EF)', border: 'none', borderRadius: 9, padding: '10px 24px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 14px rgba(217,70,239,0.5)' },
}
