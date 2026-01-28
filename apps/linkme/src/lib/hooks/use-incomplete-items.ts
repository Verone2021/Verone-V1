'use client';

/**
 * Hook: useIncompleteItems
 *
 * Agrège tous les éléments nécessitant une action de l'utilisateur:
 * - Organisations sans ownership_type
 * - Sélections non publiées
 * - Commandes en brouillon
 * - Commissions en attente
 *
 * @module useIncompleteItems
 * @since 2026-01-12
 */

import { useMemo } from 'react';

import { useLinkMeOrders } from '@/hooks/use-linkme-orders';

import { useAffiliateCommissionStats } from './use-affiliate-commission-stats';
import { useEnseigneOrganisations } from './use-enseigne-organisations';
import { useUserAffiliate, useUserSelections } from './use-user-selection';

// ============================================
// TYPES
// ============================================

export interface IncompleteItem {
  id: string;
  type: 'organisation' | 'selection' | 'order' | 'commission' | 'profile';
  title: string;
  description: string;
  route: string;
  priority: 'high' | 'medium' | 'low';
  icon: 'building' | 'package' | 'shopping-cart' | 'wallet' | 'user';
}

// ============================================
// HOOK
// ============================================

export function useIncompleteItems() {
  // Fetch data from various sources
  const { data: affiliate } = useUserAffiliate();
  const { data: organisations } = useEnseigneOrganisations(
    affiliate?.id ?? null
  );
  const { data: selections } = useUserSelections();
  const { data: orders } = useLinkMeOrders(affiliate?.id ?? null, false);
  const { data: commissionStats } = useAffiliateCommissionStats();

  // Aggregate incomplete items
  const incompleteItems = useMemo(() => {
    const items: IncompleteItem[] = [];

    // 1. Organisations sans ownership_type (HIGH priority)
    const incompleteOrgs = organisations?.filter(o => !o.ownership_type) ?? [];
    incompleteOrgs.forEach(org => {
      items.push({
        id: `org-${org.id}`,
        type: 'organisation',
        title: org.trade_name ?? org.legal_name ?? 'Organisation',
        description: 'Type de propriété manquant (Succursale/Franchise)',
        route: `/organisations?highlight=${org.id}`,
        priority: 'high',
        icon: 'building',
      });
    });

    // 2. Sélections non publiées (MEDIUM priority)
    const draftSelections = selections?.filter(s => !s.published_at) ?? [];
    draftSelections.forEach(sel => {
      items.push({
        id: `sel-${sel.id}`,
        type: 'selection',
        title: sel.name,
        description: 'Sélection en brouillon - non publiée',
        route: `/ma-selection/${sel.id}`,
        priority: 'medium',
        icon: 'package',
      });
    });

    // 3. Commandes en brouillon (MEDIUM priority)
    const draftOrders = orders?.filter(o => o.status === 'draft') ?? [];
    draftOrders.forEach(order => {
      items.push({
        id: `order-${order.id}`,
        type: 'order',
        title: order.order_number,
        description: 'Commande en brouillon',
        route: `/commandes?order=${order.id}`,
        priority: 'medium',
        icon: 'shopping-cart',
      });
    });

    // 4. Commissions en attente (LOW priority - informational)
    const pendingCommissions = commissionStats?.pending?.count ?? 0;
    if (pendingCommissions > 0) {
      items.push({
        id: 'commissions-pending',
        type: 'commission',
        title: `${pendingCommissions} commission${pendingCommissions > 1 ? 's' : ''} en attente`,
        description: 'Demander un versement',
        route: '/commissions',
        priority: 'low',
        icon: 'wallet',
      });
    }

    return items;
  }, [organisations, selections, orders, commissionStats]);

  // Computed values
  const totalCount = incompleteItems.length;
  const highPriorityCount = incompleteItems.filter(
    i => i.priority === 'high'
  ).length;

  return {
    items: incompleteItems,
    totalCount,
    highPriorityCount,
    hasItems: totalCount > 0,
  };
}
