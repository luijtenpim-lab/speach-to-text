import React, { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Settings from './pages/Settings'
import Agent from './pages/Agent'
import Onboarding from './pages/Onboarding'
import Auth from './pages/Auth'
import VocaLogo from './components/VocaLogo'
import BackgroundAccent from './components/BackgroundAccent'
import { supabase } from './lib/supabase'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashIcon /> },
  { to: '/history',   label: 'History',   icon: <HistoryIcon /> },
  { to: '/agent',     label: 'Agent',     icon: <AgentIcon /> },
  { to: '/settings',  label: 'Settings',  icon: <SettingsIcon /> },
]

export default function App () {
  const [onboardingDone, setOnboardingDone] = useState(null)
  const [user, setUser] = useState(undefined) // undefined = loading, null = signed out

  useEffect(() => {
    window.voiceflow.getSetting('onboarding_complete').then((val) => {
      setOnboardingDone(val === 'true')
    })

    // Check current session and forward token to main process
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.access_token) {
        window.voiceflow.setSessionToken(session.access_token)
      }
    })

    // Listen for auth changes — also forward token to main process
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      window.voiceflow.setSessionToken(session?.access_token ?? '')
    })

    return () => subscription.unsubscribe()
  }, [])

  if (onboardingDone === null || user === undefined) return null

  // Not signed in → show auth screen
  if (!user) return <Auth onAuth={setUser} />

  return (
    <HashRouter>
      {!onboardingDone ? (
        <Routes>
          <Route path="*" element={<Onboarding onComplete={() => setOnboardingDone(true)} />} />
        </Routes>
      ) : (
        <div style={styles.shell}>
          {/* Sidebar */}
          <nav style={styles.sidebar}>
            {/* Logo */}
            <div style={styles.logoWrap}>
              <VocaLogo size={30} variant="full" glow={true} />
            </div>

            {/* Nav links */}
            <div style={styles.navGroup}>
              {NAV.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  style={({ isActive }) => ({
                    ...styles.navLink,
                    ...(isActive ? styles.navActive : {}),
                  })}
                >
                  <span style={styles.navIcon}>{icon}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            {/* Status */}
            <div style={styles.navBottom}>
              <div style={styles.statusDot} />
              <span style={styles.statusLabel}>Ready</span>
            </div>
          </nav>

          {/* Content area */}
          <main style={styles.content}>
            {/* Techy background decoration */}
            <BackgroundAccent />

            {/* Page content sits above the background */}
            <div style={styles.pageWrapper}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/history" element={<History />} />
                <Route path="/agent" element={<Agent />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </main>
        </div>
      )}
    </HashRouter>
  )
}

// ─── SVG nav icons ────────────────────────────────────────────────────────────

function DashIcon () {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
    </svg>
  )
}

function HistoryIcon () {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v3.75l2.5 2" />
    </svg>
  )
}

function AgentIcon () {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" />
      <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SettingsIcon () {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.87 2.87l1.06 1.06M12.07 12.07l1.06 1.06M2.87 13.13l1.06-1.06M12.07 3.93l1.06-1.06" strokeLinecap="round" />
    </svg>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  shell: {
    display: 'flex',
    height: '100vh',
    background: '#080808',
    color: '#FFFFFF',
    fontFamily: '-apple-system, "Inter", BlinkMacSystemFont, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },

  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebar: {
    width: 220,
    background: '#0D0D0D',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    padding: '22px 20px 18px',
    paddingTop: 44, // space for traffic lights
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 10,
    WebkitAppRegion: 'drag', // makes this area draggable
    WebkitUserSelect: 'none',
  },
  navGroup: {
    flex: 1,
    padding: '4px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    WebkitAppRegion: 'no-drag',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    color: '#888888',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.15s',
    borderLeft: '3px solid transparent',
    marginLeft: -3,
  },
  navActive: {
    background: 'linear-gradient(90deg, rgba(217,70,239,0.2) 0%, transparent 100%)',
    color: '#FFFFFF',
    borderLeftColor: '#D946EF',
    fontWeight: 600,
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    flexShrink: 0,
  },
  navBottom: {
    padding: '14px 20px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#34D399',
    boxShadow: '0 0 7px rgba(52,211,153,0.8)',
  },
  statusLabel: {
    fontSize: 12,
    color: '#888888',
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    overflow: 'hidden',
    background: '#080808',
    position: 'relative',
  },
  pageWrapper: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    overflow: 'auto',
    padding: 36,
  },
}
