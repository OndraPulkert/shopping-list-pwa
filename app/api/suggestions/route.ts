import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface HistoryRow { name: string }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ suggestions: [] });

  const db = getDb();
  const rows = db.prepare(
    `SELECT name FROM item_history
     WHERE name LIKE ? ESCAPE '\\'
     ORDER BY use_count DESC, last_used_at DESC
     LIMIT 8`
  ).all(`${q.replace(/[%_\\]/g, '\\$&')}%`) as HistoryRow[];

  return NextResponse.json({ suggestions: rows.map((r) => r.name) });
}
