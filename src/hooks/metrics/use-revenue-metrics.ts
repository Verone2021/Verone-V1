/**
 * Hook pour les métriques de revenus
 * Utilise vraies données des tables sales_orders pour calculer les revenus
 */

'use client';

import { createClient } from '@/lib/supabase/client';

export interface RevenueMetrics {
  today: number;
  month: number;
  year: number;
  trend: number;
  averageOrderValue: number;
}

export function useRevenueMetrics() {
  const supabase = createClient();

  const fetch = async (): Promise<RevenueMetrics> => {
    try {
      const now = new Date();

      // Dates pour aujourd'hui
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

      // Dates pour ce mois
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Dates pour cette année
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

      // Dates pour le mois précédent (pour la tendance)
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Récupérer les revenus d'aujourd'hui (commandes confirmées et livrées)
      const { data: todayOrders, error: todayError } = await supabase
        .from('sales_orders')
        .select('total_ht')
        .in('status', ['confirmed', 'partially_shipped', 'shipped', 'delivered'])
        .gte('created_at', startOfToday.toISOString())
        .lt('created_at', endOfToday.toISOString());

      if (todayError) throw todayError;

      // Récupérer les revenus du mois
      const { data: monthOrders, error: monthError } = await supabase
        .from('sales_orders')
        .select('total_ht')
        .in('status', ['confirmed', 'partially_shipped', 'shipped', 'delivered'])
        .gte('created_at', startOfMonth.toISOString())
        .lt('created_at', endOfMonth.toISOString());

      if (monthError) throw monthError;

      // Récupérer les revenus de l'année
      const { data: yearOrders, error: yearError } = await supabase
        .from('sales_orders')
        .select('total_ht')
        .in('status', ['confirmed', 'partially_shipped', 'shipped', 'delivered'])
        .gte('created_at', startOfYear.toISOString())
        .lt('created_at', endOfYear.toISOString());

      if (yearError) throw yearError;

      // Récupérer les revenus du mois précédent (pour la tendance)
      const { data: previousMonthOrders, error: previousMonthError } = await supabase
        .from('sales_orders')
        .select('total_ht')
        .in('status', ['confirmed', 'partially_shipped', 'shipped', 'delivered'])
        .gte('created_at', startOfPreviousMonth.toISOString())
        .lt('created_at', endOfPreviousMonth.toISOString());

      if (previousMonthError) throw previousMonthError;

      // Calculer les totaux (les montants sont déjà en euros dans la DB)
      const today = (todayOrders || []).reduce((sum, order) => sum + parseFloat(order.total_ht || 0), 0);
      const month = (monthOrders || []).reduce((sum, order) => sum + parseFloat(order.total_ht || 0), 0);
      const year = (yearOrders || []).reduce((sum, order) => sum + parseFloat(order.total_ht || 0), 0);
      const previousMonth = (previousMonthOrders || []).reduce((sum, order) => sum + parseFloat(order.total_ht || 0), 0);

      // Calculer la tendance mensuelle
      let trend = 0;
      if (previousMonth > 0) {
        trend = ((month - previousMonth) / previousMonth) * 100;
      } else if (month > 0) {
        trend = 100; // Si pas de revenus le mois précédent, 100% d'augmentation
      }

      // Calculer la valeur moyenne des commandes (sur le mois)
      const averageOrderValue = monthOrders && monthOrders.length > 0
        ? month / monthOrders.length
        : 0;

      return {
        today: Math.round(today * 100) / 100, // Arrondir à 2 décimales
        month: Math.round(month * 100) / 100,
        year: Math.round(year * 100) / 100,
        trend: Math.round(trend * 10) / 10, // Arrondir à 1 décimale
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      };

    } catch (error: any) {
      console.error('Erreur lors de la récupération des métriques de revenus:', error?.message || 'Erreur inconnue');

      // Retourner des valeurs vides en cas d'erreur
      return {
        today: 0,
        month: 0,
        year: 0,
        trend: 0,
        averageOrderValue: 0,
      };
    }
  };

  return { fetch };
}