'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { parseItemInput } from '@/lib/parseItemInput';
import type { ShoppingItem as ShoppingItemType } from '@/types/shopping';

interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, name: string, quantity: string | null) => void;
  sortable?: boolean;
}

export function ShoppingItem({ item, onToggle, onDelete, onEdit, sortable = false }: ShoppingItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: !sortable });

  const displayValue = item.quantity ? `${item.name} x${item.quantity}` : item.name;

  function startEdit() {
    setEditValue(displayValue);
    setIsEditing(true);
  }

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== displayValue) {
      const { name, quantity } = parseItemInput(trimmed);
      onEdit(item.id, name, quantity);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setIsEditing(false);
  }

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <div className="flex min-h-12 w-full items-center gap-2 px-4 py-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitEdit}
          aria-label="Edit item"
          className="flex-1 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-base text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); commitEdit(); }}
          className="rounded-md px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
        >
          Save
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...dragStyle, touchAction: isDragging ? 'none' : undefined }}
      className={`group flex min-h-12 w-full items-center ${item.bought ? 'opacity-50' : ''}`}
    >
      {sortable && (
        <div
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
          className="flex min-h-12 min-w-11 cursor-grab items-center justify-center text-zinc-300 active:cursor-grabbing dark:text-zinc-600"
          aria-label="Drag to reorder"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm6-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
          </svg>
        </div>
      )}
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
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className={`text-base ${item.bought ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
            {item.name}
          </span>
          {item.quantity && (
            <span className="flex-shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {item.quantity}
            </span>
          )}
        </span>
      </button>

      <button
        onClick={startEdit}
        aria-label={`Edit ${item.name}`}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-zinc-500 transition-opacity hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      <button
        onClick={() => onDelete(item.id)}
        aria-label={`Remove ${item.name}`}
        className="mr-1 flex min-h-11 min-w-11 items-center justify-center rounded-md text-zinc-400 transition-opacity hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
