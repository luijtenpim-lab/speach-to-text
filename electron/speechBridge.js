const { spawn } = require('child_process')
const path       = require('path')
const fs         = require('fs')
const { app }    = require('electron')

const SUPABASE_URL = 'https://symzpwobkyhqseslmijg.supabase.co'

let helperProcess = null
let dgConnection  = null
let _onPartial    = null
let _onFinal      = null
let _onError      = null
let _onReady      = null
let startTime     = null
let _accessToken  = null   // Supabase JWT — set via setAccessToken()

// ── Auth token (passed from renderer after login) ─────────────────────────────

function setAccessToken (token) {
  _accessToken = token
}

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

  console.log('[SpeechBridge] Launching helper:', helperPath)
  helperProcess = spawn(helperPath, [], { stdio: ['pipe', 'pipe', 'pipe'] })

  // stdout = raw PCM audio → forward to Deepgram via sendMedia
  helperProcess.stdout.on('data', (chunk) => {
    try { if (dgConnection) dgConnection.sendMedia(chunk) } catch {}
  })

  // stderr = JSON control messages
  let stderrBuf = ''
  helperProcess.stderr.on('data', (data) => {
    stderrBuf += data.toString()
    const lines = stderrBuf.split('\n')
    stderrBuf   = lines.pop()
    for (const line of lines) {
      if (!line.trim()) continue
      try { handleControl(JSON.parse(line)) } catch {}
    }
  })

  helperProcess.on('exit', (code) => {
    if (code !== 0 && _onError) _onError(`SpeechHelper exited: ${code}`)
    helperProcess = null
  })
}

function handleControl (msg) {
  switch (msg.type) {
    case 'authorized': break
    case 'ready':   if (_onReady) _onReady(); break
    case 'stopped': break
    case 'error':   if (_onError) _onError(msg.message); break
  }
}

// ── Start recording ───────────────────────────────────────────────────────────

async function startRecording () {
  if (!helperProcess) throw new Error('SpeechBridge not initialised')

  const tempKey = await fetchDeepgramToken()

  const { DeepgramClient } = require('@deepgram/sdk')
  const deepgram = new DeepgramClient(tempKey)

  // connect() is async and returns a V1Socket
  dgConnection = await deepgram.listen.v1.connect({
    model:            'nova-2',
    language:         'en-US',
    smart_format:     true,
    punctuate:        true,
    interim_results:  true,
    utterance_end_ms: 800,
    vad_events:       true,
    encoding:         'linear16',
    sample_rate:      16000,
    channels:         1,
  })

  dgConnection.on('open', () => {
    console.log('[Deepgram] Connected')
    startTime = Date.now()
    helperProcess?.stdin.write('START\n')
  })

  // V1Socket emits 'message' with the parsed JSON object
  dgConnection.on('message', (data) => {
    const transcript = data?.channel?.alternatives?.[0]?.transcript ?? ''
    if (!transcript) return

    if (data.speech_final) {
      console.log('[Deepgram] Utterance end:', transcript)
      if (_onPartial) _onPartial('')
      if (_onFinal)   _onFinal(transcript)
    } else if (data.is_final === false) {
      if (_onPartial) _onPartial(transcript)
    }
  })

  dgConnection.on('error', (err) => {
    console.error('[Deepgram error]', err?.message ?? err)
    if (_onError) _onError('Deepgram error: ' + (err?.message ?? ''))
  })

  dgConnection.on('close', () => {
    console.log('[Deepgram] Connection closed')
    dgConnection = null
  })
}

// ── Stop recording ────────────────────────────────────────────────────────────

function stopRecording () {
  helperProcess?.stdin.write('STOP\n')
  const duration = startTime ? Date.now() - startTime : 0
  startTime = null

  // Tell Deepgram no more audio is coming, then close after it processes
  setTimeout(() => {
    try { dgConnection?.sendCloseStream() } catch {}
    setTimeout(() => {
      try { dgConnection?.close() } catch {}
      dgConnection = null
    }, 1000)
  }, 500)

  return duration
}

// ── Destroy ───────────────────────────────────────────────────────────────────

function destroySpeechBridge () {
  try { dgConnection?.sendCloseStream() } catch {}
  try { dgConnection?.close() } catch {}
  dgConnection = null
  if (helperProcess) {
    helperProcess.stdin.write('EXIT\n')
    helperProcess = null
  }
}

// ── Supabase edge function calls ──────────────────────────────────────────────

async function fetchDeepgramToken () {
  // Try edge function first (production path — keys stay server-side)
  if (_accessToken) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-deepgram-token`, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${_accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        const { key } = await res.json()
        if (key) {
          console.log('[SpeechBridge] Got temp Deepgram token from edge function')
          return key
        }
      } else {
        console.warn('[SpeechBridge] Edge function returned', res.status, '— falling back to env key')
      }
    } catch (e) {
      console.warn('[SpeechBridge] Edge function failed:', e.message, '— falling back to env key')
    }
  }

  // Fallback: use key from env (dev mode / before edge function is working)
  const envKey = process.env.DEEPGRAM_API_KEY
  if (envKey) {
    console.log('[SpeechBridge] Using DEEPGRAM_API_KEY from env')
    return envKey
  }

  throw new Error('No Deepgram key available — set DEEPGRAM_API_KEY in .env or log in')
}

async function cleanTranscript (text) {
  if (!_accessToken) return text

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/cleanup`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${_accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!res.ok) return text
    const { cleaned } = await res.json()
    return cleaned ?? text
  } catch {
    return text
  }
}

module.exports = {
  initSpeechBridge,
  startRecording,
  stopRecording,
  destroySpeechBridge,
  cleanTranscript,
  setAccessToken,
}
