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
