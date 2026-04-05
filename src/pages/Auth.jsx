import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import VocaLogo from '../components/VocaLogo'

const C = {
  bg:      '#080808',
  surface: '#141414',
  border:  'rgba(255,255,255,0.07)',
  text1:   '#FFFFFF',
  text2:   '#C8C8C8',
  text3:   '#888888',
  error:   '#F87171',
}

export default function Auth ({ onAuth }) {
  const [mode, setMode]       = useState('signin') // 'signin' | 'signup'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [info, setInfo]       = useState(null)

  async function handleSubmit (e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    if (mode === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      onAuth(data.user)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setInfo('Check your email to confirm your account, then sign in.')
      setMode('signin')
    }

    setLoading(false)
  }

  return (
    <div style={styles.root}>
      {/* Background bloom */}
      <div style={styles.bloom} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <VocaLogo size={36} variant="full" glow />
        </div>

        <h1 style={styles.title}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to your Voxa account'
            : 'Start transcribing with Voxa'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {info  && <div style={styles.info}>{info}</div>}

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading
              ? 'Please wait…'
              : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={styles.switchRow}>
          {mode === 'signin' ? (
            <>
              <span style={styles.switchText}>Don't have an account?</span>
              <button style={styles.switchBtn} onClick={() => { setMode('signup'); setError(null); setInfo(null) }}>
                Sign up
              </button>
            </>
          ) : (
            <>
              <span style={styles.switchText}>Already have an account?</span>
              <button style={styles.switchBtn} onClick={() => { setMode('signin'); setError(null); setInfo(null) }}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    height: '100vh',
    background: C.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bloom: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(217,70,239,0.12) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: C.surface,
    border: `1px solid rgba(217,70,239,0.2)`,
    borderRadius: 20,
    padding: '40px 44px',
    width: 400,
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(217,70,239,0.1)',
  },
  logoWrap: {
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: C.text1,
    margin: '0 0 6px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 14,
    color: C.text3,
    margin: '0 0 28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: C.text2,
  },
  input: {
    background: '#0D0D0D',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '11px 14px',
    color: C.text1,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  },
  error: {
    fontSize: 13,
    color: C.error,
    background: 'rgba(248,113,113,0.08)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 8,
    padding: '10px 14px',
  },
  info: {
    fontSize: 13,
    color: '#34D399',
    background: 'rgba(52,211,153,0.08)',
    border: '1px solid rgba(52,211,153,0.2)',
    borderRadius: 8,
    padding: '10px 14px',
  },
  submitBtn: {
    marginTop: 4,
    background: 'linear-gradient(135deg, #9333EA, #D946EF)',
    border: 'none',
    borderRadius: 11,
    padding: '13px',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(217,70,239,0.45)',
    transition: 'opacity 0.15s',
    fontFamily: 'inherit',
  },
  switchRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
  },
  switchText: {
    fontSize: 13,
    color: C.text3,
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#C084FC',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
  },
}
