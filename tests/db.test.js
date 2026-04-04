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
