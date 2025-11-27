/**
 * 📦 Hook: Gestion Réceptions Achats (Purchase Orders)
 *
 * Features:
 * - Chargement items prêts à réception
 * - Calcul automatique différentiel (quantité restante = commandée - déjà reçue)
 * - Validation réceptions (partielles/complètes)
 * - Historique mouvements stock (traçabilité)
 * - Stats dashboard réceptions
 *
 * Workflow:
 * 1. Charger PO confirmé avec items enrichis
 * 2. Calculer quantités restantes (différentiel)
 * 3. User saisit quantités à recevoir
 * 4. Validation → Trigger stock + update statut
 */

'use client';

import { useState, useCallback } from 'react';

import type {
  ReceptionItem,
  ValidateReceptionPayload,
  ReceptionHistory,
  ReceptionShipmentStats,
} from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

export interface PurchaseOrderForReception {
  id: string;
  po_number: string;
  status: string;
  created_at: string;
  expected_delivery_date: string | null;
  received_at: string | null;
  received_by: string | null;

  // Supplier
  organisations: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  } | null;

  // Items enrichis pour réception
  purchase_order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    quantity_received: number | null;
    unit_price_ht: number;
    products: {
      id: string;
      name: string;
      sku: string;
      stock_quantity: number;
      stock_forecasted_in: number;
    };
  }>;
}

export function usePurchaseReceptions() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger un PO avec items pour formulaire réception
   */
  const loadPurchaseOrderForReception = useCallback(
    async (poId: string): Promise<PurchaseOrderForReception | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('purchase_orders')
          .select(
            `
          id,
          po_number,
          status,
          created_at,
          expected_delivery_date,
          received_at,
          received_by,
          organisations (
            id,
            legal_name,
            trade_name
          ),
          purchase_order_items (
            id,
            product_id,
            quantity,
            quantity_received,
            unit_price_ht,
            products (
              id,
              name,
              sku,
              stock_quantity,
              stock_forecasted_in
            )
          )
        `
          )
          .eq('id', poId)
          .single();

        if (fetchError) {
          console.error('Erreur chargement PO pour réception:', fetchError);
          setError(fetchError.message);
          return null;
        }

        return data as PurchaseOrderForReception;
      } catch (err) {
        console.error('Exception chargement PO:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Transformer items PO en ReceptionItems avec calculs
   */
  const prepareReceptionItems = useCallback(
    (purchaseOrder: PurchaseOrderForReception): ReceptionItem[] => {
      return purchaseOrder.purchase_order_items.map(item => {
        const quantityOrdered = item.quantity;
        const quantityAlreadyReceived = item.quantity_received || 0;
        const quantityRemaining = quantityOrdered - quantityAlreadyReceived;

        return {
          purchase_order_item_id: item.id,
          product_id: item.product_id,
          product_name: item.products.name,
          product_sku: item.products.sku,
          quantity_ordered: quantityOrdered,
          quantity_already_received: quantityAlreadyReceived,
          quantity_remaining: quantityRemaining,
          quantity_to_receive: quantityRemaining, // Défaut: tout recevoir
          stock_forecast_impact: quantityRemaining, // Impact si tout reçu
          unit_price_ht: item.unit_price_ht,
        };
      });
    },
    []
  );

  /**
   * Valider réception (Server Action Next.js 15)
   */
  const validateReception = useCallback(
    async (
      payload: ValidateReceptionPayload
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setValidating(true);
        setError(null);

        // ✅ Appeler Server Action (Next.js 15 best practice)
        const { validatePurchaseReception } = await import(
          '../actions/purchase-receptions'
        );
        const result = await validatePurchaseReception(payload);

        if (!result.success) {
          throw new Error(result.error || 'Erreur validation réception');
        }

        return result;
      } catch (err) {
        console.error('Erreur validation réception:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setValidating(false);
      }
    },
    []
  );

  /**
   * Charger historique réceptions (mouvements stock liés)
   */
  const loadReceptionHistory = useCallback(
    async (poId: string): Promise<ReceptionHistory[]> => {
      try {
        // ✅ D'abord récupérer les réceptions liées au PO
        const { data: receptions, error: receptionsError } = await supabase
          .from('purchase_order_receptions')
          .select('id')
          .eq('purchase_order_id', poId);

        if (receptionsError || !receptions || receptions.length === 0) {
          // Pas de réceptions trouvées
          return [];
        }

        const receptionIds = receptions.map(r => r.id);

        // ✅ Récupérer mouvements stock IN liés aux réceptions (reference_type='reception')
        const { data: movements, error: movementsError } = await supabase
          .from('stock_movements')
          .select(
            `
          id,
          quantity_change,
          quantity_before,
          quantity_after,
          performed_at,
          notes,
          performed_by,
          product_id,
          carrier_name,
          tracking_number,
          delivery_note,
          received_by_name,
          products (
            name,
            sku,
            product_images!left(public_url, is_primary)
          ),
          user_profiles!performed_by (
            first_name,
            last_name
          )
        `
          )
          .eq('reference_type', 'reception')
          .in('reference_id', receptionIds)
          .or('affects_forecast.is.null,affects_forecast.is.false')
          .eq('movement_type', 'IN')
          .eq('products.product_images.is_primary', true)
          .order('performed_at', { ascending: false });

        if (movementsError) {
          console.error('Erreur chargement historique:', movementsError);
          return [];
        }

        // Grouper par performed_at (même réception)
        const grouped = new Map<string, ReceptionHistory>();

        movements?.forEach(movement => {
          const key = movement.performed_at;

          // Récupérer le nom de l'utilisateur depuis user_profiles ou fallback
          const userProfile = movement.user_profiles as {
            first_name: string | null;
            last_name: string | null;
          } | null;
          const userName = userProfile
            ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
            : movement.received_by_name || 'Utilisateur';

          if (!grouped.has(key)) {
            grouped.set(key, {
              movement_id: movement.id,
              received_at: movement.performed_at,
              received_by: movement.performed_by,
              received_by_name: userName,
              carrier_name: movement.carrier_name || undefined,
              tracking_number: movement.tracking_number || undefined,
              delivery_note: movement.delivery_note || undefined,
              items: [],
              notes: movement.notes || undefined,
              total_quantity: 0,
            });
          }

          const history = grouped.get(key)!;
          const productData = movement.products as any;
          history.items.push({
            product_name: productData.name,
            product_sku: productData.sku,
            product_image_url:
              productData.product_images?.[0]?.public_url || null,
            quantity_received: movement.quantity_change,
            stock_before: movement.quantity_before,
            stock_after: movement.quantity_after,
          });
          history.total_quantity += movement.quantity_change;
        });

        return Array.from(grouped.values());
      } catch (err) {
        console.error('Exception historique réceptions:', err);
        return [];
      }
    },
    [supabase]
  );

  /**
   * Charger stats dashboard réceptions
   */
  const loadReceptionStats =
    useCallback(async (): Promise<ReceptionShipmentStats> => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // POs confirmés en attente réception
        const { count: pending } = await supabase
          .from('purchase_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'validated');

        // POs partiellement reçus
        const { count: partial } = await supabase
          .from('purchase_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'partially_received');

        // POs complètement reçus aujourd'hui
        const { count: completedToday } = await supabase
          .from('purchase_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'received')
          .gte('received_at', today.toISOString());

        // POs en retard (expected_delivery_date < today)
        const { count: overdue } = await supabase
          .from('purchase_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['validated', 'partially_received'])
          .not('expected_delivery_date', 'is', null)
          .lt('expected_delivery_date', today.toISOString().split('T')[0]);

        // POs urgents (expected_delivery_date < today + 3 jours)
        const threeDays = new Date(today);
        threeDays.setDate(threeDays.getDate() + 3);

        const { count: urgent } = await supabase
          .from('purchase_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['validated', 'partially_received'])
          .not('expected_delivery_date', 'is', null)
          .gte('expected_delivery_date', today.toISOString().split('T')[0])
          .lte('expected_delivery_date', threeDays.toISOString().split('T')[0]);

        return {
          total_pending: pending || 0,
          total_partial: partial || 0,
          total_completed_today: completedToday || 0,
          total_overdue: overdue || 0,
          total_urgent: urgent || 0,
        };
      } catch (err) {
        console.error('Erreur chargement stats réceptions:', err);
        return {
          total_pending: 0,
          total_partial: 0,
          total_completed_today: 0,
          total_overdue: 0,
          total_urgent: 0,
        };
      }
    }, [supabase]);

  /**
   * Charger liste POs prêts à réception (pour page /stocks/receptions)
   */
  const loadPurchaseOrdersReadyForReception = useCallback(
    async (filters?: {
      status?: string;
      search?: string;
      urgent_only?: boolean;
      overdue_only?: boolean;
    }) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('purchase_orders')
          .select(
            `
          id,
          po_number,
          status,
          created_at,
          expected_delivery_date,
          received_at,
          organisations!left (
            id,
            legal_name,
            trade_name
          ),
          purchase_order_items (
            quantity,
            quantity_received
          )
        `
          )
          .order('expected_delivery_date', {
            ascending: true,
            nullsFirst: false,
          });

        // Filtres de statut (dynamique selon page appelante)
        if (!filters?.status) {
          // Par défaut : charger commandes "à recevoir"
          query = query.in('status', ['validated', 'partially_received']);
        } else if (filters.status === 'received') {
          // Historique : charger commandes complètement reçues
          query = query.eq('status', 'received');
        } else if (filters.status === 'partially_received') {
          // Filtre sur partiellement reçues uniquement
          query = query.eq('status', 'partially_received');
        } else {
          // Autres cas : appliquer filtre tel quel
          query = query.eq('status', filters.status as any);
        }

        if (filters?.search) {
          query = query.or(
            `po_number.ilike.%${filters.search}%,organisations.trade_name.ilike.%${filters.search}%,organisations.legal_name.ilike.%${filters.search}%`
          );
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          console.error('Erreur chargement POs:', fetchError);
          setError(fetchError.message);
          return [];
        }

        // Mapper les données pour ajouter supplier_name
        const mappedData = (data || []).map((po: any) => ({
          ...po,
          supplier_name: po.organisations
            ? po.organisations.trade_name || po.organisations.legal_name
            : 'Fournisseur inconnu',
        }));

        return mappedData;
      } catch (err) {
        console.error('Exception chargement POs:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    loading,
    validating,
    error,
    loadPurchaseOrderForReception,
    prepareReceptionItems,
    validateReception,
    loadReceptionHistory,
    loadReceptionStats,
    loadPurchaseOrdersReadyForReception,
  };
}
