'use client';

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

/**
 * Distribution geographique par ville
 */
export interface CityDistribution {
  city: string;
  count: number;
  revenue: number;
}

/**
 * Organisation avec chiffre d'affaires
 */
export interface OrganisationWithRevenue {
  id: string;
  legal_name: string;
  trade_name: string | null;
  is_enseigne_parent: boolean;
  is_active: boolean | null;
  city: string | null;
  country: string | null;
  revenue: number;
  // Champs additionnels pour l'organisation mere
  siret?: string | null;
  siren?: string | null;
  billing_address_line1?: string | null;
  billing_address_line2?: string | null;
  billing_postal_code?: string | null;
  billing_city?: string | null;
}

/**
 * Statistiques completes d'une enseigne
 */
export interface EnseigneStats {
  totalOrganisations: number;
  totalRevenue: number;
  averageRevenue: number;
  citiesCount: number;
  citiesDistribution: CityDistribution[];
  organisationsWithRevenue: OrganisationWithRevenue[];
  parentOrganisation: OrganisationWithRevenue | null;
  totalOrders: number;
}

/**
 * Hook pour recuperer les statistiques d'une enseigne
 * Inclut: nombre d'organisations, CA total, CA moyen, distribution geographique,
 * nombre de commandes
 *
 * @param enseigneId - ID de l'enseigne
 * @param year - Annee de filtrage (null = toutes les annees)
 */
export function useEnseigneStats(
  enseigneId: string | null,
  year: number | null = null
) {
  const [stats, setStats] = useState<EnseigneStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    if (!enseigneId) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Recuperer les organisations de l'enseigne
      const { data: organisations, error: orgsError } = await supabase
        .from('organisations')
        .select(
          'id, legal_name, trade_name, is_enseigne_parent, is_active, city, country, logo_url, siret, siren, billing_address_line1, billing_address_line2, billing_postal_code, billing_city'
        )
        .eq('enseigne_id', enseigneId)
        .order('is_enseigne_parent', { ascending: false })
        .order('legal_name', { ascending: true });

      if (orgsError) throw orgsError;

      if (!organisations || organisations.length === 0) {
        setStats({
          totalOrganisations: 0,
          totalRevenue: 0,
          averageRevenue: 0,
          citiesCount: 0,
          citiesDistribution: [],
          organisationsWithRevenue: [],
          parentOrganisation: null,
          totalOrders: 0,
        });
        setLoading(false);
        return;
      }

      // 2. Recuperer le CA de chaque organisation (sales_orders validees)
      // La table sales_orders utilise le pattern polymorphique: customer_id + customer_type
      const orgIds = organisations.map(o => o.id);

      let revenueQuery = supabase
        .from('sales_orders')
        .select('id, customer_id, total_ttc')
        .eq('customer_type', 'organization')
        .in('customer_id', orgIds)
        .not('status', 'in', '("cancelled","draft")');

      // Filtre par annee si specifie
      if (year !== null) {
        revenueQuery = revenueQuery
          .gte('order_date', `${year}-01-01`)
          .lt('order_date', `${year + 1}-01-01`);
      }

      const { data: revenueData, error: revenueError } = await revenueQuery;

      if (revenueError) {
        console.warn('Erreur recuperation CA:', revenueError);
      }

      const orders = revenueData ?? [];
      const totalOrders = orders.length;

      // Calculer le CA par organisation
      const revenueByOrg: Record<string, number> = {};
      orders.forEach(order => {
        if (order.customer_id) {
          revenueByOrg[order.customer_id] =
            (revenueByOrg[order.customer_id] || 0) + (order.total_ttc || 0);
        }
      });

      // 3. Enrichir les organisations avec le CA
      const organisationsWithRevenue: OrganisationWithRevenue[] =
        organisations.map(org => ({
          ...org,
          revenue: revenueByOrg[org.id] || 0,
        }));

      // 5. Calculer les stats globales
      const totalRevenue = organisationsWithRevenue.reduce(
        (sum, org) => sum + org.revenue,
        0
      );
      const totalOrganisations = organisations.length;
      const averageRevenue =
        totalOrganisations > 0 ? totalRevenue / totalOrganisations : 0;

      // 6. Distribution par ville
      const cityMap: Record<string, { count: number; revenue: number }> = {};
      organisationsWithRevenue.forEach(org => {
        const cityKey = org.city || 'Non renseigne';
        if (!cityMap[cityKey]) {
          cityMap[cityKey] = { count: 0, revenue: 0 };
        }
        cityMap[cityKey].count += 1;
        cityMap[cityKey].revenue += org.revenue;
      });

      const citiesDistribution: CityDistribution[] = Object.entries(cityMap)
        .map(([city, data]) => ({
          city,
          count: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.count - a.count);

      const citiesCount = citiesDistribution.filter(
        c => c.city !== 'Non renseigne'
      ).length;

      // 7. Identifier la societe mere
      const parentOrganisation =
        organisationsWithRevenue.find(org => org.is_enseigne_parent) || null;

      setStats({
        totalOrganisations,
        totalRevenue,
        averageRevenue,
        citiesCount,
        citiesDistribution,
        organisationsWithRevenue,
        parentOrganisation,
        totalOrders,
      });
    } catch (err) {
      console.error('Erreur recuperation stats enseigne:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la recuperation des statistiques'
      );
    } finally {
      setLoading(false);
    }
  }, [enseigneId, year]);

  useEffect(() => {
    void fetchStats().catch(error => {
      console.error('[useEnseigneStats] fetchStats failed:', error);
    });
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
