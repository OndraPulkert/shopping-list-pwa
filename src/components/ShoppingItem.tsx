'use client';

import type { ShoppingItem as ShoppingItemType } from '@/types/shopping';

interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ShoppingItem({ item, onToggle, onDelete }: ShoppingItemProps) {
  return (
    <div className={`group flex min-h-12 w-full items-center transition-opacity ${item.bought ? 'opacity-50' : ''}`}>
      <button
        onClick={() => onToggle(item.id)}
        className="flex flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
        aria-pressed={item.bought}
      >
        <span
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            item.bought
              ? 'border-zinc-400 bg-zinc-400 dark:border-zinc-500 dark:bg-zinc-500'
              : 'border-zinc-300 dark:border-zinc-600'
          }`}
        >
          {item.bought && (
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span
            className={`text-base ${
              item.bought ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {item.name}
          </span>
          {item.quantity && (
            <span className="flex-shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {item.quantity}
            </span>
          )}
        </span>
      </button>

      {/* Delete: always visible on mobile, hover-reveal on desktop */}
      <button
        onClick={() => onDelete(item.id)}
        aria-label={`Remove ${item.name}`}
        className="mr-2 rounded-md p-2 text-zinc-300 transition-opacity hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
