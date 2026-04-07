/**
 * Hook: Notifications Dashboard - Verone
 *
 * Agrege les notifications et alertes critiques pour affichage
 * dans le dashboard : stocks bas, commandes urgentes, erreurs systeme.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import {
  fetchActivityNotifs,
  fetchOrgNotifs,
  fetchSampleNotifs,
} from './dashboard-notifications.fetchers-activity';
import {
  fetchErrorLogNotifs,
  fetchLowStockNotifs,
  fetchUrgentOrderNotifs,
} from './dashboard-notifications.fetchers-orders';
import type {
  DashboardNotification,
  UseDashboardNotificationsResult,
} from './use-dashboard-notifications.types';

export type {
  DashboardNotification,
  NotificationSeverity,
  NotificationType,
  UseDashboardNotificationsResult,
} from './use-dashboard-notifications.types';

const STORAGE_KEY = 'verone-dashboard-notifications-read';

function applyReadState(
  notifications: DashboardNotification[]
): DashboardNotification[] {
  if (typeof window === 'undefined') return notifications;
  const existingReads = localStorage.getItem(STORAGE_KEY);
  const readNotifications: Record<string, string> = existingReads
    ? (JSON.parse(existingReads) as Record<string, string>)
    : {};

  return notifications.map(notif => {
    if (readNotifications[notif.id]) {
      return {
        ...notif,
        isRead: true,
        read_at: new Date(readNotifications[notif.id]),
      };
    }
    return notif;
  });
}

/**
 * Hook pour recuperer les notifications dashboard
 * Analyse plusieurs sources : stocks, commandes, logs activite
 */
export function useDashboardNotifications(
  limit = 10
): UseDashboardNotificationsResult {
  const [notifications, setNotifications] = useState<DashboardNotification[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const oneDayAgo = new Date(now);
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      const twoHoursAgo = new Date(now);
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [
        lowStockNotifs,
        urgentOrderNotifs,
        errorLogNotifs,
        activityNotifs,
        orgNotifs,
        sampleNotifs,
      ] = await Promise.all([
        fetchLowStockNotifs(supabase),
        fetchUrgentOrderNotifs(supabase, threeDaysAgo),
        fetchErrorLogNotifs(supabase, oneDayAgo),
        fetchActivityNotifs(supabase, twoHoursAgo),
        fetchOrgNotifs(supabase, oneDayAgo),
        fetchSampleNotifs(supabase, sevenDaysAgo, twoHoursAgo),
      ]);

      const allNotifications = [
        ...lowStockNotifs,
        ...urgentOrderNotifs,
        ...errorLogNotifs,
        ...activityNotifs,
        ...orgNotifs,
        ...sampleNotifs,
      ];

      allNotifications.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      const limited = applyReadState(allNotifications.slice(0, limit));
      setNotifications(limited);
    } catch (err: unknown) {
      console.error('Erreur chargement notifications:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des notifications'
      );
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const markAsRead = async (id: string) => {
    try {
      const now = new Date();

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true, read_at: now } : notif
        )
      );

      if (typeof window !== 'undefined') {
        const existingReads = localStorage.getItem(STORAGE_KEY);
        const readNotifications: Record<string, string> = existingReads
          ? (JSON.parse(existingReads) as Record<string, string>)
          : {};
        readNotifications[id] = now.toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(readNotifications));
      }
    } catch (err) {
      console.error('Erreur markAsRead:', err);
    }
  };

  useEffect(() => {
    void fetchNotifications();

    const interval = setInterval(
      () => {
        void fetchNotifications();
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
  };
}
