import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type Params = Promise<{ id: string; itemId: string }>;

export async function PATCH(_req: Request, { params }: { params: Params }) {
  const { id: listId, itemId } = await params;
  const db = getDb();

  const current = db.prepare('SELECT bought FROM items WHERE id = ? AND list_id = ?').get(itemId, listId) as
    | { bought: number }
    | undefined;
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const newBought = current.bought === 0 ? 1 : 0;
  const boughtAt = newBought === 1 ? Date.now() : null;
  db.prepare('UPDATE items SET bought = ?, bought_at = ? WHERE id = ? AND list_id = ?').run(
    newBought,
    boughtAt,
    itemId,
    listId,
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id: listId, itemId } = await params;
  const db = getDb();
  db.prepare('DELETE FROM items WHERE id = ? AND list_id = ?').run(itemId, listId);
  return NextResponse.json({ ok: true });
}
