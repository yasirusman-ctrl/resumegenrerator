import Database from 'better-sqlite3'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '..', '..', 'data', 'resumes.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (db) return db

  import('node:fs').then(fs => {
    const dir = join(__dirname, '..', '..', 'data')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  })

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  return db
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      template TEXT NOT NULL DEFAULT 'modern',
      custom_sections TEXT DEFAULT '[]',
      stats TEXT DEFAULT '{}',
      share_id TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_resumes_username ON resumes(username);
    CREATE INDEX IF NOT EXISTS idx_resumes_share_id ON resumes(share_id);
  `)
}

export interface ResumeRecord {
  id: number
  username: string
  template: string
  custom_sections: string
  stats: string
  share_id: string
  created_at: string
}
