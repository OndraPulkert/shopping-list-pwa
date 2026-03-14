'use client';

import Link from 'next/link';
import { use, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useList } from '@/hooks/useList';
import { useListItems } from '@/hooks/useListItems';
import { AddItemForm } from '@/components/AddItemForm';
import { ErrorBanner } from '@/components/ErrorBanner';
import { ShoppingList } from '@/components/ShoppingList';

export default function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { name, notFound: listNotFound, error: listError, clearError: clearListError, rename } = useList(id);
  const {
    items, loading, notFound: itemsNotFound, error: itemsError, clearError: clearItemsError,
    addItem, toggleItem, deleteItem, editItem, reorderItems,
    clearBought, undoClearBought, canUndo,
    resetList,
  } = useListItems(id);

  const [editingName, setEditingName] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const error = listError ?? itemsError;

  // Redirect if list doesn't exist
  useEffect(() => {
    if (listNotFound || itemsNotFound) router.replace('/');
  }, [listNotFound, itemsNotFound, router]);

  // Focus name input when entering edit mode
  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  function startRename() {
    setEditValue(name ?? '');
    setEditingName(true);
  }

  function commitRename() {
    setEditingName(false);
    rename(editValue);
  }

  function handleResetClick() {
    if (!confirmReset) { setConfirmReset(true); return; }
    setConfirmReset(false);
    resetList();
  }

  function dismissError() {
    clearListError();
    clearItemsError();
  }

  const activeCount = items.filter((i) => !i.bought).length;
  const hasBought = items.some((i) => i.bought);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            aria-label="Back to lists"
            className="flex-shrink-0 rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Inline rename — tap title to edit */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {editingName ? (
              <input
                ref={nameInputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                className="flex-1 rounded-md border border-zinc-400 bg-white px-2 py-1 text-lg font-semibold text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
            ) : (
              <button
                onClick={startRename}
                title="Tap to rename"
                className="truncate text-left text-lg font-semibold text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                {name ?? '…'}
              </button>
            )}
            {activeCount > 0 && !editingName && (
              <span className="flex-shrink-0 text-sm text-zinc-400 dark:text-zinc-500">
                {activeCount} {activeCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>

          {/* Reset — requires double-tap confirmation */}
          {hasBought && !editingName && (
            <button
              onClick={handleResetClick}
              onBlur={() => setConfirmReset(false)}
              title={confirmReset ? 'Tap again to confirm reset' : 'Reset — mark all as not bought'}
              className={`flex-shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                confirmReset
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              {confirmReset ? 'Confirm reset' : 'Reset'}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        {error && <ErrorBanner message={error} onDismiss={dismissError} />}

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-zinc-400">Loading…</span>
          </div>
        ) : (
          <>
            <AddItemForm onAdd={addItem} />
            <ShoppingList
              items={items}
              onToggle={toggleItem}
              onDelete={deleteItem}
              onEdit={editItem}
              onReorder={reorderItems}
              onClearBought={clearBought}
              onUndoClear={undoClearBought}
              canUndo={canUndo}
            />
          </>
        )}
      </div>
    </div>
  );
}
