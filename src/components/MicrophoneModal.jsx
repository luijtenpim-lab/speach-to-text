import React, { useEffect, useState } from 'react'

export default function MicrophoneModal ({ onClose }) {
  const [devices, setDevices] = useState([])
  const [selected, setSelected] = useState('default')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.voiceflow.getSetting('microphone_id').then(v => {
      if (v) setSelected(v)
    })

    navigator.mediaDevices.enumerateDevices()
      .then(all => {
        const mics = all.filter(d => d.kind === 'audioinput')
        // If labels are empty, mic permission hasn't been granted yet
        if (mics.length > 0 && !mics[0].label) {
          // Request mic permission to get labels
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              stream.getTracks().forEach(t => t.stop())
              return navigator.mediaDevices.enumerateDevices()
            })
            .then(all2 => {
              setDevices(all2.filter(d => d.kind === 'audioinput'))
              setLoading(false)
            })
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
        <h2 style={styles.title}>Select Microphone</h2>
        <p style={styles.subtitle}>Choose the microphone VoiceFlow uses to capture your voice.</p>

        {loading ? (
          <div style={styles.empty}>Detecting microphones…</div>
        ) : devices.length === 0 ? (
          <div style={styles.empty}>No microphones found. Check your system audio settings.</div>
        ) : (
          <div style={styles.list}>
            {/* Default option */}
            <div
              style={{ ...styles.item, ...(selected === 'default' ? styles.itemSelected : {}) }}
              onClick={() => setSelected('default')}
            >
              <div style={styles.radio}>
                {selected === 'default' && <div style={styles.radioDot} />}
              </div>
              <div>
                <div style={styles.itemLabel}>Auto-detect</div>
                <div style={styles.itemDesc}>Use the system default microphone</div>
              </div>
            </div>

            {devices.map(device => (
              <div
                key={device.deviceId}
                style={{ ...styles.item, ...(selected === device.deviceId ? styles.itemSelected : {}) }}
                onClick={() => setSelected(device.deviceId)}
              >
                <div style={styles.radio}>
                  {selected === device.deviceId && <div style={styles.radioDot} />}
                </div>
                <div>
                  <div style={styles.itemLabel}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={save}>Save and close</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  backdrop:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:         { background: '#111', borderRadius: 16, width: 520, maxHeight: '70vh', display: 'flex', flexDirection: 'column', padding: 28, gap: 0 },
  title:         { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  subtitle:      { color: '#666', fontSize: 13, marginBottom: 20 },
  list:          { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  item:          { display: 'flex', alignItems: 'center', gap: 14, background: '#1e1e1e', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', border: '1px solid transparent' },
  itemSelected:  { border: '1px solid #4ade80', background: '#1a2e1a' },
  itemLabel:     { fontSize: 14, fontWeight: 500 },
  itemDesc:      { fontSize: 12, color: '#666', marginTop: 2 },
  radio:         { width: 20, height: 20, borderRadius: '50%', border: '2px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioDot:      { width: 10, height: 10, borderRadius: '50%', background: '#4ade80' },
  empty:         { color: '#555', fontSize: 13, padding: '20px 0' },
  footer:        { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  cancelBtn:     { background: 'none', border: '1px solid #444', borderRadius: 8, padding: '10px 20px', color: '#aaa', fontSize: 13, cursor: 'pointer' },
  saveBtn:       { background: '#4ade80', border: 'none', borderRadius: 8, padding: '10px 24px', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
}
