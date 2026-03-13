import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface ItemRow {
  id: string;
  list_id: string;
  name: string;
  quantity: string | null;
  bought: number;
  created_at: number;
  bought_at: number | null;
}

function rowToItem(r: ItemRow) {
  return {
    id: r.id,
    listId: r.list_id,
    name: r.name,
    quantity: r.quantity ?? null,
    bought: r.bought === 1,
    createdAt: r.created_at,
    boughtAt: r.bought_at ?? null,
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const items = db.prepare(
    'SELECT * FROM items WHERE list_id = ? ORDER BY bought ASC, created_at ASC'
  ).all(id) as ItemRow[];

  return NextResponse.json({ items: items.map(rowToItem) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = await params;
  const { name, quantity, id: clientId } = await request.json() as {
    name: string; quantity?: string | null; id?: string;
  };
  const trimmed = name?.trim();
  if (!trimmed || trimmed.length > 500) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  if (quantity && (typeof quantity !== 'string' || quantity.length > 50)) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (clientId && !UUID_RE.test(clientId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const db = getDb();
  const id = clientId ?? crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    'INSERT OR IGNORE INTO items (id, list_id, name, quantity, bought, created_at) VALUES (?, ?, ?, ?, 0, ?)'
  ).run(id, listId, trimmed, quantity ?? null, now);

  // Track in history for autocomplete
  db.prepare(`
    INSERT INTO item_history (name, use_count, last_used_at) VALUES (?, 1, ?)
    ON CONFLICT(name) DO UPDATE SET use_count = use_count + 1, last_used_at = excluded.last_used_at
  `).run(trimmed, now);

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow;
  return NextResponse.json({ item: rowToItem(item) }, { status: 201 });
}
