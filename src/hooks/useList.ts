'use client';

import { useState, useEffect } from 'react';

export function useList(id: string) {
  const [name, setName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/lists/${id}`)
      .then((res) => {
        if (res.status === 404) { setNotFound(true); return null; }
        if (!res.ok) return null;
        return res.json() as Promise<{ list: { name: string } }>;
      })
      .then((data) => { if (data) setName(data.list.name); })
      .catch(() => {});
  }, [id]);

  async function rename(newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === name) return;
    const prev = name;
    setName(trimmed); // optimistic
    try {
      await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
    } catch {
      setName(prev); // rollback to captured pre-update value
    }
  }

  return { name, notFound, rename };
}
