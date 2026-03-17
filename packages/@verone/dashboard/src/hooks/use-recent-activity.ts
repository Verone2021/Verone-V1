/**
 * 📊 Hook: Activité Récente Dashboard - Vérone
 *
 * Récupère les actions récentes d'un utilisateur pour affichage
 * dans la timeline du dashboard avec données réelles de la DB.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// Type pour les items de timeline du dashboard
export interface TimelineItem {
  id: string;
  type: 'order' | 'product' | 'stock' | 'customer' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  icon?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

// Type retourné par la fonction RPC
interface UserActivityLog {
  action: string;
  page_url: string | null;
  table_name: string | null;
  record_id: string | null;
  severity: string;
  created_at: string;
}

interface UseRecentActivityResult {
  activities: TimelineItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer l'activité récente utilisateur
 * Utilise la fonction RPC `get_user_recent_actions` de la DB
 */
function transformActivityToTimeline(log: UserActivityLog): TimelineItem {
  // Mapper les actions vers des types de timeline
  const getType = (
    action: string,
    tableName: string | null
  ): TimelineItem['type'] => {
    if (action.includes('order') || tableName === 'orders') return 'order';
    if (action.includes('product') || tableName === 'products')
      return 'product';
    if (action.includes('stock') || tableName === 'stocks') return 'stock';
    if (
      action.includes('customer') ||
      tableName === 'individual_customers' ||
      tableName === 'b2b_customers'
    )
      return 'customer';
    return 'system';
  };

  // Générer titre et description lisibles
  const getTitle = (action: string, _tableName: string | null): string => {
    // Actions spécifiques
    if (action === 'create_product') return 'Nouveau produit créé';
    if (action === 'update_product') return 'Produit modifié';
    if (action === 'delete_product') return 'Produit supprimé';
    if (action === 'create_order') return 'Nouvelle commande créée';
    if (action === 'update_order') return 'Commande mise à jour';
    if (action === 'stock_movement') return 'Mouvement de stock';
    if (action === 'page_view') return 'Page visitée';

    // Fallback: formatter action
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDescription = (activityLog: UserActivityLog): string => {
    const { action, table_name, record_id, page_url } = activityLog;

    if (action === 'page_view' && page_url) {
      const path = page_url.split('/').filter(Boolean).join(' › ');
      return `Navigation: ${path}`;
    }

    if (table_name && record_id) {
      return `${table_name} #${record_id.substring(0, 8)}`;
    }

    if (table_name) {
      return `Table: ${table_name}`;
    }

    return action.replace(/_/g, ' ');
  };

  return {
    id: `${log.created_at}-${log.action}`,
    type: getType(log.action, log.table_name),
    title: getTitle(log.action, log.table_name),
    description: getDescription(log),
    timestamp: new Date(log.created_at),
    severity: log.severity as TimelineItem['severity'],
  };
}

export function useRecentActivity(limit = 10): UseRecentActivityResult {
  const [activities, setActivities] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Récupérer l'utilisateur courant
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Appeler la fonction RPC pour récupérer les activités
      const { data, error: rpcError } = (await supabase.rpc(
        'get_user_recent_actions',
        {
          p_user_id: user.id,
          p_limit: limit,
        }
      )) as {
        data: UserActivityLog[] | null;
        error: { message: string } | null;
      };

      if (rpcError) {
        console.error('Erreur RPC get_user_recent_actions:', rpcError);
        throw rpcError;
      }

      if (!data || data.length === 0) {
        // Pas d'activité = array vide (pas une erreur)
        setActivities([]);
        return;
      }

      // Transformer les logs DB en items timeline
      const timeline = data.map(transformActivityToTimeline);
      setActivities(timeline);
    } catch (err: unknown) {
      console.error('Erreur chargement activité récente:', err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de l'activité"
      );
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities,
  };
}
