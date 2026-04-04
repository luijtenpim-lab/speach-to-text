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
