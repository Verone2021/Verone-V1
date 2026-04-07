'use client';

import { useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import { useNotificationActions } from './use-notification-actions';
import { useNotificationRealtime } from './use-notification-realtime';
import type {
  DatabaseNotification,
  DatabaseNotificationsHook,
  NotificationBase,
  NotificationsState,
} from './types';

export function useDatabaseNotifications(): DatabaseNotificationsHook {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
  });

  const supabase = createClient();

  const loadNotifications = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({
          ...prev,
          loading: false,
          notifications: [],
          unreadCount: 0,
        }));
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, type, severity, title, message, action_url, action_label, user_id, read, created_at, updated_at'
        )
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const { count: realUnreadCount } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .eq('read', false);

      const notifications = (data ?? []) as DatabaseNotification[];

      setState(prev => ({
        ...prev,
        notifications,
        unreadCount:
          realUnreadCount ?? notifications.filter(n => !n.read).length,
        loading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';

      if (
        errorMessage.includes('relation "notifications" does not exist') ||
        errorMessage.includes('Failed to fetch')
      ) {
        setState(prev => ({
          ...prev,
          notifications: [],
          unreadCount: 0,
          loading: false,
          error: null,
        }));
      } else {
        console.error('Erreur chargement notifications:', error);
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      }
    }
  }, [supabase]);

  const { markAsRead, markAllAsRead, deleteNotification, createNotification } =
    useNotificationActions(setState);

  const getByType = useCallback(
    (type: NotificationBase['type']) =>
      state.notifications.filter(n => n.type === type),
    [state.notifications]
  );

  const getBySeverity = useCallback(
    (severity: NotificationBase['severity']) =>
      state.notifications.filter(n => n.severity === severity),
    [state.notifications]
  );

  const getUnread = useCallback(
    () => state.notifications.filter(n => !n.read),
    [state.notifications]
  );

  useNotificationRealtime(loadNotifications, setState);

  return {
    notifications: state.notifications,
    loading: state.loading,
    error: state.error ? new Error(state.error) : null,
    unreadCount: state.unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: loadNotifications,
    createNotification,
    getByType,
    getBySeverity,
    getUnread,
    stats: {
      total: state.notifications.length,
      unread: state.unreadCount,
      urgent: state.notifications.filter(n => n.severity === 'urgent').length,
      important: state.notifications.filter(n => n.severity === 'important')
        .length,
      byType: {
        system: state.notifications.filter(n => n.type === 'system').length,
        business: state.notifications.filter(n => n.type === 'business').length,
        catalog: state.notifications.filter(n => n.type === 'catalog').length,
        operations: state.notifications.filter(n => n.type === 'operations')
          .length,
        performance: state.notifications.filter(n => n.type === 'performance')
          .length,
        maintenance: state.notifications.filter(n => n.type === 'maintenance')
          .length,
      },
    },
  };
}
