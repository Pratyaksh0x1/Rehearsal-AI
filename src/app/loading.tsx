import React from 'react';
import { Skeleton } from '@/components/ui';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-bg text-text-primary p-6 md:p-12 max-w-6xl mx-auto space-y-8 animate-in fade-in-50">
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

