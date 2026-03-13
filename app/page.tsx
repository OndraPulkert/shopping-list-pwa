'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLists } from '@/hooks/useLists';
import type { ShoppingList } from '@/types/shopping';

export default function Home() {
  const { lists, loading, createList, deleteList } = useLists();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const list = await createList(name);
    setCreating(false);
    if (!list) return;
    setNewName('');
    router.push(`/list/${list.id}`);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">My Lists</h1>
      </header>

      <div className="mx-auto max-w-lg p-4">
        {/* New list */}
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="New list name..."
            autoFocus
            aria-label="New list name"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="rounded-lg bg-zinc-900 px-5 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Create
          </button>
        </div>

        {/* List of lists */}
        {loading ? (
          <p className="text-center text-zinc-400">Loading...</p>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">No lists yet</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Create one above to get started</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {lists.map((list) => (
              <ListItem key={list.id} list={list} onOpen={() => router.push(`/list/${list.id}`)} onDelete={() => deleteList(list.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ListItem({
  list,
  onOpen,
  onDelete,
}: {
  list: ShoppingList;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="group flex items-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <button
        onClick={onOpen}
        className="flex flex-1 flex-col gap-0.5 px-4 py-4 text-left"
      >
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{list.name}</span>
        <span className="text-sm text-zinc-400 dark:text-zinc-500">
          {list.activeCount} {list.activeCount === 1 ? 'item' : 'items'} remaining
        </span>
      </button>
      <button
        onClick={onDelete}
        aria-label={`Delete ${list.name}`}
        className="mr-3 rounded-md p-2 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
}
