import React, { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/history',   label: 'History',   icon: '◷' },
  { to: '/settings',  label: 'Settings',  icon: '⚙' }
]

export default function App () {
  const [onboardingDone, setOnboardingDone] = useState(null)

  useEffect(() => {
    window.voiceflow.getSetting('onboarding_complete').then((val) => {
      setOnboardingDone(val === 'true')
    })
  }, [])

  if (onboardingDone === null) return null // loading

  return (
    <HashRouter>
      {!onboardingDone ? (
        <Routes>
          <Route path="*" element={<Onboarding onComplete={() => setOnboardingDone(true)} />} />
        </Routes>
      ) : (
        <div style={styles.shell}>
          <nav style={styles.sidebar}>
            <div style={styles.logo}>🎙 VoiceFlow</div>
            {NAV.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navActive : {}) })}
              >
                <span style={{ marginRight: 8 }}>{icon}</span>{label}
              </NavLink>
            ))}
          </nav>
          <main style={styles.content}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      )}
    </HashRouter>
  )
}

const styles = {
  shell:    { display: 'flex', height: '100vh', background: '#1a1a1a', color: '#fff' },
  sidebar:  { width: 200, background: '#111', padding: '24px 0', display: 'flex', flexDirection: 'column' },
  logo:     { padding: '0 20px 24px', fontSize: 18, fontWeight: 700, borderBottom: '1px solid #333', marginBottom: 16 },
  navLink:  { display: 'flex', alignItems: 'center', padding: '10px 20px', color: '#aaa', textDecoration: 'none', borderRadius: 6, margin: '2px 8px', fontSize: 14 },
  navActive: { background: '#2a2a2a', color: '#fff' },
  content:  { flex: 1, overflow: 'auto', padding: 32 }
}
