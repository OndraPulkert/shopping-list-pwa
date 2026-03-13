'use client';

import type { ShoppingItem as ShoppingItemType } from '@/types/shopping';
import { ShoppingItem } from '@/components/ShoppingItem';
import { EmptyState } from '@/components/EmptyState';

interface ShoppingListProps {
  items: ShoppingItemType[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClearBought: () => void;
  onUndoClear: () => void;
  canUndo: boolean;
}

export function ShoppingList({ items, onToggle, onDelete, onClearBought, onUndoClear, canUndo }: ShoppingListProps) {
  if (items.length === 0 && !canUndo) return <EmptyState />;

  const activeItems = items.filter((item) => !item.bought);
  const boughtItems = items.filter((item) => item.bought);

  return (
    <>
      <div className="flex flex-col">
        <ul>
          {activeItems.map((item) => (
            <li key={item.id} className="border-b border-zinc-100 dark:border-zinc-800">
              <ShoppingItem item={item} onToggle={onToggle} onDelete={onDelete} />
            </li>
          ))}
        </ul>

        {boughtItems.length > 0 && (
          <>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                In cart ({boughtItems.length})
              </span>
              <button
                aria-label="Clear bought items"
                onClick={onClearBought}
                className="text-xs text-zinc-400 underline hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                Clear
              </button>
            </div>
            <ul>
              {boughtItems.map((item) => (
                <li key={item.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <ShoppingItem item={item} onToggle={onToggle} onDelete={onDelete} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Undo toast */}
      {canUndo && (
        <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-zinc-900 px-5 py-3 shadow-lg dark:bg-zinc-100">
          <span className="text-sm text-zinc-300 dark:text-zinc-600">Items cleared</span>
          <button
            onClick={onUndoClear}
            className="text-sm font-semibold text-white hover:text-zinc-200 dark:text-zinc-900 dark:hover:text-zinc-700"
          >
            Undo
          </button>
        </div>
      )}
    </>
  );
}
