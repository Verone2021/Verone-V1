/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { StockReasonCode } from './use-stock-movements';
import type { MovementHistoryFilters } from './use-movements-history.types';

type GetReasonDescription = (code: StockReasonCode) => string;
type ToastFn = (opts: {
  title: string;
  description?: string;
  variant?: 'destructive';
}) => void;

/**
 * Exporte les mouvements de stock en CSV selon les filtres actifs
 */
export async function exportMovementsToCSV(
  supabase: SupabaseClient,
  filters: MovementHistoryFilters,
  getReasonDescription: GetReasonDescription,
  toast: ToastFn
): Promise<void> {
  const exportFilters = { ...filters, limit: undefined, offset: undefined };

  let query = supabase.from('stock_movements').select('*');

  if (exportFilters.dateRange) {
    query = query
      .gte('performed_at', exportFilters.dateRange.from.toISOString())
      .lte('performed_at', exportFilters.dateRange.to.toISOString());
  }

  if (exportFilters.movementTypes && exportFilters.movementTypes.length > 0) {
    query = query.in('movement_type', exportFilters.movementTypes);
  }

  if (exportFilters.reasonCodes && exportFilters.reasonCodes.length > 0) {
    query = query.in('reason_code', exportFilters.reasonCodes);
  }

  if (exportFilters.userIds && exportFilters.userIds.length > 0) {
    query = query.in('performed_by', exportFilters.userIds);
  }

  if (exportFilters.affects_forecast !== undefined) {
    if (exportFilters.affects_forecast === false) {
      query = query.or('affects_forecast.is.null,affects_forecast.eq.false');
    } else {
      query = query.eq('affects_forecast', true);
    }
  }

  if (exportFilters.forecast_type) {
    query = query.eq('forecast_type', exportFilters.forecast_type);
  }

  if (exportFilters.productSearch) {
    const { data: matchingProducts } = await supabase
      .from('products')
      .select('id')
      .or(
        `name.ilike.%${exportFilters.productSearch}%,sku.ilike.%${exportFilters.productSearch}%`
      );
    if (matchingProducts && matchingProducts.length > 0) {
      query = query.in(
        'product_id',
        matchingProducts.map(p => p.id)
      );
    }
  }

  query = query.order('performed_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;

  if (!data || data.length === 0) {
    toast({
      title: 'Aucune donnée',
      description: 'Aucun mouvement à exporter avec les filtres actuels',
    });
    return;
  }

  const exportUserIds = [
    ...new Set(data.map(m => m.performed_by).filter(Boolean)),
  ];
  const exportProductIds = [
    ...new Set(data.map(m => m.product_id).filter(Boolean)),
  ];

  const [exportUserProfiles, exportProducts] = await Promise.all([
    exportUserIds.length > 0
      ? supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', exportUserIds)
      : { data: [] },
    exportProductIds.length > 0
      ? supabase
          .from('products')
          .select('id, name, sku')
          .in('id', exportProductIds)
      : { data: [] },
  ]);

  const formattedData = data.map(movement => {
    const userProfile = exportUserProfiles.data?.find(
      profile => profile.user_id === movement.performed_by
    );
    const product = exportProducts.data?.find(
      prod => prod.id === movement.product_id
    );
    const userName = userProfile
      ? `${userProfile.first_name ?? ''} ${userProfile.last_name ?? ''}`.trim()
      : 'Utilisateur inconnu';

    return {
      'Date/Heure': new Date(movement.performed_at).toLocaleString('fr-FR'),
      Produit: product?.name ?? 'Produit supprimé',
      SKU: product?.sku ?? 'N/A',
      Type: movement.movement_type,
      Quantité:
        movement.movement_type === 'OUT'
          ? -movement.quantity_change
          : movement.quantity_change,
      'Stock Avant': movement.quantity_before,
      'Stock Après': movement.quantity_after,
      'Coût Unitaire': movement.unit_cost ?? '',
      Motif: movement.reason_code
        ? getReasonDescription(
            movement.reason_code as Parameters<typeof getReasonDescription>[0]
          )
        : '',
      Utilisateur: userName,
      Notes: movement.notes ?? '',
      Référence: movement.reference_type ?? '',
      Prévisionnel: movement.affects_forecast ? 'Oui' : 'Non',
    };
  });

  const headers = Object.keys(formattedData[0] ?? {});
  const csvContent = [
    headers.join(','),
    ...formattedData.map(row =>
      headers
        .map(header => `"${row[header as keyof typeof row] ?? ''}"`)
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `historique-mouvements-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  toast({
    title: 'Export réussi',
    description: `${formattedData.length} mouvements exportés en CSV`,
  });
}
