'use client';

import { useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { DatabaseNotification, NotificationsState } from './types';

type SetState = React.Dispatch<React.SetStateAction<NotificationsState>>;

export function useNotificationRealtime(
  loadNotifications: () => Promise<void>,
  setState: SetState
) {
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscriptions = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) {
        setState(prev => ({
          ...prev,
          notifications: [],
          unreadCount: 0,
          loading: false,
        }));
        return;
      }

      void loadNotifications().catch((err: unknown) => {
        console.error('[useDatabaseNotifications] Initial fetch error:', err);
      });

      channel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          payload => {
            const newNotification = payload.new as DatabaseNotification;
            setState(prev => ({
              ...prev,
              notifications: [newNotification, ...prev.notifications],
              unreadCount: newNotification.read
                ? prev.unreadCount
                : prev.unreadCount + 1,
            }));
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications' },
          payload => {
            const updatedNotification = payload.new as DatabaseNotification;
            setState(prev => {
              const oldNotification = prev.notifications.find(
                n => n.id === updatedNotification.id
              );
              const unreadDelta =
                oldNotification &&
                !oldNotification.read &&
                updatedNotification.read
                  ? -1
                  : 0;

              return {
                ...prev,
                notifications: prev.notifications.map(n =>
                  n.id === updatedNotification.id ? updatedNotification : n
                ),
                unreadCount: Math.max(0, prev.unreadCount + unreadDelta),
              };
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'notifications' },
          payload => {
            const deletedId = payload.old.id as string;
            setState(prev => {
              const deletedNotification = prev.notifications.find(
                n => n.id === deletedId
              );
              const wasUnread =
                deletedNotification && !deletedNotification.read;

              return {
                ...prev,
                notifications: prev.notifications.filter(
                  n => n.id !== deletedId
                ),
                unreadCount: wasUnread
                  ? Math.max(0, prev.unreadCount - 1)
                  : prev.unreadCount,
              };
            });
          }
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') {
            console.warn(
              '[useDatabaseNotifications] Realtime subscription failed'
            );
          }
        });
    };

    void setupSubscriptions().catch((err: unknown) => {
      console.error('[useDatabaseNotifications] Setup error:', err);
    });

    return () => {
      isMounted = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadNotifications, setState, supabase]);
}
