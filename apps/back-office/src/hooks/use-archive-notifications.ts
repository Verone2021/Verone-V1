/**
 * Hook: use-archive-notifications
 * Gestion des notifications d'archivage affiliés pour le back-office
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export interface ArchiveNotification {
  id: string;
  organisation_id: string;
  affiliate_id: string;
  action: 'archive' | 'restore';
  status: 'pending' | 'reviewed' | 'processed';
  affiliate_note: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  // Relations jointes
  organisations?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    email: string | null;
    city: string | null;
  };
  linkme_affiliates?: {
    id: string;
    display_name: string | null;
  };
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook pour récupérer les notifications d'archivage en attente
 */
export function useArchiveNotifications() {
  return useQuery({
    queryKey: ['archive-notifications'],
    queryFn: async () => {
      const supabase = createClient();

      // Note: Table affiliate_archive_requests créée par migration
      // Les types seront générés après application de la migration
      const { data, error } = await (supabase as any)
        .from('affiliate_archive_requests')
        .select(
          `
          *,
          organisations(id, legal_name, trade_name, email, city),
          linkme_affiliates(id, display_name)
        `
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération notifications:', error);
        throw error;
      }

      return (data || []) as ArchiveNotification[];
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refresh toutes les 5 minutes
  });
}

/**
 * Hook pour compter les notifications en attente (pour badge)
 */
export function useArchiveNotificationsCount() {
  return useQuery({
    queryKey: ['archive-notifications-count'],
    queryFn: async () => {
      const supabase = createClient();

      const { count, error } = await (supabase as any)
        .from('affiliate_archive_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.error('Erreur comptage notifications:', error);
        return 0;
      }

      return count || 0;
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Hook pour marquer une notification comme traitée
 */
export function useMarkNotificationReviewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      notificationId,
      status,
      adminNote,
    }: {
      notificationId: string;
      status: 'reviewed' | 'processed';
      adminNote?: string;
    }) => {
      const supabase = createClient();

      const { error } = await (supabase as any)
        .from('affiliate_archive_requests')
        .update({
          status,
          admin_note: adminNote || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        throw new Error(error.message);
      }

      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive-notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['archive-notifications-count'],
      });
      toast.success('Notification traitée');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message,
      });
    },
  });
}
