import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ suggestions: [] });

  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT name FROM item_history
          WHERE name LIKE ? ESCAPE '\\'
          ORDER BY use_count DESC, last_used_at DESC
          LIMIT 8`,
    args: [`${q.replace(/[%_\\]/g, '\\$&')}%`],
  });

  return NextResponse.json({ suggestions: result.rows.map((r) => r.name as string) });
}
