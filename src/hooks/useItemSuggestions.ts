'use client';

import { useState, useEffect, useRef } from 'react';

export function useItemSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const q = query.trim();
    if (!q) { setSuggestions([]); return; }

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json() as { suggestions: string[] };
        setSuggestions(data.suggestions);
      } catch {
        // ignore network errors
      }
    }, 150);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  return suggestions;
}
