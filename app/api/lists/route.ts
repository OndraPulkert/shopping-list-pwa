import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const result = await db.execute(`
    SELECT
      l.id,
      l.name,
      l.created_at,
      COUNT(i.id)                                    AS itemCount,
      SUM(CASE WHEN i.bought = 0 THEN 1 ELSE 0 END) AS activeCount
    FROM lists l
    LEFT JOIN items i ON i.list_id = l.id
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `);

  const lists = result.rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    createdAt: r.created_at as number,
    itemCount: (r.itemCount as number) ?? 0,
    activeCount: (r.activeCount as number) ?? 0,
  }));

  return NextResponse.json({ lists });
}

export async function POST(request: Request) {
  const { name } = await request.json() as { name: string };
  const trimmed = name?.trim();
  if (!trimmed || trimmed.length > 200) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });

  const db = await getDb();
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.execute({ sql: 'INSERT INTO lists (id, name, created_at) VALUES (?, ?, ?)', args: [id, trimmed, now] });

  return NextResponse.json(
    { list: { id, name: trimmed, createdAt: now, itemCount: 0, activeCount: 0 } },
    { status: 201 }
  );
}
