# Design Spec — Speech-to-Text Core Engine
**Date:** 2026-04-04
**Status:** Approved
**Scope:** MVP — core dictation engine only (no billing, no subscription)

---

## 1. Goal

Build a macOS desktop app that lets users hold a hotkey, speak, and have their words injected as text into whatever application is currently active (Slack, WhatsApp, Google Docs, etc.).

---

## 2. Stack

| Layer | Choice | Rationale |
|---|---|---|
| Desktop framework | Electron + React | Cross-platform path to Windows later; large ecosystem |
| Speech-to-text | macOS native SFSpeechRecognizer | Zero cost, zero API keys for MVP; swap to OpenAI Whisper API later |
| Text injection | Clipboard + AppleScript (Cmd+V simulation) | Most reliable cross-app injection on macOS |
| Local storage | SQLite (better-sqlite3) | Simple, local, no server needed |
| STT bridge | Swift helper binary (bundled) | Required to run SFSpeechRecognizer outside of a focused window |
| Hotkey capture | uiohook-napi (low-level) | fn key is hardware-level; cannot be captured by Electron's standard globalShortcut |

---

## 3. Architecture

```
Electron App
├── Main Process (Node.js)
│   ├── Global hotkey listener (fn key, via uiohook-napi)
│   ├── Text injector (clipboard + AppleScript)
│   ├── SQLite database (history + settings)
│   └── IPC bridge ↔ renderer & Swift helper
├── Renderer Process (React)
│   ├── Dashboard, History, Settings UI
│   └── Recording overlay (live transcript feedback)
└── Swift Helper (compiled binary, bundled in app)
    ├── SFSpeechRecognizer
    └── Communication via stdin/stdout pipe
```

---

## 4. Recording Flow

1. User holds `fn`
2. Electron main process detects `keydown` via `uiohook-napi` (low-level key listener)
3. Main sends start signal to Swift helper via stdin
4. Swift helper starts `SFSpeechRecognizer` and streams partial transcripts to stdout
5. Main forwards partial transcripts to renderer via IPC
6. Renderer displays live text in floating overlay
7. User releases hotkey → `keyup` detected
8. Main sends stop signal to Swift helper
9. Swift helper sends final transcript and exits streaming mode
10. Main process injects final text into active app

**Text injection steps:**
1. Save current clipboard content
2. Write transcript to clipboard
3. Execute: `osascript -e 'tell application "System Events" to keystroke "v" using command down'`
4. Restore original clipboard after 500ms delay

**Key invariant:** The target app (Slack, WhatsApp, etc.) never loses focus during this entire flow. The hotkey is captured globally without stealing focus.

---

## 5. Data Schema

```sql
-- Transcription sessions
CREATE TABLE sessions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  text         TEXT NOT NULL,
  word_count   INTEGER NOT NULL,
  duration_ms  INTEGER NOT NULL,
  app_name     TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User preferences (key-value)
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**Default settings entries:**
- `hotkey` → `"fn"` (user-configurable; any key or combo)
- `hotkey_mode` → `"hold"` (hold-to-talk)
- `microphone` → `"default"`

---

## 6. UI Screens

### 6a. Menu Bar Tray
- Always visible in macOS menu bar
- No Dock icon — behaves like a system utility
- Click to open main window
- Mic indicator icon when recording is active

### 6b. Dashboard
- Total words transcribed (lifetime)
- Time saved (total words ÷ 40 WPM, expressed in hours)
- Line chart: word count per day, last 7 days
- Most used apps breakdown

### 6c. History
- Chronological list of past sessions
- Each row: timestamp, target app name, word count, text preview
- Actions per row: copy full text, delete
- Privacy note: "Transcriptions stored locally on your device"

### 6d. Settings
- Hotkey selector: user clicks a "Press a key" capture field and holds any key to set it
- Default hotkey: `fn`
- Any single key or combo (e.g. `fn`, `Ctrl`, `Right Option`, `Cmd+Shift+Space`) is supported
- Microphone selector (dropdown)
- Language selector (for future Whisper swap)

### 6e. Recording Overlay
- Small floating pill, always on top, appears on hotkey hold
- Displays streaming transcript text in real time
- Disappears on release, no user interaction required
- Position: bottom-center of screen

---

## 7. Permissions Required

| Permission | Why |
|---|---|
| Microphone | Voice capture |
| Accessibility | Global hotkey + AppleScript text injection |
| Speech Recognition | SFSpeechRecognizer (macOS will prompt user) |

The app must guide the user through granting all three permissions on first launch.

---

## 8. Error Handling

| Scenario | Behavior |
|---|---|
| Microphone not available | Show error in overlay, do not inject |
| Speech Recognition permission denied | Show onboarding screen with instructions |
| Accessibility permission denied | Show onboarding screen with instructions |
| No speech detected after 5s | Dismiss overlay silently, inject nothing |
| Target app does not accept keyboard input | Clipboard contains text; user can paste manually |

---

## 9. Future Scope (Not MVP)

- Swap SFSpeechRecognizer → OpenAI Whisper API (one-file change by design)
- Subscription billing (Stripe) + Free tier word limits
- Custom dictionary / word corrections
- Windows support (Electron already supports it; replace Swift helper with Windows STT)
- Toggle mode (press once to start, press again to stop)

---

## 10. File Structure

```
/
├── electron/
│   ├── main.js          # Main process: hotkey, injection, SQLite, IPC
│   └── preload.js       # Secure IPC bridge to renderer
├── src/
│   ├── App.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── History.jsx
│   │   └── Settings.jsx
│   └── components/
│       └── RecordingOverlay.jsx
├── swift-helper/
│   └── SpeechHelper.swift   # SFSpeechRecognizer, stdio pipe
├── tools/                   # Per CLAUDE.md: atomic Python scripts
├── .tmp/                    # Per CLAUDE.md: intermediate files
├── .env                     # API keys (future Whisper key)
└── docs/specs/              # This file lives here
```
