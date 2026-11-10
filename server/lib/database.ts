// Pure module (geen Nuxt auto-imports) zodat het ook vanuit scripts/admin.ts te gebruiken is.
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const MIGRATIONS: string[] = [
  // 1: basis schema
  `
  CREATE TABLE people (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    roles TEXT NOT NULL DEFAULT '[]',
    role_other TEXT NOT NULL DEFAULT '',
    repairs TEXT NOT NULL DEFAULT '',
    about TEXT NOT NULL DEFAULT '',
    photo BLOB,
    photo_original BLOB,
    photo_crop TEXT,
    photo_updated_at TEXT,
    consent_at TEXT NOT NULL,
    visible INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  `,
]

export function openDatabase(dataDir: string): DatabaseSync {
  const dir = resolve(dataDir)
  mkdirSync(dir, { recursive: true })
  const db = new DatabaseSync(join(dir, 'smoelenboek.sqlite'))
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;')
  migrate(db)
  return db
}

function migrate(db: DatabaseSync) {
  const { user_version: current } = db.prepare('PRAGMA user_version').get() as {
    user_version: number
  }
  for (let version = current; version < MIGRATIONS.length; version++) {
    db.exec('BEGIN')
    try {
      db.exec(MIGRATIONS[version]!)
      db.exec(`PRAGMA user_version = ${version + 1}`)
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  }
}
