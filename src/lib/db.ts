import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'shopping.db');

let _db: Database.Database | undefined;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    // WAL mode: concurrent reads while writes happen (two devices polling simultaneously)
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
    runMigrations(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id         TEXT PRIMARY KEY,
      list_id    TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      bought     INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      bought_at  INTEGER
    );

    -- Tracks all item names ever added — powers autocomplete
    CREATE TABLE IF NOT EXISTS item_history (
      name         TEXT PRIMARY KEY,
      use_count    INTEGER NOT NULL DEFAULT 1,
      last_used_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_items_list_id ON items(list_id);
    CREATE INDEX IF NOT EXISTS idx_history_use   ON item_history(use_count DESC, last_used_at DESC);
  `);
}

// Additive migrations — ALTER TABLE fails silently if column already exists
function runMigrations(db: Database.Database) {
  // v2: item quantity field
  try { db.exec('ALTER TABLE items ADD COLUMN quantity TEXT'); } catch {}
}
