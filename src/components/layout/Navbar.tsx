'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LogOut, User as UserIcon } from 'lucide-react';
import { getRankDefinition } from '@/config/ranks';

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut, signInWithGoogle } = useAuth();

  const userRank = user?.rank || 'Bronze';
  const rankDef = getRankDefinition(userRank);

  const navLinks = [
    { label: 'Home', href: '/home' },
    { label: 'Interview', href: '/interview' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Profile', href: '/profile' },
  ];

  return (
    <header className="sticky top-3.5 z-50 w-full px-4 sm:px-6 pointer-events-none">
      <nav className="pointer-events-auto max-w-4xl mx-auto h-12 sm:h-13 rounded-full backdrop-blur-2xl bg-surface/80 dark:bg-[#0b0f19]/80 border border-white/20 dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.35)] px-3 sm:px-5 flex items-center justify-between transition-all">
        {/* Logo */}
        <Link href={user ? '/home' : '/'} className="flex items-center gap-2 group flex-shrink-0">
          <div className="relative w-7 h-7 flex-shrink-0">
            <Image
              src="/logo.svg"
              alt="Rehearsal AI"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-text-primary group-hover:text-accent transition-colors flex items-center gap-1">
            Rehearsal <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.2 rounded-full font-mono font-bold tracking-wider">AI</span>
          </span>
        </Link>

        {/* Navigation Links */}
        {user && (
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-accent/15 text-accent font-semibold shadow-sm border border-accent/25'
                      : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* User badge preview */}
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="relative w-4 h-4">
                  <Image src={rankDef.badgeUrl} alt={rankDef.displayName} fill />
                </div>
                <span className="text-xs font-medium text-text-primary max-w-[90px] truncate">
                  {user.username || user.name || 'Candidate'}
                </span>
              </Link>

              <ThemeToggle />

              <button
                type="button"
                onClick={() => signOut()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border border-white/10 bg-white/5 hover:bg-danger-subtle text-text-muted hover:text-danger transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="px-3.5 py-1 text-xs font-medium rounded-full bg-accent hover:bg-accent-hover text-accent-foreground transition-all shadow-md flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
