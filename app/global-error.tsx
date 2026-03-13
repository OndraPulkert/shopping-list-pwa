'use client';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="cs">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <p style={{ color: '#71717a' }}>Something went wrong</p>
          <button onClick={reset} style={{ color: '#a1a1aa', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
