/**
 * Hook pour la gestion des mouvements de stock
 * Gère les entrées, sorties, ajustements et transferts de stock
 */

import { useState, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

export type {
  MovementType,
  StockReasonCode,
  StockMovement,
  CreateStockMovementData,
  StockMovementFilters,
  StockMovementStats,
} from './stock-movements-types';
import type {
  StockReasonCode,
  StockMovement,
  StockMovementReferenceEnrichment,
  CreateStockMovementData,
  StockMovementFilters,
  StockMovementStats,
} from './stock-movements-types';
import {
  getReasonDescription as _getReasonDescription,
  getReasonsByCategory as _getReasonsByCategory,
} from './stock-reason-utils';

// Types locaux pour les jointures Supabase nested (PostgREST peut renvoyer
// soit un objet soit un tableau selon la cardinalité détectée).
interface OrganisationMini {
  legal_name: string | null;
  trade_name: string | null;
}
interface RawSalesOrderRow {
  id: string;
  order_number: string | null;
  customer_id: string | null;
  organisations: OrganisationMini | OrganisationMini[] | null;
}
interface RawPurchaseOrderRow {
  id: string;
  po_number: string | null;
  supplier_id: string | null;
  organisations: OrganisationMini | OrganisationMini[] | null;
}

export function useStockMovements() {
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stats, setStats] = useState<StockMovementStats | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Récupérer tous les mouvements avec filtres
  const fetchMovements = useCallback(
    async (filters?: StockMovementFilters) => {
      setLoading(true);
      try {
        // Étape 1 : fetch des mouvements + produits (sans user_profiles, FK inexistante dans le schema PostgREST)
        let query = supabase
          .from('stock_movements')
          .select(
            `
          id,
          product_id,
          movement_type,
          quantity_change,
          quantity_before,
          quantity_after,
          unit_cost,
          reference_type,
          reference_id,
          notes,
          reason_code,
          affects_forecast,
          forecast_type,
          performed_by,
          performed_at,
          created_at,
          updated_at,
          products (
            id,
            name,
            sku,
            product_images!left (
              public_url,
              is_primary
            )
          )
        `
          )
          .order('performed_at', { ascending: false });

        // Appliquer les filtres
        if (filters?.product_id) {
          query = query.eq('product_id', filters.product_id);
        }
        if (filters?.movement_type) {
          query = query.eq('movement_type', filters.movement_type);
        }
        if (filters?.reference_type) {
          query = query.eq('reference_type', filters.reference_type);
        }
        if (filters?.date_from) {
          query = query.gte('performed_at', filters.date_from);
        }
        if (filters?.date_to) {
          query = query.lte('performed_at', filters.date_to);
        }
        if (filters?.performed_by) {
          query = query.eq('performed_by', filters.performed_by);
        }
        if (filters?.affects_forecast !== undefined) {
          query = query.eq('affects_forecast', filters.affects_forecast);
        }

        const { data, error } = await query;

        if (error) throw error;

        const rawMovements = data ?? [];

        // Étape 2 : fetch des profils utilisateurs séparément (pas de FK nommée explicite
        // sur stock_movements.performed_by côté PostgREST — pattern identique à getProductHistory)
        const userIds = Array.from(
          new Set(
            rawMovements
              .map(m => m.performed_by)
              .filter((id): id is string => Boolean(id))
          )
        );

        let userProfilesMap = new Map<
          string,
          { first_name: string | null; last_name: string | null }
        >();

        if (userIds.length > 0) {
          const { data: userProfiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', userIds);

          if (profilesError) {
            console.warn(
              '[useStockMovements] user_profiles fetch:',
              profilesError
            );
          } else if (userProfiles) {
            userProfilesMap = new Map(
              userProfiles.map(p => [
                p.user_id,
                { first_name: p.first_name, last_name: p.last_name },
              ])
            );
          }
        }

        // ── Étape 3 : enrichissement références commandes (max 4 requêtes batchées) ──

        // Regrouper les reference_id par type pour éviter le N+1
        const shipmentIds = rawMovements
          .filter(m => m.reference_type === 'shipment')
          .map(m => m.reference_id)
          .filter((id): id is string => Boolean(id));

        const receptionIds = rawMovements
          .filter(m => m.reference_type === 'reception')
          .map(m => m.reference_id)
          .filter((id): id is string => Boolean(id));

        const directSoIds = rawMovements
          .filter(
            m =>
              m.reference_type === 'sales_order_forecast' ||
              m.reference_type === 'sale'
          )
          .map(m => m.reference_id)
          .filter((id): id is string => Boolean(id));

        // Maps résultats
        const shipmentToSoIdMap = new Map<string, string>();
        const receptionToPOIdMap = new Map<string, string>();
        const soEnrichMap = new Map<
          string,
          { order_number: string; customer_name: string | null }
        >();
        const poEnrichMap = new Map<
          string,
          { po_number: string; supplier_name: string | null }
        >();

        // Requête 1 : shipments → sales_order_id
        if (shipmentIds.length > 0) {
          const { data: shipmentRows, error: shipErr } = await supabase
            .from('sales_order_shipments')
            .select('id, sales_order_id')
            .in('id', shipmentIds);

          if (shipErr) {
            console.warn('[useStockMovements] shipments fetch:', shipErr);
          } else if (shipmentRows) {
            for (const row of shipmentRows) {
              if (row.sales_order_id) {
                shipmentToSoIdMap.set(row.id, row.sales_order_id);
              }
            }
          }
        }

        // Requête 2 : receptions → purchase_order_id
        if (receptionIds.length > 0) {
          const { data: receptionRows, error: recErr } = await supabase
            .from('purchase_order_receptions')
            .select('id, purchase_order_id')
            .in('id', receptionIds);

          if (recErr) {
            console.warn('[useStockMovements] receptions fetch:', recErr);
          } else if (receptionRows) {
            for (const row of receptionRows) {
              if (row.purchase_order_id) {
                receptionToPOIdMap.set(row.id, row.purchase_order_id);
              }
            }
          }
        }

        // Tous les SO IDs à résoudre (directs + via shipments)
        const allSoIds = Array.from(
          new Set([...directSoIds, ...Array.from(shipmentToSoIdMap.values())])
        );

        // Tous les PO IDs à résoudre (via receptions)
        const allPoIds = Array.from(
          new Set(Array.from(receptionToPOIdMap.values()))
        );

        // Requête 3 : sales_orders + organisations customer
        if (allSoIds.length > 0) {
          const { data: soRows, error: soErr } = await supabase
            .from('sales_orders')
            .select(
              'id, order_number, customer_id, organisations!left ( legal_name, trade_name )'
            )
            .in('id', allSoIds);

          if (soErr) {
            console.warn('[useStockMovements] sales_orders fetch:', soErr);
          } else if (soRows) {
            for (const rawRow of soRows) {
              const row = rawRow as unknown as RawSalesOrderRow;
              const org = Array.isArray(row.organisations)
                ? (row.organisations[0] ?? null)
                : row.organisations;
              const customerName = org?.trade_name ?? org?.legal_name ?? null;
              soEnrichMap.set(row.id, {
                order_number: row.order_number ?? row.id.slice(0, 8),
                customer_name: customerName,
              });
            }
          }
        }

        // Requête 4 : purchase_orders + organisations supplier
        if (allPoIds.length > 0) {
          const { data: poRows, error: poErr } = await supabase
            .from('purchase_orders')
            .select(
              'id, po_number, supplier_id, organisations!left ( legal_name, trade_name )'
            )
            .in('id', allPoIds);

          if (poErr) {
            console.warn('[useStockMovements] purchase_orders fetch:', poErr);
          } else if (poRows) {
            for (const rawRow of poRows) {
              const row = rawRow as unknown as RawPurchaseOrderRow;
              const org = Array.isArray(row.organisations)
                ? (row.organisations[0] ?? null)
                : row.organisations;
              const supplierName = org?.trade_name ?? org?.legal_name ?? null;
              poEnrichMap.set(row.id, {
                po_number: row.po_number ?? row.id.slice(0, 8),
                supplier_name: supplierName,
              });
            }
          }
        }

        // ── Étape 4 : Enrichir les produits avec primary_image_url + user_profiles + reference_enrichment ──
        const enrichedMovements = rawMovements.map(movement => {
          // Calcul reference_enrichment selon reference_type
          let referenceEnrichment: StockMovementReferenceEnrichment | null =
            null;

          if (movement.reference_type === 'shipment' && movement.reference_id) {
            const soId = shipmentToSoIdMap.get(movement.reference_id);
            if (soId) {
              referenceEnrichment = {
                salesOrder: soEnrichMap.get(soId) ?? null,
              };
            }
          } else if (
            movement.reference_type === 'reception' &&
            movement.reference_id
          ) {
            const poId = receptionToPOIdMap.get(movement.reference_id);
            if (poId) {
              referenceEnrichment = {
                purchaseOrder: poEnrichMap.get(poId) ?? null,
              };
            }
          } else if (
            (movement.reference_type === 'sales_order_forecast' ||
              movement.reference_type === 'sale') &&
            movement.reference_id
          ) {
            referenceEnrichment = {
              salesOrder: soEnrichMap.get(movement.reference_id) ?? null,
            };
          }

          return {
            ...movement,
            products: movement.products
              ? {
                  ...movement.products,
                  primary_image_url:
                    movement.products.product_images?.[0]?.public_url ?? null,
                }
              : null,
            user_profiles: movement.performed_by
              ? (userProfilesMap.get(movement.performed_by) ?? null)
              : null,
            reference_enrichment: referenceEnrichment,
          };
        });

        setMovements(enrichedMovements as unknown as StockMovement[]);
      } catch (error) {
        console.error(
          'Erreur lors de la récupération des mouvements:',
          error instanceof Error ? error.message : JSON.stringify(error)
        );
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les mouvements de stock',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  // Récupérer les statistiques des mouvements
  const fetchStats = useCallback(
    async (filters?: StockMovementFilters) => {
      try {
        let query = supabase
          .from('stock_movements')
          .select('movement_type, quantity_change');

        // Appliquer les mêmes filtres que pour les mouvements
        if (filters?.product_id) {
          query = query.eq('product_id', filters.product_id);
        }
        if (filters?.date_from) {
          query = query.gte('performed_at', filters.date_from);
        }
        if (filters?.date_to) {
          query = query.lte('performed_at', filters.date_to);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calculer les statistiques
        const statsData = data?.reduce(
          (acc, movement) => {
            acc.total_movements++;
            switch (movement.movement_type) {
              case 'IN':
                acc.total_in += Math.abs(movement.quantity_change);
                break;
              case 'OUT':
                acc.total_out += Math.abs(movement.quantity_change);
                break;
              case 'ADJUST':
                acc.total_adjustments++;
                break;
              case 'TRANSFER':
                acc.total_transfers++;
                break;
            }
            return acc;
          },
          {
            total_movements: 0,
            total_in: 0,
            total_out: 0,
            total_adjustments: 0,
            total_transfers: 0,
          }
        );

        setStats(statsData ?? null);
      } catch (error) {
        console.error(
          'Erreur lors de la récupération des statistiques:',
          error
        );
      }
    },
    [supabase]
  );

  // Créer un mouvement de stock
  const createMovement = useCallback(
    async (data: CreateStockMovementData) => {
      setLoading(true);
      try {
        // 1. Récupérer le stock actuel du produit (priorité stock_real)
        const { data: product, error: productError } = await supabase
          .from('products')
          .select(
            'stock_real, stock_quantity, stock_forecasted_in, stock_forecasted_out'
          )
          .eq('id', data.product_id)
          .single();

        if (productError) throw productError;

        const currentStock = product.stock_real ?? product.stock_quantity ?? 0;

        // 2. Calculer la nouvelle quantité selon le type de mouvement
        let newQuantity: number;
        let quantityChange: number;

        switch (data.movement_type) {
          case 'IN':
            quantityChange = Math.abs(data.quantity_change);
            newQuantity = currentStock + quantityChange;
            break;
          case 'OUT': {
            const quantityToRemove = Math.abs(data.quantity_change);

            // Validation stricte ERP : impossible de retirer plus que le stock disponible
            if (quantityToRemove > currentStock) {
              throw new Error(
                `Stock insuffisant. Vous tentez de retirer ${quantityToRemove} unités mais seulement ${currentStock} unité(s) disponible(s) en stock.`
              );
            }

            quantityChange = -quantityToRemove;
            newQuantity = currentStock + quantityChange;
            break;
          }
          case 'ADJUST': {
            // Pour un ajustement, quantity_change représente la nouvelle quantité souhaitée
            const newTargetQuantity = Math.abs(data.quantity_change);

            // Validation : quantité cible doit être >= 0
            if (newTargetQuantity < 0) {
              throw new Error(
                "La quantité cible d'un ajustement doit être supérieure ou égale à 0"
              );
            }

            newQuantity = newTargetQuantity;
            quantityChange = newQuantity - currentStock;
            break;
          }
          case 'TRANSFER': {
            // Pour un transfert, on gère comme une sortie pour l'instant
            const quantityToTransfer = Math.abs(data.quantity_change);

            // Validation stricte ERP : impossible de transférer plus que le stock disponible
            if (quantityToTransfer > currentStock) {
              throw new Error(
                `Stock insuffisant pour le transfert. Vous tentez de transférer ${quantityToTransfer} unités mais seulement ${currentStock} unité(s) disponible(s) en stock.`
              );
            }

            quantityChange = -quantityToTransfer;
            newQuantity = currentStock + quantityChange;
            break;
          }
          default:
            throw new Error('Type de mouvement invalide');
        }

        // 3. Créer le mouvement de stock avec nouvelles colonnes
        const { data: movement, error: movementError } = await supabase
          .from('stock_movements')
          .insert([
            {
              product_id: data.product_id,
              movement_type: data.movement_type,
              quantity_change: quantityChange,
              quantity_before: currentStock,
              quantity_after: newQuantity,
              unit_cost: data.unit_cost,
              reference_type: data.reference_type,
              reference_id: data.reference_id,
              notes: data.notes,
              reason_code: data.reason_code as string | null | undefined,
              affects_forecast: data.affects_forecast ?? false,
              forecast_type: data.forecast_type,
              performed_by: (await supabase.auth.getUser()).data.user?.id,
            } as unknown as import('@verone/types').Database['public']['Tables']['stock_movements']['Insert'],
          ])
          .select('id')
          .single();

        if (movementError) throw movementError;

        // Le trigger se charge automatiquement de mettre à jour le stock du produit

        toast({
          title: 'Succès',
          description: 'Mouvement de stock créé avec succès',
        });

        // Rafraîchir les données
        await fetchMovements();

        return movement;
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Erreur lors de la création du mouvement:', error);
        toast({
          title: 'Erreur',
          description:
            error.message ?? 'Impossible de créer le mouvement de stock',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchMovements]
  );

  // Récupérer le stock disponible avancé (réel - prévisionnel)
  const getAvailableStock = useCallback(
    async (productId: string) => {
      try {
        const { data, error } = await supabase.rpc(
          'get_available_stock_advanced',
          { p_product_id: productId }
        );

        if (error) throw error;

        return (
          data?.[0] ?? {
            stock_real: 0,
            stock_forecasted_in: 0,
            stock_forecasted_out: 0,
            stock_available: 0,
            stock_total_forecasted: 0,
          }
        );
      } catch (error) {
        console.error(
          'Erreur lors de la récupération du stock disponible:',
          error
        );
        return {
          stock_real: 0,
          stock_forecasted_in: 0,
          stock_forecasted_out: 0,
          stock_available: 0,
          stock_total_forecasted: 0,
        };
      }
    },
    [supabase]
  );

  // Récupérer l'historique d'un produit spécifique
  const getProductHistory = useCallback(
    async (productId: string) => {
      setLoading(true);
      try {
        // Première requête : récupérer les mouvements de stock
        // ✅ FIX Phase 3.7: Filtrer UNIQUEMENT mouvements réels (affects_forecast = false OU NULL)
        const { data: movements, error: movementsError } = await supabase
          .from('stock_movements')
          .select(
            'id, product_id, movement_type, quantity_change, quantity_before, quantity_after, unit_cost, reference_type, reference_id, notes, reason_code, affects_forecast, forecast_type, performed_by, performed_at, created_at, updated_at'
          )
          .eq('product_id', productId)
          .or('affects_forecast.is.null,affects_forecast.eq.false') // Exclut mouvements prévisionnels
          .order('performed_at', { ascending: false });

        if (movementsError) throw movementsError;

        if (!movements || movements.length === 0) {
          return [];
        }

        // Récupérer les IDs utilisateurs uniques
        const userIds = [
          ...new Set(movements.map(m => m.performed_by).filter(Boolean)),
        ];

        // Deuxième requête : récupérer les profils utilisateurs
        const { data: userProfiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        if (profilesError) {
          console.warn('Erreur récupération profils:', profilesError);
        }

        // Combiner les données
        const enrichedMovements = movements.map(movement => ({
          ...movement,
          user_profiles:
            userProfiles?.find(
              profile => profile.user_id === movement.performed_by
            ) ?? null,
        }));

        return enrichedMovements;
      } catch (error) {
        console.error("Erreur lors de la récupération de l'historique:", error);
        toast({
          title: 'Erreur',
          description: "Impossible de récupérer l'historique du produit",
          variant: 'destructive',
        });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  // Fonctions utilitaires pour les mouvements courants
  const addStock = useCallback(
    (
      productId: string,
      quantity: number,
      unitCost?: number,
      notes?: string
    ) => {
      return createMovement({
        product_id: productId,
        movement_type: 'IN',
        quantity_change: quantity,
        unit_cost: unitCost,
        reference_type: 'manual_entry',
        notes: notes,
      });
    },
    [createMovement]
  );

  const removeStock = useCallback(
    (
      productId: string,
      quantity: number,
      referenceType?: string,
      referenceId?: string,
      notes?: string
    ) => {
      return createMovement({
        product_id: productId,
        movement_type: 'OUT',
        quantity_change: quantity,
        reference_type: referenceType ?? 'manual_entry',
        reference_id: referenceId,
        notes: notes,
      });
    },
    [createMovement]
  );

  const adjustStock = useCallback(
    (productId: string, newQuantity: number, notes?: string) => {
      return createMovement({
        product_id: productId,
        movement_type: 'ADJUST',
        quantity_change: newQuantity,
        reference_type: 'inventory_adjustment',
        notes: notes,
      });
    },
    [createMovement]
  );

  const getReasonDescription = useCallback(
    (reasonCode: StockReasonCode): string => _getReasonDescription(reasonCode),
    []
  );

  const getReasonsByCategory = useCallback(() => _getReasonsByCategory(), []);

  return {
    // État
    loading,
    movements,
    stats,

    // Actions principales
    fetchMovements,
    fetchStats,
    createMovement,
    getAvailableStock,
    getProductHistory,

    // Actions simplifiées
    addStock,
    removeStock,
    adjustStock,

    // Helpers motifs
    getReasonDescription,
    getReasonsByCategory,
  };
}
