import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg text-text-primary flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="space-y-2">
        <p className="font-mono text-sm uppercase tracking-widest text-accent font-bold">404 Error</p>
        <h1 className="text-display">Page Not Found</h1>
        <p className="text-text-muted text-body max-w-md mx-auto">
          The interview room or resource you are looking for does not exist or has been relocated.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button variant="primary" size="md" className="gap-2">
            <Home className="w-4 h-4" />
            Return to Home
          </Button>
        </Link>
        <Link href="/interview">
          <Button variant="secondary" size="md" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Interview Rounds
          </Button>
        </Link>
      </div>
    </main>
  );
}

