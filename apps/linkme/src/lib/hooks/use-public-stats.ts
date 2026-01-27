/**
 * Hook: usePublicStats
 * Statistiques publiques de la plateforme LinkMe
 *
 * Utilisé sur la landing page (Hero section) pour afficher:
 * - Nombre d'affiliés actifs
 * - Nombre de sélections publiées
 * - Total commissions payées
 * - Nombre de commandes
 *
 * @module use-public-stats
 * @since 2026-01-23
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

export interface PublicStats {
  totalAffiliates: number;
  totalSelections: number;
  totalCommissionsPaid: number;
  totalOrders: number;
  updatedAt: string;
}

/**
 * Formate un nombre pour l'affichage public
 * Ex: 42 → "40+", 2548 → "2.5K+"
 */
export function formatPublicStat(value: number): string {
  if (value === 0) return '0';

  if (value < 100) {
    // Arrondir à la dizaine inférieure + "+"
    const rounded = Math.floor(value / 10) * 10;
    return rounded > 0 ? `${rounded}+` : `${value}`;
  }

  if (value < 1000) {
    // Arrondir à la centaine inférieure + "+"
    const rounded = Math.floor(value / 100) * 100;
    return `${rounded}+`;
  }

  // Pour les milliers
  const thousands = value / 1000;
  if (thousands < 10) {
    return `${thousands.toFixed(1).replace('.0', '')}K+`;
  }

  return `${Math.floor(thousands)}K+`;
}

/**
 * Formate un montant en euros pour l'affichage public
 * Ex: 2548.50 → "2.5K", 150234 → "150K"
 */
export function formatPublicAmount(value: number): string {
  if (value === 0) return '0';

  if (value < 1000) {
    return `${Math.floor(value)}`;
  }

  const thousands = value / 1000;
  if (thousands < 10) {
    return `${thousands.toFixed(1).replace('.0', '')}K`;
  }

  if (thousands < 1000) {
    return `${Math.floor(thousands)}K`;
  }

  // Millions
  const millions = thousands / 1000;
  return `${millions.toFixed(1).replace('.0', '')}M`;
}

// Type de la réponse RPC (non généré dans les types Supabase tant que migration pas appliquée)
interface PublicStatsRpcResponse {
  total_affiliates: number;
  total_selections: number;
  total_commissions_paid: number;
  total_orders: number;
  updated_at: string;
}

/**
 * Hook pour récupérer les stats publiques de LinkMe
 * Données mises en cache pendant 1h (staleTime)
 */
export function usePublicStats() {
  return useQuery({
    queryKey: ['linkme-public-stats'],
    queryFn: async (): Promise<PublicStats> => {
      // Appel RPC - cast vers unknown car RPC pas encore dans les types générés
      // Une fois la migration appliquée et types regénérés, ce cast pourra être supprimé

      const { data, error } = (await (supabase as any).rpc(
        'get_linkme_public_stats'
      )) as { data: PublicStatsRpcResponse | null; error: Error | null };

      if (error) {
        console.error('Erreur fetch public stats:', error);
        throw error;
      }

      // Transformer la réponse snake_case en camelCase
      return {
        totalAffiliates: data?.total_affiliates ?? 0,
        totalSelections: data?.total_selections ?? 0,
        totalCommissionsPaid: data?.total_commissions_paid ?? 0,
        totalOrders: data?.total_orders ?? 0,
        updatedAt: data?.updated_at ?? new Date().toISOString(),
      };
    },
    // Cache pendant 1h - données publiques, pas besoin de refresh fréquent
    staleTime: 60 * 60 * 1000,
    // Garder les données en cache même quand l'onglet est inactif
    gcTime: 2 * 60 * 60 * 1000,
    // Ne pas retry en cas d'erreur (page publique, afficher fallback)
    retry: false,
  });
}
