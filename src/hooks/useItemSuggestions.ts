'use client';

import { useState, useEffect, useRef } from 'react';

export function useItemSuggestions(query: string) {
  const [result, setResult] = useState<{ query: string; suggestions: string[] }>({
    query: '',
    suggestions: [],
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!trimmedQuery) return;

    const controller = new AbortController();

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json() as { suggestions: string[] };
        setResult({ query: trimmedQuery, suggestions: data.suggestions });
      } catch {
        // AbortError or network error — ignore
      }
    }, 150);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      controller.abort();
    };
  }, [trimmedQuery]);

  return result.query === trimmedQuery ? result.suggestions : [];
}
