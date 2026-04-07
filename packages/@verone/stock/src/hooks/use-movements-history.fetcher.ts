/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { StockReasonCode } from './use-stock-movements';
import type {
  MovementHistoryFilters,
  MovementWithDetails,
  MovementsStats,
} from './use-movements-history.types';

type GetReasonDescription = (code: StockReasonCode) => string;

type ProductWithImages = {
  id: string;
  name: string;
  sku: string;
  product_images: Array<{ public_url: string | null }> | null;
};

/**
 * Récupère les mouvements de stock avec enrichissement (produits + utilisateurs)
 */
export async function queryMovements(
  supabase: SupabaseClient,
  filters: MovementHistoryFilters,
  getReasonDescription: GetReasonDescription
): Promise<{ movements: MovementWithDetails[]; total: number }> {
  let query = supabase.from('stock_movements').select('*', { count: 'exact' });

  if (filters.dateRange) {
    query = query
      .gte('performed_at', filters.dateRange.from.toISOString())
      .lte('performed_at', filters.dateRange.to.toISOString());
  }

  if (filters.movementTypes && filters.movementTypes.length > 0) {
    query = query.in('movement_type', filters.movementTypes as any);
  }

  if (filters.reasonCodes && filters.reasonCodes.length > 0) {
    query = query.in('reason_code', filters.reasonCodes);
  }

  if (filters.userIds && filters.userIds.length > 0) {
    query = query.in('performed_by', filters.userIds);
  }

  if (filters.affects_forecast !== undefined) {
    if (filters.affects_forecast === false) {
      query = query.or('affects_forecast.is.null,affects_forecast.eq.false');
    } else {
      query = query.eq('affects_forecast', true);
    }
  }

  if (filters.forecast_type) {
    query = query.eq('forecast_type', filters.forecast_type);
  }

  if (filters.productSearch) {
    const { data: matchingProducts } = await supabase
      .from('products')
      .select('id')
      .or(
        `name.ilike.%${filters.productSearch}%,sku.ilike.%${filters.productSearch}%`
      );
    if (matchingProducts && matchingProducts.length > 0) {
      query = query.in(
        'product_id',
        matchingProducts.map(p => p.id)
      );
    } else {
      return { movements: [], total: 0 };
    }
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);
  query = query.order('performed_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;
  if (!data || data.length === 0) return { movements: [], total: count ?? 0 };

  const userIds = [...new Set(data.map(m => m.performed_by).filter(Boolean))];
  const productIds = [...new Set(data.map(m => m.product_id).filter(Boolean))];

  const [userProfilesResult, productsResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds),
    supabase
      .from('products')
      .select('id, name, sku, product_images!left(public_url)')
      .eq('product_images.is_primary', true)
      .limit(1, { foreignTable: 'product_images' })
      .in('id', productIds),
  ]);

  const userProfiles = userProfilesResult.data ?? [];
  const products = productsResult.data ?? [];

  const enrichedMovements = data.map(movement => {
    const userProfile = userProfiles.find(
      profile => profile.user_id === movement.performed_by
    );
    const product = products.find(prod => prod.id === movement.product_id);
    const typedProduct = product as unknown as ProductWithImages | undefined;

    const userName = userProfile
      ? `${userProfile.first_name ?? ''} ${userProfile.last_name ?? ''}`.trim()
      : 'Utilisateur inconnu';

    return {
      ...movement,
      product_name: typedProduct?.name ?? 'Produit supprimé',
      product_sku: typedProduct?.sku ?? 'SKU inconnu',
      product_image_url: typedProduct?.product_images?.[0]?.public_url ?? null,
      user_name: userName,
      user_first_name: userProfile?.first_name,
      user_last_name: userProfile?.last_name,
      reason_description: movement.reason_code
        ? getReasonDescription(
            movement.reason_code as Parameters<typeof getReasonDescription>[0]
          )
        : undefined,
    };
  });

  return {
    movements: enrichedMovements as unknown as MovementWithDetails[],
    total: count ?? 0,
  };
}

/**
 * Calcule les statistiques des mouvements (KPIs, top motifs, top utilisateurs)
 */
export async function queryStats(
  supabase: SupabaseClient,
  filters: MovementHistoryFilters,
  getReasonDescription: GetReasonDescription
): Promise<MovementsStats> {
  const hasDateRange = !!filters.dateRange;
  const rangeFrom = filters.dateRange?.from;
  const rangeTo = filters.dateRange?.to;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(
    today.getTime() - today.getDay() * 24 * 60 * 60 * 1000
  );
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const applyCommonFilters = (query: any) => {
    if (filters.movementTypes && filters.movementTypes.length > 0) {
      query = query.in('movement_type', filters.movementTypes as any);
    }
    query = query.or('affects_forecast.is.null,affects_forecast.eq.false');
    if (hasDateRange && rangeFrom) {
      query = query.gte('performed_at', rangeFrom.toISOString());
    }
    if (hasDateRange && rangeTo) {
      query = query.lte('performed_at', rangeTo.toISOString());
    }
    return query;
  };

  let totalQuery = supabase
    .from('stock_movements')
    .select('*', { count: 'exact', head: true });
  totalQuery = applyCommonFilters(totalQuery);
  const { count: totalCount } = await totalQuery;

  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;

  if (!hasDateRange) {
    let todayQuery = supabase
      .from('stock_movements')
      .select('*', { count: 'exact', head: true })
      .gte('performed_at', today.toISOString());
    todayQuery = applyCommonFilters(todayQuery);
    todayCount = (await todayQuery).count ?? 0;

    let weekQuery = supabase
      .from('stock_movements')
      .select('*', { count: 'exact', head: true })
      .gte('performed_at', weekStart.toISOString());
    weekQuery = applyCommonFilters(weekQuery);
    weekCount = (await weekQuery).count ?? 0;

    let monthQuery = supabase
      .from('stock_movements')
      .select('*', { count: 'exact', head: true })
      .gte('performed_at', monthStart.toISOString());
    monthQuery = applyCommonFilters(monthQuery);
    monthCount = (await monthQuery).count ?? 0;
  }

  let typeQuery = supabase.from('stock_movements').select('movement_type');
  typeQuery = applyCommonFilters(typeQuery);
  if (!hasDateRange) {
    typeQuery = typeQuery.gte('performed_at', monthStart.toISOString());
  }
  const { data: typeStats } = await typeQuery;

  const byType = {
    IN: typeStats?.filter(m => m.movement_type === 'IN').length ?? 0,
    OUT: typeStats?.filter(m => m.movement_type === 'OUT').length ?? 0,
    ADJUST: typeStats?.filter(m => m.movement_type === 'ADJUST').length ?? 0,
  };

  const [{ count: realCount }, { count: forecastCount }] = await Promise.all([
    supabase
      .from('stock_movements')
      .select('*', { count: 'exact', head: true })
      .or('affects_forecast.is.null,affects_forecast.is.false'),
    supabase
      .from('stock_movements')
      .select('*', { count: 'exact', head: true })
      .eq('affects_forecast', true),
  ]);

  let reasonQuery = supabase
    .from('stock_movements')
    .select('reason_code')
    .not('reason_code', 'is', null);
  reasonQuery = applyCommonFilters(reasonQuery);
  if (!hasDateRange) {
    reasonQuery = reasonQuery.gte('performed_at', monthStart.toISOString());
  }
  const { data: reasonStats } = await reasonQuery;

  const reasonCounts =
    reasonStats?.reduce(
      (acc, item) => {
        if (item.reason_code) {
          acc[item.reason_code] = (acc[item.reason_code] ?? 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    ) ?? {};

  const topReasons = Object.entries(reasonCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([code, count]) => ({
      code,
      description: getReasonDescription(
        code as Parameters<typeof getReasonDescription>[0]
      ),
      count,
    }));

  let userQuery = supabase.from('stock_movements').select('performed_by');
  userQuery = applyCommonFilters(userQuery);
  if (!hasDateRange) {
    userQuery = userQuery.gte('performed_at', monthStart.toISOString());
  }
  const { data: userStats } = await userQuery;

  const statsUserIds = [
    ...new Set(userStats?.map(m => m.performed_by).filter(Boolean) ?? []),
  ];

  let statsUserProfiles: Array<{
    user_id: string;
    first_name: string | null;
    last_name: string | null;
  }> = [];
  if (statsUserIds.length > 0) {
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', statsUserIds);
    statsUserProfiles = data ?? [];
  }

  const userCounts =
    userStats?.reduce(
      (acc, item) => {
        const userId = item.performed_by;
        const userProfile = statsUserProfiles.find(
          profile => profile.user_id === userId
        );
        const userName = userProfile
          ? `${userProfile.first_name ?? ''} ${userProfile.last_name ?? ''}`.trim()
          : 'Utilisateur inconnu';

        if (!acc[userId]) {
          acc[userId] = { user_id: userId, user_name: userName, count: 0 };
        }
        acc[userId].count++;
        return acc;
      },
      {} as Record<
        string,
        { user_id: string; user_name: string; count: number }
      >
    ) ?? {};

  const topUsers = Object.values(userCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalMovements: totalCount ?? 0,
    movementsToday: todayCount,
    movementsThisWeek: weekCount,
    movementsThisMonth: monthCount,
    byType,
    realMovements: realCount ?? 0,
    forecastMovements: forecastCount ?? 0,
    topReasons,
    topUsers,
  };
}
