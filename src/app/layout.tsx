import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AnimatedCursor } from '@/components/theme/AnimatedCursor';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui';
import React, { Suspense } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Rehearsal AI — Master Your Coding Interviews with Voice AI',
    template: '%s | Rehearsal AI',
  },
  description:
    'Practice technical, HR, and resume-review interviews with specialized AI agents, real-time voice feedback, and PUBG-style rank progression.',
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Rehearsal AI — Master Your Coding Interviews with Voice AI',
    description: 'Realistic voice-driven coding, HR, and resume interviews with AI engineers.',
    siteName: 'Rehearsal AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rehearsal AI',
    description: 'Realistic voice-driven coding, HR, and resume interviews with AI engineers.',
  },
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('rehearsal-theme');
                  var theme = (stored === 'light') ? 'light' : 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-bg text-text-primary min-h-screen flex flex-col font-sans selection:bg-accent-subtle selection:text-accent">
        <AuthProvider>
          <Suspense fallback={null}>
            <PostHogProvider>
              <ThemeProvider>
                {children}
                <AnimatedCursor />
                <Toaster />
                <Analytics />
              </ThemeProvider>
            </PostHogProvider>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
