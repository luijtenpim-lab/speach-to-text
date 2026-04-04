import React, { useState, useEffect } from 'react'

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)',    flag: '🇺🇸' },
  { code: 'en-GB', label: 'English (UK)',    flag: '🇬🇧' },
  { code: 'af',    label: 'Afrikaans',       flag: '🇿🇦' },
  { code: 'sq',    label: 'Albanian',        flag: '🇦🇱' },
  { code: 'ar',    label: 'Arabic',          flag: '🇸🇦' },
  { code: 'hy',    label: 'Armenian',        flag: '🇦🇲' },
  { code: 'az',    label: 'Azerbaijani',     flag: '🇦🇿' },
  { code: 'eu',    label: 'Basque',          flag: '🇪🇸' },
  { code: 'be',    label: 'Belarusian',      flag: '🇧🇾' },
  { code: 'bn',    label: 'Bengali',         flag: '🇧🇩' },
  { code: 'bs',    label: 'Bosnian',         flag: '🇧🇦' },
  { code: 'bg',    label: 'Bulgarian',       flag: '🇧🇬' },
  { code: 'yue',   label: 'Cantonese (CN)',  flag: '🇨🇳' },
  { code: 'yue-HK',label: 'Cantonese (HK)', flag: '🇭🇰' },
  { code: 'ca',    label: 'Catalan',         flag: '🇪🇸' },
  { code: 'zh',    label: 'Chinese',         flag: '🇨🇳' },
  { code: 'hr',    label: 'Croatian',        flag: '🇭🇷' },
  { code: 'cs',    label: 'Czech',           flag: '🇨🇿' },
  { code: 'da',    label: 'Danish',          flag: '🇩🇰' },
  { code: 'nl',    label: 'Dutch',           flag: '🇳🇱' },
  { code: 'et',    label: 'Estonian',        flag: '🇪🇪' },
  { code: 'fi',    label: 'Finnish',         flag: '🇫🇮' },
  { code: 'fr',    label: 'French',          flag: '🇫🇷' },
  { code: 'gl',    label: 'Galician',        flag: '🇪🇸' },
  { code: 'de',    label: 'German',          flag: '🇩🇪' },
  { code: 'el',    label: 'Greek',           flag: '🇬🇷' },
  { code: 'gu',    label: 'Gujarati',        flag: '🇮🇳' },
  { code: 'he',    label: 'Hebrew',          flag: '🇮🇱' },
  { code: 'hi',    label: 'Hindi',           flag: '🇮🇳' },
  { code: 'hu',    label: 'Hungarian',       flag: '🇭🇺' },
  { code: 'is',    label: 'Icelandic',       flag: '🇮🇸' },
  { code: 'id',    label: 'Indonesian',      flag: '🇮🇩' },
  { code: 'it',    label: 'Italian',         flag: '🇮🇹' },
  { code: 'ja',    label: 'Japanese',        flag: '🇯🇵' },
  { code: 'kn',    label: 'Kannada',         flag: '🇮🇳' },
  { code: 'kk',    label: 'Kazakh',          flag: '🇰🇿' },
  { code: 'ko',    label: 'Korean',          flag: '🇰🇷' },
  { code: 'lv',    label: 'Latvian',         flag: '🇱🇻' },
  { code: 'lt',    label: 'Lithuanian',      flag: '🇱🇹' },
  { code: 'mk',    label: 'Macedonian',      flag: '🇲🇰' },
  { code: 'ms',    label: 'Malay',           flag: '🇲🇾' },
  { code: 'mr',    label: 'Marathi',         flag: '🇮🇳' },
  { code: 'mi',    label: 'Maori',           flag: '🇳🇿' },
  { code: 'ne',    label: 'Nepali',          flag: '🇳🇵' },
  { code: 'no',    label: 'Norwegian',       flag: '🇳🇴' },
  { code: 'fa',    label: 'Persian',         flag: '🇮🇷' },
  { code: 'pl',    label: 'Polish',          flag: '🇵🇱' },
  { code: 'pt',    label: 'Portuguese',      flag: '🇵🇹' },
  { code: 'pt-BR', label: 'Portuguese (BR)', flag: '🇧🇷' },
  { code: 'pa',    label: 'Punjabi',         flag: '🇮🇳' },
  { code: 'ro',    label: 'Romanian',        flag: '🇷🇴' },
  { code: 'ru',    label: 'Russian',         flag: '🇷🇺' },
  { code: 'sr',    label: 'Serbian',         flag: '🇷🇸' },
  { code: 'sk',    label: 'Slovak',          flag: '🇸🇰' },
  { code: 'sl',    label: 'Slovenian',       flag: '🇸🇮' },
  { code: 'es',    label: 'Spanish',         flag: '🇪🇸' },
  { code: 'es-LA', label: 'Spanish (LA)',    flag: '🌎' },
  { code: 'sw',    label: 'Swahili',         flag: '🇰🇪' },
  { code: 'sv',    label: 'Swedish',         flag: '🇸🇪' },
  { code: 'tl',    label: 'Tagalog',         flag: '🇵🇭' },
  { code: 'ta',    label: 'Tamil',           flag: '🇮🇳' },
  { code: 'te',    label: 'Telugu',          flag: '🇮🇳' },
  { code: 'th',    label: 'Thai',            flag: '🇹🇭' },
  { code: 'tr',    label: 'Turkish',         flag: '🇹🇷' },
  { code: 'uk',    label: 'Ukrainian',       flag: '🇺🇦' },
  { code: 'ur',    label: 'Urdu',            flag: '🇵🇰' },
  { code: 'uz',    label: 'Uzbek',           flag: '🇺🇿' },
  { code: 'vi',    label: 'Vietnamese',      flag: '🇻🇳' },
  { code: 'cy',    label: 'Welsh',           flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
]

export default function LanguageModal ({ onClose }) {
  const [autoDetect, setAutoDetect] = useState(true)
  const [selected, setSelected] = useState([])

  useEffect(() => {
    window.voiceflow.getSetting('language_auto').then(v => setAutoDetect(v !== 'false'))
    window.voiceflow.getSetting('languages').then(v => {
      if (v) setSelected(JSON.parse(v))
    })
  }, [])

  function toggleLanguage (code) {
    if (autoDetect) return
    setSelected(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  async function save () {
    await window.voiceflow.setSetting('language_auto', String(autoDetect))
    await window.voiceflow.setSetting('languages', JSON.stringify(selected))
    onClose()
  }

  const selectedLangs = LANGUAGES.filter(l => selected.includes(l.code))

  return (
    <div style={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Languages</h2>
            <p style={styles.subtitle}>Select the languages you want to use with VoiceFlow</p>
          </div>
          <div style={styles.autoDetectRow}>
            <span style={styles.autoDetectLabel}>Auto-detect</span>
            <div
              style={{ ...styles.toggle, ...(autoDetect ? styles.toggleOn : styles.toggleOff) }}
              onClick={() => { setAutoDetect(v => !v); setSelected([]) }}
            >
              <div style={{ ...styles.toggleThumb, ...(autoDetect ? styles.toggleThumbOn : {}) }} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Left — language grid */}
          <div style={styles.gridSide}>
            {autoDetect && (
              <div style={styles.autoNotice}>
                Auto-detect is on. VoiceFlow will try to detect the language you are speaking.
              </div>
            )}
            <div style={styles.grid}>
              {LANGUAGES.map(lang => {
                const isSelected = selected.includes(lang.code)
                return (
                  <div
                    key={lang.code}
                    style={{
                      ...styles.langCard,
                      ...(isSelected ? styles.langCardSelected : {}),
                      ...(autoDetect ? styles.langCardDisabled : {})
                    }}
                    onClick={() => toggleLanguage(lang.code)}
                  >
                    <span style={styles.flag}>{lang.flag}</span>
                    <span style={styles.langLabel}>{lang.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right — selected panel */}
          <div style={styles.selectedSide}>
            <div style={styles.selectedTitle}>Selected</div>
            {autoDetect ? (
              <>
                <div style={styles.selectedItem}>
                  <span style={styles.checkIcon}>✓</span> All languages
                </div>
                <p style={styles.selectedNote}>
                  All languages are available when auto-detect is enabled.
                </p>
              </>
            ) : selectedLangs.length === 0 ? (
              <p style={styles.selectedNote}>No languages selected. Pick at least one from the list.</p>
            ) : (
              selectedLangs.map(l => (
                <div key={l.code} style={styles.selectedItem}>
                  <span>{l.flag}</span> {l.label}
                </div>
              ))
            )}

            <div style={{ flex: 1 }} />
            <button style={styles.saveBtn} onClick={save}>Save and close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  backdrop:          { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:             { background: '#111', borderRadius: 16, width: '88vw', maxWidth: 1100, height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header:            { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '28px 32px 20px', borderBottom: '1px solid #222' },
  title:             { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  subtitle:          { color: '#666', fontSize: 13 },
  autoDetectRow:     { display: 'flex', alignItems: 'center', gap: 12 },
  autoDetectLabel:   { fontSize: 14, fontWeight: 600 },
  toggle:            { width: 48, height: 28, borderRadius: 14, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 },
  toggleOn:          { background: '#4ade80' },
  toggleOff:         { background: '#444' },
  toggleThumb:       { position: 'absolute', top: 3, left: 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' },
  toggleThumbOn:     { left: 23 },
  body:              { display: 'flex', flex: 1, overflow: 'hidden' },
  gridSide:          { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  autoNotice:        { background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#aaa', marginBottom: 16 },
  grid:              { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  langCard:          { display: 'flex', alignItems: 'center', gap: 10, background: '#1e2433', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s' },
  langCardSelected:  { border: '1px solid #4ade80', background: '#1a2e1a' },
  langCardDisabled:  { opacity: 0.5, cursor: 'default' },
  flag:              { fontSize: 20, flexShrink: 0 },
  langLabel:         { fontSize: 13, color: '#ddd' },
  selectedSide:      { width: 220, borderLeft: '1px solid #222', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 10 },
  selectedTitle:     { fontWeight: 700, fontSize: 15, marginBottom: 4 },
  selectedItem:      { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ddd' },
  selectedNote:      { fontSize: 12, color: '#555', lineHeight: 1.5 },
  checkIcon:         { width: 20, height: 20, borderRadius: '50%', background: '#333', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#4ade80' },
  saveBtn:           { background: '#4ade80', border: 'none', borderRadius: 10, padding: '12px 0', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' },
}
