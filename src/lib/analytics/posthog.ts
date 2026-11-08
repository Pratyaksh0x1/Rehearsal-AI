import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window !== 'undefined') {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
      });
    }
  }
}

export function captureEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    try {
      posthog.capture(eventName, properties);
    } catch (e) {
      console.warn('[PostHog] captureEvent warning:', e);
    }
  }
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    try {
      posthog.identify(userId, properties);
    } catch (e) {
      console.warn('[PostHog] identifyUser warning:', e);
    }
  }
}

export function resetAnalytics() {
  if (typeof window !== 'undefined') {
    try {
      posthog.reset();
    } catch (e) {
      console.warn('[PostHog] reset warning:', e);
    }
  }
}

