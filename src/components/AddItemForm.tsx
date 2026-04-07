'use client';

import { useState, useRef, useEffect } from 'react';
import { useItemSuggestions } from '@/hooks/useItemSuggestions';
import { parseItemInput } from '@/lib/parseItemInput';
import { QUICK_QUANTITIES } from '@/lib/quantity';

// Web Speech API types — not in all TS libs
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface SpeechRecognitionErrorEvent {
  error: string;
}
interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function getSpeechCtor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionInstance) | null;
}

function createRecognition(): SpeechRecognitionInstance | null {
  const Ctor = getSpeechCtor();
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = 'cs-CZ';
  r.interimResults = false;
  return r;
}

interface AddItemFormProps {
  onAdd: (name: string, quantity?: string | null) => void;
  existingNames?: string[];
}

export function AddItemForm({ onAdd, existingNames = [] }: AddItemFormProps) {
  const [value, setValue] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [frequentItems, setFrequentItems] = useState<string[]>([]);
  const suggestions = useItemSuggestions(value);
  const existingLower = existingNames.map((n) => n.toLowerCase());
  const frequentChips = frequentItems.filter((name) => !existingLower.includes(name.toLowerCase()));
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

  // Fetch most frequently used items on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/suggestions', { signal: controller.signal })
      .then((res) => res.ok ? res.json() : { suggestions: [] })
      .then(({ suggestions }) => setFrequentItems(suggestions))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const speechSupported = !!getSpeechCtor();

  // Stop recognition on unmount (prevents mic staying active after navigation)
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = createRecognition();
    if (!recognition) return;
    recognition.onresult = (e) => {
      if (!e.results[0]?.[0]) return;
      const transcript = e.results[0][0].transcript;
      // Speech returns "mléko pivo chleba" — split each word as a separate item
      const items = transcript.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
      for (const item of items) {
        const { name, quantity } = parseItemInput(item);
        if (name) onAdd(name, quantity ?? selectedQuantity);
      }
      setSelectedQuantity(null);
      recognition.stop(); // explicitly stop mic — iOS Safari doesn't always auto-stop
    };
    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error === 'not-allowed') alert('Microphone access denied. Check browser permissions.');
    };
    recognition.onend = () => setIsListening(false);
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      // Already running or not allowed
    }
  }

  function submit(rawName?: string) {
    const raw = (rawName ?? value).trim();
    if (!raw) return;
    // Support comma-separated items: "mléko, chleba x2, máslo"
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const { name, quantity } = parseItemInput(part);
      onAdd(name, quantity ?? selectedQuantity);
    }
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
            className="w-full rounded-lg border border-zinc-400 bg-white py-3 pl-4 pr-9 text-base text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          {value && (
            <button
              type="button"
              onClick={() => { setValue(''); setActiveSuggestion(-1); inputRef.current?.focus(); }}
              aria-label="Clear input"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

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

        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? 'Stop listening' : 'Voice input'}
            className={`flex-shrink-0 rounded-lg px-3 py-3 transition-colors ${
              isListening
                ? 'animate-pulse bg-red-500 text-white'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}

        <button
          onClick={() => submit()}
          disabled={!value.trim()}
          className="flex-shrink-0 rounded-lg bg-indigo-600 px-5 py-3 text-base font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Add
        </button>
      </div>

      {frequentChips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {frequentChips.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => submit(name)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
            >
              + {name}
            </button>
          ))}
        </div>
      )}

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
