import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { Analytics } from '@vercel/analytics/react';
import React, { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Rehearsal AI — Master Your Coding Interviews with Voice AI',
  description:
    'Practice technical, HR, and resume-review interviews with specialized AI agents, real-time voice feedback, and PUBG-style rank progression.',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('rehearsal-theme');
                  var theme = (stored === 'dark' || stored === 'light')
                    ? stored
                    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
      <body className="bg-bg text-text-primary min-h-screen flex flex-col selection:bg-accent-subtle selection:text-accent">
        <AuthProvider>
          <Suspense fallback={null}>
            <PostHogProvider>
              <ThemeProvider>
                {children}
                <Analytics />
              </ThemeProvider>
            </PostHogProvider>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
