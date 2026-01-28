/**
 * Hook: useOrganisationDetail
 * Charge les détails complets d'une organisation pour la fiche détaillée
 *
 * Inclut :
 * - Données organisation (identité, adresses, contacts)
 * - Stats (CA, commissions, nombre de commandes) via RPC existant
 * - 5 dernières commandes via linkme_orders_enriched
 *
 * @module use-organisation-detail
 * @since 2026-01-12
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export interface OrganisationDetail {
  // Identité
  id: string;
  legal_name: string;
  trade_name: string | null;
  logo_url: string | null;
  ownership_type: 'propre' | 'succursale' | 'franchise' | null;

  // Adresse de livraison
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;

  // Adresse de facturation
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_city: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;

  // Contacts
  phone: string | null;
  email: string | null;
  secondary_email: string | null;
  website: string | null;

  // Informations légales
  siren: string | null;
  siret: string | null;
  vat_number: string | null;

  // Coordonnées GPS
  latitude: number | null;
  longitude: number | null;

  // Enseigne (pour récupérer les stats)
  enseigne_id: string | null;

  // Maison mère de l'enseigne (pour affichage contacts enseigne)
  is_enseigne_parent: boolean;
}

export interface OrganisationOrder {
  id: string;
  reference: string;
  created_at: string;
  total_ht: number;
  status: string;
  commission_ht: number;
}

export interface OrganisationDetailData {
  organisation: OrganisationDetail;
  stats: {
    totalRevenueHT: number;
    totalCommissionsHT: number;
    orderCount: number;
  };
  recentOrders: OrganisationOrder[];
}

// Type de retour de la RPC get_enseigne_organisation_stats
interface RpcStatsRow {
  org_id: string;
  total_revenue_ht: number;
  total_commissions_ht: number;
  order_count: number;
}

// =====================================================================
// HOOK
// =====================================================================

/**
 * Hook pour charger les détails complets d'une organisation
 *
 * @param organisationId - ID de l'organisation
 * @returns Détails organisation, stats et commandes récentes
 */
export function useOrganisationDetail(organisationId: string | null) {
  return useQuery({
    queryKey: ['organisation-detail', organisationId],
    queryFn: async (): Promise<OrganisationDetailData | null> => {
      if (!organisationId) return null;

      const supabase = createClient();

      // 1. Récupérer les détails de l'organisation
      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .select(
          `
          id,
          legal_name,
          trade_name,
          logo_url,
          ownership_type,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_postal_code,
          shipping_country,
          billing_address_line1,
          billing_address_line2,
          billing_city,
          billing_postal_code,
          billing_country,
          phone,
          email,
          secondary_email,
          website,
          siren,
          siret,
          vat_number,
          latitude,
          longitude,
          enseigne_id,
          is_enseigne_parent
        `
        )
        .eq('id', organisationId)
        .single();

      if (orgError) {
        console.error('Error fetching organisation detail:', orgError);
        throw orgError;
      }

      if (!org) return null;

      // 2. Récupérer les stats via RPC existant (utilise enseigne_id)
      let stats = {
        totalRevenueHT: 0,
        totalCommissionsHT: 0,
        orderCount: 0,
      };

      if (org.enseigne_id) {
        const { data: statsData } = await supabase.rpc(
          'get_enseigne_organisation_stats',
          { p_enseigne_id: org.enseigne_id }
        );

        if (statsData && Array.isArray(statsData)) {
          const orgStats = (statsData as RpcStatsRow[]).find(
            row => row.org_id === organisationId
          );
          if (orgStats) {
            stats = {
              totalRevenueHT: Number(orgStats.total_revenue_ht) || 0,
              totalCommissionsHT: Number(orgStats.total_commissions_ht) || 0,
              orderCount: orgStats.order_count || 0,
            };
          }
        }
      }

      // 3. Récupérer les 5 dernières commandes via linkme_orders_enriched
      const { data: orders } = await supabase
        .from('linkme_orders_enriched')
        .select(
          `
          id,
          order_number,
          created_at,
          total_ht,
          status
        `
        )
        .eq('customer_organisation_id', organisationId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Récupérer les commissions pour ces commandes
      const orderIds = (orders ?? [])
        .map(o => o.id)
        .filter((id): id is string => id !== null && id !== undefined);
      const commissionsMap = new Map<string, number>();

      if (orderIds.length > 0) {
        const { data: commissions } = await supabase
          .from('linkme_commissions')
          .select('order_id, affiliate_commission')
          .in('order_id', orderIds);

        if (commissions) {
          commissions.forEach(c => {
            if (c.order_id) {
              commissionsMap.set(
                c.order_id,
                Number(c.affiliate_commission) || 0
              );
            }
          });
        }
      }

      const recentOrders: OrganisationOrder[] = (orders ?? []).map(order => ({
        id: order.id ?? '',
        reference:
          order.order_number ?? `CMD-${(order.id ?? '').substring(0, 8)}`,
        created_at: order.created_at ?? new Date().toISOString(),
        total_ht: Number(order.total_ht) || 0,
        status: order.status ?? 'draft',
        commission_ht: commissionsMap.get(order.id ?? '') ?? 0,
      }));

      return {
        organisation: org as OrganisationDetail,
        stats,
        recentOrders,
      };
    },
    enabled: !!organisationId,
    staleTime: 30000, // 30 seconds
  });
}

export default useOrganisationDetail;
