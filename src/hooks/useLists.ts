'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ShoppingList } from '@/types/shopping';

export function useLists() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/lists');
      if (!res.ok) return;
      const { lists } = await res.json() as { lists: ShoppingList[] };
      setLists(lists);
    } catch {
      // Network offline — keep last known state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  // Poll every 5s — picks up lists created/deleted on another device
  useEffect(() => {
    const interval = setInterval(fetchLists, 5000);
    return () => clearInterval(interval);
  }, [fetchLists]);

  async function createList(name: string): Promise<ShoppingList | null> {
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return null;
      const { list } = await res.json() as { list: ShoppingList };
      setLists((prev) => [list, ...prev]);
      return list;
    } catch {
      return null;
    }
  }

  async function deleteList(id: string) {
    setLists((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/lists/${id}`, { method: 'DELETE' });
    } catch {
      // On failure re-sync
      fetchLists();
    }
  }

  return { lists, loading, createList, deleteList, refetch: fetchLists };
}
