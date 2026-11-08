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
                  if (stored === 'dark' || stored === 'light') {
                    document.documentElement.setAttribute('data-theme', stored);
                  } else {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                  }
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
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
