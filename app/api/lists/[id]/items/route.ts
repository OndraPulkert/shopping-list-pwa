import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function rowToItem(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    listId: r.list_id as string,
    name: r.name as string,
    quantity: (r.quantity as string | null) ?? null,
    bought: (r.bought as number) === 1,
    createdAt: r.created_at as number,
    boughtAt: (r.bought_at as number | null) ?? null,
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM items WHERE list_id = ? ORDER BY bought ASC, sort_order ASC, created_at ASC',
    args: [id],
  });
  return NextResponse.json({ items: result.rows.map(rowToItem) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = await params;
  const { name, quantity, id: clientId } = await request.json() as {
    name: string; quantity?: string | null; id?: string;
  };
  const trimmed = name?.trim();
  if (!trimmed || trimmed.length > 500) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  const qty = (typeof quantity === 'string' ? quantity.trim() : null) || null;
  if (qty && qty.length > 50) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (clientId && !UUID_RE.test(clientId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const db = await getDb();
  const id = clientId ?? crypto.randomUUID();
  const now = Date.now();

  // Place new items at the end of active list
  const maxOrder = await db.execute({
    sql: 'SELECT COALESCE(MAX(sort_order), 0) AS m FROM items WHERE list_id = ?',
    args: [listId],
  });
  const sortOrder = (maxOrder.rows[0].m as number) + 1;

  await db.execute({
    sql: `INSERT INTO items (id, list_id, name, quantity, bought, created_at, sort_order) VALUES (?, ?, ?, ?, 0, ?, ?)
          ON CONFLICT(id) DO NOTHING`,
    args: [id, listId, trimmed, qty, now, sortOrder],
  });

  // Track in history for autocomplete
  await db.execute({
    sql: `INSERT INTO item_history (name, use_count, last_used_at) VALUES (?, 1, ?)
          ON CONFLICT(name) DO UPDATE SET use_count = use_count + 1, last_used_at = excluded.last_used_at`,
    args: [trimmed, now],
  });

  const itemResult = await db.execute({ sql: 'SELECT * FROM items WHERE id = ?', args: [id] });
  return NextResponse.json({ item: rowToItem(itemResult.rows[0]) }, { status: 201 });
}
