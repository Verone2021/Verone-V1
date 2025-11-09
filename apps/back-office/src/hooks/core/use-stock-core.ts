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

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Types de mouvements stock
 */
export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';

/**
 * Types de références documentaires
 */
export type ReferenceType =
  | 'sales_order' // Commande vente client
  | 'purchase_order' // Commande achat fournisseur
  | 'manual_adjustment' // Ajustement manuel inventaire
  | 'transfer' // Transfert inter-entrepôts
  | 'return' // Retour client/fournisseur
  | 'damage' // Casse/perte
  | 'sample'; // Échantillon

/**
 * Codes raison standardisés
 */
export type ReasonCode =
  | 'sale' // Vente client
  | 'purchase' // Achat fournisseur
  | 'return_customer' // Retour client
  | 'return_supplier' // Retour fournisseur
  | 'adjustment' // Ajustement inventaire
  | 'damage' // Casse/perte
  | 'transfer_in' // Transfert entrant
  | 'transfer_out' // Transfert sortant
  | 'sample' // Échantillon
  | 'cancelled'; // Annulation commande

/**
 * Type prévisionnel (forecast_type)
 */
export type ForecastType = 'in' | 'out' | null;

/**
 * Interface complète mouvement stock (20 colonnes)
 * Correspond à table stock_movements avec channel_id (migrations 003+004)
 */
export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: MovementType;
  quantity_change: number; // Négatif pour OUT, positif pour IN
  quantity_before: number;
  quantity_after: number;
  reason_code: string; // ✅ FIX: string pour stock_reason_code PostgreSQL (25 valeurs)
  reference_type: ReferenceType | null;
  reference_id: string | null;
  notes: string | null;
  affects_forecast: boolean; // true = prévisionnel, false = réel
  forecast_type: ForecastType;
  performed_by: string | null; // user_id
  performed_at: string;
  channel_id: string | null; // 🆕 Canal vente (b2b, ecommerce, retail, wholesale)
  created_at: string;
  updated_at: string;

  // Relations
  products?: any;
  sales_channels?: {
    id: string;
    name: string;
    code: string;
    is_active: boolean;
  } | null;
}

/**
 * Interface élément stock (product avec infos stock)
 * Stock = GLOBAL unique (pas séparé par canal)
 */
export interface StockItem {
  id: string;
  sku: string;
  name: string;
  stock_real: number; // Stock physique actuel
  stock_quantity: number; // Alias stock_real (legacy)
  stock_forecasted_in: number; // Entrées prévisionnelles (commandes fournisseurs)
  stock_forecasted_out: number; // Sorties prévisionnelles (commandes clients confirmées)
  min_stock: number | null; // Seuil alerte stock minimum
  cost_price: number | null; // Prix de revient unitaire
  archived_at: string | null;
}

/**
 * Paramètres création mouvement stock
 */
export interface CreateMovementParams {
  product_id: string;
  movement_type: MovementType;
  quantity_change: number; // Déjà signé (négatif pour OUT, positif pour IN)
  reason_code: string; // ✅ FIX: Accepter string pour stock_reason_code PostgreSQL (25 valeurs)
  reference_type?: ReferenceType | null;
  reference_id?: string | null;
  notes?: string | null;
  affects_forecast?: boolean; // Default false (mouvement réel)
  forecast_type?: ForecastType;
  channel_id?: string | null; // Auto-injecté si OUT sale (via config hook)
}

/**
 * Filtres recherche mouvements
 */
export interface MovementFilters {
  product_id?: string;
  movement_type?: MovementType | MovementType[];
  reference_type?: ReferenceType;
  reference_id?: string;
  channel_id?: string | null; // Filtrer par canal vente
  affects_forecast?: boolean;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

/**
 * Configuration hook avec injection dépendances
 */
export interface UseStockCoreConfig {
  supabase: SupabaseClient; // Client Supabase (browser/server/edge)
  channelId?: string | null; // Canal vente actif (b2b, ecommerce, retail, wholesale)
  userId: string; // User ID pour audit trails
}

/**
 * API retournée par hook
 */
export interface UseStockCoreReturn {
  // State
  loading: boolean;
  error: string | null;

  // Stock Items (GLOBAL - pas de séparation par canal)
  stockItems: StockItem[];
  getStockItems: (filters?: {
    search?: string;
    archived?: boolean;
  }) => Promise<StockItem[]>;
  getStockItem: (productId: string) => Promise<StockItem | null>;

  // Movements
  movements: StockMovement[];
  getMovements: (filters?: MovementFilters) => Promise<StockMovement[]>;
  createMovement: (params: CreateMovementParams) => Promise<StockMovement>;

  // Analytics par canal (traceability)
  filterByChannel: (channelId: string) => Promise<StockMovement[]>;
  getMovementsByChannel: (
    channelId: string,
    dateFrom?: string,
    dateTo?: string
  ) => Promise<StockMovement[]>;

  // Refresh
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

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

        const items = (data || []) as StockItem[];
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

        const movementsData = (data || []) as StockMovement[];
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
          console.log(
            `✅ [useStockCore] Auto-injection channel_id: ${channelId} (OUT sale)`
          );
        } else {
          console.log(
            `ℹ️ [useStockCore] Pas de channel_id (type=${params.movement_type}, ref=${params.reference_type})`
          );
        }

        // Préparer données mouvement
        const movementData = {
          product_id: params.product_id,
          movement_type: params.movement_type,
          quantity_change: params.quantity_change,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reason_code: params.reason_code,
          reference_type: params.reference_type || null,
          reference_id: params.reference_id || null,
          notes: params.notes || null,
          affects_forecast: params.affects_forecast || false,
          forecast_type: params.forecast_type || null,
          performed_by: userId,
          performed_at: new Date().toISOString(),
          channel_id: finalChannelId, // 🆕 Auto-injecté si OUT sale
        };

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

        console.log(
          `✅ [useStockCore] Mouvement créé: ${data.id} (${params.movement_type}, channel=${finalChannelId || 'NULL'})`
        );

        // Trigger refetch automatique (mouvements sont mis à jour via DB triggers)
        await refetch();

        return data as StockMovement;
      } catch (err) {
        console.error('❌ [useStockCore] Erreur création mouvement:', err);
        throw err;
      }
    },
    [supabase, channelId, userId, getStockItem]
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
  // REFRESH
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
