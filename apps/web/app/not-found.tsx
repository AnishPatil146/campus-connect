'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@campus-connect/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-extrabold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Page Not Found</h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6 text-sm">
        The requested page does not exist or has been moved. Return to Campus Connect home or login.
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <Button className="bg-blue-600 hover:bg-blue-700">Go Home</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline">Sign In</Button>
        </Link>
      </div>
    </div>
  );
}