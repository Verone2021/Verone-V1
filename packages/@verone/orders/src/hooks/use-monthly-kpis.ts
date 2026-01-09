'use client';

/**
 * Hook: useMonthlyKPIs
 * KPIs mensuels avec comparaison mois précédent
 *
 * Utilisable par:
 * - Back-office: toutes les commandes ou filtrées par canal
 * - Front-end LinkMe: commandes d'un affilié spécifique
 *
 * Filtres par la vraie date de commande (sales_orders.created_at),
 * PAS par la date de création des enregistrements techniques.
 *
 * @module use-monthly-kpis
 * @since 2025-12-19
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export interface MonthlyKPIs {
  // Mois en cours
  currentMonth: {
    label: string; // "Décembre 2025"
    ordersCount: number;
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
    panierMoyen: number;
  };
  // Mois précédent
  previousMonth: {
    label: string; // "Novembre 2025"
    ordersCount: number;
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
    panierMoyen: number;
  };
  // Variations vs mois précédent (en %)
  variations: {
    ordersCount: number; // +15 = +15%, -10 = -10%
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
    panierMoyen: number;
  };
  // Variations vs moyenne générale (en %)
  averageVariations: {
    ordersCount: number;
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
    panierMoyen: number;
  };
  // Moyenne mensuelle (pour référence)
  monthlyAverage: {
    ordersCount: number;
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
    panierMoyen: number;
  };
  // Totaux all-time
  allTime: {
    ordersCount: number;
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
  };
}

export interface UseMonthlyKPIsOptions {
  /** ID du canal de vente (ex: LinkMe, Site Internet) */
  channelId?: string | null;
  /** ID de l'affilié (pour LinkMe front-end) */
  affiliateId?: string | null;
  /** Activer le hook */
  enabled?: boolean;
}

// ============================================
// HELPERS
// ============================================

/**
 * Retourne le premier jour du mois
 */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Retourne le dernier jour du mois (23:59:59.999)
 */
function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Formate le nom du mois en français
 */
function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/**
 * Calcule la variation en pourcentage
 */
function calculateVariation(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

// ============================================
// MAIN HOOK
// ============================================

export function useMonthlyKPIs(options: UseMonthlyKPIsOptions = {}) {
  const { channelId, affiliateId, enabled = true } = options;

  return useQuery({
    queryKey: ['monthly-kpis', channelId, affiliateId],
    queryFn: async (): Promise<MonthlyKPIs> => {
      const supabase = createClient();

      // Calculer les périodes
      const now = new Date();
      const currentMonthStart = getMonthStart(now);
      const currentMonthEnd = getMonthEnd(now);

      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthStart = getMonthStart(prevMonth);
      const previousMonthEnd = getMonthEnd(prevMonth);

      // ============================================
      // Requête principale via RPC get_linkme_orders
      // ============================================
      // Cette RPC retourne les commandes avec les vraies dates (created_at de sales_orders)
      // et les marges affiliés (total_affiliate_margin)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: ordersData, error } = await (supabase as any).rpc(
        'get_linkme_orders',
        { p_affiliate_id: affiliateId || null }
      );

      if (error) {
        console.error('Erreur fetch orders pour KPIs:', error);
        throw error;
      }

      const orders = ordersData || [];

      // Filtrer par canal si spécifié (pour le back-office)
      // Note: La RPC get_linkme_orders ne filtre pas par canal,
      // mais les ordres LinkMe ont déjà le bon channel_id
      // Pour d'autres canaux, on pourrait utiliser une autre RPC

      // ============================================
      // Calculer les KPIs par période
      // ============================================

      // Mois en cours
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentMonthOrders = orders.filter((o: any) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= currentMonthStart && orderDate <= currentMonthEnd;
      });

      // Mois précédent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const previousMonthOrders = orders.filter((o: any) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= previousMonthStart && orderDate <= previousMonthEnd;
      });

      // Fonction de calcul des KPIs pour une liste de commandes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calculateKPIs = (ordersList: any[]) => {
        const count = ordersList.length;
        const caHT = ordersList.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, o: any) => sum + (o.total_ht || 0),
          0
        );
        const caTTC = ordersList.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, o: any) => sum + (o.total_ttc || 0),
          0
        );
        const commissionsHT = ordersList.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, o: any) => sum + (o.total_affiliate_margin || 0),
          0
        );
        // TTC = HT * 1.2 (TVA 20%)
        const commissionsTTC = commissionsHT * 1.2;
        const panierMoyen = count > 0 ? caTTC / count : 0;

        return {
          ordersCount: count,
          caHT,
          caTTC,
          commissionsHT,
          commissionsTTC,
          panierMoyen,
        };
      };

      const currentKPIs = calculateKPIs(currentMonthOrders);
      const previousKPIs = calculateKPIs(previousMonthOrders);
      const allTimeKPIs = calculateKPIs(orders);

      // Calculer le nombre de mois avec des commandes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const monthsWithOrders = new Set(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orders.map((o: any) => {
          const d = new Date(o.created_at);
          return `${d.getFullYear()}-${d.getMonth()}`;
        })
      );
      const numberOfMonths = Math.max(monthsWithOrders.size, 1);

      // Calculer les moyennes mensuelles
      const monthlyAverage = {
        ordersCount: Math.round(allTimeKPIs.ordersCount / numberOfMonths),
        caHT: allTimeKPIs.caHT / numberOfMonths,
        caTTC: allTimeKPIs.caTTC / numberOfMonths,
        commissionsHT: allTimeKPIs.commissionsHT / numberOfMonths,
        commissionsTTC: allTimeKPIs.commissionsTTC / numberOfMonths,
        panierMoyen: allTimeKPIs.panierMoyen, // Moyenne du panier moyen reste le même
      };

      // Calculer les variations vs mois précédent
      const variations = {
        ordersCount: calculateVariation(
          currentKPIs.ordersCount,
          previousKPIs.ordersCount
        ),
        caHT: calculateVariation(currentKPIs.caHT, previousKPIs.caHT),
        caTTC: calculateVariation(currentKPIs.caTTC, previousKPIs.caTTC),
        commissionsHT: calculateVariation(
          currentKPIs.commissionsHT,
          previousKPIs.commissionsHT
        ),
        commissionsTTC: calculateVariation(
          currentKPIs.commissionsTTC,
          previousKPIs.commissionsTTC
        ),
        panierMoyen: calculateVariation(
          currentKPIs.panierMoyen,
          previousKPIs.panierMoyen
        ),
      };

      // Calculer les variations vs moyenne générale
      const averageVariations = {
        ordersCount: calculateVariation(
          currentKPIs.ordersCount,
          monthlyAverage.ordersCount
        ),
        caHT: calculateVariation(currentKPIs.caHT, monthlyAverage.caHT),
        caTTC: calculateVariation(currentKPIs.caTTC, monthlyAverage.caTTC),
        commissionsHT: calculateVariation(
          currentKPIs.commissionsHT,
          monthlyAverage.commissionsHT
        ),
        commissionsTTC: calculateVariation(
          currentKPIs.commissionsTTC,
          monthlyAverage.commissionsTTC
        ),
        panierMoyen: calculateVariation(
          currentKPIs.panierMoyen,
          monthlyAverage.panierMoyen
        ),
      };

      return {
        currentMonth: {
          label: formatMonthLabel(currentMonthStart),
          ...currentKPIs,
        },
        previousMonth: {
          label: formatMonthLabel(previousMonthStart),
          ...previousKPIs,
        },
        variations,
        averageVariations,
        monthlyAverage,
        allTime: {
          ordersCount: allTimeKPIs.ordersCount,
          caHT: allTimeKPIs.caHT,
          caTTC: allTimeKPIs.caTTC,
          commissionsHT: allTimeKPIs.commissionsHT,
          commissionsTTC: allTimeKPIs.commissionsTTC,
        },
      };
    },
    enabled,
    // Optimisation: cache plus long, pas de refetch sur focus
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Force refetch pour debug
  });
}

/**
 * Helper pour formater la variation avec signe + ou -
 */
export function formatVariation(value: number): string {
  if (value === 0) return '0%';
  return value > 0 ? `+${value}%` : `${value}%`;
}

/**
 * Helper pour obtenir la couleur de la variation
 */
export function getVariationColor(value: number): string {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-500';
}
