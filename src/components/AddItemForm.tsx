'use client';

import { useState, useRef, useEffect } from 'react';
import { useItemSuggestions } from '@/hooks/useItemSuggestions';
import { parseItemInput } from '@/lib/parseItemInput';
import { QUICK_QUANTITIES } from '@/lib/quantity';

interface AddItemFormProps {
  onAdd: (name: string, quantity?: string | null) => void;
}

export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [value, setValue] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = useItemSuggestions(value);
  const visibleSuggestions = showSuggestions && value.trim() && suggestions.length > 0 ? suggestions : [];
  const activeSuggestionId =
    activeSuggestion >= 0 && visibleSuggestions[activeSuggestion]
      ? `item-suggestion-${activeSuggestion}`
      : undefined;

  // Auto-focus only on non-touch devices (mobile keyboard shouldn't pop up on navigation)
  useEffect(() => {
    if (!window.matchMedia('(hover: none)').matches) {
      inputRef.current?.focus();
    }
  }, []);

  function submit(rawName?: string) {
    const raw = (rawName ?? value).trim();
    if (!raw) return;
    const { name, quantity } = parseItemInput(raw);
    onAdd(name, quantity ?? selectedQuantity);
    setValue('');
    setSelectedQuantity(null);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    // Re-focus only on non-touch
    if (!window.matchMedia('(hover: none)').matches) {
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        submit(suggestions[activeSuggestion]);
      } else {
        submit();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  }

  return (
    <div className="relative p-4">
      <div className="flex items-start gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
              setActiveSuggestion(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay so suggestion click fires first
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-label="Item name"
            aria-autocomplete="list"
            aria-controls="item-suggestions"
            aria-expanded={visibleSuggestions.length > 0}
            aria-activedescendant={activeSuggestionId}
            placeholder="Add item… (e.g. milk x3)"
            className="w-full rounded-lg border border-zinc-400 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />

          {visibleSuggestions.length > 0 && (
            <ul
              id="item-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            >
              {visibleSuggestions.map((s, i) => (
                <li
                  id={`item-suggestion-${i}`}
                  key={s}
                  role="option"
                  aria-selected={i === activeSuggestion}
                  onMouseDown={() => submit(s)}
                  className={`cursor-pointer px-4 py-2.5 text-base ${
                    i === activeSuggestion
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={() => submit()}
          disabled={!value.trim()}
          className="flex-shrink-0 rounded-lg bg-indigo-600 px-5 py-3 text-base font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Add
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_QUANTITIES.map((quantity) => {
          const selected = selectedQuantity === quantity;
          return (
            <button
              key={quantity}
              type="button"
              onClick={() => setSelectedQuantity(selected ? null : quantity)}
              aria-pressed={selected}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                selected
                  ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300'
              }`}
            >
              {quantity}
            </button>
          );
        })}
      </div>
    </div>
  );
}
