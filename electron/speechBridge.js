const { spawn } = require('child_process')
const path       = require('path')
const fs         = require('fs')
const WebSocket  = require('ws')
const { app }    = require('electron')

const SUPABASE_URL = 'https://symzpwobkyhqseslmijg.supabase.co'

let helperProcess  = null
let ws             = null       // raw Deepgram WebSocket
let _onPartial     = null
let _onFinal       = null
let _onError       = null
let _onReady       = null
let startTime      = null
let _accessToken   = null
let _pendingStop   = false      // stop() called before ws opened

// ── Auth ──────────────────────────────────────────────────────────────────────

function setAccessToken (token) { _accessToken = token }

// ── Helper path ───────────────────────────────────────────────────────────────

function getHelperPath () {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'SpeechHelper')
    : path.join(__dirname, '..', 'swift-helper', 'SpeechHelper')
}

// ── Init ──────────────────────────────────────────────────────────────────────

function initSpeechBridge ({ onPartial, onFinal, onError, onReady }) {
  _onPartial = onPartial
  _onFinal   = onFinal
  _onError   = onError
  _onReady   = onReady

  const helperPath = getHelperPath()
  try { fs.chmodSync(helperPath, 0o755) } catch {}

  helperProcess = spawn(helperPath, [], { stdio: ['pipe', 'pipe', 'pipe'] })

  // stdout = raw PCM — forward to Deepgram only when ws is open
  helperProcess.stdout.on('data', (chunk) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
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
}

// ── Start ─────────────────────────────────────────────────────────────────────

async function startRecording () {
  if (!helperProcess) throw new Error('SpeechBridge not initialised')

  _pendingStop = false
  startTime    = Date.now()

  // Get API key (fast — uses env fallback synchronously)
  let apiKey
  try { apiKey = await fetchDeepgramToken() }
  catch (e) { throw new Error('No Deepgram key: ' + e.message) }

  const params = new URLSearchParams({
    model:            'nova-2',
    language:         'en-US',
    encoding:         'linear16',
    sample_rate:      '16000',
    channels:         '1',
    interim_results:  'true',
    smart_format:     'true',
    punctuate:        'true',
    utterance_end_ms: '800',
    vad_events:       'true',
  })

  ws = new WebSocket(
    `wss://api.deepgram.com/v1/listen?${params}`,
    { headers: { Authorization: `Token ${apiKey.trim()}` } }
  )

  ws.on('open', () => {
    console.log('[Deepgram] Connected')
    // Start mic immediately
    helperProcess?.stdin.write('START\n')

    if (_pendingStop) {
      // User already released — flush and close
      console.log('[Deepgram] Stop was pending — closing stream')
      ws.send(JSON.stringify({ type: 'CloseStream' }))
    }
  })

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw)
      const alt  = data?.channel?.alternatives?.[0]
      const text = alt?.transcript ?? ''

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
    console.error('[Deepgram error]', err.message)
  })

  ws.on('close', (code) => {
    console.log('[Deepgram] Closed', code)
    ws = null
  })
}

// ── Stop ──────────────────────────────────────────────────────────────────────

function stopRecording () {
  // Stop mic
  helperProcess?.stdin.write('STOP\n')
  const duration = startTime ? Date.now() - startTime : 0
  startTime = null

  if (!ws) {
    // WebSocket not created yet (key fetch still pending) — flag it
    _pendingStop = true
    return duration
  }

  if (ws.readyState === WebSocket.CONNECTING) {
    // Still connecting — flag so open handler closes it
    _pendingStop = true
  } else if (ws.readyState === WebSocket.OPEN) {
    // Tell Deepgram to flush remaining audio then finish
    try { ws.send(JSON.stringify({ type: 'CloseStream' })) } catch {}
  }

  return duration
}

// ── Destroy ───────────────────────────────────────────────────────────────────

function destroySpeechBridge () {
  try { if (ws) ws.close() } catch {}
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
        if (key) { console.log('[SpeechBridge] Got edge function token'); return key }
      } else {
        console.warn('[SpeechBridge] Edge function', res.status, '— using env key')
      }
    } catch (e) {
      console.warn('[SpeechBridge] Edge function failed:', e.message, '— using env key')
    }
  }

  const envKey = process.env.DEEPGRAM_API_KEY
  if (envKey) { console.log('[SpeechBridge] Using env DEEPGRAM_API_KEY'); return envKey }

  throw new Error('No Deepgram key available')
}

// ── GPT cleanup via edge function ─────────────────────────────────────────────

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
