import { useState, useCallback, useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/shared/modules/common/hooks';

// =============================================
// DASHBOARD VENTES - VRAIES DONNÉES (pas mock)
// Consultations (client_consultations) + Commandes (sales_orders)
// =============================================

interface SalesStats {
  consultationsActives: number;
  commandesEnCours: number;
  chiffreAffaireMois: number;
  tauxConversion: number;
}

interface Consultation {
  id: string;
  organisation_name: string;
  client_email: string;
  status: string;
  created_at: string;
  tarif_maximum: number | null;
}

interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_type: 'organization' | 'individual';
  customer_name?: string;
  status: string;
  total_ttc: number;
  created_at: string;
}

export interface SalesDashboardMetrics {
  stats: SalesStats;
  recentConsultations: Consultation[];
  recentOrders: SalesOrder[];
}

export function useSalesDashboard() {
  const [metrics, setMetrics] = useState<SalesDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // ============================================
      // QUERY 1: Consultations actives (status != 'closed')
      // ============================================
      const { data: consultations, error: consultationsError } = await supabase
        .from('client_consultations')
        .select(
          'id, organisation_name, client_email, status, created_at, tarif_maximum'
        )
        .neq('status', 'closed')
        .order('created_at', { ascending: false });

      if (consultationsError) throw consultationsError;

      // ============================================
      // QUERY 2: Commandes en cours (confirmed, partially_shipped)
      // ============================================
      const { data: orders, error: ordersError } = await supabase
        .from('sales_orders')
        .select(
          'id, order_number, customer_id, customer_type, status, total_ttc, created_at'
        )
        .in('status', ['confirmed', 'partially_shipped'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // ============================================
      // QUERY 3: CA du mois (SUM total_ttc des commandes du mois courant)
      // ============================================
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyOrders, error: monthlyError } = await supabase
        .from('sales_orders')
        .select('total_ttc')
        .gte('created_at', startOfMonth.toISOString());

      if (monthlyError) throw monthlyError;

      const chiffreAffaireMois = (monthlyOrders || []).reduce(
        (sum, order) => sum + (order.total_ttc || 0),
        0
      );

      // ============================================
      // Enrichissement noms clients pour commandes
      // ============================================
      const enrichedOrders: SalesOrder[] = [];
      for (const order of orders || []) {
        let customerName = 'Client inconnu';

        if (order.customer_type === 'organization' && order.customer_id) {
          const { data: org } = await supabase
            .from('organisations')
            .select('legal_name, trade_name')
            .eq('id', order.customer_id)
            .single();
          customerName =
            org?.trade_name || org?.legal_name || 'Organisation inconnue';
        } else if (order.customer_type === 'individual' && order.customer_id) {
          const { data: individual } = await supabase
            .from('individual_customers')
            .select('first_name, last_name')
            .eq('id', order.customer_id)
            .single();
          customerName = individual
            ? `${individual.first_name} ${individual.last_name}`
            : 'Particulier inconnu';
        }

        enrichedOrders.push({
          ...order,
          customer_name: customerName,
        } as any);
      }

      // ============================================
      // Calcul taux de conversion (commandes / consultations)
      // ============================================
      const totalConsultations = consultations.length;
      const totalCommandes = enrichedOrders.length;
      const tauxConversion =
        totalConsultations > 0
          ? Math.round((totalCommandes / totalConsultations) * 100)
          : 0;

      // ============================================
      // Consolidation des métriques
      // ============================================
      setMetrics({
        stats: {
          consultationsActives: totalConsultations,
          commandesEnCours: totalCommandes,
          chiffreAffaireMois,
          tauxConversion,
        },
        recentConsultations: ((consultations || []) as any).slice(0, 3), // Top 3
        recentOrders: enrichedOrders.slice(0, 3), // Top 3
      });
    } catch (err: any) {
      const errorMessage =
        err.message || 'Erreur lors du chargement du dashboard ventes';
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  // Chargement automatique au montage
  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchDashboardMetrics,
  };
}
