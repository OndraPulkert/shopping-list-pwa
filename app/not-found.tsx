import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
      <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">Page not found</p>
      <Link href="/" className="text-sm text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-200">
        Back to lists
      </Link>
    </div>
  );
}
