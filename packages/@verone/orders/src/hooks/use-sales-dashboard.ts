'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

// =============================================
// DASHBOARD VENTES - VRAIES DONNÉES (pas mock)
// Consultations (client_consultations) + Commandes (sales_orders)
// ✅ FIX: Utilise des JOINs Supabase au lieu de boucles N+1
// =============================================

interface SalesStats {
  consultationsActives: number;
  commandesEnCours: number;
  chiffreAffaireMois: number;
  tauxConversion: number;
}

interface Consultation {
  id: string;
  organisation_name: string; // Computed from organisation_id/enseigne_id
  client_email: string;
  status: string;
  created_at: string;
  tarif_maximum: number | null;
  organisation_id: string | null;
  enseigne_id: string | null;
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
  // ✅ FIX: useMemo pour éviter recréation du client
  const supabase = useMemo(() => createClient(), []);

  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // ============================================
      // QUERY 1: Consultations actives avec JOINs (1 requête au lieu de N+1)
      // ✅ FIX: Utilise les relations Supabase au lieu de boucles
      // ============================================
      const { data: rawConsultations, error: consultationsError } = await (
        supabase as any
      )
        .from('client_consultations')
        .select(
          `
            id, organisation_id, enseigne_id, client_email, status, created_at, tarif_maximum,
            organisation:organisations!organisation_id(legal_name, trade_name),
            enseigne:enseignes!enseigne_id(name)
          `
        )
        .neq('status', 'closed')
        .order('created_at', { ascending: false });

      if (consultationsError) throw consultationsError;

      // Mapper les résultats avec noms enrichis (pas de requêtes supplémentaires)
      const consultations: Consultation[] = (rawConsultations || []).map(
        (c: any) => {
          let organisationName = 'Client inconnu';
          if (c.organisation) {
            organisationName =
              c.organisation.trade_name ||
              c.organisation.legal_name ||
              'Organisation inconnue';
          } else if (c.enseigne) {
            organisationName = c.enseigne.name || 'Enseigne inconnue';
          }
          return {
            id: c.id,
            organisation_id: c.organisation_id,
            enseigne_id: c.enseigne_id,
            client_email: c.client_email,
            status: c.status,
            created_at: c.created_at,
            tarif_maximum: c.tarif_maximum,
            organisation_name: organisationName,
          };
        }
      );

      // ============================================
      // QUERY 2: Commandes en cours (sans JOIN car customer_id est polymorphique)
      // Note: customer_id peut pointer vers organisations OU individual_customers
      // ============================================
      const { data: orders, error: ordersError } = await supabase
        .from('sales_orders')
        .select(
          'id, order_number, customer_id, customer_type, status, total_ttc, created_at'
        )
        .in('status', ['validated', 'partially_shipped'])
        .order('created_at', { ascending: false })
        .limit(10); // Limiter pour le dashboard

      if (ordersError) throw ordersError;

      // ✅ FIX: Batch fetch des noms clients (2 requêtes au lieu de N)
      const orgCustomerIds = (orders || [])
        .filter((o: any) => o.customer_type === 'organization' && o.customer_id)
        .map((o: any) => o.customer_id);
      const indivCustomerIds = (orders || [])
        .filter((o: any) => o.customer_type === 'individual' && o.customer_id)
        .map((o: any) => o.customer_id);

      const [orgsResult, indivsResult] = await Promise.all([
        orgCustomerIds.length > 0
          ? supabase
              .from('organisations')
              .select('id, legal_name, trade_name')
              .in('id', orgCustomerIds)
          : { data: [] },
        indivCustomerIds.length > 0
          ? supabase
              .from('individual_customers')
              .select('id, first_name, last_name')
              .in('id', indivCustomerIds)
          : { data: [] },
      ]);

      const orgsMap = new Map(
        (orgsResult.data || []).map((o: any) => [
          o.id,
          o.trade_name || o.legal_name || 'Organisation inconnue',
        ])
      );
      const indivsMap = new Map(
        (indivsResult.data || []).map((i: any) => [
          i.id,
          `${i.first_name} ${i.last_name}`,
        ])
      );

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

      // Mapper les commandes avec noms enrichis depuis les Maps
      const enrichedOrders: SalesOrder[] = (orders || []).map((order: any) => {
        let customerName = 'Client inconnu';
        if (order.customer_type === 'organization' && order.customer_id) {
          customerName =
            orgsMap.get(order.customer_id) || 'Organisation inconnue';
        } else if (order.customer_type === 'individual' && order.customer_id) {
          customerName =
            indivsMap.get(order.customer_id) || 'Particulier inconnu';
        }
        return {
          id: order.id,
          order_number: order.order_number,
          customer_id: order.customer_id,
          customer_type: order.customer_type,
          status: order.status,
          total_ttc: order.total_ttc,
          created_at: order.created_at,
          customer_name: customerName,
        };
      });

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
        recentConsultations: consultations.slice(0, 3), // Top 3
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
