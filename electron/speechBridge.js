const { spawn } = require('child_process')
const path       = require('path')
const fs         = require('fs')
const { app }    = require('electron')

const SUPABASE_URL = 'https://symzpwobkyhqseslmijg.supabase.co'

let helperProcess = null
let _onPartial    = null
let _onFinal      = null
let _onError      = null
let startTime     = null
let _accessToken  = null
let _mainWindow   = null   // ref to send IPC events to renderer

// ── Auth ──────────────────────────────────────────────────────────────────────

function setAccessToken (token) { _accessToken = token }
function setMainWindow  (win)   { _mainWindow  = win   }

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

  // stdout = raw PCM — forward to renderer which owns the WebSocket
  helperProcess.stdout.on('data', (chunk) => {
    _mainWindow?.webContents.send('audio:chunk', chunk)
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

  startTime = Date.now()

  // Fetch key and push to renderer — renderer opens the WebSocket
  const key = await fetchDeepgramToken()
  _mainWindow?.webContents.send('deepgram:key', key.trim())

  // Start mic — audio chunks flow to renderer via 'audio:chunk'
  helperProcess.stdin.write('START\n')
}

// ── Stop ──────────────────────────────────────────────────────────────────────

function stopRecording () {
  helperProcess?.stdin.write('STOP\n')
  const duration = startTime ? Date.now() - startTime : 0
  startTime = null

  // Signal renderer to send CloseStream to Deepgram
  _mainWindow?.webContents.send('audio:stop')

  return duration
}

// ── Destroy ───────────────────────────────────────────────────────────────────

function destroySpeechBridge () {
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
        if (key) { console.log('[SpeechBridge] Edge function token OK'); return key }
      }
      console.warn('[SpeechBridge] Edge function', res.status, '— using env key')
    } catch (e) {
      console.warn('[SpeechBridge] Edge function failed — using env key')
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
  setMainWindow,
}
