'use client';

import { useEffect } from 'react';

import { consoleErrorTracker } from '@/lib/monitoring/console-error-tracker';

/**
 * 🔍 Console Error Tracker Provider
 *
 * Provider client-side qui initialise le tracking des erreurs console
 * Compatible MCP Playwright Browser pour récupération automatique
 */
export function ConsoleErrorTrackerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Setup tracking au montage du composant
    consoleErrorTracker.setup();
  }, []);

  return <>{children}</>;
}
