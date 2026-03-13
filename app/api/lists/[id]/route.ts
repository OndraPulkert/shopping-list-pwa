import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface ListRow { id: string; name: string; created_at: number }
type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare('SELECT id, name, created_at FROM lists WHERE id = ?').get(id) as ListRow | undefined;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ list: { id: row.id, name: row.name, createdAt: row.created_at } });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const { name } = await request.json() as { name?: string };
  const trimmed = name?.trim();
  if (!trimmed || trimmed.length > 200) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  const db = getDb();
  const result = db.prepare('UPDATE lists SET name = ? WHERE id = ?').run(trimmed, id);
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM lists WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
