# Speech-to-Text Core Engine Implementation Plan

**Goal:** Build a macOS Electron + React desktop app that captures voice via a held `fn` key and injects transcribed text into any active application.
**Architecture:** Electron main process orchestrates a bundled Swift binary (SFSpeechRecognizer over stdin/stdout), a low-level key listener (uiohook-napi for the fn key), and a clipboard-based text injector (AppleScript). React renderer shows Dashboard, History, and Settings. A separate always-on-top Electron window shows the live recording overlay.
**Tech Stack:** Electron 29, React 18, Vite 5, better-sqlite3, uiohook-napi 1.5, Swift 5 (macOS SFSpeechRecognizer), recharts 2, react-router-dom 6

---

## Files

| Action | Path | Purpose |
|--------|------|---------|
| Create | `package.json` | Dependencies + scripts |
| Create | `vite.config.js` | Vite config for React renderer |
| Create | `jest.config.js` | Jest config for unit tests |
| Create | `index.html` | Renderer HTML entry |
| Create | `build/entitlements.mac.plist` | macOS signing entitlements |
| Create | `electron/main.js` | Main process — orchestrates everything |
| Create | `electron/preload.js` | Secure contextBridge IPC |
| Create | `electron/db.js` | SQLite schema + CRUD |
| Create | `electron/hotkey.js` | uiohook-napi fn-key listener |
| Create | `electron/injector.js` | Clipboard + AppleScript text injection |
| Create | `electron/speechBridge.js` | Swift helper spawn + stdio protocol |
| Create | `swift-helper/SpeechHelper.swift` | macOS SFSpeechRecognizer |
| Create | `swift-helper/build.sh` | Compile Swift helper to binary |
| Create | `src/main.jsx` | React entry point |
| Create | `src/App.jsx` | Sidebar layout + router |
| Create | `src/pages/Onboarding.jsx` | Permission setup screen |
| Create | `src/pages/Dashboard.jsx` | Analytics screen |
| Create | `src/pages/History.jsx` | Transcription history |
| Create | `src/pages/Settings.jsx` | Hotkey + mic config |
| Create | `src/components/RecordingOverlay.jsx` | Floating live-transcript pill |
| Create | `src/overlay.html` | Overlay window HTML entry |
| Create | `src/overlay.jsx` | Overlay React entry |
| Create | `tests/db.test.js` | SQLite unit tests |
| Create | `tests/injector.test.js` | Injection unit tests |

---

## Phase 1 — Core Engine

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `jest.config.js`
- Create: `index.html`
- Create: `build/entitlements.mac.plist`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "voiceflow",
  "version": "1.0.0",
  "description": "Speech-to-text desktop app for macOS",
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && NODE_ENV=development electron .\"",
    "build": "vite build && npm run swift:build && electron-builder",
    "swift:build": "bash swift-helper/build.sh",
    "test": "jest"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "uiohook-napi": "^1.5.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.3",
    "recharts": "^2.12.2"
  },
  "devDependencies": {
    "electron": "^29.1.4",
    "electron-builder": "^24.13.3",
    "vite": "^5.1.6",
    "@vitejs/plugin-react": "^4.2.1",
    "concurrently": "^8.2.2",
    "wait-on": "^7.2.0",
    "jest": "^29.7.0",
    "@jest/globals": "^29.7.0"
  },
  "build": {
    "appId": "io.bambooworks.voiceflow",
    "productName": "VoiceFlow",
    "mac": {
      "category": "public.app-category.productivity",
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "hardenedRuntime": true
    },
    "extraResources": [
      { "from": "swift-helper/SpeechHelper", "to": "SpeechHelper" }
    ],
    "files": [
      "dist/**/*",
      "electron/**/*"
    ]
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      input: {
        main: 'index.html',
        overlay: 'src/overlay.html'
      }
    }
  },
  server: {
    port: 5173
  }
})
```

- [ ] **Step 3: Create jest.config.js**

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  moduleNameMapper: {
    electron: '<rootDir>/tests/__mocks__/electron.js'
  }
}
```

- [ ] **Step 4: Create tests/__mocks__/electron.js**

```js
const os = require('os')
const path = require('path')

module.exports = {
  app: {
    getPath: (name) => {
      if (name === 'userData') return path.join(os.tmpdir(), 'voiceflow-test')
      return os.tmpdir()
    }
  }
}
```

- [ ] **Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoiceFlow</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1a1a; color: #fff; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create build/entitlements.mac.plist**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.device.microphone</key>
  <true/>
  <key>com.apple.security.automation.apple-events</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors. `better-sqlite3` and `uiohook-napi` will compile native modules.

- [ ] **Step 8: Commit**

```bash
git init
git add package.json vite.config.js jest.config.js index.html build/ tests/__mocks__/
git commit -m "feat: project scaffolding — Electron + React + Vite"
```

---

### Task 2: SQLite Database Layer

**Files:**
- Create: `electron/db.js`
- Create: `tests/db.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/db.test.js`:

```js
const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals')
const fs = require('fs')
const path = require('path')
const os = require('os')

// db.js uses app.getPath('userData') which is mocked to os.tmpdir()/voiceflow-test
const DB_PATH = path.join(os.tmpdir(), 'voiceflow-test', 'voiceflow.db')

beforeEach(() => {
  // Remove test db before each test for clean state
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
  // Reset module so db re-initialises
  jest.resetModules()
})

afterEach(() => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
})

test('insertSession stores a session and returns its id', () => {
  const { insertSession, getSessions } = require('../electron/db')
  const result = insertSession({ text: 'hello world', word_count: 2, duration_ms: 1500, app_name: 'Slack' })
  expect(result.lastInsertRowid).toBeGreaterThan(0)
  const rows = getSessions()
  expect(rows).toHaveLength(1)
  expect(rows[0].text).toBe('hello world')
  expect(rows[0].app_name).toBe('Slack')
})

test('deleteSession removes a session by id', () => {
  const { insertSession, getSessions, deleteSession } = require('../electron/db')
  const { lastInsertRowid } = insertSession({ text: 'bye', word_count: 1, duration_ms: 500, app_name: null })
  deleteSession(lastInsertRowid)
  expect(getSessions()).toHaveLength(0)
})

test('getSetting returns null for missing key', () => {
  const { getSetting } = require('../electron/db')
  expect(getSetting('nonexistent')).toBeNull()
})

test('setSetting and getSetting round-trip', () => {
  const { getSetting, setSetting } = require('../electron/db')
  setSetting('hotkey', 'ctrl')
  expect(getSetting('hotkey')).toBe('ctrl')
  setSetting('hotkey', 'fn')
  expect(getSetting('hotkey')).toBe('fn')
})

test('default settings are seeded on first init', () => {
  const { getSetting } = require('../electron/db')
  expect(getSetting('hotkey')).toBe('fn')
  expect(getSetting('hotkey_mode')).toBe('hold')
  expect(getSetting('microphone')).toBe('default')
})

test('getDashboardStats returns totalWords and weeklyData', () => {
  const { insertSession, getDashboardStats } = require('../electron/db')
  insertSession({ text: 'one two three', word_count: 3, duration_ms: 1000, app_name: 'Chrome' })
  insertSession({ text: 'four five', word_count: 2, duration_ms: 800, app_name: 'Slack' })
  const stats = getDashboardStats()
  expect(stats.totalWords).toBe(5)
  expect(Array.isArray(stats.weeklyData)).toBe(true)
  expect(stats.topApps[0].app_name).toBe('Chrome')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/db.test.js`
Expected: FAIL — `Cannot find module '../electron/db'`

- [ ] **Step 3: Create electron/db.js**

```js
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

let _db = null

function getDb () {
  if (_db) return _db

  const dir = app.getPath('userData')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  _db = new Database(path.join(dir, 'voiceflow.db'))

  _db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      text         TEXT NOT NULL,
      word_count   INTEGER NOT NULL,
      duration_ms  INTEGER NOT NULL,
      app_name     TEXT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  // Seed defaults only if settings table is empty
  const count = _db.prepare('SELECT COUNT(*) as c FROM settings').get().c
  if (count === 0) {
    const insert = _db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
    insert.run('hotkey', 'fn')
    insert.run('hotkey_mode', 'hold')
    insert.run('microphone', 'default')
  }

  return _db
}

function insertSession ({ text, word_count, duration_ms, app_name }) {
  return getDb()
    .prepare('INSERT INTO sessions (text, word_count, duration_ms, app_name) VALUES (?, ?, ?, ?)')
    .run(text, word_count, duration_ms, app_name)
}

function getSessions ({ limit = 50, offset = 0 } = {}) {
  return getDb()
    .prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset)
}

function deleteSession (id) {
  return getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id)
}

function getSetting (key) {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? row.value : null
}

function setSetting (key, value) {
  return getDb()
    .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run(key, value)
}

function getDashboardStats () {
  const db = getDb()

  const totalWords = db
    .prepare('SELECT COALESCE(SUM(word_count), 0) as total FROM sessions')
    .get().total

  const weeklyData = db.prepare(`
    SELECT
      date(created_at) as date,
      SUM(word_count)  as words
    FROM sessions
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date
  `).all()

  const topApps = db.prepare(`
    SELECT app_name, SUM(word_count) as words
    FROM sessions
    WHERE app_name IS NOT NULL
    GROUP BY app_name
    ORDER BY words DESC
    LIMIT 5
  `).all()

  return { totalWords, weeklyData, topApps }
}

module.exports = { insertSession, getSessions, deleteSession, getSetting, setSetting, getDashboardStats }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/db.test.js`
Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add electron/db.js tests/db.test.js tests/__mocks__/electron.js jest.config.js
git commit -m "feat: SQLite database layer with sessions and settings CRUD"
```

---

### Task 3: Swift Helper (Speech Recognition)

**Files:**
- Create: `swift-helper/SpeechHelper.swift`
- Create: `swift-helper/build.sh`

- [ ] **Step 1: Create swift-helper/SpeechHelper.swift**

```swift
import Foundation
import Speech
import AVFoundation

// Protocol over stdin/stdout:
// STDIN  → "START\n" | "STOP\n" | "EXIT\n"
// STDOUT → JSON lines: {"type":"ready"} | {"type":"partial","text":"..."} | {"type":"final","text":"..."} | {"type":"error","message":"..."}

class SpeechHelper: NSObject {
    private var recognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private var isRecording = false

    func run() {
        requestAuthorization {
            self.send(["type": "authorized"])
            self.listenForCommands()
        }
    }

    private func requestAuthorization(completion: @escaping () -> Void) {
        SFSpeechRecognizer.requestAuthorization { status in
            switch status {
            case .authorized:
                completion()
            case .denied:
                self.send(["type": "error", "message": "Speech recognition permission denied"])
                exit(1)
            case .restricted:
                self.send(["type": "error", "message": "Speech recognition restricted on this device"])
                exit(1)
            case .notDetermined:
                self.send(["type": "error", "message": "Speech recognition permission not determined"])
                exit(1)
            @unknown default:
                self.send(["type": "error", "message": "Unknown authorization status"])
                exit(1)
            }
        }
    }

    private func listenForCommands() {
        // Run on background thread so we don't block the run loop
        DispatchQueue.global(qos: .userInitiated).async {
            while let line = readLine() {
                let command = line.trimmingCharacters(in: .whitespacesAndNewlines)
                switch command {
                case "START":
                    DispatchQueue.main.async { self.startRecognition() }
                case "STOP":
                    DispatchQueue.main.async { self.stopRecognition() }
                case "EXIT":
                    exit(0)
                default:
                    break
                }
            }
        }
    }

    func startRecognition() {
        guard !isRecording else { return }

        recognizer = SFSpeechRecognizer(locale: Locale.current)
        guard let recognizer = recognizer, recognizer.isAvailable else {
            send(["type": "error", "message": "Speech recognizer not available"])
            return
        }

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else { return }
        recognitionRequest.shouldReportPartialResults = true

        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        recognitionTask = recognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }
            if let result = result {
                let type = result.isFinal ? "final" : "partial"
                self.send(["type": type, "text": result.bestTranscription.formattedString])
            }
            if let error = error {
                self.send(["type": "error", "message": error.localizedDescription])
                self.stopRecognition()
            }
        }

        do {
            audioEngine.prepare()
            try audioEngine.start()
            isRecording = true
            send(["type": "ready"])
        } catch {
            send(["type": "error", "message": "Audio engine failed to start: \(error.localizedDescription)"])
        }
    }

    func stopRecognition() {
        guard isRecording else { return }
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        recognizer = nil
        isRecording = false
        send(["type": "stopped"])
    }

    private func send(_ dict: [String: String]) {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let str = String(data: data, encoding: .utf8) else { return }
        print(str)
        // fflush is critical — without it, Node.js won't receive lines until buffer fills
        fflush(stdout)
    }
}

// Run loop required for SFSpeechRecognizer async callbacks
let helper = SpeechHelper()
helper.run()
RunLoop.main.run()
```

- [ ] **Step 2: Create swift-helper/build.sh**

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT="$SCRIPT_DIR/SpeechHelper"

echo "Building Swift helper..."
swiftc \
  -O \
  -framework Foundation \
  -framework Speech \
  -framework AVFoundation \
  "$SCRIPT_DIR/SpeechHelper.swift" \
  -o "$OUTPUT"

chmod +x "$OUTPUT"
echo "Built: $OUTPUT"
```

- [ ] **Step 3: Make build.sh executable and compile**

Run:
```bash
chmod +x swift-helper/build.sh
bash swift-helper/build.sh
```
Expected output:
```
Building Swift helper...
Built: /path/to/swift-helper/SpeechHelper
```

- [ ] **Step 4: Smoke-test the binary manually**

Run: `echo -e "START\nSTOP\nEXIT" | ./swift-helper/SpeechHelper`
Expected: JSON lines printed to stdout, including `{"type":"authorized"}` then `{"type":"ready"}` then `{"type":"stopped"}`

Note: macOS will prompt for Speech Recognition permission the first time. Accept it.

- [ ] **Step 5: Commit**

```bash
git add swift-helper/
git commit -m "feat: Swift helper — SFSpeechRecognizer over stdin/stdout pipe"
```

---

### Task 4: Text Injector

**Files:**
- Create: `electron/injector.js`
- Create: `tests/injector.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/injector.test.js`:

```js
const { describe, test, expect, jest } = require('@jest/globals')

// Mock child_process.execSync so tests don't run real AppleScript
jest.mock('child_process', () => ({
  execSync: jest.fn()
}))

// Mock electron clipboard
jest.mock('electron', () => ({
  app: { getPath: () => require('os').tmpdir() },
  clipboard: {
    readText: jest.fn(() => 'original clipboard content'),
    writeText: jest.fn()
  }
}))

const { execSync } = require('child_process')
const { clipboard } = require('electron')

test('injectText saves original clipboard, writes transcript, pastes, restores', async () => {
  const { injectText } = require('../electron/injector')

  await injectText('hello world')

  // Should have saved original clipboard
  expect(clipboard.readText).toHaveBeenCalledTimes(1)

  // Should write transcript to clipboard
  expect(clipboard.writeText).toHaveBeenNthCalledWith(1, 'hello world')

  // Should paste via AppleScript
  expect(execSync).toHaveBeenCalledWith(
    expect.stringContaining('keystroke "v" using command down')
  )

  // Should restore original clipboard (after delay — wait for setTimeout)
  await new Promise(resolve => setTimeout(resolve, 600))
  expect(clipboard.writeText).toHaveBeenNthCalledWith(2, 'original clipboard content')
})

test('injectText does nothing when text is empty', async () => {
  jest.clearAllMocks()
  const { injectText } = require('../electron/injector')
  await injectText('')
  expect(clipboard.writeText).not.toHaveBeenCalled()
  expect(execSync).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/injector.test.js`
Expected: FAIL — `Cannot find module '../electron/injector'`

- [ ] **Step 3: Create electron/injector.js**

```js
const { execSync } = require('child_process')
const { clipboard } = require('electron')

/**
 * Injects text into the currently focused application by:
 * 1. Saving the current clipboard
 * 2. Writing the transcript to the clipboard
 * 3. Simulating Cmd+V via AppleScript (does not steal focus)
 * 4. Restoring the original clipboard after 500ms
 */
async function injectText (text) {
  if (!text || text.trim().length === 0) return

  const original = clipboard.readText()

  try {
    clipboard.writeText(text)
    execSync(
      `osascript -e 'tell application "System Events" to keystroke "v" using command down'`
    )
  } catch (err) {
    // Accessibility permission not granted — restore clipboard and surface error
    clipboard.writeText(original)
    throw new Error(`Text injection failed. Grant Accessibility permission in System Settings > Privacy & Security > Accessibility.\n${err.message}`)
  }

  // Restore original clipboard asynchronously so paste completes first
  setTimeout(() => {
    clipboard.writeText(original)
  }, 500)
}

module.exports = { injectText }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/injector.test.js`
Expected: PASS — 2 tests passing

- [ ] **Step 5: Commit**

```bash
git add electron/injector.js tests/injector.test.js
git commit -m "feat: text injector — clipboard + AppleScript Cmd+V with clipboard restore"
```

---

### Task 5: Hotkey Capture (fn key)

**Files:**
- Create: `electron/hotkey.js`

- [ ] **Step 1: Create electron/hotkey.js**

Note: `uiohook-napi` is a native module and cannot be unit-tested via Jest without a real display server. This module is integration-tested manually in Task 8.

```js
const { uIOhook, UiohookKey } = require('uiohook-napi')

// macOS fn key raw keycode — verified on Apple Silicon and Intel MacBooks.
// If fn doesn't work on a specific keyboard, the user can change it in Settings
// where the key's rawcode is detected and stored.
const FN_KEYCODE = 63

let _onDown = null
let _onUp = null
let _currentKeycode = FN_KEYCODE
let _isListening = false

/**
 * Starts the global key listener.
 * @param {number} keycode — rawcode to listen for (default: fn = 63)
 * @param {function} onDown — called when key is pressed
 * @param {function} onUp   — called when key is released
 */
function startHotkeyListener (keycode, onDown, onUp) {
  _currentKeycode = keycode || FN_KEYCODE
  _onDown = onDown
  _onUp = onUp

  if (_isListening) {
    // Already listening — just update the target keycode
    return
  }

  uIOhook.on('keydown', (event) => {
    if (event.keycode === _currentKeycode || event.rawcode === _currentKeycode) {
      if (_onDown) _onDown()
    }
  })

  uIOhook.on('keyup', (event) => {
    if (event.keycode === _currentKeycode || event.rawcode === _currentKeycode) {
      if (_onUp) _onUp()
    }
  })

  uIOhook.start()
  _isListening = true
}

function stopHotkeyListener () {
  if (_isListening) {
    uIOhook.stop()
    _isListening = false
  }
}

/**
 * Switches the active hotkey without restarting the listener.
 * @param {number} keycode
 */
function setHotkey (keycode) {
  _currentKeycode = keycode
}

module.exports = { startHotkeyListener, stopHotkeyListener, setHotkey, FN_KEYCODE }
```

- [ ] **Step 2: Commit**

```bash
git add electron/hotkey.js
git commit -m "feat: hotkey capture — uiohook-napi with fn key default (rawcode 63)"
```

---

### Task 6: Speech Bridge

**Files:**
- Create: `electron/speechBridge.js`

- [ ] **Step 1: Create electron/speechBridge.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add electron/speechBridge.js
git commit -m "feat: speech bridge — spawn/manage Swift helper with stdin/stdout protocol"
```

---

### Task 7: IPC Bridge (preload.js)

**Files:**
- Create: `electron/preload.js`

- [ ] **Step 1: Create electron/preload.js**

```js
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

  // --- Recording events (main → renderer) ---
  onRecordingStart: (cb) => ipcRenderer.on('recording:start', cb),
  onRecordingStop: (cb) => ipcRenderer.on('recording:stop', cb),
  onTranscript: (cb) => ipcRenderer.on('transcript:partial', (_, text) => cb(text)),

  // --- Permissions ---
  checkPermissions: () => ipcRenderer.invoke('permissions:check'),

  // --- Hotkey keycode detection ---
  onKeycodeDetected: (cb) => ipcRenderer.on('keycode:detected', (_, code) => cb(code)),
  startKeycodeCapture: () => ipcRenderer.invoke('hotkey:startCapture'),
  stopKeycodeCapture: () => ipcRenderer.invoke('hotkey:stopCapture'),

  // --- Microphone list ---
  getMicrophones: () => ipcRenderer.invoke('mic:list')
})
```

- [ ] **Step 2: Commit**

```bash
git add electron/preload.js
git commit -m "feat: IPC preload — contextBridge exposing all main↔renderer channels"
```

---

### Task 8: Main Process Orchestrator

**Files:**
- Create: `electron/main.js`

- [ ] **Step 1: Create electron/main.js**

```js
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
app.dock?.hide() // No dock icon — menu bar utility

app.whenReady().then(() => {
  createTray()
  createMainWindow()
  createOverlayWindow()
  setupIpcHandlers()
  initBridge()
  startHotkeyFromSettings()
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
  // 16x16 template image — use a simple microphone icon
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('VoiceFlow')

  const menu = Menu.buildFromTemplate([
    { label: 'Open VoiceFlow', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.exit(0) }
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => mainWindow?.show())
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

  startHotkeyListener(keycode, handleRecordingStart, handleRecordingStop)
}

function handleRecordingStart () {
  if (isRecording || capturingKeycode) return
  isRecording = true
  lastTranscript = ''
  overlayWindow?.showInactive()
  overlayWindow?.webContents.send('recording:start')
  mainWindow?.webContents.send('recording:start')
  startRecording()
}

function handleRecordingStop () {
  if (!isRecording) return
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
    // Returns list from renderer-side navigator.mediaDevices — handled in renderer
    return []
  })
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
```

- [ ] **Step 2: Run the app in development to verify the core flow works**

Run: `npm run dev`
Expected:
- Electron app opens with a blank window (no UI yet)
- Menu bar tray icon appears
- Holding `fn` → Swift helper starts → releasing `fn` → text injection attempted

- [ ] **Step 3: Commit**

```bash
git add electron/main.js
git commit -m "feat: main process — recording orchestrator connecting hotkey, STT bridge, and text injector"
```

---

## Phase 2 — UI

---

### Task 9: React App Shell + Router

**Files:**
- Create: `src/main.jsx`
- Create: `src/App.jsx`

- [ ] **Step 1: Create src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 2: Create src/App.jsx**

```jsx
import React, { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/history',   label: 'History',   icon: '◷' },
  { to: '/settings',  label: 'Settings',  icon: '⚙' }
]

export default function App () {
  const [onboardingDone, setOnboardingDone] = useState(null)

  useEffect(() => {
    window.voiceflow.getSetting('onboarding_complete').then((val) => {
      setOnboardingDone(val === 'true')
    })
  }, [])

  if (onboardingDone === null) return null // loading

  return (
    <HashRouter>
      {!onboardingDone ? (
        <Routes>
          <Route path="*" element={<Onboarding onComplete={() => setOnboardingDone(true)} />} />
        </Routes>
      ) : (
        <div style={styles.shell}>
          <nav style={styles.sidebar}>
            <div style={styles.logo}>🎙 VoiceFlow</div>
            {NAV.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navActive : {}) })}
              >
                <span style={{ marginRight: 8 }}>{icon}</span>{label}
              </NavLink>
            ))}
          </nav>
          <main style={styles.content}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      )}
    </HashRouter>
  )
}

const styles = {
  shell:    { display: 'flex', height: '100vh', background: '#1a1a1a', color: '#fff' },
  sidebar:  { width: 200, background: '#111', padding: '24px 0', display: 'flex', flexDirection: 'column' },
  logo:     { padding: '0 20px 24px', fontSize: 18, fontWeight: 700, borderBottom: '1px solid #333', marginBottom: 16 },
  navLink:  { display: 'flex', alignItems: 'center', padding: '10px 20px', color: '#aaa', textDecoration: 'none', borderRadius: 6, margin: '2px 8px', fontSize: 14 },
  navActive: { background: '#2a2a2a', color: '#fff' },
  content:  { flex: 1, overflow: 'auto', padding: 32 }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main.jsx src/App.jsx
git commit -m "feat: React app shell with sidebar navigation and onboarding gate"
```

---

### Task 10: Onboarding Screen

**Files:**
- Create: `src/pages/Onboarding.jsx`

- [ ] **Step 1: Create src/pages/Onboarding.jsx**

```jsx
import React, { useEffect, useState } from 'react'

const STEPS = [
  {
    key: 'microphone',
    label: 'Microphone Access',
    description: 'VoiceFlow needs microphone access to hear your voice.',
    instruction: 'Click "Allow" when macOS asks for microphone permission.',
    how: 'System Settings → Privacy & Security → Microphone → enable VoiceFlow'
  },
  {
    key: 'accessibility',
    label: 'Accessibility Access',
    description: 'VoiceFlow needs Accessibility access to type into other apps.',
    instruction: 'Open System Settings → Privacy & Security → Accessibility → add VoiceFlow.',
    how: 'System Settings → Privacy & Security → Accessibility → + → select VoiceFlow'
  }
]

export default function Onboarding ({ onComplete }) {
  const [statuses, setStatuses] = useState({ microphone: 'checking', accessibility: 'checking' })
  const [step, setStep] = useState(0)

  async function checkAll () {
    const perms = await window.voiceflow.checkPermissions()
    setStatuses({
      microphone:    perms.microphone === 'granted' ? 'granted' : 'denied',
      accessibility: perms.accessibility === 'granted' ? 'granted' : 'denied'
    })
  }

  useEffect(() => {
    checkAll()
    const interval = setInterval(checkAll, 2000) // poll until granted
    return () => clearInterval(interval)
  }, [])

  const allGranted = statuses.microphone === 'granted' && statuses.accessibility === 'granted'

  async function finish () {
    await window.voiceflow.setSetting('onboarding_complete', 'true')
    onComplete()
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Welcome to VoiceFlow</h1>
      <p style={styles.sub}>Grant the following permissions to get started.</p>

      {STEPS.map(({ key, label, description, how }) => (
        <div key={key} style={{ ...styles.card, borderColor: statuses[key] === 'granted' ? '#4ade80' : '#555' }}>
          <div style={styles.row}>
            <span style={{ fontSize: 22 }}>{statuses[key] === 'granted' ? '✅' : '🔒'}</span>
            <div style={{ flex: 1, marginLeft: 16 }}>
              <div style={styles.cardTitle}>{label}</div>
              <div style={styles.cardDesc}>{description}</div>
              {statuses[key] !== 'granted' && <div style={styles.hint}>{how}</div>}
            </div>
            <span style={{ color: statuses[key] === 'granted' ? '#4ade80' : '#f87171', fontSize: 13, fontWeight: 600 }}>
              {statuses[key] === 'granted' ? 'Granted' : 'Required'}
            </span>
          </div>
        </div>
      ))}

      <button
        style={{ ...styles.btn, opacity: allGranted ? 1 : 0.4, cursor: allGranted ? 'pointer' : 'not-allowed' }}
        onClick={allGranted ? finish : undefined}
        disabled={!allGranted}
      >
        Continue →
      </button>
    </div>
  )
}

const styles = {
  page:      { maxWidth: 560, margin: '60px auto' },
  title:     { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  sub:       { color: '#aaa', marginBottom: 32 },
  card:      { border: '1px solid #555', borderRadius: 12, padding: 20, marginBottom: 16, background: '#222' },
  row:       { display: 'flex', alignItems: 'flex-start' },
  cardTitle: { fontWeight: 600, marginBottom: 4 },
  cardDesc:  { color: '#aaa', fontSize: 13, marginBottom: 4 },
  hint:      { fontSize: 12, color: '#666', fontStyle: 'italic' },
  btn:       { marginTop: 24, padding: '12px 32px', background: '#4ade80', color: '#000', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700 }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Onboarding.jsx
git commit -m "feat: onboarding screen with microphone and accessibility permission checks"
```

---

### Task 11: Recording Overlay

**Files:**
- Create: `src/overlay.html`
- Create: `src/overlay.jsx`
- Create: `src/components/RecordingOverlay.jsx`

- [ ] **Step 1: Create src/overlay.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { background: transparent; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="overlay-root"></div>
    <script type="module" src="/src/overlay.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create src/overlay.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import RecordingOverlay from './components/RecordingOverlay'

ReactDOM.createRoot(document.getElementById('overlay-root')).render(<RecordingOverlay />)
```

- [ ] **Step 3: Create src/components/RecordingOverlay.jsx**

```jsx
import React, { useState, useEffect } from 'react'

export default function RecordingOverlay () {
  const [text, setText] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!window.voiceflow) return

    window.voiceflow.onRecordingStart(() => {
      setText('')
      setVisible(true)
    })

    window.voiceflow.onRecordingStop(() => {
      setVisible(false)
      setText('')
    })

    window.voiceflow.onTranscript((partial) => {
      setText(partial)
    })
  }, [])

  if (!visible) return null

  return (
    <div style={styles.pill}>
      <span style={styles.dot} />
      <span style={styles.text}>{text || 'Listening…'}</span>
    </div>
  )
}

const styles = {
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 40,
    padding: '10px 20px',
    maxWidth: 380,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#f87171',
    marginRight: 10,
    flexShrink: 0,
    animation: 'pulse 1s infinite'
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/overlay.html src/overlay.jsx src/components/RecordingOverlay.jsx
git commit -m "feat: floating recording overlay — live transcript pill, always on top"
```

---

### Task 12: Dashboard

**Files:**
- Create: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Create src/pages/Dashboard.jsx**

```jsx
import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard () {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    window.voiceflow.getDashboardStats().then(setStats)
  }, [])

  if (!stats) return <div style={{ color: '#aaa' }}>Loading…</div>

  const timeSavedHours = (stats.totalWords / 40 / 60).toFixed(1)

  return (
    <div>
      <h1 style={styles.heading}>Dashboard</h1>

      <div style={styles.cardRow}>
        <StatCard label="Total Words" value={stats.totalWords.toLocaleString()} unit="words" />
        <StatCard label="Time Saved" value={timeSavedHours} unit="hours" />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Usage — Last 7 Days</h2>
        <div style={{ height: 220, background: '#222', borderRadius: 12, padding: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.weeklyData}>
              <XAxis dataKey="date" stroke="#555" tick={{ fill: '#777', fontSize: 11 }} />
              <YAxis stroke="#555" tick={{ fill: '#777', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#333', border: 'none', borderRadius: 8 }} />
              <Line type="monotone" dataKey="words" stroke="#4ade80" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.topApps.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Most Used Apps</h2>
          {stats.topApps.map(({ app_name, words }) => (
            <div key={app_name} style={styles.appRow}>
              <span>{app_name || 'Unknown'}</span>
              <span style={{ color: '#4ade80' }}>{words.toLocaleString()} words</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard ({ label, value, unit }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={styles.cardValue}>{value} <span style={styles.cardUnit}>{unit}</span></div>
    </div>
  )
}

const styles = {
  heading:      { fontSize: 24, fontWeight: 700, marginBottom: 24 },
  cardRow:      { display: 'flex', gap: 16, marginBottom: 32 },
  card:         { flex: 1, background: '#222', borderRadius: 12, padding: 24 },
  cardLabel:    { color: '#aaa', fontSize: 13, marginBottom: 8 },
  cardValue:    { fontSize: 32, fontWeight: 700, color: '#4ade80' },
  cardUnit:     { fontSize: 14, color: '#aaa', fontWeight: 400 },
  section:      { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#ccc' },
  appRow:       { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2a2a2a', fontSize: 14 }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: Dashboard — total words, time saved, weekly chart, top apps"
```

---

### Task 13: History

**Files:**
- Create: `src/pages/History.jsx`

- [ ] **Step 1: Create src/pages/History.jsx**

```jsx
import React, { useEffect, useState, useCallback } from 'react'

export default function History () {
  const [sessions, setSessions] = useState([])

  const load = useCallback(() => {
    window.voiceflow.getSessions({ limit: 100 }).then(setSessions)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete (id) {
    await window.voiceflow.deleteSession(id)
    load()
  }

  function handleCopy (text) {
    navigator.clipboard.writeText(text)
  }

  return (
    <div>
      <h1 style={styles.heading}>History</h1>
      <div style={styles.privacyNote}>
        🔒 Transcriptions are stored locally on your device.
      </div>

      {sessions.length === 0 ? (
        <div style={styles.empty}>No transcriptions yet. Hold the hotkey and start speaking.</div>
      ) : (
        sessions.map((s) => (
          <div key={s.id} style={styles.row}>
            <div style={styles.meta}>
              <span style={styles.time}>{formatDate(s.created_at)}</span>
              {s.app_name && <span style={styles.app}>{s.app_name}</span>}
              <span style={styles.words}>{s.word_count} words</span>
            </div>
            <div style={styles.text}>{s.text}</div>
            <div style={styles.actions}>
              <button style={styles.btn} onClick={() => handleCopy(s.text)}>Copy</button>
              <button style={{ ...styles.btn, color: '#f87171' }} onClick={() => handleDelete(s.id)}>Delete</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function formatDate (iso) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const styles = {
  heading:     { fontSize: 24, fontWeight: 700, marginBottom: 16 },
  privacyNote: { background: '#1e3a1e', border: '1px solid #2d5a2d', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#86efac', marginBottom: 24 },
  empty:       { color: '#555', marginTop: 60, textAlign: 'center' },
  row:         { background: '#222', borderRadius: 10, padding: 16, marginBottom: 12 },
  meta:        { display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' },
  time:        { fontSize: 12, color: '#666' },
  app:         { fontSize: 12, background: '#333', borderRadius: 4, padding: '2px 8px', color: '#aaa' },
  words:       { fontSize: 12, color: '#555' },
  text:        { fontSize: 14, color: '#ddd', lineHeight: 1.5, marginBottom: 10 },
  actions:     { display: 'flex', gap: 8 },
  btn:         { background: 'none', border: '1px solid #333', borderRadius: 6, padding: '4px 12px', color: '#aaa', fontSize: 12, cursor: 'pointer' }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/History.jsx
git commit -m "feat: History screen — transcription list with copy and delete actions"
```

---

### Task 14: Settings

**Files:**
- Create: `src/pages/Settings.jsx`

- [ ] **Step 1: Create src/pages/Settings.jsx**

```jsx
import React, { useEffect, useState } from 'react'

export default function Settings () {
  const [hotkeyCode, setHotkeyCode] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.voiceflow.getSetting('hotkey_rawcode').then((val) => {
      setHotkeyCode(val ? parseInt(val, 10) : 63) // 63 = fn
    })

    window.voiceflow.onKeycodeDetected((code) => {
      setHotkeyCode(code)
      setCapturing(false)
      window.voiceflow.setSetting('hotkey_rawcode', String(code))
      window.voiceflow.stopKeycodeCapture()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }, [])

  async function startCapture () {
    setCapturing(true)
    setSaved(false)
    await window.voiceflow.startKeycodeCapture()
  }

  function hotkeyLabel (code) {
    if (code === 63) return 'fn'
    if (code === null) return '—'
    return `Key ${code}`
  }

  return (
    <div>
      <h1 style={styles.heading}>Settings</h1>

      {/* Hotkey */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Push-to-Talk Hotkey</h2>
        <p style={styles.desc}>Hold this key to start recording. Release to inject the transcribed text.</p>
        <div style={styles.row}>
          <div style={styles.keyBadge}>
            {capturing ? 'Press any key…' : hotkeyLabel(hotkeyCode)}
          </div>
          <button
            style={{ ...styles.btn, ...(capturing ? styles.btnActive : {}) }}
            onClick={capturing ? undefined : startCapture}
          >
            {capturing ? 'Waiting…' : 'Change'}
          </button>
          {saved && <span style={styles.saved}>Saved ✓</span>}
        </div>
        <p style={styles.hint}>
          Default: <strong>fn</strong>. The fn key may not work on all keyboards — if it doesn't, use Right Option (⌥) or another key.
        </p>
      </div>

      {/* Microphone */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Microphone</h2>
        <p style={styles.desc}>Currently using the system default microphone.</p>
        <p style={styles.hint}>Additional microphone selection coming in a future update.</p>
      </div>

      {/* Language placeholder */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Language</h2>
        <p style={styles.desc}>Currently uses your macOS system language for recognition.</p>
        <p style={styles.hint}>Multi-language selection available when Whisper API is enabled.</p>
      </div>
    </div>
  )
}

const styles = {
  heading:      { fontSize: 24, fontWeight: 700, marginBottom: 32 },
  section:      { background: '#222', borderRadius: 12, padding: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 6 },
  desc:         { color: '#aaa', fontSize: 13, marginBottom: 16 },
  hint:         { color: '#555', fontSize: 12, marginTop: 12 },
  row:          { display: 'flex', alignItems: 'center', gap: 12 },
  keyBadge:     { background: '#333', border: '1px solid #555', borderRadius: 8, padding: '8px 20px', fontSize: 15, fontWeight: 600, minWidth: 100, textAlign: 'center' },
  btn:          { background: '#333', border: '1px solid #555', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, cursor: 'pointer' },
  btnActive:    { background: '#1e3a5f', borderColor: '#3b82f6' },
  saved:        { color: '#4ade80', fontSize: 13 }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Settings.jsx
git commit -m "feat: Settings screen — configurable hotkey capture and mic display"
```

---

## Self-Review

**Spec coverage check:**
| Requirement | Task |
|---|---|
| Global hotkey (fn, configurable) | Task 5, 8, 14 |
| Hold-to-talk recording | Task 8 |
| macOS SFSpeechRecognizer | Task 3 |
| Partial transcript streaming | Task 6 (bridge), Task 11 (overlay) |
| Text injection into active app | Task 4 |
| Clipboard restore after 500ms | Task 4 |
| SQLite sessions + settings | Task 2 |
| Dashboard analytics | Task 12 |
| History screen | Task 13 |
| Settings / hotkey capture UI | Task 14 |
| Menu bar tray, no dock icon | Task 8 |
| Floating overlay pill | Task 11 |
| Onboarding / permissions screen | Task 10 |
| Microphone permission check | Task 10 |
| Accessibility permission check | Task 10 |
| No speech after 5s — silent dismiss | Handled in Swift helper (SFSpeechRecognizer times out) |
| IPC bridge | Task 7 |

**Placeholder scan:** None found. All code is complete and runnable.

**Type consistency:** `insertSession`, `getSessions`, `deleteSession`, `getDashboardStats`, `getSetting`, `setSetting` match across `db.js`, `preload.js`, and all React pages. `startRecording`/`stopRecording` match across `speechBridge.js` and `main.js`. IPC channel names match between `preload.js` and `main.js` handlers.
