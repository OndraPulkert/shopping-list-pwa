'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ShoppingItem } from '@/types/shopping';
import { MutationQueue } from '@/lib/mutation-queue';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function sortItems(items: ShoppingItem[]): ShoppingItem[] {
  return [...items].sort((a, b) => {
    if (a.bought !== b.bought) return a.bought ? 1 : -1;
    return a.createdAt - b.createdAt;
  });
}

export function useListItems(listId: string) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [clearedItems, setClearedItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Pause polling while mutations are in-flight to prevent "blink-back" race condition
  const pendingMutations = useRef(0);
  const queue = useRef(new MutationQueue());
  const isOnline = useOnlineStatus();

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
      // Network offline — keep showing last known state
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Poll every 3 seconds — keeps two devices in sync
  useEffect(() => {
    const interval = setInterval(fetchItems, 3000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  // Auto-expire undo window after 5 seconds
  useEffect(() => {
    if (clearedItems.length === 0) return;
    const timer = setTimeout(() => setClearedItems([]), 5000);
    return () => clearTimeout(timer);
  }, [clearedItems]);

  // Drain queued mutations when connectivity is restored
  useEffect(() => {
    if (!isOnline || queue.current.size === 0) return;
    pendingMutations.current++;
    queue.current.drain().then(() => {
      pendingMutations.current--;
      fetchItems(); // re-sync after replay
    });
  }, [isOnline, fetchItems]);

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
    if (!isOnline) {
      queue.current.enqueue(() =>
        fetch(`/api/lists/${listId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed, quantity: quantity ?? null, id: optimisticId }),
        }).then(() => {})
      );
      pendingMutations.current--;
      return;
    }
    try {
      await fetch(`/api/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, quantity: quantity ?? null, id: optimisticId }),
      });
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
    if (!isOnline) {
      queue.current.enqueue(() =>
        fetch(`/api/lists/${listId}/items/${id}`, { method: 'PATCH' }).then(() => {})
      );
      pendingMutations.current--;
      return;
    }
    try {
      await fetch(`/api/lists/${listId}/items/${id}`, { method: 'PATCH' });
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
    if (!isOnline) {
      queue.current.enqueue(() =>
        fetch(`/api/lists/${listId}/items/${id}`, { method: 'DELETE' }).then(() => {})
      );
      pendingMutations.current--;
      return;
    }
    try {
      await fetch(`/api/lists/${listId}/items/${id}`, { method: 'DELETE' });
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
    if (!isOnline) {
      bought.forEach((item) =>
        queue.current.enqueue(() =>
          fetch(`/api/lists/${listId}/items/${item.id}`, { method: 'DELETE' }).then(() => {})
        )
      );
      // Undo is available offline — drain will replay the DELETEs on reconnect
      setClearedItems(bought);
      return;
    }
    pendingMutations.current += bought.length;
    try {
      // Wait for all DELETEs before enabling undo — prevents INSERT OR IGNORE no-op race
      await Promise.all(
        bought.map((item) => fetch(`/api/lists/${listId}/items/${item.id}`, { method: 'DELETE' }))
      );
      setClearedItems(bought);
    } finally {
      pendingMutations.current -= bought.length;
    }
  }

  async function undoClearBought() {
    if (clearedItems.length === 0) return;
    const restored = clearedItems.map((item) => ({ ...item, bought: false, boughtAt: null }));
    setItems((prev) => sortItems([...prev, ...restored]));
    setClearedItems([]);
    if (!isOnline) {
      restored.forEach((item) =>
        queue.current.enqueue(() =>
          fetch(`/api/lists/${listId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: item.name, quantity: item.quantity, id: item.id }),
          }).then(() => {})
        )
      );
      return;
    }
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
    } finally {
      pendingMutations.current -= restored.length;
    }
  }

  async function reorderItems(activeIds: string[]) {
    // Optimistic: reorder active items, keep bought items at the end
    setItems((prev) => {
      const bought = prev.filter((i) => i.bought);
      const reordered = activeIds
        .map((id) => prev.find((i) => i.id === id))
        .filter(Boolean) as ShoppingItem[];
      return [...reordered, ...bought];
    });
    pendingMutations.current++;
    try {
      await fetch(`/api/lists/${listId}/items/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: activeIds }),
      });
    } finally {
      pendingMutations.current--;
    }
  }

  async function editItem(id: string, name: string, quantity: string | null) {
    const prev = items.find((item) => item.id === id);
    setItems((cur) => sortItems(cur.map((item) =>
      item.id === id ? { ...item, name, quantity } : item
    )));
    pendingMutations.current++;
    if (!isOnline) {
      queue.current.enqueue(() =>
        fetch(`/api/lists/${listId}/items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, quantity }),
        }).then(() => {})
      );
      pendingMutations.current--;
      return;
    }
    try {
      await fetch(`/api/lists/${listId}/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity }),
      });
    } catch {
      if (prev) setItems((cur) => sortItems(cur.map((item) => item.id === id ? prev : item)));
    } finally {
      pendingMutations.current--;
    }
  }

  async function resetList() {
    setItems((prev) => sortItems(prev.map((item) => ({ ...item, bought: false, boughtAt: null }))));
    if (!isOnline) {
      queue.current.enqueue(() =>
        fetch(`/api/lists/${listId}/reset`, { method: 'POST' }).then(() => {})
      );
      return;
    }
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
    isOnline,
  };
}
