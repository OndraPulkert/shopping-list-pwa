import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const db = await getDb();

  // No query → return most frequently used items
  if (!q) {
    const result = await db.execute({
      sql: `SELECT name FROM item_history
            ORDER BY use_count DESC, last_used_at DESC
            LIMIT 8`,
      args: [],
    });
    return NextResponse.json({ suggestions: result.rows.map((r) => r.name as string) });
  }

  const result = await db.execute({
    sql: `SELECT name FROM item_history
          WHERE name LIKE ? ESCAPE '\\'
          ORDER BY use_count DESC, last_used_at DESC
          LIMIT 8`,
    args: [`${q.replace(/[%_\\]/g, '\\$&')}%`],
  });

  return NextResponse.json({ suggestions: result.rows.map((r) => r.name as string) });
}
