'use client';

import React, { useEffect, useRef } from 'react';
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
  const { user, isLoading, isProfileLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Once the page has been shown, never swap it back to the spinner (that would unmount it and
  // wipe its state, e.g. when the tab regains focus and the profile re-syncs in the background).
  const hasShownChildrenRef = useRef(false);
  if (!isLoading && !isProfileLoading && user) hasShownChildrenRef.current = true;

  useEffect(() => {
    if (!isLoading && !isProfileLoading && !user) {
      const qs = searchParams?.toString();
      const currentPath = `${pathname}${qs ? `?${qs}` : ''}`;
      const safeNext =
        currentPath.startsWith('/') && !currentPath.startsWith('//')
          ? encodeURIComponent(currentPath)
          : '';

      const redirectUrl = safeNext ? `/?next=${safeNext}` : '/';
      router.replace(redirectUrl);
    }
  }, [user, isLoading, isProfileLoading, router, pathname, searchParams]);

  if (!user || (!hasShownChildrenRef.current && (isLoading || isProfileLoading))) {
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
