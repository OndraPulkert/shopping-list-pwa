'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Pause refetch while mutations are in-flight to prevent optimistic state being overwritten
  const pendingMutations = useRef(0);

  const fetchItems = useCallback(async () => {
    if (pendingMutations.current > 0) return;
    try {
      const res = await fetch(`/api/lists/${listId}/items`);
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (!res.ok) return;
      const { items } = await res.json() as { items: ShoppingItem[] };
      setItems(sortItems(items));
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Refetch when the user returns to the tab/app
  useEffect(() => {
    const onFocus = () => fetchItems();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchItems]);

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
    pendingMutations.current++;
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, quantity: quantity ?? null, id: optimisticId }),
      });
      if (!res.ok) setItems((prev) => prev.filter((item) => item.id !== optimisticId));
    } catch {
      setItems((prev) => prev.filter((item) => item.id !== optimisticId));
    } finally {
      pendingMutations.current--;
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
    pendingMutations.current++;
    try {
      const res = await fetch(`/api/lists/${listId}/items/${id}`, { method: 'PATCH' });
      if (!res.ok && prev) setItems((cur) => sortItems(cur.map((item) => item.id === id ? prev : item)));
    } catch {
      if (prev) setItems((cur) => sortItems(cur.map((item) => item.id === id ? prev : item)));
    } finally {
      pendingMutations.current--;
    }
  }

  async function deleteItem(id: string) {
    const prev = items.find((item) => item.id === id);
    setItems((cur) => cur.filter((item) => item.id !== id));
    pendingMutations.current++;
    try {
      const res = await fetch(`/api/lists/${listId}/items/${id}`, { method: 'DELETE' });
      if (!res.ok && prev) setItems((cur) => sortItems([...cur, prev]));
    } catch {
      if (prev) setItems((cur) => sortItems([...cur, prev]));
    } finally {
      pendingMutations.current--;
    }
  }

  async function clearBought() {
    const bought = items.filter((item) => item.bought);
    if (bought.length === 0) return;
    setItems((prev) => prev.filter((item) => !item.bought));
    setClearedItems(bought); // offer undo immediately, regardless of network outcome
    pendingMutations.current++;
    try {
      for (const item of bought) {
        await fetch(`/api/lists/${listId}/items/${item.id}`, { method: 'DELETE' });
      }
    } catch {
      // Partial failure — undo is available, focus refetch will reconcile
    } finally {
      pendingMutations.current--;
    }
  }

  async function undoClearBought() {
    if (clearedItems.length === 0) return;
    const restored = clearedItems.map((item) => ({ ...item, bought: false, boughtAt: null }));
    const snapshot = clearedItems;
    setItems((prev) => sortItems([...prev, ...restored]));
    setClearedItems([]);
    pendingMutations.current += restored.length;
    try {
      await Promise.all(
        restored.map((item) =>
          fetch(`/api/lists/${listId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: item.name, quantity: item.quantity, id: item.id }),
          })
        )
      );
    } catch {
      // Rollback: remove optimistically added items and restore undo button
      setItems((prev) => prev.filter((item) => !restored.find((r) => r.id === item.id)));
      setClearedItems(snapshot);
    } finally {
      pendingMutations.current -= restored.length;
    }
  }

  async function editItem(id: string, name: string, quantity: string | null) {
    const prev = items.find((item) => item.id === id);
    setItems((cur) => sortItems(cur.map((item) =>
      item.id === id ? { ...item, name, quantity } : item
    )));
    pendingMutations.current++;
    try {
      const res = await fetch(`/api/lists/${listId}/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity }),
      });
      if (!res.ok && prev) setItems((cur) => sortItems(cur.map((item) => item.id === id ? prev : item)));
    } catch {
      if (prev) setItems((cur) => sortItems(cur.map((item) => item.id === id ? prev : item)));
    } finally {
      pendingMutations.current--;
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
    pendingMutations.current++;
    try {
      const res = await fetch(`/api/lists/${listId}/items/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: activeIds }),
      });
      if (!res.ok) setItems(snapshot);
    } catch {
      setItems(snapshot);
    } finally {
      pendingMutations.current--;
    }
  }

  async function resetList() {
    setItems((prev) => sortItems(prev.map((item) => ({ ...item, bought: false, boughtAt: null }))));
    pendingMutations.current++;
    try {
      await fetch(`/api/lists/${listId}/reset`, { method: 'POST' });
    } finally {
      pendingMutations.current--;
    }
  }

  return {
    items, loading, notFound,
    addItem, toggleItem, deleteItem, editItem, reorderItems,
    clearBought, undoClearBought, canUndo: clearedItems.length > 0,
    resetList,
  };
}
