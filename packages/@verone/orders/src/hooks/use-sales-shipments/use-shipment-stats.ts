'use client';

import { useCallback } from 'react';

import type { ReceptionShipmentStats } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

/**
 * Sub-hook : stats dashboard expéditions
 */
export function useShipmentStats() {
  const supabase = createClient();

  const loadShipmentStats =
    useCallback(async (): Promise<ReceptionShipmentStats> => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // SOs confirmés en attente expédition
        const { count: pending } = await supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'validated');

        // SOs partiellement expédiés
        const { count: partial } = await supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'partially_shipped');

        // SOs complètement expédiés aujourd'hui
        const { count: completedToday } = await supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'shipped')
          .gte('shipped_at', today.toISOString());

        // SOs en retard (expected_delivery_date < today)
        const { count: overdue } = await supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['validated', 'partially_shipped'])
          .not('expected_delivery_date', 'is', null)
          .lt('expected_delivery_date', today.toISOString().split('T')[0]);

        // SOs urgents (expected_delivery_date < today + 3 jours)
        const threeDays = new Date(today);
        threeDays.setDate(threeDays.getDate() + 3);

        const { count: urgent } = await supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['validated', 'partially_shipped'])
          .not('expected_delivery_date', 'is', null)
          .gte('expected_delivery_date', today.toISOString().split('T')[0])
          .lte('expected_delivery_date', threeDays.toISOString().split('T')[0]);

        return {
          total_pending: pending ?? 0,
          total_partial: partial ?? 0,
          total_completed_today: completedToday ?? 0,
          total_overdue: overdue ?? 0,
          total_urgent: urgent ?? 0,
        };
      } catch (err) {
        console.error('Erreur chargement stats expéditions:', err);
        return {
          total_pending: 0,
          total_partial: 0,
          total_completed_today: 0,
          total_overdue: 0,
          total_urgent: 0,
        };
      }
    }, [supabase]);

  return { loadShipmentStats };
}
