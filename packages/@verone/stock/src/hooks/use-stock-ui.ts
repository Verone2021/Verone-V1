/**
 * Hook UI - Wrapper use-stock-core pour composants React
 *
 * Responsabilités UI:
 * - Auto-injection Supabase client browser
 * - Auto-détection userId depuis session auth
 * - Toast notifications (succès/erreurs)
 * - Loading states optimisés
 * - Error handling avec retry logic
 *
 * @module use-stock-ui
 * @since Phase 2.2 - 2025-10-31
 *
 * @example
 * // Usage composant React
 * function StockDashboard() {
 *   const stock = useStockUI({ channelId: 'xxx-b2b' })
 *
 *   const handleCreateMovement = async () => {
 *     await stock.createMovement({
 *       product_id: 'yyy',
 *       movement_type: 'OUT',
 *       quantity_change: -10,
 *       reason_code: 'sale'
 *     })
 *     // ✅ Toast automatique: "Mouvement créé avec succès"
 *   }
 *
 *   return (
 *     <div>
 *       {stock.loading && <Spinner />}
 *       {stock.error && <Alert>{stock.error}</Alert>}
 *       {stock.stockItems.map(...)}
 *     </div>
 *   )
 * }
 */

'use client';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';
import { createClient } from '@verone/utils/supabase/client';

import {
  useStockCore,
  type UseStockCoreReturn,
  type CreateMovementParams,
  type MovementFilters,
  type StockMovement,
} from '../hooks/core/use-stock-core';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Configuration hook UI (simplifié vs use-stock-core)
 */
export interface UseStockUIConfig {
  channelId?: string | null; // Canal vente actif (optional, auto-injecté si OUT sale)
  autoLoad?: boolean; // Charger stocks automatiquement au montage (default: true)
  initialFilters?: MovementFilters; // Filtres initiaux mouvements
}

/**
 * API retournée par hook UI (extend use-stock-core avec toast)
 */
export interface UseStockUIReturn
  extends Omit<UseStockCoreReturn, 'createMovement'> {
  // Override avec toast notifications
  createMovement: (
    params: CreateMovementParams
  ) => Promise<StockMovement | null>;

  // Méthodes UI avec toast
  createMovementWithToast: (
    params: CreateMovementParams,
    successMessage?: string
  ) => Promise<StockMovement | null>;

  // États UI enrichis
  isAuthenticated: boolean;
  userId: string | null;
  currentChannel: { id: string; name: string } | null;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useStockUI(config: UseStockUIConfig = {}): UseStockUIReturn {
  const { channelId = null, autoLoad = true, initialFilters } = config;

  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // =========================================================================
  // AUTHENTIFICATION & SESSION
  // =========================================================================

  /**
   * Récupérer userId depuis session Supabase
   */
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          // ✅ FIX 4-bis: Ne pas logger AuthSessionMissingError (normal pendant logout)
          if (error.message !== 'Auth session missing!') {
            console.error('❌ [useStockUI] Erreur auth:', error);
          }
          setIsAuthenticated(false);
          setUserId(null);
          return;
        }

        if (user) {
          setUserId(user.id);
          setIsAuthenticated(true);
          console.warn('✅ [useStockUI] Auth OK, user:', user.id);
        } else {
          setIsAuthenticated(false);
          setUserId(null);
        }
      } catch (err) {
        // ✅ FIX 4-bis: Ne pas logger AuthSessionMissingError (normal pendant logout)
        const isAuthSessionMissing =
          err instanceof Error && err.message === 'Auth session missing!';
        if (!isAuthSessionMissing) {
          console.error('❌ [useStockUI] Exception auth:', err);
        }
        setIsAuthenticated(false);
        setUserId(null);
      }
    };

    void getUser();
  }, [supabase]);

  /**
   * Récupérer infos canal si channelId fourni
   */
  useEffect(() => {
    if (!channelId) {
      setCurrentChannel(null);
      return;
    }

    const fetchChannel = async () => {
      try {
        // ✅ FIX: Vérifier authentification AVANT fetch (Console Zero Tolerance)
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Si pas d'utilisateur, retourner état neutre sans fetch
        if (!user) {
          setCurrentChannel(null);
          return;
        }

        // Utilisateur authentifié → fetch autorisé
        const { data, error } = await supabase
          .from('sales_channels')
          .select('id, name, code')
          .eq('id', channelId)
          .single();

        if (error) throw error;

        if (data) {
          setCurrentChannel({ id: data.id, name: data.name });
          console.warn(
            `✅ [useStockUI] Canal actif: ${data.name} (${data.code})`
          );
        }
      } catch (err) {
        console.error('❌ [useStockUI] Erreur fetch canal:', err);
        setCurrentChannel(null);
      }
    };

    void fetchChannel();
  }, [channelId, supabase]);

  // =========================================================================
  // HOOK CORE avec Dependency Injection
  // =========================================================================

  const stockCore = useStockCore({
    supabase,
    channelId,
    userId: userId ?? 'anonymous', // Fallback si pas auth
  });

  // =========================================================================
  // CHARGEMENT AUTO AU MONTAGE
  // =========================================================================

  useEffect(() => {
    if (autoLoad && isAuthenticated && userId) {
      console.warn('🔄 [useStockUI] Auto-load stocks au montage');

      // Charger stocks + mouvements initiaux
      Promise.all([
        stockCore.getStockItems({ archived: false }),
        stockCore.getMovements(initialFilters ?? { limit: 100 }),
      ]).catch(err => {
        // ✅ FIX 4-ter: Ne pas afficher toast si AuthSessionMissingError (logout en cours)
        const isAuthSessionMissing =
          err instanceof Error && err.message.includes('Auth session missing');
        const isNetworkError =
          err instanceof Error && err.message.includes('Failed to fetch');

        if (!isAuthSessionMissing && !isNetworkError) {
          console.error('❌ [useStockUI] Erreur auto-load:', err);
          toast.error('Impossible de charger les données stock');
        }
        // Sinon on ignore silencieusement (logout en cours)
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, isAuthenticated, userId, initialFilters]);

  // =========================================================================
  // MÉTHODES UI avec TOAST NOTIFICATIONS
  // =========================================================================

  /**
   * Créer mouvement avec toast automatique
   */
  const createMovement = async (
    params: CreateMovementParams
  ): Promise<StockMovement | null> => {
    return createMovementWithToast(params);
  };

  /**
   * Créer mouvement avec toast custom
   */
  const createMovementWithToast = async (
    params: CreateMovementParams,
    successMessage?: string
  ): Promise<StockMovement | null> => {
    if (!isAuthenticated || !userId) {
      toast.error('Vous devez être connecté pour créer un mouvement stock');
      return null;
    }

    try {
      const movement = await stockCore.createMovement(params);

      // Toast succès
      toast.success(
        successMessage ??
          `Mouvement créé : ${params.movement_type} de ${Math.abs(params.quantity_change)} unités`
      );

      return movement;
    } catch (err) {
      console.error('❌ [useStockUI] Erreur création mouvement:', err);

      // Toast erreur
      toast.error(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la création du mouvement'
      );

      return null;
    }
  };

  // =========================================================================
  // RETURN API UI
  // =========================================================================

  return {
    // États core
    ...stockCore,

    // Override avec toast
    createMovement,
    createMovementWithToast,

    // États UI enrichis
    isAuthenticated,
    userId,
    currentChannel,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export types from core for convenience
export type {
  StockMovement,
  StockItem,
  CreateMovementParams,
  MovementFilters,
  MovementType,
  ReferenceType,
  ReasonCode,
  ForecastType,
} from '../hooks/core/use-stock-core';
