import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = await params;
  const { ids } = await request.json() as { ids: string[] };
  if (!Array.isArray(ids)) return NextResponse.json({ error: 'ids required' }, { status: 400 });

  const db = await getDb();
  // Update sort_order for each item in one batch
  await Promise.all(
    ids.map((itemId, index) =>
      db.execute({
        sql: 'UPDATE items SET sort_order = ? WHERE id = ? AND list_id = ?',
        args: [index, itemId, listId],
      })
    )
  );

  return NextResponse.json({ ok: true });
}
