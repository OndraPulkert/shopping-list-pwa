'use client';

import { useState, useEffect, useRef } from 'react';

export function useItemSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const q = query.trim();
    if (!q) { setSuggestions([]); return; }

    const controller = new AbortController();

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json() as { suggestions: string[] };
        setSuggestions(data.suggestions);
      } catch {
        // AbortError or network error — ignore
      }
    }, 150);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      controller.abort();
    };
  }, [query]);

  return suggestions;
}
