/**
 * Hook Core Universel - Gestion Stock Multi-Canal
 *
 * Architecture Pure Business Logic avec Dependency Injection
 * Pattern réutilisable pour tous contextes (UI, API routes, scripts)
 *
 * @module use-stock-core
 * @since Phase 2.1 - 2025-10-31
 *
 * @example
 * // Usage standard avec UI
 * const stockCore = useStockCore({
 *   supabase: createClient(),
 *   channelId: 'xxx-b2b-channel',
 *   userId: 'user-123'
 * })
 *
 * @example
 * // Usage API route (sans channel spécifique)
 * const stockCore = useStockCore({
 *   supabase: createServerClient(),
 *   userId: 'user-123'
 * })
 */

import { useState, useCallback } from 'react';

export type {
  MovementType,
  ReferenceType,
  ReasonCode,
  ForecastType,
  StockMovement,
  StockItem,
  CreateMovementParams,
  MovementFilters,
  UseStockCoreConfig,
  UseStockCoreReturn,
} from './stock-core-types';
import type {
  StockMovement,
  StockItem,
  CreateMovementParams,
  MovementFilters,
  UseStockCoreConfig,
  UseStockCoreReturn,
} from './stock-core-types';

export function useStockCore({
  supabase,
  channelId = null,
  userId,
}: UseStockCoreConfig): UseStockCoreReturn {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =========================================================================
  // STOCK ITEMS (GLOBAL - pas séparé par canal)
  // =========================================================================

  /**
   * Récupérer liste produits avec infos stock GLOBAL
   * Stock = unique source vérité (pas de stock_b2b, stock_ecommerce, etc.)
   */
  const getStockItems = useCallback(
    async (filters?: {
      search?: string;
      archived?: boolean;
    }): Promise<StockItem[]> => {
      setLoading(true);
      setError(null);

      // ✅ FIX 5: Vérifier authentification AVANT fetch (Console Zero Tolerance)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Si pas d'utilisateur, retourner état neutre sans fetch
        setLoading(false);
        setError(null);
        return [];
      }

      try {
        let query = supabase.from('products').select(`
          id,
          sku,
          name,
          stock_real,
          stock_quantity,
          stock_forecasted_in,
          stock_forecasted_out,
          min_stock,
          cost_price,
          archived_at
        `);

        // Filtres optionnels
        if (filters?.archived === false) {
          query = query.is('archived_at', null);
        }

        if (filters?.search) {
          query = query.or(
            `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
          );
        }

        query = query.order('name', { ascending: true });

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const items = (data ?? []) as StockItem[];
        setStockItems(items);
        return items;
      } catch (err) {
        console.error('❌ [useStockCore] Erreur fetch stock items:', err);
        const errorMsg =
          err instanceof Error ? err.message : 'Erreur fetch stock items';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Récupérer stock d'un produit spécifique
   */
  const getStockItem = useCallback(
    async (productId: string): Promise<StockItem | null> => {
      // ✅ FIX 6: Vérifier authentification AVANT fetch (Console Zero Tolerance)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Si pas d'utilisateur, retourner null sans fetch
        return null;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select(
            `
          id,
          sku,
          name,
          stock_real,
          stock_quantity,
          stock_forecasted_in,
          stock_forecasted_out,
          min_stock,
          archived_at
        `
          )
          .eq('id', productId)
          .single();

        if (fetchError) throw fetchError;

        return data as StockItem;
      } catch (err) {
        console.error('❌ [useStockCore] Erreur fetch stock item:', err);
        return null;
      }
    },
    [supabase]
  );

  // =========================================================================
  // MOUVEMENTS STOCK
  // =========================================================================

  /**
   * Récupérer mouvements stock avec filtres
   */
  const getMovements = useCallback(
    async (filters?: MovementFilters): Promise<StockMovement[]> => {
      setLoading(true);
      setError(null);

      // ✅ FIX 7: Vérifier authentification AVANT fetch (Console Zero Tolerance)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Si pas d'utilisateur, retourner tableau vide sans fetch
        setLoading(false);
        setError(null);
        return [];
      }

      try {
        let query = supabase.from('stock_movements').select(`
          *,
          products (
            id,
            sku,
            name
          ),
          sales_channels (
            id,
            name,
            code,
            is_active
          )
        `);

        // Appliquer filtres
        if (filters?.product_id) {
          query = query.eq('product_id', filters.product_id);
        }

        if (filters?.movement_type) {
          if (Array.isArray(filters.movement_type)) {
            query = query.in('movement_type', filters.movement_type);
          } else {
            query = query.eq('movement_type', filters.movement_type);
          }
        }

        if (filters?.reference_type) {
          query = query.eq('reference_type', filters.reference_type);
        }

        if (filters?.reference_id) {
          query = query.eq('reference_id', filters.reference_id);
        }

        if (filters?.channel_id !== undefined) {
          if (filters.channel_id === null) {
            query = query.is('channel_id', null);
          } else {
            query = query.eq('channel_id', filters.channel_id);
          }
        }

        if (filters?.affects_forecast !== undefined) {
          query = query.eq('affects_forecast', filters.affects_forecast);
        }

        if (filters?.date_from) {
          query = query.gte('performed_at', filters.date_from);
        }

        if (filters?.date_to) {
          query = query.lte('performed_at', filters.date_to);
        }

        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        query = query.order('performed_at', { ascending: false });

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const movementsData = (data ?? []) as StockMovement[];
        setMovements(movementsData);
        return movementsData;
      } catch (err) {
        console.error('❌ [useStockCore] Erreur fetch movements:', err);
        const errorMsg =
          err instanceof Error ? err.message : 'Erreur fetch movements';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // =========================================================================
  // REFRESH (défini ici car utilisé par createMovement)
  // =========================================================================

  /**
   * Rafraîchir stocks + mouvements
   */
  const refetch = useCallback(async () => {
    await Promise.all([
      getStockItems({ archived: false }),
      getMovements({ limit: 100 }),
    ]);
  }, [getStockItems, getMovements]);

  /**
   * Créer mouvement stock avec auto-injection channel_id
   *
   * RÈGLE BUSINESS CRITIQUE:
   * - channel_id injecté SEULEMENT si:
   *   1. movement_type === 'OUT'
   *   2. reference_type === 'sales_order'
   *   3. channelId fourni dans config hook
   * - Sinon: channel_id = NULL (achats, ajustements, transferts)
   */
  const createMovement = useCallback(
    async (params: CreateMovementParams): Promise<StockMovement> => {
      try {
        // Récupérer stock avant mouvement (quantity_before)
        const stockBefore = await getStockItem(params.product_id);
        if (!stockBefore) {
          throw new Error(`Produit ${params.product_id} introuvable`);
        }

        const quantityBefore = params.affects_forecast
          ? params.forecast_type === 'out'
            ? stockBefore.stock_forecasted_out
            : stockBefore.stock_forecasted_in
          : stockBefore.stock_real;

        const quantityAfter = quantityBefore + params.quantity_change;

        // 🔑 AUTO-INJECTION channel_id (RÈGLE BUSINESS)
        let finalChannelId: string | null = null;

        if (
          params.movement_type === 'OUT' &&
          params.reference_type === 'sales_order' &&
          channelId
        ) {
          finalChannelId = channelId;
        }

        // Préparer données mouvement
        const movementData = {
          product_id: params.product_id,
          movement_type: params.movement_type,
          quantity_change: params.quantity_change,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reason_code: params.reason_code,
          reference_type: params.reference_type ?? null,
          reference_id: params.reference_id ?? null,
          notes: params.notes ?? null,
          affects_forecast: params.affects_forecast ?? false,
          forecast_type: params.forecast_type ?? null,
          performed_by: userId,
          performed_at: new Date().toISOString(),
          channel_id: finalChannelId,
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Supabase client typing limitation
        const { data, error: insertError } = await supabase
          .from('stock_movements')
          .insert(movementData)
          .select(
            `
          *,
          products (
            id,
            sku,
            name
          ),
          sales_channels (
            id,
            name,
            code,
            is_active
          )
        `
          )
          .single();

        if (insertError) throw insertError;
        if (!data) throw new Error('Mouvement créé mais non retourné');

        // Trigger refetch automatique (mouvements sont mis à jour via DB triggers)
        await refetch();

        return data as StockMovement;
      } catch (err) {
        console.error('[useStockCore] Erreur création mouvement:', err);
        throw err;
      }
    },
    [supabase, channelId, userId, getStockItem, refetch]
  );

  // =========================================================================
  // ANALYTICS PAR CANAL (Traceability)
  // =========================================================================

  /**
   * Filtrer mouvements par canal vente
   * Utile pour analytics: "Ventes B2B dernier mois", "Sorties ecommerce Q1"
   */
  const filterByChannel = useCallback(
    async (targetChannelId: string): Promise<StockMovement[]> => {
      return getMovements({ channel_id: targetChannelId });
    },
    [getMovements]
  );

  /**
   * Récupérer mouvements canal avec période
   */
  const getMovementsByChannel = useCallback(
    async (
      targetChannelId: string,
      dateFrom?: string,
      dateTo?: string
    ): Promise<StockMovement[]> => {
      return getMovements({
        channel_id: targetChannelId,
        movement_type: 'OUT', // Seulement OUT (ventes)
        reference_type: 'sales_order',
        date_from: dateFrom,
        date_to: dateTo,
      });
    },
    [getMovements]
  );

  // =========================================================================
  // RETURN API
  // =========================================================================

  return {
    // State
    loading,
    error,

    // Stock Items (GLOBAL)
    stockItems,
    getStockItems,
    getStockItem,

    // Movements
    movements,
    getMovements,
    createMovement,

    // Analytics
    filterByChannel,
    getMovementsByChannel,

    // Refresh
    refetch,
  };
}
