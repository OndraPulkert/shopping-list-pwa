'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ShoppingItem } from '@/types/shopping';

// Only split active vs bought — preserve existing order within each group.
// Server returns items already sorted by sort_order; this must not override it.
function sortItems(items: ShoppingItem[]): ShoppingItem[] {
  return [...items].sort((a, b) => {
    if (a.bought !== b.bought) return a.bought ? 1 : -1;
    return 0;
  });
}

export function useListItems(listId: string) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [clearedItems, setClearedItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pause refetch while mutations are in-flight to prevent optimistic state being overwritten

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/lists/${listId}/items`);
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (!res.ok) {
        setError('Could not load items.');
        return;
      }
      const { items } = await res.json() as { items: ShoppingItem[] };
      setItems(sortItems(items));
      setError(null);
      setLoading(false);
    } catch {
      setError('Could not load items.');
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Auto-expire undo window after 5 seconds
  useEffect(() => {
    if (clearedItems.length === 0) return;
    const timer = setTimeout(() => setClearedItems([]), 5000);
    return () => clearTimeout(timer);
  }, [clearedItems]);

  async function addItem(name: string, quantity?: string | null) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const optimisticId = crypto.randomUUID();
    const optimistic: ShoppingItem = {
      id: optimisticId, listId, name: trimmed,
      quantity: quantity ?? null,
      bought: false, createdAt: Date.now(), boughtAt: null,
    };
    setItems((prev) => sortItems([...prev, optimistic]));
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, quantity: quantity ?? null, id: optimisticId }),
      });
      if (!res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== optimisticId));
        setError('Could not add the item.');
        return;
      }
      setError(null);
    } catch {
      setItems((prev) => prev.filter((item) => item.id !== optimisticId));
      setError('Could not add the item.');
    } finally {
    }
  }

  async function toggleItem(id: string) {
    const prev = items.find((item) => item.id === id);
    setItems((cur) =>
      sortItems(cur.map((item) =>
        item.id === id
          ? { ...item, bought: !item.bought, boughtAt: !item.bought ? Date.now() : null }
          : item
      ))
    );
    try {
      const res = await fetch(`/api/lists/${listId}/items/${id}`, { method: 'PATCH' });
      if (!res.ok) {
        if (prev) setItems((cur) => sortItems(cur.map((item) => item.id === id ? prev : item)));
        setError('Could not update the item.');
        return;
      }
      setError(null);
    } catch {
      if (prev) setItems((cur) => sortItems(cur.map((item) => item.id === id ? prev : item)));
      setError('Could not update the item.');
    } finally {
    }
  }

  async function deleteItem(id: string) {
    const prev = items.find((item) => item.id === id);
    setItems((cur) => cur.filter((item) => item.id !== id));
    try {
      const res = await fetch(`/api/lists/${listId}/items/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        if (prev) setItems((cur) => sortItems([...cur, prev]));
        setError('Could not delete the item.');
        return;
      }
      setError(null);
    } catch {
      if (prev) setItems((cur) => sortItems([...cur, prev]));
      setError('Could not delete the item.');
    } finally {
    }
  }

  async function clearBought() {
    const bought = items.filter((item) => item.bought);
    if (bought.length === 0) return;
    setItems((prev) => prev.filter((item) => !item.bought));
    setClearedItems(bought); // offer undo immediately, regardless of network outcome
    let needsRefetch = false;
    try {
      for (const item of bought) {
        const res = await fetch(`/api/lists/${listId}/items/${item.id}`, { method: 'DELETE' });
        if (!res.ok) {
          setClearedItems([]);
          setError('Could not clear bought items.');
          needsRefetch = true;
          return;
        }
      }
      setError(null);
    } catch {
      setClearedItems([]);
      setError('Could not clear bought items.');
      needsRefetch = true;
    } finally {
    }
    if (needsRefetch) fetchItems();
  }

  async function undoClearBought() {
    if (clearedItems.length === 0) return;
    const restored = clearedItems.map((item) => ({ ...item, bought: false, boughtAt: null }));
    const snapshot = clearedItems;
    setItems((prev) => sortItems([...prev, ...restored]));
    setClearedItems([]);
    let needsRefetch = false;
    try {
      const responses = await Promise.all(
        restored.map((item) =>
          fetch(`/api/lists/${listId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: item.name, quantity: item.quantity, id: item.id }),
          })
        )
      );
      if (responses.some((res) => !res.ok)) {
        throw new Error('restore failed');
      }
      setError(null);
    } catch {
      // Re-sync after partial failure because some items may already exist on the server.
      setClearedItems(snapshot);
      setError('Could not restore cleared items.');
      needsRefetch = true;
    } finally {
    }
    if (needsRefetch) fetchItems();
  }

  async function editItem(id: string, name: string, quantity: string | null) {
    const prev = items.find((item) => item.id === id);
    setItems((cur) => sortItems(cur.map((item) =>
      item.id === id ? { ...item, name, quantity } : item
    )));
    try {
      const res = await fetch(`/api/lists/${listId}/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity }),
      });
      if (!res.ok) {
        if (prev) setItems((cur) => sortItems(cur.map((item) => item.id === id ? prev : item)));
        setError('Could not save item changes.');
        return;
      }
      setError(null);
    } catch {
      if (prev) setItems((cur) => sortItems(cur.map((item) => item.id === id ? prev : item)));
      setError('Could not save item changes.');
    } finally {
    }
  }

  async function reorderItems(activeIds: string[]) {
    // Guard: all ids must exist in current active items
    const active = items.filter((i) => !i.bought);
    if (activeIds.some((id) => !active.find((i) => i.id === id))) return;

    // Capture snapshot inside setItems to get the latest state, not stale closure value
    let snapshot: ShoppingItem[] = [];
    setItems((prev) => {
      snapshot = prev;
      const bought = prev.filter((i) => i.bought);
      const reordered = activeIds
        .map((id) => prev.find((i) => i.id === id))
        .filter(Boolean) as ShoppingItem[];
      return [...reordered, ...bought];
    });
    try {
      const res = await fetch(`/api/lists/${listId}/items/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: activeIds }),
      });
      if (!res.ok) {
        setItems(snapshot);
        setError('Could not reorder items.');
        return;
      }
      setError(null);
    } catch {
      setItems(snapshot);
      setError('Could not reorder items.');
    } finally {
    }
  }

  async function resetList() {
    const previousItems = items;
    setItems((prev) => sortItems(prev.map((item) => ({ ...item, bought: false, boughtAt: null }))));
    try {
      const res = await fetch(`/api/lists/${listId}/reset`, { method: 'POST' });
      if (!res.ok) {
        setItems(previousItems);
        setError('Could not reset the list.');
        return;
      }
      setError(null);
    } catch {
      setItems(previousItems);
      setError('Could not reset the list.');
    } finally {
    }
  }

  return {
    items, loading, notFound, error, clearError: () => setError(null),
    addItem, toggleItem, deleteItem, editItem, reorderItems,
    clearBought, undoClearBought, canUndo: clearedItems.length > 0,
    resetList,
  };
}
