import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const db = await getDb();
  const result = await db.execute({ sql: 'SELECT id, name, created_at FROM lists WHERE id = ?', args: [id] });
  const row = result.rows[0];
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ list: { id: row.id, name: row.name, createdAt: row.created_at } });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const { name } = await request.json() as { name?: string };
  const trimmed = name?.trim();
  if (!trimmed || trimmed.length > 200) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  const db = await getDb();
  const result = await db.execute({ sql: 'UPDATE lists SET name = ? WHERE id = ?', args: [trimmed, id] });
  if (result.rowsAffected === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM lists WHERE id = ?', args: [id] });
  return NextResponse.json({ ok: true });
}
