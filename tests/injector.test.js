const { test, expect } = require('@jest/globals')

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
