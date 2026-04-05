import React, { useEffect, useState } from 'react'
import LanguageModal from '../components/LanguageModal'
import MicrophoneModal from '../components/MicrophoneModal'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:           '#0D0D0D',
  surface:      '#141414',
  surfaceDeep:  '#0D0D0D',
  border:       'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(217,70,239,0.4)',
  text1:        '#FFFFFF',
  text2:        '#C8C8C8',
  text3:        '#888888',
  accent:       '#D946EF',
  accentBright: '#F0ABFC',
  accentText:   '#F0ABFC',
}

const SECTIONS = [
  { id: 'defaults', label: 'Defaults', icon: <SlidersIcon /> },
  { id: 'system',   label: 'System',   icon: <SystemIcon /> },
  { id: 'account',  label: 'Account',  icon: <UserIcon /> },
  { id: 'status',   label: 'Status',   icon: <InfoCircleIcon /> },
]

export default function Settings () {
  const [section, setSection] = useState('defaults')

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <h1 style={styles.sidebarTitle}>Settings</h1>
        <div style={styles.navGroup}>
          {SECTIONS.map(({ id, label, icon }) => (
            <button
              key={id}
              style={{ ...styles.navBtn, ...(section === id ? styles.navActive : {}) }}
              onClick={() => setSection(id)}
            >
              <span style={{ ...styles.navIcon, ...(section === id ? styles.navIconActive : {}) }}>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>
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
  const [capturing, setCapturing]   = useState(false)
  const [saved, setSaved]           = useState(false)
  const [showLang, setShowLang]     = useState(false)
  const [showMic, setShowMic]       = useState(false)
  const [micLabel, setMicLabel]     = useState('Auto-detect')
  const [langLabel, setLangLabel]   = useState('Auto-detect')

  useEffect(() => {
    window.voiceflow.getSetting('hotkey_rawcode').then(v => setHotkeyCode(v ? parseInt(v, 10) : 63))
    window.voiceflow.getSetting('microphone_label').then(v => { if (v) setMicLabel(v) })
    window.voiceflow.getSetting('language_auto').then(v => {
      if (v === 'false') {
        window.voiceflow.getSetting('languages').then(v2 => {
          if (v2) {
            const codes = JSON.parse(v2)
            setLangLabel(codes.length === 1 ? codes[0] : `${codes.length} languages`)
          }
        })
      }
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
    <>
      {showLang && (
        <LanguageModal onClose={() => {
          setShowLang(false)
          window.voiceflow.getSetting('language_auto').then(v =>
            setLangLabel(v === 'false' ? 'Custom' : 'Auto-detect'))
        }} />
      )}
      {showMic && (
        <MicrophoneModal onClose={() => {
          setShowMic(false)
          window.voiceflow.getSetting('microphone_label').then(v =>
            setMicLabel(v || 'Auto-detect'))
        }} />
      )}

      <SectionHeader title="Defaults" subtitle="Configure default input and recording preferences" />

      <SettingRow
        icon={<KeyboardIcon />}
        title="Keyboard shortcut"
        desc="The key you hold to record. Press 'Change' then press your preferred key."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ ...styles.keyBadge, ...(capturing ? styles.keyBadgeCapturing : {}) }}>
            {capturing ? 'Press any key…' : hotkeyLabel(hotkeyCode)}
          </div>
          <ActionBtn onClick={capturing ? undefined : startCapture} disabled={capturing}>
            {capturing ? 'Waiting…' : 'Change'}
          </ActionBtn>
          {saved && <span style={styles.savedBadge}>Saved ✓</span>}
        </div>
        <p style={styles.hint}>
          Default: <strong style={{ color: C.accentText }}>fn</strong>. If fn doesn't respond, try Right Option (⌥) or another key.
        </p>
      </SettingRow>

      <SettingRow
        icon={<MicSmIcon />}
        title="Microphone"
        desc="The microphone Voxa uses to capture your voice"
        badge={micLabel}
      >
        <ActionBtn onClick={() => setShowMic(true)}>Select microphone</ActionBtn>
      </SettingRow>

      <SettingRow
        icon={<GlobeIcon />}
        title="Language"
        desc="Preferred language for voice recognition"
        badge={langLabel}
      >
        <ActionBtn onClick={() => setShowLang(true)}>Select language</ActionBtn>
      </SettingRow>
    </>
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

  if (!settings) return <div style={{ color: C.text3, padding: 8 }}>Loading…</div>

  return (
    <>
      <SectionHeader title="System" subtitle="App behaviour and performance preferences" />

      <ToggleRow
        iconBg="rgba(217,70,239,0.15)" iconColor={C.accentBright}
        icon={<LoginIcon />}
        title="Launch at login"
        desc="Open Voxa automatically when your Mac starts"
        value={settings.launchAtLogin}
        onToggle={() => toggle('launchAtLogin')}
      />
      <ToggleRow
        iconBg="rgba(52,211,153,0.12)" iconColor="#34D399"
        icon={<SoundIcon />}
        title="Interaction sounds"
        desc="Play sounds for key actions like start/stop recording"
        value={settings.interactionSounds}
        onToggle={() => toggle('interactionSounds')}
      />
      <ToggleRow
        iconBg="rgba(251,191,36,0.12)" iconColor="#FBBF24"
        icon={<ClipboardIcon />}
        title="Copy to clipboard"
        desc="Automatically copy transcriptions to clipboard after recording"
        value={settings.copyToClipboard}
        onToggle={() => toggle('copyToClipboard')}
      />
      <ToggleRow
        iconBg="rgba(248,113,113,0.12)" iconColor="#F87171"
        icon={<MuteIcon />}
        title="Mute background audio"
        desc="Mute audio playing in the background during transcription"
        value={settings.muteBackground}
        onToggle={() => toggle('muteBackground')}
      />
    </>
  )
}

// ─── Account ─────────────────────────────────────────────────────────────────

function AccountSection () {
  const [email, setEmail] = useState(null)

  useEffect(() => {
    window.voiceflow.getSetting('account_email').then(setEmail)
  }, [])

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <SectionHeader title="Account" subtitle="Manage your account and subscription" noMargin />
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
          {/* Email card */}
          <div style={styles.accountCard}>
            <div style={styles.avatar}>{email[0].toUpperCase()}</div>
            <div>
              <div style={styles.accountLabel}>Signed in as</div>
              <div style={styles.accountEmail}>{email}</div>
            </div>
          </div>

          {/* Plan card */}
          <div style={styles.planCard}>
            <span style={styles.planBadge}>Free plan</span>
            <div style={styles.planTitle}>Upgrade to Pro</div>
            <p style={styles.planDesc}>
              Unlimited transcriptions, OpenAI Whisper accuracy, priority support and more.
            </p>
            <ActionBtn onClick={() => {}}>View Pro plans →</ActionBtn>
          </div>
        </>
      ) : (
        <div style={styles.signInCard}>
          <div style={styles.signInIconWrap}><UserIcon /></div>
          <div style={styles.signInTitle}>Sign in to Voxa</div>
          <p style={styles.signInDesc}>
            Sign in to sync settings, manage your subscription, and access your account.
          </p>
          <input
            type="email"
            placeholder="email@example.com"
            style={styles.emailInput}
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
    </>
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

  const allGranted = perms && perms.microphone === 'granted' && perms.accessibility === 'granted'

  return (
    <>
      <SectionHeader title="Status" subtitle="App version, permissions, and diagnostics" />

      {/* App info */}
      <div style={styles.statusCard}>
        <div style={styles.statusCardHead}>
          <span style={styles.statusCardTitle}>App Information</span>
        </div>
        {info ? (
          <div style={styles.infoTable}>
            {[
              ['Version',   info.version],
              ['Platform',  info.platform],
              ['Electron',  info.electronVersion],
              ['Engine',    info.userAgent?.split(' ').find(s => s.startsWith('Chrome')) || 'Chromium'],
            ].map(([k, v]) => (
              <div key={k} style={styles.infoRow}>
                <span style={styles.infoKey}>{k}</span>
                <span style={styles.infoVal}>{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: C.text3, fontSize: 13, paddingTop: 12 }}>Loading…</div>
        )}
      </div>

      {/* Permissions */}
      <div style={styles.statusCard}>
        <div style={styles.statusCardHead}>
          <span style={styles.statusCardTitle}>Permissions</span>
          {perms && (
            <span style={{
              ...styles.permBadge,
              ...(allGranted ? styles.permBadgeOk : styles.permBadgeWarn),
            }}>
              {allGranted ? 'All granted' : 'Action needed'}
            </span>
          )}
        </div>
        {perms && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PermRow
              label="Microphone"
              desc="Required for voice recording and transcription"
              granted={perms.microphone === 'granted'}
            />
            <PermRow
              label="Accessibility"
              desc="Allows global hotkeys and system-wide text injection"
              granted={perms.accessibility === 'granted'}
            />
          </div>
        )}
      </div>
    </>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────

function SectionHeader ({ title, subtitle, noMargin }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 24 }}>
      <h2 style={styles.pageTitle}>{title}</h2>
      <p style={styles.pageSubtitle}>{subtitle}</p>
    </div>
  )
}

function SettingRow ({ icon, title, desc, badge, children }) {
  return (
    <div style={styles.settingRow}>
      <div style={styles.settingLeft}>
        <div style={styles.settingLabelRow}>
          <span style={styles.settingIconWrap}>{icon}</span>
          <div>
            <div style={styles.settingTitle}>{title}</div>
            <div style={styles.settingDesc}>{desc}</div>
            {badge && <span style={styles.settingBadge}>{badge}</span>}
          </div>
        </div>
      </div>
      <div style={styles.settingRight}>{children}</div>
    </div>
  )
}

function ToggleRow ({ iconBg, iconColor, icon, title, desc, value, onToggle }) {
  return (
    <div style={styles.toggleRow}>
      <div style={{ ...styles.toggleIconBox, background: iconBg, color: iconColor }}>
        {icon}
      </div>
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

function PermRow ({ label, desc, granted }) {
  return (
    <div style={styles.permRow}>
      <div style={{
        ...styles.permDot,
        background: granted ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
        border: `1px solid ${granted ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
      }}>
        <span style={{ color: granted ? '#34D399' : '#F87171', fontSize: 13, fontWeight: 700 }}>
          {granted ? '✓' : '!'}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={styles.settingTitle}>{label}</div>
        <div style={styles.settingDesc}>{desc}</div>
      </div>
      <span style={{ color: granted ? '#34D399' : '#F87171', fontSize: 12, fontWeight: 700 }}>
        {granted ? 'Granted' : 'Denied'}
      </span>
    </div>
  )
}

function ActionBtn ({ children, onClick, disabled }) {
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

// ─── Icons ────────────────────────────────────────────────────────────────────

function SlidersIcon () {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="8" cy="6" r="2.5" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2.5" fill="currentColor" stroke="none"/><circle cx="10" cy="18" r="2.5" fill="currentColor" stroke="none"/></svg>
}
function SystemIcon () {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
}
function UserIcon () {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
}
function InfoCircleIcon () {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8" strokeWidth="3"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
}
function KeyboardIcon () {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="10" x2="6" y2="10" strokeWidth="3"/><line x1="10" y1="10" x2="10" y2="10" strokeWidth="3"/><line x1="14" y1="10" x2="14" y2="10" strokeWidth="3"/><line x1="18" y1="10" x2="18" y2="10" strokeWidth="3"/><line x1="8" y1="14" x2="16" y2="14" strokeWidth="2"/></svg>
}
function MicSmIcon () {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
}
function GlobeIcon () {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
}
function LoginIcon () {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
}
function SoundIcon () {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/></svg>
}
function ClipboardIcon () {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
}
function MuteIcon () {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  // Layout
  shell:          { display: 'flex', height: '100%', margin: -36 },
  sidebar:        { width: 196, background: '#0C0D20', borderRight: '1px solid rgba(217,70,239,0.15)', padding: '24px 10px', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarTitle:   { fontSize: 16, fontWeight: 700, padding: '0 10px', marginBottom: 14, color: C.text1, letterSpacing: '-0.01em' },
  navGroup:       { display: 'flex', flexDirection: 'column', gap: 2 },
  navBtn:         { display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', color: C.text3, fontSize: 13, fontWeight: 500, textAlign: 'left', padding: '9px 10px', borderRadius: 8, cursor: 'pointer', width: '100%', transition: 'all 0.15s' },
  navActive:      { background: 'rgba(217,70,239,0.18)', color: C.accentText },
  navIcon:        { opacity: 0.45, display: 'flex', alignItems: 'center' },
  navIconActive:  { opacity: 1 },
  content:        { flex: 1, padding: 32, overflowY: 'auto', background: '#080808' },

  // Section headers
  pageTitle:      { fontSize: 21, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.01em', color: C.text1 },
  pageSubtitle:   { color: C.text3, fontSize: 13, lineHeight: 1.5 },

  // Setting rows
  settingRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 22px', marginBottom: 10, gap: 24 },
  settingLeft:    { flex: 1, minWidth: 0 },
  settingRight:   { flexShrink: 0 },
  settingLabelRow:{ display: 'flex', alignItems: 'flex-start', gap: 12 },
  settingIconWrap:{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3, flexShrink: 0, marginTop: 1 },
  settingTitle:   { fontWeight: 600, fontSize: 14, marginBottom: 3, color: C.text1 },
  settingDesc:    { color: C.text3, fontSize: 12, lineHeight: 1.5 },
  settingBadge:   { display: 'inline-block', marginTop: 6, color: C.text2, fontSize: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 8px' },
  hint:           { color: C.text3, fontSize: 12, marginTop: 8, lineHeight: 1.5 },

  // Toggle rows
  toggleRow:      { display: 'flex', alignItems: 'center', gap: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', marginBottom: 10 },
  toggleIconBox:  { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  toggle:         { width: 46, height: 26, borderRadius: 13, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 },
  toggleOn:       { background: C.accent, boxShadow: `0 0 10px rgba(217,70,239,0.6)` },
  toggleOff:      { background: 'rgba(255,255,255,0.1)' },
  toggleThumb:    { position: 'absolute', top: 3, left: 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.5)' },
  toggleThumbOn:  { left: 23 },

  // Account
  accountCard:    { display: 'flex', alignItems: 'center', gap: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 12 },
  avatar:         { width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, #D946EF, #F0ABFC)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 19, fontWeight: 700, flexShrink: 0, boxShadow: '0 0 14px rgba(217,70,239,0.5)' },
  accountLabel:   { color: C.text3, fontSize: 12, marginBottom: 3 },
  accountEmail:   { fontWeight: 600, fontSize: 14, color: C.text1 },
  planCard:       { background: `linear-gradient(135deg, rgba(217,70,239,0.14), rgba(99,102,241,0.08))`, border: '1px solid rgba(217,70,239,0.3)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 10 },
  planBadge:      { alignSelf: 'flex-start', background: 'rgba(255,255,255,0.08)', borderRadius: 50, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: C.text3, letterSpacing: '0.05em' },
  planTitle:      { fontWeight: 700, fontSize: 16, color: C.text1 },
  planDesc:       { color: C.text2, fontSize: 13, lineHeight: 1.55, margin: 0 },
  signInCard:     { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' },
  signInIconWrap: { width: 58, height: 58, borderRadius: '50%', background: 'rgba(217,70,239,0.14)', border: '1px solid rgba(217,70,239,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accentBright, marginBottom: 4 },
  signInTitle:    { fontWeight: 700, fontSize: 16, color: C.text1 },
  signInDesc:     { color: C.text3, fontSize: 13, lineHeight: 1.55, maxWidth: 340 },
  emailInput:     { background: C.surfaceDeep, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: '12px 16px', color: C.text1, fontSize: 14, width: '100%', maxWidth: 340 },
  signOutBtn:     { background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text3, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },

  // Status
  statusCard:     { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, marginBottom: 12 },
  statusCardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusCardTitle:{ fontWeight: 700, fontSize: 14, color: C.text1 },
  permBadge:      { borderRadius: 50, padding: '3px 10px', fontSize: 11, fontWeight: 700 },
  permBadgeOk:    { background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.3)' },
  permBadgeWarn:  { background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' },
  infoTable:      { marginTop: 16, display: 'flex', flexDirection: 'column' },
  infoRow:        { display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid rgba(255,255,255,0.05)` },
  infoKey:        { color: C.text3, fontSize: 13 },
  infoVal:        { color: C.accentText, fontSize: 13, fontFamily: '"JetBrains Mono","SF Mono",monospace' },
  permRow:        { display: 'flex', alignItems: 'center', gap: 14, background: C.surfaceDeep, borderRadius: 10, padding: '13px 16px' },
  permDot:        { width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Shared inputs / actions
  keyBadge:       { background: C.surfaceDeep, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 700, minWidth: 72, textAlign: 'center', color: C.accentText, fontFamily: '"JetBrains Mono","SF Mono",monospace' },
  keyBadgeCapturing: { border: `1px solid ${C.borderAccent}`, boxShadow: '0 0 10px rgba(217,70,239,0.25)', color: C.accentBright },
  savedBadge:     { color: '#34D399', fontSize: 12, fontWeight: 700 },
  actionBtn:      { background: 'linear-gradient(135deg, #9333EA, #D946EF)', border: 'none', borderRadius: 9, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 0 1px rgba(217,70,239,0.5)', transition: 'all 0.15s', whiteSpace: 'nowrap' },
  actionBtnDisabled: { background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.text3, cursor: 'not-allowed', boxShadow: 'none' },
}
