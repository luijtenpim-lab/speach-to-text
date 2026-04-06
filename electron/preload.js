const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('voiceflow', {
  // --- Sessions ---
  getSessions: (opts) => ipcRenderer.invoke('db:getSessions', opts),
  deleteSession: (id) => ipcRenderer.invoke('db:deleteSession', id),

  // --- Dashboard stats ---
  getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),

  // --- Settings ---
  getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
  setSetting: (key, value) => ipcRenderer.invoke('db:setSetting', key, value),

  // --- Recording controls (renderer → main) ---
  startRecording: () => ipcRenderer.invoke('recording:start'),
  stopRecording: () => ipcRenderer.invoke('recording:stop'),

  // --- Recording events (main → renderer) ---
  onRecordingStart:      (cb) => ipcRenderer.on('recording:start',      cb),
  onRecordingStop:       (cb) => ipcRenderer.on('recording:stop',       cb),
  onRecordingProcessing: (cb) => ipcRenderer.on('recording:processing', cb),
  onTranscript:          (cb) => ipcRenderer.on('transcript:partial', (_, text) => cb(text)),

  // --- Permissions ---
  checkPermissions: () => ipcRenderer.invoke('permissions:check'),

  // --- Hotkey keycode detection ---
  onKeycodeDetected: (cb) => ipcRenderer.on('keycode:detected', (_, code) => cb(code)),
  startKeycodeCapture: () => ipcRenderer.invoke('hotkey:startCapture'),
  stopKeycodeCapture: () => ipcRenderer.invoke('hotkey:stopCapture'),

  // --- Microphone list ---
  getMicrophones: () => ipcRenderer.invoke('mic:list'),

  // --- App info + system settings ---
  getAppInfo:     () => ipcRenderer.invoke('app:info'),
  getSystemAll:   () => ipcRenderer.invoke('system:getAll'),
  setSystem:      (key, value) => ipcRenderer.invoke('system:set', key, value)
})
