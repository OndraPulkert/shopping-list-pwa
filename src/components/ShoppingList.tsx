'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { ShoppingItem as ShoppingItemType } from '@/types/shopping';
import { ShoppingItem } from '@/components/ShoppingItem';
import { EmptyState } from '@/components/EmptyState';

interface ShoppingListProps {
  items: ShoppingItemType[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, name: string, quantity: string | null) => void;
  onReorder: (activeIds: string[]) => void;
  onClearBought: () => void;
  onUndoClear: () => void;
  canUndo: boolean;
}

export function ShoppingList({
  items, onToggle, onDelete, onEdit, onReorder, onClearBought, onUndoClear, canUndo,
}: ShoppingListProps) {
  const activeItems = items.filter((i) => !i.bought);
  const boughtItems = items.filter((i) => i.bought);

  // Desktop: drag starts after 8px movement
  // Mobile touch: drag starts after holding 250ms (distinguishes tap from drag)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activeItems.findIndex((i) => i.id === active.id);
    const newIndex = activeItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(activeItems, oldIndex, newIndex);
    onReorder(reordered.map((i) => i.id));
  }

  if (items.length === 0 && !canUndo) return <EmptyState />;

  return (
    <>
      <div className="flex flex-col">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={activeItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul>
              {activeItems.map((item) => (
                <li key={item.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <ShoppingItem item={item} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} sortable />
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>

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
                  <ShoppingItem item={item} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

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
