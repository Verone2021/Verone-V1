/**
 * Activity Tracker Provider for LinkMe app
 * Tracks page views and user interactions for LinkMe affiliates.
 * Uses AuthContext for user state (no direct Supabase auth calls to avoid
 * deadlock with GoTrueClient initializePromise).
 */

'use client';

import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

import { useUserActivityTracker } from '@verone/notifications';

import { useAuth } from '../../contexts/AuthContext';

interface LinkmeActivityTrackerProviderProps {
  children: React.ReactNode;
}

// Paths that should not be tracked (public/auth pages)
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

export function LinkmeActivityTrackerProvider({
  children,
}: LinkmeActivityTrackerProviderProps) {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  const { user } = useAuth();

  const { trackEvent, flushEvents } = useUserActivityTracker();

  // SSR guard
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Auto page_view tracking on pathname change
  useEffect(() => {
    if (!hasMounted || !user || !pathname) return;

    // Skip public/auth paths
    const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));
    if (isPublicPath) return;

    // Skip /selections/{slug} pages for anonymous visitors (already guarded by !user above)
    // Defer tracking to avoid setState during Router render
    setTimeout(() => {
      trackEvent({
        action: 'page_view',
        new_data: {
          page_url: pathname,
          page_title: document.title,
          referrer: document.referrer,
          app_source: 'linkme',
        },
      });
    }, 0);
  }, [pathname, user, hasMounted, trackEvent]);

  // Flush events before page unload
  useEffect(() => {
    if (!hasMounted) return;

    const handleBeforeUnload = () => {
      void flushEvents().catch(error => {
        console.error('[LinkmeActivityTracker] flushEvents failed:', error);
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasMounted, flushEvents]);

  return <>{children}</>;
}
