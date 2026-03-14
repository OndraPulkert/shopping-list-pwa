'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ShoppingList } from '@/types/shopping';

export function useLists() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/lists');
      if (!res.ok) {
        setError('Could not load lists.');
        return;
      }
      const { lists } = await res.json() as { lists: ShoppingList[] };
      setLists(lists);
      setError(null);
    } catch {
      setError('Could not load lists.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  async function createList(name: string): Promise<ShoppingList | null> {
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        setError('Could not create the list.');
        return null;
      }
      const { list } = await res.json() as { list: ShoppingList };
      setLists((prev) => [list, ...prev]);
      setError(null);
      return list;
    } catch {
      setError('Could not create the list.');
      return null;
    }
  }

  async function deleteList(id: string) {
    const previousLists = lists;
    setLists((prev) => prev.filter((l) => l.id !== id));
    try {
      const res = await fetch(`/api/lists/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setLists(previousLists);
        setError('Could not delete the list.');
        return;
      }
      setError(null);
    } catch {
      setLists(previousLists);
      setError('Could not delete the list.');
    }
  }

  return { lists, loading, error, clearError: () => setError(null), createList, deleteList, refetch: fetchLists };
}
