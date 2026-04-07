'use client';

import { useState, useCallback } from 'react';

import type { ReceptionShipmentStats } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

export function usePurchaseReceptionsList() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger stats dashboard réceptions
   */
  const loadReceptionStats =
    useCallback(async (): Promise<ReceptionShipmentStats> => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // POs confirmés en attente réception
        const { count: pending } = await supabase
          .from('purchase_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'validated');

        // POs partiellement reçus
        const { count: partial } = await supabase
          .from('purchase_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'partially_received');

        // POs complètement reçus aujourd'hui
        const { count: completedToday } = await supabase
          .from('purchase_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'received')
          .gte('received_at', today.toISOString());

        // POs en retard (expected_delivery_date < today)
        const { count: overdue } = await supabase
          .from('purchase_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['validated', 'partially_received'])
          .not('expected_delivery_date', 'is', null)
          .lt('expected_delivery_date', today.toISOString().split('T')[0]);

        // POs urgents (expected_delivery_date < today + 3 jours)
        const threeDays = new Date(today);
        threeDays.setDate(threeDays.getDate() + 3);

        const { count: urgent } = await supabase
          .from('purchase_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['validated', 'partially_received'])
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
        console.error('Erreur chargement stats réceptions:', err);
        return {
          total_pending: 0,
          total_partial: 0,
          total_completed_today: 0,
          total_overdue: 0,
          total_urgent: 0,
        };
      }
    }, [supabase]);

  /**
   * Charger liste POs prêts à réception (pour page /stocks/receptions)
   */
  const loadPurchaseOrdersReadyForReception = useCallback(
    async (filters?: {
      status?: string;
      search?: string;
      urgent_only?: boolean;
      overdue_only?: boolean;
    }) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('purchase_orders')
          .select(
            `
          id,
          po_number,
          status,
          created_at,
          expected_delivery_date,
          received_at,
          organisations!left (
            id,
            legal_name,
            trade_name
          ),
          purchase_order_items (
            id,
            product_id,
            quantity,
            quantity_received,
            unit_price_ht,
            products (
              id,
              name,
              sku,
              stock_real,
              product_images!left (
                public_url,
                is_primary
              )
            )
          )
        `
          )
          // ✅ FIX 2025-11-28: Trier par date de réception (plus récente d'abord) pour l'historique
          // Pour les commandes "à recevoir", on garde le tri par date prévue
          .order('received_at', {
            ascending: false, // Plus récente en premier
            nullsFirst: true, // Les commandes non reçues (null) en premier (pour "à recevoir")
          });

        // Filtres de statut (dynamique selon page appelante)
        if (!filters?.status) {
          // Par défaut : charger commandes "à recevoir"
          query = query.in('status', ['validated', 'partially_received']);
        } else if (filters.status === 'received') {
          // Historique : charger commandes complètement reçues
          query = query.eq('status', 'received');
        } else if (filters.status === 'partially_received') {
          // Filtre sur partiellement reçues uniquement
          query = query.eq('status', 'partially_received');
        } else {
          // Autres cas : appliquer filtre tel quel
          query = query.eq(
            'status',
            filters.status as
              | 'draft'
              | 'cancelled'
              | 'received'
              | 'validated'
              | 'partially_received'
          );
        }

        if (filters?.search) {
          query = query.or(
            `po_number.ilike.%${filters.search}%,organisations.trade_name.ilike.%${filters.search}%,organisations.legal_name.ilike.%${filters.search}%`
          );
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          console.error('Erreur chargement POs:', fetchError);
          setError(fetchError.message);
          return [];
        }

        // Mapper les données pour ajouter supplier_name
        type PORow = typeof data extends Array<infer T> ? T : never;
        const mappedData = (data ?? []).map((po: PORow) => {
          const org = po.organisations as {
            trade_name: string | null;
            legal_name: string;
          } | null;
          return {
            ...po,
            supplier_name: org
              ? (org.trade_name ?? org.legal_name)
              : 'Fournisseur inconnu',
          };
        });

        return mappedData;
      } catch (err) {
        console.error('Exception chargement POs:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    loading,
    error,
    loadReceptionStats,
    loadPurchaseOrdersReadyForReception,
  };
}
