'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-6xl font-extrabold text-rose-500 mb-4">500</h1>
        <h2 className="text-2xl font-bold mb-2">Internal Application Error</h2>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          An unexpected server error occurred. Please try again or return home.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 rounded-xl bg-blue-600 font-bold hover:bg-blue-500 text-sm transition-all"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}