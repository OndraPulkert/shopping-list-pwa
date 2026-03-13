import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface ListRow {
  id: string;
  name: string;
  created_at: number;
  itemCount: number;
  activeCount: number;
}

export async function GET() {
  const db = getDb();
  const lists = db.prepare(`
    SELECT
      l.id,
      l.name,
      l.created_at,
      COUNT(i.id) AS itemCount,
      SUM(CASE WHEN i.bought = 0 THEN 1 ELSE 0 END) AS activeCount
    FROM lists l
    LEFT JOIN items i ON i.list_id = l.id
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `).all() as ListRow[];

  return NextResponse.json({
    lists: lists.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.created_at,
      itemCount: r.itemCount ?? 0,
      activeCount: r.activeCount ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const { name } = await request.json() as { name: string };
  const trimmed = name?.trim();
  if (!trimmed) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const db = getDb();
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare('INSERT INTO lists (id, name, created_at) VALUES (?, ?, ?)').run(id, trimmed, now);

  return NextResponse.json(
    { list: { id, name: trimmed, createdAt: now, itemCount: 0, activeCount: 0 } },
    { status: 201 }
  );
}
