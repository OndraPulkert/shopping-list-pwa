import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = await params;
  const { ids } = await request.json() as { ids: unknown };

  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string' && UUID_RE.test(id))) {
    return NextResponse.json({ error: 'Invalid ids' }, { status: 400 });
  }

  const db = await getDb();
  // Atomic batch — all sort_order updates succeed or none do
  await db.batch(
    ids.map((itemId, index) => ({
      sql: 'UPDATE items SET sort_order = ? WHERE id = ? AND list_id = ?',
      args: [index, itemId, listId],
    })),
    'write'
  );

  return NextResponse.json({ ok: true });
}
