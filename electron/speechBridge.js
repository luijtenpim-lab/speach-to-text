const { spawn }  = require('child_process')
const path        = require('path')
const fs          = require('fs')
const { app }     = require('electron')

let helperProcess = null
let dgConnection  = null
let _onPartial    = null
let _onFinal      = null
let _onError      = null
let _onReady      = null
let startTime     = null

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

  // stdout = raw PCM audio → forward to Deepgram when connected
  helperProcess.stdout.on('data', (chunk) => {
    try {
      if (dgConnection) dgConnection.send(chunk)
    } catch {}
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

async function startRecording (deepgramApiKey) {
  if (!helperProcess) throw new Error('SpeechBridge not initialised')

  const { createClient } = require('@deepgram/sdk')
  const deepgram  = createClient(deepgramApiKey)

  dgConnection = deepgram.listen.live({
    model:            'nova-2',
    language:         'en-US',
    smart_format:     true,
    punctuate:        true,
    interim_results:  true,
    utterance_end_ms: '800',
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

  dgConnection.on('Results', async (data) => {
    const alt        = data.channel?.alternatives?.[0]
    const transcript = alt?.transcript ?? ''
    if (!transcript) return

    if (data.speech_final) {
      // End of utterance — clean with GPT then fire onFinal
      console.log('[Deepgram] Utterance:', transcript)
      if (_onPartial) _onPartial('') // clear overlay
      if (_onFinal)   _onFinal(transcript) // fire immediately (raw)
    } else if (!data.is_final) {
      // Interim — show in overlay only
      if (_onPartial) _onPartial(transcript)
    }
  })

  dgConnection.on('error', (err) => {
    console.error('[Deepgram] Error:', err)
    if (_onError) _onError('Deepgram: ' + err?.message)
  })

  dgConnection.on('close', () => {
    console.log('[Deepgram] Closed')
    dgConnection = null
  })
}

// ── Stop recording ────────────────────────────────────────────────────────────

function stopRecording () {
  helperProcess?.stdin.write('STOP\n')
  const duration = startTime ? Date.now() - startTime : 0
  startTime = null

  // Give Deepgram ~1.5s to process remaining audio, then close
  setTimeout(() => {
    try { dgConnection?.requestClose() } catch {}
    dgConnection = null
  }, 1500)

  return duration
}

// ── Destroy ───────────────────────────────────────────────────────────────────

function destroySpeechBridge () {
  try { dgConnection?.requestClose() } catch {}
  dgConnection = null
  if (helperProcess) {
    helperProcess.stdin.write('EXIT\n')
    helperProcess = null
  }
}

// ── GPT-4o mini cleanup ───────────────────────────────────────────────────────

async function cleanTranscript (text, openaiApiKey) {
  const { OpenAI } = require('openai')
  const openai     = new OpenAI({ apiKey: openaiApiKey })

  const res = await openai.chat.completions.create({
    model:       'gpt-4o-mini',
    temperature: 0,
    max_tokens:  500,
    messages: [
      {
        role:    'system',
        content: 'You are a transcript cleaner. Remove filler words (um, uh, like, you know, basically, right, so yeah, actually, literally, I mean, kind of, sort of). Fix grammar and punctuation. Keep exact meaning. Return ONLY the cleaned text.',
      },
      { role: 'user', content: text },
    ],
  })

  return res.choices[0].message.content?.trim() ?? text
}

module.exports = {
  initSpeechBridge,
  startRecording,
  stopRecording,
  destroySpeechBridge,
  cleanTranscript,
}
