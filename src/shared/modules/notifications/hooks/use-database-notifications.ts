'use client';

import { useState } from 'react';
import type { Database } from '@verone/types';

/**
 * TODO: Implémenter hook database notifications (Phase 2+)
 * Hook temporaire stub pour débloquer compilation TypeScript
 *
 * Module /notifications est désactivé (Phase 2+) - voir middleware.ts:24
 *
 * Fonctionnalités attendues:
 * - Fetch notifications depuis table Supabase
 * - Mark as read/unread
 * - Delete notifications
 * - Real-time subscriptions
 * - Unread count tracking
 *
 * @see docs/database/notifications.md
 * @see src/app/notifications/page.tsx
 */

// Type basé sur table Supabase notifications
export type DatabaseNotification = Database['public']['Tables']['notifications']['Row'];

export interface DatabaseNotificationsHook {
  notifications: DatabaseNotification[];
  loading: boolean;
  error: Error | null;
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook pour notifications database (Phase 2+ - STUB)
 */
export function useDatabaseNotifications(): DatabaseNotificationsHook {
  const [notifications] = useState<DatabaseNotification[]>([]);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  // TODO: Implement real Supabase queries
  return {
    notifications,
    loading,
    error,
    unreadCount: 0,
    markAsRead: async (id: string) => {
      console.warn(`useDatabaseNotifications.markAsRead not implemented: ${id}`);
    },
    markAllAsRead: async () => {
      console.warn('useDatabaseNotifications.markAllAsRead not implemented');
    },
    deleteNotification: async (id: string) => {
      console.warn(`useDatabaseNotifications.deleteNotification not implemented: ${id}`);
    },
    refetch: async () => {
      console.warn('useDatabaseNotifications.refetch not implemented');
    },
  };
}
