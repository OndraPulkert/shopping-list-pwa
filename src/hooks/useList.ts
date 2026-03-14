'use client';

import { useState, useEffect } from 'react';

export function useList(id: string) {
  const [name, setName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/lists/${id}`)
      .then((res) => {
        if (res.status === 404) { setNotFound(true); return null; }
        if (!res.ok) {
          setError('Could not load the list.');
          return null;
        }
        return res.json() as Promise<{ list: { name: string } }>;
      })
      .then((data) => {
        if (data) {
          setName(data.list.name);
          setError(null);
        }
      })
      .catch(() => { setError('Could not load the list.'); });
  }, [id]);

  async function rename(newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === name) return;
    const prev = name;
    setName(trimmed); // optimistic
    try {
      const res = await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        setName(prev);
        setError('Could not rename the list.');
        return;
      }
      setError(null);
    } catch {
      setName(prev); // rollback to captured pre-update value
      setError('Could not rename the list.');
    }
  }

  return { name, notFound, error, clearError: () => setError(null), rename };
}
