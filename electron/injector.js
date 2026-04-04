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
