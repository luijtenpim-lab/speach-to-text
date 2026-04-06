const { spawn }  = require('child_process')
const path        = require('path')
const fs          = require('fs')
const WebSocket   = require('ws')
const { app }     = require('electron')

const SUPABASE_URL = 'https://symzpwobkyhqseslmijg.supabase.co'

let helperProcess = null
let ws            = null
let _onPartial    = null
let _onFinal      = null
let _onError      = null
let startTime     = null
let _accessToken  = null
let _cachedKey    = null

// ── Auth ──────────────────────────────────────────────────────────────────────

function setAccessToken (token) { _accessToken = token }

// ── Key cache — fetch once at startup, refresh every 50s ──────────────────────

async function refreshKey () {
  try {
    _cachedKey = await fetchDeepgramToken()
    console.log('[SpeechBridge] Deepgram key ready')
  } catch (e) {
    console.error('[SpeechBridge] Key fetch failed:', e.message)
  }
  setTimeout(refreshKey, 50_000)
}

// ── Helper path ───────────────────────────────────────────────────────────────

function getHelperPath () {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'SpeechHelper')
    : path.join(__dirname, '..', 'swift-helper', 'SpeechHelper')
}

// ── Init ──────────────────────────────────────────────────────────────────────

function initSpeechBridge ({ onPartial, onFinal, onError }) {
  _onPartial = onPartial
  _onFinal   = onFinal
  _onError   = onError

  const helperPath = getHelperPath()
  try { fs.chmodSync(helperPath, 0o755) } catch {}

  helperProcess = spawn(helperPath, [], { stdio: ['pipe', 'pipe', 'pipe'] })

  // stdout = raw PCM → forward to Deepgram WebSocket
  helperProcess.stdout.on('data', (chunk) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(chunk)
    }
  })

  // stderr = JSON control messages
  let buf = ''
  helperProcess.stderr.on('data', (data) => {
    buf += data.toString()
    const lines = buf.split('\n')
    buf = lines.pop()
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const msg = JSON.parse(line)
        if (msg.type === 'error' && _onError) _onError(msg.message)
      } catch {}
    }
  })

  helperProcess.on('exit', (code) => {
    if (code !== 0 && _onError) _onError(`SpeechHelper exited: ${code}`)
    helperProcess = null
  })

  // Pre-fetch key immediately
  refreshKey()
}

// ── Start ─────────────────────────────────────────────────────────────────────

function startRecording () {
  if (!helperProcess) throw new Error('SpeechBridge not initialised')
  if (!_cachedKey)    throw new Error('Deepgram key not ready — try again in a moment')

  startTime = Date.now()

  const params = new URLSearchParams({
    model:           'nova-2',
    language:        'en-US',
    encoding:        'linear16',
    sample_rate:     '16000',
    channels:        '1',
    interim_results: 'true',
    punctuate:       'true',
    endpointing:     '800',
  })

  ws = new WebSocket(
    `wss://api.deepgram.com/v1/listen?${params}`,
    {
      headers: {
        Authorization: `Token ${_cachedKey}`,
        Origin: 'http://localhost',   // required — Deepgram rejects file:// origin
      },
    }
  )

  ws.on('open', () => {
    console.log('[Deepgram] Connected ✓')
    helperProcess?.stdin.write('START\n')
  })

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw)
      const text = data?.channel?.alternatives?.[0]?.transcript ?? ''
      if (!text) return

      if (data.speech_final) {
        console.log('[Deepgram] Final:', text)
        if (_onPartial) _onPartial('')
        if (_onFinal)   _onFinal(text)
      } else if (data.is_final === false) {
        if (_onPartial) _onPartial(text)
      }
    } catch {}
  })

  ws.on('error', (err) => {
    console.error('[Deepgram] Error:', err.message)
    if (_onError) _onError(err.message)
  })

  ws.on('close', (code) => {
    console.log('[Deepgram] Closed', code)
    ws = null
  })
}

// ── Stop ──────────────────────────────────────────────────────────────────────

function stopRecording () {
  helperProcess?.stdin.write('STOP\n')
  const duration = startTime ? Date.now() - startTime : 0
  startTime = null

  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'CloseStream' }))
  }

  return duration
}

// ── Destroy ───────────────────────────────────────────────────────────────────

function destroySpeechBridge () {
  try { ws?.close() } catch {}
  ws = null
  if (helperProcess) {
    helperProcess.stdin.write('EXIT\n')
    helperProcess = null
  }
}

// ── Token fetch ───────────────────────────────────────────────────────────────

async function fetchDeepgramToken () {
  if (_accessToken) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-deepgram-token`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${_accessToken}`, 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const { key } = await res.json()
        if (key) return key
      }
    } catch {}
  }
  const envKey = process.env.DEEPGRAM_API_KEY
  if (envKey) return envKey
  throw new Error('No Deepgram key available')
}

// ── GPT cleanup ───────────────────────────────────────────────────────────────

async function cleanTranscript (text) {
  if (!_accessToken) return text
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/cleanup`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${_accessToken}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    })
    if (!res.ok) return text
    const { cleaned } = await res.json()
    return cleaned ?? text
  } catch { return text }
}

module.exports = {
  initSpeechBridge,
  startRecording,
  stopRecording,
  destroySpeechBridge,
  cleanTranscript,
  setAccessToken,
}
