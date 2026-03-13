export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 text-center">
      <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">Your list is empty</p>
      <p className="text-sm text-zinc-400 dark:text-zinc-500">Add something above to get started</p>
    </div>
  );
}
