const { spawn } = require('child_process')
const path = require('path')
const { app } = require('electron')

let helperProcess = null
let _onPartial = null
let _onFinal = null
let _onError = null
let _onReady = null
let startTime = null

/**
 * Returns the path to the bundled SpeechHelper binary.
 * In development: swift-helper/SpeechHelper (relative to project root)
 * In production: Resources/SpeechHelper (inside app bundle)
 */
function getHelperPath () {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'SpeechHelper')
  }
  return path.join(__dirname, '..', 'swift-helper', 'SpeechHelper')
}

function initSpeechBridge ({ onPartial, onFinal, onError, onReady }) {
  _onPartial = onPartial
  _onFinal = onFinal
  _onError = onError
  _onReady = onReady

  const helperPath = getHelperPath()
  helperProcess = spawn(helperPath, [], { stdio: ['pipe', 'pipe', 'pipe'] })

  let buffer = ''

  helperProcess.stdout.on('data', (data) => {
    buffer += data.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const msg = JSON.parse(line)
        handleMessage(msg)
      } catch (e) {
        console.error('[SpeechBridge] Failed to parse line:', line)
      }
    }
  })

  helperProcess.stderr.on('data', (data) => {
    console.error('[SpeechHelper stderr]', data.toString())
  })

  helperProcess.on('exit', (code) => {
    if (code !== 0) {
      if (_onError) _onError(`SpeechHelper exited with code ${code}`)
    }
    helperProcess = null
  })
}

function handleMessage (msg) {
  switch (msg.type) {
    case 'authorized':
      // Helper is ready to receive START/STOP commands
      break
    case 'ready':
      if (_onReady) _onReady()
      break
    case 'partial':
      if (_onPartial) _onPartial(msg.text)
      break
    case 'final':
      if (_onFinal) _onFinal(msg.text)
      break
    case 'stopped':
      // Recording cleanly stopped
      break
    case 'error':
      if (_onError) _onError(msg.message)
      break
  }
}

function startRecording () {
  if (!helperProcess) throw new Error('SpeechBridge not initialised')
  startTime = Date.now()
  helperProcess.stdin.write('START\n')
}

function stopRecording () {
  if (!helperProcess) return
  helperProcess.stdin.write('STOP\n')
  const duration = startTime ? Date.now() - startTime : 0
  startTime = null
  return duration
}

function destroySpeechBridge () {
  if (helperProcess) {
    helperProcess.stdin.write('EXIT\n')
    helperProcess = null
  }
}

module.exports = { initSpeechBridge, startRecording, stopRecording, destroySpeechBridge }
