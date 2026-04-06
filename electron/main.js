const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, systemPreferences } = require('electron')
const path = require('path')

const db = require('./db')
const { injectText } = require('./injector')
const { startHotkeyListener, stopHotkeyListener, setHotkey, FN_KEYCODE } = require('./hotkey')
const { initSpeechBridge, startRecording, stopRecording, destroySpeechBridge } = require('./speechBridge')

// --- State ---
let mainWindow = null
let overlayWindow = null
let tray = null
let isRecording = false
let lastTranscript = ''
let capturingKeycode = false

// --- App setup ---
app.whenReady().then(() => {
  app.dock?.hide() // No dock icon — menu bar utility
  createTray()
  createMainWindow()
  createOverlayWindow()
  setupIpcHandlers()
  initBridge()
  startHotkeyFromSettings()
  requestPermissions()
})

app.on('before-quit', () => {
  destroySpeechBridge()
  stopHotkeyListener()
})

// --- Windows ---
function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 800,
    minHeight: 550,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a1a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const url = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/renderer/index.html')}`

  mainWindow.loadURL(url)
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow.hide() // Keep running in background
  })
}

function createOverlayWindow () {
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 80,
    x: Math.round(require('electron').screen.getPrimaryDisplay().workAreaSize.width / 2 - 200),
    y: require('electron').screen.getPrimaryDisplay().workAreaSize.height - 120,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const url = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173/src/overlay.html'
    : `file://${path.join(__dirname, '../dist/renderer/src/overlay.html')}`

  overlayWindow.loadURL(url)
}

// --- Tray ---
function createTray () {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setTitle('🎙') // visible menu bar text fallback
  tray.setToolTip('Voxa')

  const menu = Menu.buildFromTemplate([
    { label: 'Open Voxa', click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { type: 'separator' },
    { label: 'Start Recording', click: () => handleRecordingStart() },
    { label: 'Stop Recording',  click: () => handleRecordingStop() },
    { type: 'separator' },
    { label: 'Quit Voxa', click: () => app.exit(0) }
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => { mainWindow?.show(); mainWindow?.focus() })
}

// --- Speech bridge ---
function initBridge () {
  initSpeechBridge({
    onPartial: (text) => {
      lastTranscript = text
      overlayWindow?.webContents.send('transcript:partial', text)
      mainWindow?.webContents.send('transcript:partial', text)
    },
    onFinal: (text) => {
      lastTranscript = text
    },
    onReady: () => {
      // Recording has started in the helper
    },
    onError: (message) => {
      console.error('[SpeechBridge error]', message)
      if (isRecording) handleRecordingStop()
    }
  })
}

// --- Hotkey ---
function startHotkeyFromSettings () {
  const storedKeycode = db.getSetting('hotkey_rawcode')
  const keycode = storedKeycode ? parseInt(storedKeycode, 10) : FN_KEYCODE

  console.log('[VoiceFlow] Starting hotkey listener for keycode:', keycode)
  startHotkeyListener(keycode, handleRecordingStart, handleRecordingStop)
}

function handleRecordingStart () {
  if (isRecording || capturingKeycode) return
  console.log('[VoiceFlow] Recording START')
  isRecording = true
  lastTranscript = ''
  overlayWindow?.showInactive()
  overlayWindow?.webContents.send('recording:start')
  mainWindow?.webContents.send('recording:start')
  startRecording()
}

function handleRecordingStop () {
  if (!isRecording) return
  console.log('[VoiceFlow] Recording STOP, transcript:', lastTranscript)
  isRecording = false
  const duration = stopRecording() || 0

  overlayWindow?.hide()
  overlayWindow?.webContents.send('recording:stop')
  mainWindow?.webContents.send('recording:stop')

  if (lastTranscript.trim().length > 0) {
    const text = lastTranscript.trim()
    const wordCount = text.split(/\s+/).filter(Boolean).length

    // Inject text into active app
    injectText(text).catch(console.error)

    // Persist session
    db.insertSession({ text, word_count: wordCount, duration_ms: duration, app_name: null })
  }

  lastTranscript = ''
}

// --- IPC Handlers ---
function setupIpcHandlers () {
  ipcMain.handle('db:getSessions', (_, opts) => db.getSessions(opts))
  ipcMain.handle('db:deleteSession', (_, id) => db.deleteSession(id))
  ipcMain.handle('db:getDashboardStats', () => db.getDashboardStats())
  ipcMain.handle('db:getSetting', (_, key) => db.getSetting(key))
  ipcMain.handle('db:setSetting', (_, key, value) => {
    db.setSetting(key, value)
    // If hotkey changed, update the listener
    if (key === 'hotkey_rawcode') {
      setHotkey(parseInt(value, 10))
    }
  })

  ipcMain.handle('permissions:check', async () => {
    const mic = systemPreferences.getMediaAccessStatus('microphone')
    const accessibility = await checkAccessibility()
    return { microphone: mic, accessibility }
  })

  ipcMain.handle('hotkey:startCapture', () => {
    capturingKeycode = true
    // Temporarily override keydown listener to capture any key
    const { uIOhook } = require('uiohook-napi')
    const captureHandler = (event) => {
      mainWindow?.webContents.send('keycode:detected', event.rawcode || event.keycode)
      uIOhook.removeListener('keydown', captureHandler)
      capturingKeycode = false
    }
    uIOhook.on('keydown', captureHandler)
  })

  ipcMain.handle('hotkey:stopCapture', () => {
    capturingKeycode = false
  })

  ipcMain.handle('mic:list', async () => {
    return []
  })

  // UI-triggered recording (click button instead of hotkey)
  ipcMain.handle('recording:start', () => handleRecordingStart())
  ipcMain.handle('recording:stop', () => handleRecordingStop())

  // App info for Status screen
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform === 'darwin' ? 'macOS' : process.platform,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    userAgent: `Electron/${process.versions.electron} (${process.platform})`
  }))

  // Login item (launch at login)
  ipcMain.handle('app:getLoginItem', () => {
    return app.getLoginItemSettings().openAtLogin
  })
  ipcMain.handle('app:setLoginItem', (_, enabled) => {
    app.setLoginItemSettings({ openAtLogin: enabled })
  })

  // System toggles — persisted in SQLite settings
  ipcMain.handle('system:getAll', () => ({
    launchAtLogin:   app.getLoginItemSettings().openAtLogin,
    interactionSounds:   db.getSetting('interaction_sounds') !== 'false',
    copyToClipboard:     db.getSetting('copy_to_clipboard') === 'true',
    muteBackground:      db.getSetting('mute_background') !== 'false'
  }))
  ipcMain.handle('system:set', (_, key, value) => {
    if (key === 'launchAtLogin') {
      app.setLoginItemSettings({ openAtLogin: value })
    } else {
      db.setSetting(key, String(value))
    }
  })
}

async function requestPermissions () {
  // Trigger macOS microphone permission dialog — this registers the app
  // in System Settings > Privacy & Security > Microphone
  const micStatus = systemPreferences.getMediaAccessStatus('microphone')
  if (micStatus !== 'granted') {
    await systemPreferences.askForMediaAccess('microphone')
  }
}

function checkAccessibility () {
  return new Promise((resolve) => {
    try {
      const { execSync } = require('child_process')
      execSync(`osascript -e 'tell application "System Events" to get name of first process'`)
      resolve('granted')
    } catch {
      resolve('denied')
    }
  })
}
