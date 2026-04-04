import React, { useEffect, useState } from 'react'

const SECTIONS = [
  { id: 'defaults', label: 'Defaults' },
  { id: 'system',   label: 'System'   },
  { id: 'account',  label: 'Account'  },
  { id: 'status',   label: 'Status'   },
]

export default function Settings () {
  const [section, setSection] = useState('defaults')

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <h1 style={styles.sidebarTitle}>Settings</h1>
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            style={{ ...styles.navBtn, ...(section === id ? styles.navActive : {}) }}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </aside>
      <div style={styles.content}>
        {section === 'defaults' && <DefaultsSection />}
        {section === 'system'   && <SystemSection />}
        {section === 'account'  && <AccountSection />}
        {section === 'status'   && <StatusSection />}
      </div>
    </div>
  )
}

// ─── Defaults ────────────────────────────────────────────────────────────────

function DefaultsSection () {
  const [hotkeyCode, setHotkeyCode] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.voiceflow.getSetting('hotkey_rawcode').then((val) => {
      setHotkeyCode(val ? parseInt(val, 10) : 63)
    })
    window.voiceflow.onKeycodeDetected((code) => {
      setHotkeyCode(code)
      setCapturing(false)
      window.voiceflow.setSetting('hotkey_rawcode', String(code))
      window.voiceflow.stopKeycodeCapture()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }, [])

  async function startCapture () {
    setCapturing(true)
    setSaved(false)
    await window.voiceflow.startKeycodeCapture()
  }

  function hotkeyLabel (code) {
    if (code === 63 || code === null) return 'fn'
    return `Key ${code}`
  }

  return (
    <div>
      <h2 style={styles.pageTitle}>Defaults</h2>
      <p style={styles.pageSubtitle}>Configure default settings and permissions</p>

      <SettingRow
        title="Set default keyboard shortcut"
        desc="Choose your preferred key to hold for recording."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={styles.keyBadge}>
            {capturing ? 'Press any key…' : hotkeyLabel(hotkeyCode)}
          </div>
          <ActionButton onClick={capturing ? undefined : startCapture} disabled={capturing}>
            {capturing ? 'Waiting…' : 'Change shortcut'}
          </ActionButton>
          {saved && <span style={{ color: '#4ade80', fontSize: 13 }}>Saved ✓</span>}
        </div>
        <p style={styles.hint}>
          Default: <strong>fn</strong>. If fn doesn't respond, try Right Option (⌥) or another key.
        </p>
      </SettingRow>

      <SettingRow
        title="Set default microphone"
        desc="Choose your preferred microphone to capture your voice."
        badge="Current: Auto-detect"
      >
        <ActionButton disabled>Select microphone</ActionButton>
      </SettingRow>

      <SettingRow
        title="Set default language"
        desc="Choose your preferred language for voice recognition."
      >
        <ActionButton disabled>Select language</ActionButton>
      </SettingRow>
    </div>
  )
}

// ─── System ──────────────────────────────────────────────────────────────────

function SystemSection () {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    window.voiceflow.getSystemAll().then(setSettings)
  }, [])

  async function toggle (key) {
    const next = !settings[key]
    setSettings(s => ({ ...s, [key]: next }))
    await window.voiceflow.setSystem(key, next)
  }

  if (!settings) return <div style={{ color: '#aaa' }}>Loading…</div>

  return (
    <div>
      <h2 style={styles.pageTitle}>System</h2>
      <p style={styles.pageSubtitle}>System preferences and performance settings</p>

      <ToggleRow
        icon="🟦"
        title="Launch app at login"
        desc="Open VoiceFlow automatically when your computer starts."
        value={settings.launchAtLogin}
        onToggle={() => toggle('launchAtLogin')}
      />
      <ToggleRow
        icon="🟩"
        title="Interaction sounds"
        desc="Play sounds for key actions like start/stop recording."
        value={settings.interactionSounds}
        onToggle={() => toggle('interactionSounds')}
      />
      <ToggleRow
        icon="🟪"
        title="Copy to clipboard"
        desc="Automatically copy transcriptions to clipboard for easy pasting."
        value={settings.copyToClipboard}
        onToggle={() => toggle('copyToClipboard')}
      />
      <ToggleRow
        icon="🟥"
        title="Mute background audio while transcribing"
        desc="Automatically mute audio playing in the background during transcription sessions."
        value={settings.muteBackground}
        onToggle={() => toggle('muteBackground')}
      />
    </div>
  )
}

// ─── Account ─────────────────────────────────────────────────────────────────

function AccountSection () {
  const [email, setEmail] = useState(null)

  useEffect(() => {
    window.voiceflow.getSetting('account_email').then(setEmail)
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={styles.pageTitle}>Account</h2>
          <p style={styles.pageSubtitle}>Manage your account and preferences</p>
        </div>
        {email && (
          <button style={styles.signOutBtn} onClick={async () => {
            await window.voiceflow.setSetting('account_email', '')
            setEmail(null)
          }}>
            Sign out
          </button>
        )}
      </div>

      {email ? (
        <>
          <div style={styles.card}>
            <div style={styles.emailIcon}>✉</div>
            <div>
              <div style={styles.cardMeta}>Account Email</div>
              <div style={styles.cardValue}>{email}</div>
            </div>
          </div>

          <div style={{ ...styles.card, flexDirection: 'column', textAlign: 'center', gap: 16 }}>
            <div style={styles.cardTitle}>Manage Your Account</div>
            <p style={styles.cardMeta}>
              To update your account details, password, or billing, visit your VoiceFlow account dashboard.
            </p>
            <ActionButton onClick={() => {}}>
              Manage Account ↗
            </ActionButton>
          </div>
        </>
      ) : (
        <div style={{ ...styles.card, flexDirection: 'column', gap: 16 }}>
          <div style={styles.cardTitle}>Sign in to VoiceFlow</div>
          <p style={styles.cardMeta}>Sign in to sync your settings, manage your subscription, and access your account.</p>
          <input
            type="email"
            placeholder="email@example.com"
            style={styles.input}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && e.target.value) {
                await window.voiceflow.setSetting('account_email', e.target.value)
                setEmail(e.target.value)
              }
            }}
          />
          <p style={styles.hint}>Press Enter to save. Full authentication coming soon.</p>
        </div>
      )}
    </div>
  )
}

// ─── Status ───────────────────────────────────────────────────────────────────

function StatusSection () {
  const [info, setInfo] = useState(null)
  const [perms, setPerms] = useState(null)

  useEffect(() => {
    window.voiceflow.getAppInfo().then(setInfo)
    window.voiceflow.checkPermissions().then(setPerms)
  }, [])

  return (
    <div>
      <h2 style={styles.pageTitle}>Status</h2>
      <p style={styles.pageSubtitle}>View system status and connection information</p>

      <div style={styles.statusCard}>
        <div style={styles.statusCardTitle}>App Information</div>
        {info ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Version',          info.version],
                ['Platform',         info.platform],
                ['Electron',         info.electronVersion],
                ['User Agent',       info.userAgent],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid #2a2a2a' }}>
                  <td style={styles.infoKey}>{k}</td>
                  <td style={styles.infoVal}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{ color: '#555' }}>Loading…</div>}
      </div>

      <div style={styles.statusCard}>
        <div style={styles.statusCardTitle}>App Permissions</div>
        <p style={{ color: '#aaa', fontSize: 13, marginBottom: 16 }}>
          {perms && perms.microphone === 'granted' && perms.accessibility === 'granted'
            ? 'All required permissions are granted'
            : 'Some permissions are missing'}
        </p>
        {perms && (
          <>
            <PermissionRow
              label="Microphone"
              desc="Required for voice recording and transcription"
              granted={perms.microphone === 'granted'}
            />
            <PermissionRow
              label="Accessibility"
              desc="Allows global hotkeys and app control"
              granted={perms.accessibility === 'granted'}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────

function SettingRow ({ title, desc, badge, children }) {
  return (
    <div style={styles.settingRow}>
      <div style={styles.settingLeft}>
        <div style={styles.settingTitle}>{title}</div>
        <div style={styles.settingDesc}>{desc}</div>
        {badge && <div style={styles.badge}>{badge}</div>}
      </div>
      <div style={styles.settingRight}>{children}</div>
    </div>
  )
}

function ToggleRow ({ icon, title, desc, value, onToggle }) {
  return (
    <div style={styles.toggleRow}>
      <div style={styles.toggleIcon}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={styles.settingTitle}>{title}</div>
        <div style={styles.settingDesc}>{desc}</div>
      </div>
      <div
        style={{ ...styles.toggle, ...(value ? styles.toggleOn : styles.toggleOff) }}
        onClick={onToggle}
      >
        <div style={{ ...styles.toggleThumb, ...(value ? styles.toggleThumbOn : {}) }} />
      </div>
    </div>
  )
}

function PermissionRow ({ label, desc, granted }) {
  return (
    <div style={styles.permRow}>
      <div style={{ ...styles.permDot, background: granted ? '#4ade80' : '#f87171' }}>
        {granted ? '✓' : '✕'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={styles.settingTitle}>{label}</div>
        <div style={styles.settingDesc}>{desc}</div>
      </div>
      <span style={{ color: granted ? '#4ade80' : '#f87171', fontSize: 13, fontWeight: 600 }}>
        {granted ? 'Granted' : 'Denied'}
      </span>
    </div>
  )
}

function ActionButton ({ children, onClick, disabled }) {
  return (
    <button
      style={{ ...styles.actionBtn, ...(disabled ? styles.actionBtnDisabled : {}) }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  shell:         { display: 'flex', height: '100%', gap: 0, margin: -32 },
  sidebar:       { width: 180, background: '#111', padding: '28px 12px', display: 'flex', flexDirection: 'column', gap: 4, borderRight: '1px solid #222' },
  sidebarTitle:  { fontSize: 20, fontWeight: 700, padding: '0 8px', marginBottom: 20 },
  navBtn:        { background: 'none', border: 'none', color: '#aaa', fontSize: 14, textAlign: 'left', padding: '9px 12px', borderRadius: 8, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 8 },
  navActive:     { background: '#2a2a2a', color: '#fff' },
  content:       { flex: 1, padding: 32, overflowY: 'auto' },

  pageTitle:     { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  pageSubtitle:  { color: '#666', fontSize: 13, marginBottom: 28 },

  settingRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e1e1e', borderRadius: 12, padding: '20px 24px', marginBottom: 12, gap: 24 },
  settingLeft:   { flex: 1 },
  settingRight:  { flexShrink: 0 },
  settingTitle:  { fontWeight: 600, fontSize: 14, marginBottom: 3 },
  settingDesc:   { color: '#666', fontSize: 12 },
  badge:         { marginTop: 6, color: '#555', fontSize: 12 },
  hint:          { color: '#555', fontSize: 12, marginTop: 8 },

  toggleRow:     { display: 'flex', alignItems: 'center', gap: 16, background: '#1e1e1e', borderRadius: 12, padding: '18px 20px', marginBottom: 12 },
  toggleIcon:    { fontSize: 28, width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a2a2a', flexShrink: 0 },
  toggle:        { width: 48, height: 28, borderRadius: 14, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 },
  toggleOn:      { background: '#4ade80' },
  toggleOff:     { background: '#444' },
  toggleThumb:   { position: 'absolute', top: 3, left: 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' },
  toggleThumbOn: { left: 23 },

  card:          { display: 'flex', alignItems: 'center', gap: 16, background: '#1e1e1e', borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle:     { fontWeight: 600, fontSize: 15, marginBottom: 4 },
  cardMeta:      { color: '#666', fontSize: 12 },
  cardValue:     { fontWeight: 600, fontSize: 15 },
  emailIcon:     { width: 44, height: 44, borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 18, flexShrink: 0 },

  signOutBtn:    { background: 'none', border: '1px solid #444', borderRadius: 8, color: '#fff', padding: '8px 16px', fontSize: 13, cursor: 'pointer' },
  input:         { background: '#2a2a2a', border: '1px solid #444', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, width: '100%' },

  statusCard:    { background: '#1e1e1e', borderRadius: 12, padding: 24, marginBottom: 16 },
  statusCardTitle: { fontWeight: 700, fontSize: 15, marginBottom: 16 },
  infoKey:       { color: '#666', fontSize: 13, padding: '10px 0', width: 120 },
  infoVal:       { color: '#fff', fontSize: 13, textAlign: 'right', fontFamily: 'monospace' },

  permRow:       { display: 'flex', alignItems: 'center', gap: 14, background: '#2a2a2a', borderRadius: 10, padding: '14px 16px', marginBottom: 10 },
  permDot:       { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: 13, flexShrink: 0 },

  keyBadge:      { background: '#2a2a2a', border: '1px solid #444', borderRadius: 8, padding: '8px 20px', fontSize: 15, fontWeight: 600, minWidth: 80, textAlign: 'center' },
  actionBtn:     { background: '#4ade80', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  actionBtnDisabled: { background: '#2a2a2a', color: '#555', cursor: 'not-allowed' },
}
