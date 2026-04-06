const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, systemPreferences } = require('electron')
const path = require('path')

const db = require('./db')
const { injectText } = require('./injector')
const { startHotkeyListener, stopHotkeyListener, setHotkey, FN_KEYCODE } = require('./hotkey')
const { initSpeechBridge, startRecording, stopRecording, destroySpeechBridge, cleanTranscript } = require('./speechBridge')

// --- State ---
let mainWindow      = null
let overlayWindow   = null
let tray            = null
let isRecording     = false
let recordDuration  = 0
let capturingKeycode = false

// --- App setup ---
app.whenReady().then(() => {
  createAppMenu()
  createTray()
  createMainWindow()
  createOverlayWindow()
  setupIpcHandlers()
  initBridge()
  startHotkeyFromSettings()
  requestPermissions()
})

app.on('before-quit', () => {
  app.quitting = true
  destroySpeechBridge()
  stopHotkeyListener()
})

app.on('window-all-closed', () => app.quit())

// --- App menu ---
function createAppMenu () {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Voxa',
      submenu: [
        { label: 'About Voxa', role: 'about' },
        { type: 'separator' },
        { label: 'Hide Voxa',  accelerator: 'Cmd+H', role: 'hide' },
        { type: 'separator' },
        { label: 'Quit Voxa', accelerator: 'Cmd+Q', click: () => app.exit(0) },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut'  }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Open Voxa',    accelerator: 'Cmd+1', click: () => { mainWindow?.show(); mainWindow?.focus() } },
        { label: 'Close Window', accelerator: 'Cmd+W', click: () => mainWindow?.hide() },
        { role: 'minimize' },
      ],
    },
  ])
  Menu.setApplicationMenu(menu)
}

// --- Windows ---
function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 900, height: 650, minWidth: 800, minHeight: 550,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#080808',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const url = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/renderer/index.html')}`

  mainWindow.loadURL(url)
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('close', (e) => {
    if (app.quitting) return
    e.preventDefault()
    mainWindow.hide()
  })
}

function createOverlayWindow () {
  overlayWindow = new BrowserWindow({
    width: 420, height: 64,
    x: Math.round(require('electron').screen.getPrimaryDisplay().workAreaSize.width / 2 - 210),
    y: require('electron').screen.getPrimaryDisplay().workAreaSize.height - 120,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, hasShadow: false, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
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
  tray.setTitle('🎙')
  tray.setToolTip('Voxa')

  const menu = Menu.buildFromTemplate([
    { label: 'Open Voxa',      click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { type: 'separator' },
    { label: 'Start Recording', click: () => handleRecordingStart() },
    { label: 'Stop Recording',  click: () => handleRecordingStop() },
    { type: 'separator' },
    { label: 'Quit Voxa',      click: () => app.exit(0) },
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => { mainWindow?.show(); mainWindow?.focus() })
}

// --- Speech bridge (Deepgram + GPT-4o mini) ---
function initBridge () {
  initSpeechBridge({
    onReady: () => {},

    // Interim partial — show in overlay only (not injected)
    onPartial: (text) => {
      overlayWindow?.webContents.send('transcript:partial', text)
      mainWindow?.webContents.send('transcript:partial', text)
    },

    // Utterance complete — clean with GPT then inject
    onFinal: async (rawText) => {
      if (!rawText.trim()) return

      const openaiKey = db.getSetting('openai_api_key')
      let text = rawText

      if (openaiKey) {
        try {
          text = await cleanTranscript(rawText, openaiKey)
        } catch (e) {
          console.error('[GPT cleanup]', e.message)
        }
      }

      const wordCount = text.split(/\s+/).filter(Boolean).length
      injectText(text).catch(console.error)
      db.insertSession({ text, word_count: wordCount, duration_ms: 0, app_name: null })
    },

    onError: (msg) => {
      console.error('[SpeechBridge]', msg)
      handleRecordingStop()
    },
  })
}

// --- Hotkey ---
function startHotkeyFromSettings () {
  const stored  = db.getSetting('hotkey_rawcode')
  const keycode = stored ? parseInt(stored, 10) : FN_KEYCODE
  startHotkeyListener(keycode, handleRecordingStart, handleRecordingStop)
}

function handleRecordingStart () {
  if (isRecording || capturingKeycode) return
  console.log('[Voxa] Recording START')
  isRecording = true

  overlayWindow?.showInactive()
  overlayWindow?.webContents.send('recording:start')
  mainWindow?.webContents.send('recording:start')

  const dgKey = db.getSetting('deepgram_api_key')
    || process.env.DEEPGRAM_API_KEY
    || ''

  startRecording(dgKey).catch((err) => {
    console.error('[Voxa] Failed to start recording:', err.message)
    handleRecordingStop()
  })
}

function handleRecordingStop () {
  if (!isRecording) return
  console.log('[Voxa] Recording STOP')
  isRecording   = false
  recordDuration = stopRecording() || 0

  // Keep overlay visible in processing state briefly
  overlayWindow?.webContents.send('recording:processing')
  mainWindow?.webContents.send('recording:processing')

  // Hide overlay after Deepgram finishes (1.5s buffer in stopRecording)
  setTimeout(() => {
    overlayWindow?.hide()
    overlayWindow?.webContents.send('recording:stop')
    mainWindow?.webContents.send('recording:stop')
  }, 2000)
}

// --- IPC Handlers ---
function setupIpcHandlers () {
  ipcMain.handle('db:getSessions',      (_, opts) => db.getSessions(opts))
  ipcMain.handle('db:deleteSession',    (_, id)   => db.deleteSession(id))
  ipcMain.handle('db:getDashboardStats', ()       => db.getDashboardStats())
  ipcMain.handle('db:getSetting',       (_, key)  => db.getSetting(key))
  ipcMain.handle('db:setSetting',       (_, key, value) => {
    db.setSetting(key, value)
    if (key === 'hotkey_rawcode') setHotkey(parseInt(value, 10))
  })

  ipcMain.handle('permissions:check', async () => ({
    microphone:   systemPreferences.getMediaAccessStatus('microphone'),
    accessibility: await checkAccessibility(),
  }))

  ipcMain.handle('hotkey:startCapture', () => {
    capturingKeycode = true
    const { uIOhook } = require('uiohook-napi')
    const handler = (event) => {
      mainWindow?.webContents.send('keycode:detected', event.rawcode || event.keycode)
      uIOhook.removeListener('keydown', handler)
      capturingKeycode = false
    }
    uIOhook.on('keydown', handler)
  })
  ipcMain.handle('hotkey:stopCapture', () => { capturingKeycode = false })
  ipcMain.handle('mic:list', async () => [])

  ipcMain.handle('recording:start', () => handleRecordingStart())
  ipcMain.handle('recording:stop',  () => handleRecordingStop())

  ipcMain.handle('app:info', () => ({
    version:         app.getVersion(),
    platform:        process.platform === 'darwin' ? 'macOS' : process.platform,
    electronVersion: process.versions.electron,
    nodeVersion:     process.versions.node,
    userAgent:       `Electron/${process.versions.electron} (${process.platform})`,
  }))

  ipcMain.handle('app:getLoginItem', () => app.getLoginItemSettings().openAtLogin)
  ipcMain.handle('app:setLoginItem', (_, enabled) => app.setLoginItemSettings({ openAtLogin: enabled }))

  ipcMain.handle('system:getAll', () => ({
    launchAtLogin:     app.getLoginItemSettings().openAtLogin,
    interactionSounds: db.getSetting('interaction_sounds') !== 'false',
    copyToClipboard:   db.getSetting('copy_to_clipboard') === 'true',
    muteBackground:    db.getSetting('mute_background')   !== 'false',
  }))
  ipcMain.handle('system:set', (_, key, value) => {
    if (key === 'launchAtLogin') app.setLoginItemSettings({ openAtLogin: value })
    else db.setSetting(key, String(value))
  })
}

async function requestPermissions () {
  const status = systemPreferences.getMediaAccessStatus('microphone')
  if (status !== 'granted') await systemPreferences.askForMediaAccess('microphone')
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
