import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('UPDATE items SET bought = 0, bought_at = NULL WHERE list_id = ?').run(id);
  return NextResponse.json({ ok: true });
}
