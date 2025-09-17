/**
 * Hook pour les métriques de commandes
 * Utilise vraies données des tables sales_orders et purchase_orders
 */

'use client';

import { createClient } from '@/lib/supabase/client';

export interface OrderMetrics {
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  trend: number;
  recentOrders: Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
  }>;
}

export function useOrderMetrics() {
  const supabase = createClient();

  const fetch = async (): Promise<OrderMetrics> => {
    try {
      // Date de référence pour les tendances (30 jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      // Date de référence pour les tendances (60 jours pour comparaison)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const sixtyDaysAgoISO = sixtyDaysAgo.toISOString();

      // Récupérer toutes les commandes des 30 derniers jours
      const { data: recentOrders, error: recentError } = await supabase
        .from('sales_orders')
        .select(`
          id,
          order_number,
          status,
          total_ht,
          created_at,
          organisations (
            name
          )
        `)
        .gte('created_at', thirtyDaysAgoISO)
        .order('created_at', { ascending: false });

      if (recentError) throw recentError;

      // Récupérer les commandes des 30 jours précédents pour calculer la tendance
      const { data: previousOrders, error: previousError } = await supabase
        .from('sales_orders')
        .select('id, status')
        .gte('created_at', sixtyDaysAgoISO)
        .lt('created_at', thirtyDaysAgoISO);

      if (previousError) throw previousError;

      // Calculer les métriques actuelles
      const pending = recentOrders?.filter(order =>
        ['draft', 'confirmed'].includes(order.status)
      ).length || 0;

      const processing = recentOrders?.filter(order =>
        ['partially_shipped'].includes(order.status)
      ).length || 0;

      const completed = recentOrders?.filter(order =>
        ['shipped', 'delivered'].includes(order.status)
      ).length || 0;

      const cancelled = recentOrders?.filter(order =>
        order.status === 'cancelled'
      ).length || 0;

      // Calculer la tendance (comparaison avec les 30 jours précédents)
      const currentTotal = recentOrders?.length || 0;
      const previousTotal = previousOrders?.length || 0;

      let trend = 0;
      if (previousTotal > 0) {
        trend = ((currentTotal - previousTotal) / previousTotal) * 100;
      } else if (currentTotal > 0) {
        trend = 100; // Si pas de commandes avant, 100% d'augmentation
      }

      // Formater les commandes récentes
      const formattedRecentOrders = (recentOrders || [])
        .slice(0, 5) // Prendre les 5 plus récentes
        .map(order => ({
          id: order.order_number,
          customer: order.organisations?.name || 'Client inconnu',
          amount: order.total_ht / 100, // Convertir centimes en euros
          status: order.status
        }));

      return {
        pending,
        processing,
        completed,
        cancelled,
        trend: Math.round(trend * 10) / 10, // Arrondir à 1 décimale
        recentOrders: formattedRecentOrders,
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des métriques de commandes:', error);

      // Retourner des valeurs vides en cas d'erreur
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        trend: 0,
        recentOrders: [],
      };
    }
  };

  return { fetch };
}