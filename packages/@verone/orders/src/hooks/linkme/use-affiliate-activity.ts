/**
 * Hook: use-user-linkme-activity
 * Fetch activity data for a LinkMe USER (not enseigne/affiliate).
 * Shows what THIS user did: orders they created, notifications received, onboarding steps.
 *
 * @module use-affiliate-activity (kept filename for backward compat with index.ts)
 * @since 2026-03-04
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export interface UserOrder {
  id: string;
  order_number: string;
  linkme_display_number: string | null;
  status: string;
  total_ht: number;
  total_ttc: number;
  created_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
}

export interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

export interface UserOnboardingStep {
  id: string;
  step_id: string;
  completed_at: string | null;
  created_at: string;
}

export interface UserActivityStats {
  selectionsCount: number;
  ordersCount: number;
  totalCaHT: number;
  lastOrderDate: string | null;
}

export interface UserActivityData {
  userId: string;
  orders: UserOrder[];
  notifications: UserNotification[];
  onboardingSteps: UserOnboardingStep[];
  stats: UserActivityStats;
}

// ============================================
// ONBOARDING STEP LABELS
// ============================================

export const ONBOARDING_STEP_LABELS: Record<string, string> = {
  tour_welcome: 'Visite guidee — Bienvenue',
  tour_selection: 'Visite guidee — Selections',
  tour_commissions: 'Visite guidee — Commissions',
  create_selection: 'Creer une selection',
  add_products: 'Ajouter des produits',
  configure_margins: 'Configurer les marges',
  share_selection: 'Partager une selection',
  dismissed: 'Onboarding ferme',
};

// ============================================
// HOOK
// ============================================

/**
 * Fetches activity data for a specific LinkMe user:
 * 1. Orders created by this user (sales_orders.created_by = userId)
 * 2. Notifications received by this user
 * 3. Onboarding steps completed
 * 4. Selections count (via affiliate, enseigne-level KPI)
 */
export function useUserLinkmeActivity(
  userId: string | null,
  enseigneId: string | null,
  organisationId: string | null
) {
  const activityQuery = useQuery({
    queryKey: ['user-linkme-activity', userId],
    queryFn: async (): Promise<UserActivityData> => {
      if (!userId) {
        throw new Error('No user ID');
      }

      const supabase = createClient();

      // Fetch user-level data in parallel
      const [
        ordersResult,
        notificationsResult,
        onboardingResult,
        selectionsCount,
      ] = await Promise.all([
        // Orders created BY this user
        supabase
          .from('sales_orders')
          .select(
            'id, order_number, linkme_display_number, status, total_ht, total_ttc, created_at, confirmed_at, delivered_at, cancelled_at'
          )
          .eq('created_by', userId)
          .order('created_at', { ascending: false })
          .limit(200),
        // Notifications for this user
        supabase
          .from('notifications')
          .select('id, type, title, message, read, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100),
        // Onboarding steps
        supabase
          .from('linkme_onboarding_progress')
          .select('id, step_id, completed_at, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        // Selections count (enseigne-level, OK for KPI)
        resolveSelectionsCount(supabase, enseigneId, organisationId),
      ]);

      const orders = (ordersResult.data ?? []) as UserOrder[];
      const notifications = (notificationsResult.data ??
        []) as UserNotification[];
      const onboardingSteps = (onboardingResult.data ??
        []) as UserOnboardingStep[];

      // Compute stats
      const stats: UserActivityStats = {
        selectionsCount,
        ordersCount: orders.length,
        totalCaHT: orders.reduce((sum, o) => sum + (o.total_ht ?? 0), 0),
        lastOrderDate: orders[0]?.created_at ?? null,
      };

      return {
        userId,
        orders,
        notifications,
        onboardingSteps,
        stats,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    data: activityQuery.data ?? null,
    stats: activityQuery.data?.stats ?? {
      selectionsCount: 0,
      ordersCount: 0,
      totalCaHT: 0,
      lastOrderDate: null,
    },
    isLoading: activityQuery.isLoading,
    isError: activityQuery.isError,
  };
}

/**
 * Resolve selections count via affiliate (enseigne-level).
 * This is the only KPI that stays at enseigne level.
 */
async function resolveSelectionsCount(
  supabase: ReturnType<typeof createClient>,
  enseigneId: string | null,
  organisationId: string | null
): Promise<number> {
  let affiliateId: string | null = null;

  if (enseigneId) {
    const { data } = await supabase
      .from('linkme_affiliates')
      .select('id')
      .eq('enseigne_id', enseigneId)
      .limit(1)
      .single();
    affiliateId = data?.id ?? null;
  }

  if (!affiliateId && organisationId) {
    const { data } = await supabase
      .from('linkme_affiliates')
      .select('id')
      .eq('organisation_id', organisationId)
      .limit(1)
      .single();
    affiliateId = data?.id ?? null;
  }

  if (!affiliateId) return 0;

  const { count } = await supabase
    .from('linkme_selections')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId);

  return count ?? 0;
}

// ============================================
// BACKWARD COMPAT — deprecated, kept for existing imports
// ============================================

/** @deprecated Use useUserLinkmeActivity instead */
export const useAffiliateActivity = useUserLinkmeActivity;
