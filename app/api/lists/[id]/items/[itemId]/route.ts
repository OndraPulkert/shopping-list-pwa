import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type Params = Promise<{ id: string; itemId: string }>;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id: listId, itemId } = await params;
  const body = await req.json().catch(() => ({})) as { name?: string; quantity?: string | null };
  const db = await getDb();

  const current = await db.execute({
    sql: 'SELECT bought FROM items WHERE id = ? AND list_id = ?',
    args: [itemId, listId],
  });
  if (!current.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Edit mode: body contains name
  if (body.name !== undefined) {
    const trimmed = body.name.trim();
    if (!trimmed || trimmed.length > 500) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    await db.execute({
      sql: 'UPDATE items SET name = ?, quantity = ? WHERE id = ? AND list_id = ?',
      args: [trimmed, body.quantity ?? null, itemId, listId],
    });
    return NextResponse.json({ ok: true });
  }

  // Toggle bought state
  const newBought = (current.rows[0].bought as number) === 0 ? 1 : 0;
  const boughtAt = newBought === 1 ? Date.now() : null;
  await db.execute({
    sql: 'UPDATE items SET bought = ?, bought_at = ? WHERE id = ? AND list_id = ?',
    args: [newBought, boughtAt, itemId, listId],
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id: listId, itemId } = await params;
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM items WHERE id = ? AND list_id = ?', args: [itemId, listId] });
  return NextResponse.json({ ok: true });
}