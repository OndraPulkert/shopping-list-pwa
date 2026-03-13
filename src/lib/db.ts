import { createClient, type Client } from '@libsql/client';

// In development: falls back to a local SQLite file (no Turso credentials needed)
// In production (Vercel): TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars required
function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    // Local dev: use a local SQLite file
    if (process.env.NODE_ENV !== 'production') {
      return createClient({ url: 'file:shopping.db' });
    }
    throw new Error(
      'TURSO_DATABASE_URL is not set. Add it in Vercel → Project Settings → Environment Variables.'
    );
  }
  return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
}

// Attach to globalThis so Next.js hot reload in dev doesn't create multiple DB clients
const g = globalThis as typeof globalThis & { _dbReady?: Promise<Client> };

export function getDb(): Promise<Client> {
  if (!g._dbReady) {
    const client = createDbClient();
    g._dbReady = initSchema(client)
      .then(() => runMigrations(client))
      .then(() => client);
  }
  return g._dbReady;
}

async function initSchema(db: Client) {
  // Enable foreign key enforcement (SQLite requires this per-connection)
  await db.execute('PRAGMA foreign_keys = ON');
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS lists (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id         TEXT PRIMARY KEY,
      list_id    TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      quantity   TEXT,
      bought     INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      bought_at  INTEGER
    );

    CREATE TABLE IF NOT EXISTS item_history (
      name         TEXT PRIMARY KEY,
      use_count    INTEGER NOT NULL DEFAULT 1,
      last_used_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_items_list_id ON items(list_id);
    CREATE INDEX IF NOT EXISTS idx_history_use   ON item_history(use_count DESC, last_used_at DESC);
  `);
}

// Additive migrations — ALTER TABLE fails if column already exists; that's expected
async function runMigrations(db: Client) {
  try { await db.execute('ALTER TABLE items ADD COLUMN quantity TEXT'); } catch (e) { console.warn('migration skipped:', e); }
  try { await db.execute('ALTER TABLE items ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0'); } catch (e) { console.warn('migration skipped:', e); }
}
