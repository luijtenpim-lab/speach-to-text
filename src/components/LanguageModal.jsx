import React, { useState, useEffect } from 'react'

const C = {
  bg:      '#0D0D0D',
  surface: '#141414',
  deep:    '#0D0D0D',
  border:  'rgba(255,255,255,0.07)',
  text1:   '#FFFFFF',
  text2:   '#C8C8C8',
  text3:   '#888888',
}

const LANGUAGES = [
  { code: 'en-US',  label: 'English (US)',    flag: '🇺🇸' },
  { code: 'en-GB',  label: 'English (UK)',    flag: '🇬🇧' },
  { code: 'af',     label: 'Afrikaans',       flag: '🇿🇦' },
  { code: 'sq',     label: 'Albanian',        flag: '🇦🇱' },
  { code: 'ar',     label: 'Arabic',          flag: '🇸🇦' },
  { code: 'hy',     label: 'Armenian',        flag: '🇦🇲' },
  { code: 'az',     label: 'Azerbaijani',     flag: '🇦🇿' },
  { code: 'eu',     label: 'Basque',          flag: '🇪🇸' },
  { code: 'be',     label: 'Belarusian',      flag: '🇧🇾' },
  { code: 'bn',     label: 'Bengali',         flag: '🇧🇩' },
  { code: 'bs',     label: 'Bosnian',         flag: '🇧🇦' },
  { code: 'bg',     label: 'Bulgarian',       flag: '🇧🇬' },
  { code: 'yue',    label: 'Cantonese (CN)',  flag: '🇨🇳' },
  { code: 'yue-HK', label: 'Cantonese (HK)', flag: '🇭🇰' },
  { code: 'ca',     label: 'Catalan',         flag: '🇪🇸' },
  { code: 'zh',     label: 'Chinese',         flag: '🇨🇳' },
  { code: 'hr',     label: 'Croatian',        flag: '🇭🇷' },
  { code: 'cs',     label: 'Czech',           flag: '🇨🇿' },
  { code: 'da',     label: 'Danish',          flag: '🇩🇰' },
  { code: 'nl',     label: 'Dutch',           flag: '🇳🇱' },
  { code: 'et',     label: 'Estonian',        flag: '🇪🇪' },
  { code: 'fi',     label: 'Finnish',         flag: '🇫🇮' },
  { code: 'fr',     label: 'French',          flag: '🇫🇷' },
  { code: 'gl',     label: 'Galician',        flag: '🇪🇸' },
  { code: 'de',     label: 'German',          flag: '🇩🇪' },
  { code: 'el',     label: 'Greek',           flag: '🇬🇷' },
  { code: 'gu',     label: 'Gujarati',        flag: '🇮🇳' },
  { code: 'he',     label: 'Hebrew',          flag: '🇮🇱' },
  { code: 'hi',     label: 'Hindi',           flag: '🇮🇳' },
  { code: 'hu',     label: 'Hungarian',       flag: '🇭🇺' },
  { code: 'is',     label: 'Icelandic',       flag: '🇮🇸' },
  { code: 'id',     label: 'Indonesian',      flag: '🇮🇩' },
  { code: 'it',     label: 'Italian',         flag: '🇮🇹' },
  { code: 'ja',     label: 'Japanese',        flag: '🇯🇵' },
  { code: 'kn',     label: 'Kannada',         flag: '🇮🇳' },
  { code: 'kk',     label: 'Kazakh',          flag: '🇰🇿' },
  { code: 'ko',     label: 'Korean',          flag: '🇰🇷' },
  { code: 'lv',     label: 'Latvian',         flag: '🇱🇻' },
  { code: 'lt',     label: 'Lithuanian',      flag: '🇱🇹' },
  { code: 'mk',     label: 'Macedonian',      flag: '🇲🇰' },
  { code: 'ms',     label: 'Malay',           flag: '🇲🇾' },
  { code: 'mr',     label: 'Marathi',         flag: '🇮🇳' },
  { code: 'mi',     label: 'Maori',           flag: '🇳🇿' },
  { code: 'ne',     label: 'Nepali',          flag: '🇳🇵' },
  { code: 'no',     label: 'Norwegian',       flag: '🇳🇴' },
  { code: 'fa',     label: 'Persian',         flag: '🇮🇷' },
  { code: 'pl',     label: 'Polish',          flag: '🇵🇱' },
  { code: 'pt',     label: 'Portuguese',      flag: '🇵🇹' },
  { code: 'pt-BR',  label: 'Portuguese (BR)', flag: '🇧🇷' },
  { code: 'pa',     label: 'Punjabi',         flag: '🇮🇳' },
  { code: 'ro',     label: 'Romanian',        flag: '🇷🇴' },
  { code: 'ru',     label: 'Russian',         flag: '🇷🇺' },
  { code: 'sr',     label: 'Serbian',         flag: '🇷🇸' },
  { code: 'sk',     label: 'Slovak',          flag: '🇸🇰' },
  { code: 'sl',     label: 'Slovenian',       flag: '🇸🇮' },
  { code: 'es',     label: 'Spanish',         flag: '🇪🇸' },
  { code: 'es-LA',  label: 'Spanish (LA)',    flag: '🌎' },
  { code: 'sw',     label: 'Swahili',         flag: '🇰🇪' },
  { code: 'sv',     label: 'Swedish',         flag: '🇸🇪' },
  { code: 'tl',     label: 'Tagalog',         flag: '🇵🇭' },
  { code: 'ta',     label: 'Tamil',           flag: '🇮🇳' },
  { code: 'te',     label: 'Telugu',          flag: '🇮🇳' },
  { code: 'th',     label: 'Thai',            flag: '🇹🇭' },
  { code: 'tr',     label: 'Turkish',         flag: '🇹🇷' },
  { code: 'uk',     label: 'Ukrainian',       flag: '🇺🇦' },
  { code: 'ur',     label: 'Urdu',            flag: '🇵🇰' },
  { code: 'uz',     label: 'Uzbek',           flag: '🇺🇿' },
  { code: 'vi',     label: 'Vietnamese',      flag: '🇻🇳' },
  { code: 'cy',     label: 'Welsh',           flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
]

export default function LanguageModal ({ onClose }) {
  const [autoDetect, setAutoDetect] = useState(true)
  const [selected, setSelected]     = useState([])
  const [search, setSearch]         = useState('')

  useEffect(() => {
    window.voiceflow.getSetting('language_auto').then(v => setAutoDetect(v !== 'false'))
    window.voiceflow.getSetting('languages').then(v => { if (v) setSelected(JSON.parse(v)) })
  }, [])

  function toggleLang (code) {
    if (autoDetect) return
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  async function save () {
    await window.voiceflow.setSetting('language_auto', String(autoDetect))
    await window.voiceflow.setSetting('languages', JSON.stringify(selected))
    onClose()
  }

  const filtered = search
    ? LANGUAGES.filter(l => l.label.toLowerCase().includes(search.toLowerCase()))
    : LANGUAGES

  const selectedLangs = LANGUAGES.filter(l => selected.includes(l.code))

  return (
    <div style={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Languages</h2>
            <p style={styles.subtitle}>Select the languages you want Voxa to recognise</p>
          </div>
          <div style={styles.autoRow}>
            <span style={styles.autoLabel}>Auto-detect</span>
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
          {/* Grid side */}
          <div style={styles.gridSide}>
            {autoDetect ? (
              <div style={styles.autoNotice}>
                <span style={styles.autoNoticeDot} />
                Auto-detect is on — Voxa will identify your language automatically.
              </div>
            ) : (
              <input
                style={styles.search}
                placeholder="Search languages…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            )}
            <div style={styles.grid}>
              {filtered.map(lang => {
                const isSel = selected.includes(lang.code)
                return (
                  <div
                    key={lang.code}
                    style={{
                      ...styles.langCard,
                      ...(isSel ? styles.langCardSel : {}),
                      ...(autoDetect ? styles.langCardDimmed : {}),
                    }}
                    onClick={() => toggleLang(lang.code)}
                  >
                    <span style={styles.flag}>{lang.flag}</span>
                    <span style={styles.langLabel}>{lang.label}</span>
                    {isSel && <span style={styles.check}>✓</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected side */}
          <div style={styles.selectedSide}>
            <div style={styles.selectedTitle}>Selected</div>
            {autoDetect ? (
              <>
                <div style={styles.allItem}>
                  <span style={styles.allCheck}>✓</span> All languages
                </div>
                <p style={styles.selectedNote}>Auto-detect makes all languages available.</p>
              </>
            ) : selectedLangs.length === 0 ? (
              <p style={styles.selectedNote}>Pick at least one language from the list.</p>
            ) : (
              <div style={styles.selectedList}>
                {selectedLangs.map(l => (
                  <div key={l.code} style={styles.selectedItem}>
                    <span style={styles.selectedFlag}>{l.flag}</span>
                    <span style={styles.selectedLabel}>{l.label}</span>
                  </div>
                ))}
              </div>
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
  backdrop:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' },
  modal:        { background: C.bg, border: '1px solid rgba(217,70,239,0.2)', borderRadius: 18, width: '88vw', maxWidth: 1060, height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(217,70,239,0.12)' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 28px 18px', borderBottom: `1px solid ${C.border}` },
  title:        { fontSize: 20, fontWeight: 700, marginBottom: 3, color: C.text1, letterSpacing: '-0.01em' },
  subtitle:     { color: C.text3, fontSize: 13 },
  autoRow:      { display: 'flex', alignItems: 'center', gap: 12 },
  autoLabel:    { fontSize: 13, fontWeight: 600, color: C.text2 },
  toggle:       { width: 46, height: 26, borderRadius: 13, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 },
  toggleOn:     { background: '#D946EF', boxShadow: '0 0 10px rgba(217,70,239,0.6)' },
  toggleOff:    { background: 'rgba(255,255,255,0.1)' },
  toggleThumb:  { position: 'absolute', top: 3, left: 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.5)' },
  toggleThumbOn:{ left: 23 },
  body:         { display: 'flex', flex: 1, overflow: 'hidden' },
  gridSide:     { flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 },
  autoNotice:   { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(217,70,239,0.12)', border: '1px solid rgba(217,70,239,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#F0ABFC' },
  autoNoticeDot:{ width: 8, height: 8, borderRadius: '50%', background: '#D946EF', flexShrink: 0, boxShadow: '0 0 6px #D946EF' },
  search:       { background: C.surface, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: '10px 14px', color: C.text1, fontSize: 13, outline: 'none', width: '100%' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 },
  langCard:     { display: 'flex', alignItems: 'center', gap: 9, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' },
  langCardSel:  { border: '1px solid rgba(217,70,239,0.5)', background: 'rgba(217,70,239,0.14)', boxShadow: '0 0 0 1px rgba(217,70,239,0.2)' },
  langCardDimmed: { opacity: 0.38, cursor: 'default' },
  flag:         { fontSize: 17, flexShrink: 0 },
  langLabel:    { fontSize: 12, color: C.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  check:        { fontSize: 11, color: '#A78BFA', fontWeight: 700, flexShrink: 0 },
  selectedSide: { width: 216, borderLeft: `1px solid ${C.border}`, padding: '22px 18px', display: 'flex', flexDirection: 'column', gap: 8 },
  selectedTitle:{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: C.text1 },
  allItem:      { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#F0ABFC' },
  allCheck:     { width: 20, height: 20, borderRadius: '50%', background: 'rgba(217,70,239,0.18)', border: '1px solid rgba(217,70,239,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#A78BFA', fontWeight: 700, flexShrink: 0 },
  selectedNote: { fontSize: 12, color: C.text3, lineHeight: 1.55 },
  selectedList: { display: 'flex', flexDirection: 'column', gap: 7, overflowY: 'auto' },
  selectedItem: { display: 'flex', alignItems: 'center', gap: 8 },
  selectedFlag: { fontSize: 16, flexShrink: 0 },
  selectedLabel:{ fontSize: 12, color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  saveBtn:      { background: 'linear-gradient(135deg, #9333EA, #D946EF)', border: 'none', borderRadius: 10, padding: '12px 0', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%', boxShadow: '0 0 14px rgba(217,70,239,0.5)' },
}
