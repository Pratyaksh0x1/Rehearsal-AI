'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LogOut, User as UserIcon, Menu, X, ChevronDown, Award } from 'lucide-react';
import { getRankDefinition } from '@/config/ranks';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LanguageSelectModal } from '@/components/explainer/LanguageSelectModal';

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut, signInWithGoogle } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isExplainerModalOpen, setIsExplainerModalOpen] = useState(false);

  const userRank = user?.rank || 'Bronze';
  const rankDef = getRankDefinition(userRank);

  const navLinks = [
    { label: 'Home', href: '/home' },
    { label: 'Interview', href: '/interview' },
    { label: 'Concept Explainer', href: '/explainer', isExplainer: true },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Profile', href: '/profile' },
  ];

  return (
    <>
      {/* Skip to Main Content Link for Keyboard / Screen Reader Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-modal focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-foreground focus:rounded-md focus:shadow-md focus:font-medium text-xs"
      >
        Skip to main content
      </a>

      <header className="sticky top-3.5 z-40 w-full px-4 sm:px-6 pointer-events-none">
        <nav
          aria-label="Main Navigation"
          className="pointer-events-auto max-w-4xl mx-auto h-12 sm:h-13 rounded-full backdrop-blur-2xl bg-surface/90 border border-border shadow-sm px-3 sm:px-5 flex items-center justify-between transition-all"
        >
          {/* Logo */}
          <Link
            href={user ? '/home' : '/'}
            className="flex items-center gap-2 group flex-shrink-0 focus-ring rounded-full px-1"
          >
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
              Rehearsal <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-mono font-bold tracking-wider">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1" role="menubar">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/home' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    onClick={(e) => {
                      if (link.isExplainer) {
                        e.preventDefault();
                        setIsExplainerModalOpen(true);
                      }
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all focus-ring ${
                      isActive
                        ? 'bg-accent/15 text-accent font-semibold shadow-sm border border-accent/25'
                        : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
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
                {/* Desktop User Dropdown Menu */}
                <div className="hidden sm:block">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        aria-label="User profile and settings menu"
                        className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-border bg-surface hover:bg-surface-hover transition-colors focus-ring"
                      >
                        <div className="relative w-4 h-4 flex-shrink-0">
                          <Image src={rankDef.badgeUrl} alt={rankDef.displayName} fill className="object-contain" />
                        </div>
                        <span className="text-xs font-medium text-text-primary max-w-[90px] truncate">
                          {user.username || user.name || 'Candidate'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-text-subtle" />
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="end"
                        sideOffset={8}
                        className="z-dropdown min-w-[200px] rounded-lg border border-border bg-surface p-1.5 text-text-primary shadow-xl animate-in fade-in zoom-in-95"
                      >
                        <div className="px-2 py-1.5 border-b border-border mb-1">
                          <p className="text-xs font-semibold text-text-primary truncate">
                            {user.username || user.name || 'Candidate'}
                          </p>
                          <p className="text-[11px] text-text-subtle flex items-center gap-1 mt-0.5">
                            <Award className="w-3 h-3 text-accent" />
                            Rank: {userRank}
                          </p>
                        </div>

                        <DropdownMenu.Item asChild>
                          <Link
                            href="/profile"
                            className="flex items-center gap-2 px-2 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors cursor-pointer outline-none"
                          >
                            <UserIcon className="w-3.5 h-3.5" />
                            <span>Profile &amp; Settings</span>
                          </Link>
                        </DropdownMenu.Item>

                        <div className="px-2 py-1.5 flex items-center justify-between text-xs text-text-muted">
                          <span>Theme</span>
                          <ThemeToggle />
                        </div>

                        <DropdownMenu.Separator className="h-px bg-border my-1" />

                        <DropdownMenu.Item
                          onSelect={() => signOut()}
                          className="flex items-center gap-2 px-2 py-1.5 text-xs text-danger hover:bg-danger-subtle rounded-md transition-colors cursor-pointer outline-none"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>

                {/* Mobile Hamburger Button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle Navigation Menu"
                  aria-expanded={mobileMenuOpen}
                  className="md:hidden p-1.5 rounded-full border border-border bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors focus-ring"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="px-3.5 py-1 text-xs font-semibold rounded-full bg-accent hover:bg-accent-hover text-accent-foreground transition-all shadow-sm flex items-center gap-1.5 focus-ring"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Navigation Drawer / Sheet */}
        {user && mobileMenuOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            className="pointer-events-auto md:hidden mt-2 max-w-sm mx-auto rounded-2xl border border-border bg-surface/95 backdrop-blur-2xl p-4 shadow-xl space-y-3 animate-in fade-in zoom-in-95"
          >
            {/* User Rank Header Card */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-subtle border border-border">
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image src={rankDef.badgeUrl} alt={rankDef.displayName} fill className="object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {user.username || user.name || 'Candidate'}
                </p>
                <p className="text-[11px] text-text-subtle">Rank: {userRank}</p>
              </div>
              <ThemeToggle />
            </div>

            {/* Navigation links */}
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/home' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      if (link.isExplainer) {
                        e.preventDefault();
                        setIsExplainerModalOpen(true);
                      }
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-accent/15 text-accent font-semibold'
                        : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-danger hover:bg-danger-subtle transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Language Selection Pop-up Modal when clicking Concept Explainer */}
      <LanguageSelectModal
        isOpen={isExplainerModalOpen}
        onClose={() => setIsExplainerModalOpen(false)}
      />
    </>
  );
}
