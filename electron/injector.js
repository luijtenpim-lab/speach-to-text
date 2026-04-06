const { execSync } = require('child_process')
const { clipboard } = require('electron')

/**
 * Injects text into the currently focused application.
 * Strategy 1: Clipboard + Cmd+V via AppleScript (requires Accessibility)
 * Strategy 2: Clipboard only — user can paste manually (fallback)
 */
async function injectText (text) {
  if (!text?.trim()) return

  const original = clipboard.readText()
  clipboard.writeText(text)

  try {
    execSync(
      `osascript -e 'tell application "System Events" to keystroke "v" using command down'`,
      { timeout: 3000 }
    )
    console.log('[Injector] Pasted via Cmd+V ✓')
  } catch (err) {
    console.error('[Injector] Cmd+V failed — Accessibility permission may be missing.')
    console.error('[Injector] Go to: System Settings → Privacy & Security → Accessibility → add Electron/Voxa')
    console.error('[Injector] Text is in clipboard — press Cmd+V manually for now.')
    // Don't throw — text is on clipboard, user can paste
  }

  setTimeout(() => clipboard.writeText(original), 800)
}

module.exports = { injectText }
