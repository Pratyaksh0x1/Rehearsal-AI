'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-bg text-text-primary flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-14 h-14 rounded-full bg-danger-subtle text-danger flex items-center justify-center mx-auto shadow-sm">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-sm uppercase tracking-widest text-danger font-bold">Unexpected Exception</p>
        <h1 className="text-h2">Something Went Wrong</h1>
        <p className="text-text-muted text-body max-w-md mx-auto">
          We encountered an issue while loading this page. You can retry or head back to your dashboard.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" size="md" onClick={() => reset()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="secondary" size="md" className="gap-2">
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
      </div>
    </main>
  );
}

