'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * AuthGate wraps private pages to ensure unauthenticated users
 * do not see a flash of protected UI while the session initializes.
 */
export function AuthGate({ children }: AuthGateProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !user) {
      const qs = searchParams?.toString();
      const currentPath = `${pathname}${qs ? `?${qs}` : ''}`;
      const safeNext =
        currentPath.startsWith('/') && !currentPath.startsWith('//')
          ? encodeURIComponent(currentPath)
          : '';

      const redirectUrl = safeNext ? `/?next=${safeNext}` : '/';
      router.replace(redirectUrl);
    }
  }, [user, isLoading, router, pathname, searchParams]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-bg text-text-primary flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
          <div className="h-4 w-40 bg-zinc-800 rounded-full animate-pulse mx-auto" />
          <div className="h-3 w-56 bg-zinc-800/60 rounded-full animate-pulse mx-auto" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

