'use client';

import { useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type {
  CreateNotificationData,
  DatabaseNotification,
  NotificationsState,
} from './types';

type SetState = React.Dispatch<React.SetStateAction<NotificationsState>>;

export function useNotificationActions(setState: SetState) {
  const supabase = createClient();

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);

        if (error) throw error;

        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }));
      } catch (error) {
        console.error('Erreur marquage notification:', error);
        throw error;
      }
    },
    [supabase, setState]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error: teamError } = await supabase
        .from('notifications')
        .update({ read: true })
        .is('user_id', null)
        .eq('read', false);

      if (teamError) throw teamError;

      const { error: personalError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (personalError) throw personalError;

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
      throw error;
    }
  }, [supabase, setState]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId);

        if (error) throw error;

        setState(prev => {
          const deletedNotification = prev.notifications.find(
            n => n.id === notificationId
          );
          const wasUnread = deletedNotification && !deletedNotification.read;

          return {
            ...prev,
            notifications: prev.notifications.filter(
              n => n.id !== notificationId
            ),
            unreadCount: wasUnread
              ? Math.max(0, prev.unreadCount - 1)
              : prev.unreadCount,
          };
        });
      } catch (error) {
        console.error('Erreur suppression notification:', error);
        throw error;
      }
    },
    [supabase, setState]
  );

  const createNotification = useCallback(
    async (data: CreateNotificationData): Promise<DatabaseNotification> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const notificationData = {
          ...data,
          user_id: data.user_id ?? user.id,
        };

        const { data: newNotification, error } = await supabase
          .from('notifications')
          .insert([notificationData])
          .select(
            'id, type, severity, title, message, action_url, action_label, user_id, read, created_at, updated_at'
          )
          .single();

        if (error) throw error;

        if (newNotification.user_id === user.id) {
          setState(prev => ({
            ...prev,
            notifications: [newNotification, ...prev.notifications],
            unreadCount: prev.unreadCount + 1,
          }));
        }

        return newNotification as DatabaseNotification;
      } catch (error) {
        console.error('Erreur création notification:', error);
        throw error;
      }
    },
    [supabase, setState]
  );

  return { markAsRead, markAllAsRead, deleteNotification, createNotification };
}
