/**
 * 📦 Hook: Gestion Expéditions Ventes (Sales Orders)
 *
 * Features:
 * - Chargement items prêts à expédition
 * - Calcul automatique différentiel (quantité restante = commandée - déjà expédiée)
 * - Vérification stock disponible avant expédition
 * - Validation expéditions (partielles/complètes)
 * - Intégration transporteurs (Packlink, Mondial Relay, Chronotruck)
 * - Historique mouvements stock (traçabilité)
 * - Stats dashboard expéditions
 *
 * Workflow:
 * 1. Charger SO confirmé avec items enrichis
 * 2. Calculer quantités restantes (différentiel)
 * 3. Vérifier stock disponible
 * 4. User saisit quantités à expédier + transporteur
 * 5. Validation → Trigger stock + update statut
 */

'use client';

import { useState, useCallback } from 'react';

import type {
  ShipmentItem,
  ValidateShipmentPayload,
  ShipmentHistory,
  ReceptionShipmentStats,
} from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';

export interface SalesOrderForShipment {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  expected_delivery_date: string | null;
  shipped_at: string | null;
  shipped_by: string | null;
  total_ttc?: number; // Total TTC pour assurance

  // Customer (polymorphic)
  customer_id: string;
  customer_type: string; // 'organization' | 'individual'
  customer_name?: string; // Chargé dynamiquement selon customer_type

  // Shipping address (pré-remplir formulaire)
  shipping_address?: Record<string, unknown>;

  // Relations jointes (polymorphiques)
  organisations?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    email?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    postal_code?: string;
    city?: string;
    region?: string;
  };

  // Items enrichis pour expédition
  sales_order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    quantity_shipped: number | null;
    unit_price_ht: number;
    products: {
      id: string;
      name: string;
      sku: string;
      stock_quantity: number;
      stock_real: number;
      stock_forecasted_out: number;
      product_images?: Array<{
        public_url: string;
        is_primary: boolean;
      }>;
    };
  }>;
}

export function useSalesShipments() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger un SO avec items pour formulaire expédition
   */
  const loadSalesOrderForShipment = useCallback(
    async (soId: string): Promise<SalesOrderForShipment | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('sales_orders')
          .select(
            `
          id,
          order_number,
          status,
          created_at,
          expected_delivery_date,
          shipped_at,
          shipped_by,
          shipping_address,
          customer_id,
          customer_type,
          individual_customer_id,
          sales_order_items (
            id,
            product_id,
            quantity,
            quantity_shipped,
            unit_price_ht,
            products (
              id,
              name,
              sku,
              stock_quantity,
              stock_real,
              stock_forecasted_out,
              product_images!left (
                public_url,
                is_primary
              )
            )
          )
        `
          )
          .eq('id', soId)
          .single();

        if (fetchError) {
          console.error('Erreur chargement SO pour expédition:', fetchError);
          setError(fetchError.message);
          return null;
        }

        if (!data) {
          return null;
        }

        // Charger nom client selon customer_type (relation polymorphique)
        let customerName = 'Client inconnu';
        let organisationData: SalesOrderForShipment['organisations'] | null =
          null;

        if (data.customer_type === 'organization' && data.customer_id) {
          const { data: org } = await supabase
            .from('organisations')
            .select(
              'id, legal_name, trade_name, email, phone, address_line1, address_line2, postal_code, city, region'
            )
            .eq('id', data.customer_id)
            .single();

          if (org) {
            customerName = getOrganisationDisplayName(org);
            organisationData = {
              ...org,
              email: org.email ?? undefined,
              phone: org.phone ?? undefined,
              address_line1: org.address_line1 ?? undefined,
              address_line2: org.address_line2 ?? undefined,
              postal_code: org.postal_code ?? undefined,
              city: org.city ?? undefined,
              region: org.region ?? undefined,
            };
          }
        } else if (
          data.customer_type === 'individual' &&
          data.individual_customer_id
        ) {
          const { data: indiv } = await supabase
            .from('individual_customers')
            .select('first_name, last_name')
            .eq('id', data.individual_customer_id)
            .single();

          if (indiv) {
            customerName = `${indiv.first_name} ${indiv.last_name}`;
          }
        }

        // Charger les expéditions Packlink en cours (a_payer) pour cette commande
        // Ces quantités ne sont PAS dans quantity_shipped (trigger skip pour a_payer)
        const { data: pendingShipments } = await supabase
          .from('sales_order_shipments')
          .select('product_id, quantity_shipped')
          .eq('sales_order_id', soId)
          .eq('packlink_status', 'a_payer');

        const pendingByProduct = new Map<string, number>();
        for (const ps of pendingShipments ?? []) {
          const current = pendingByProduct.get(ps.product_id) ?? 0;
          pendingByProduct.set(ps.product_id, current + ps.quantity_shipped);
        }

        return {
          ...data,
          customer_name: customerName,
          organisations: organisationData,
          _pendingPacklinkByProduct: Object.fromEntries(pendingByProduct),
        } as SalesOrderForShipment & {
          _pendingPacklinkByProduct: Record<string, number>;
        };
      } catch (err) {
        console.error('Exception chargement SO:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Transformer items SO en ShipmentItems avec calculs
   */
  const prepareShipmentItems = useCallback(
    (salesOrder: SalesOrderForShipment): ShipmentItem[] => {
      // Récupérer les quantités Packlink en cours (a_payer, pas encore dans quantity_shipped)
      const pendingMap =
        (
          salesOrder as SalesOrderForShipment & {
            _pendingPacklinkByProduct?: Record<string, number>;
          }
        )._pendingPacklinkByProduct ?? {};

      return salesOrder.sales_order_items.map(item => {
        const quantityOrdered = item.quantity;
        const quantityAlreadyShipped = item.quantity_shipped ?? 0;
        const pendingPacklink = pendingMap[item.product_id] ?? 0;
        const quantityRemaining =
          quantityOrdered - quantityAlreadyShipped - pendingPacklink;
        const stockAvailable = item.products.stock_real ?? 0;

        // Extraire l'image principale du produit
        const primaryImage = item.products.product_images?.find(
          img => img.is_primary
        );
        const imageUrl =
          primaryImage?.public_url ??
          item.products.product_images?.[0]?.public_url ??
          null;

        return {
          sales_order_item_id: item.id,
          product_id: item.product_id,
          product_name: item.products.name,
          product_sku: item.products.sku,
          primary_image_url: imageUrl,
          quantity_ordered: quantityOrdered,
          quantity_already_shipped: quantityAlreadyShipped,
          quantity_remaining: quantityRemaining,
          quantity_to_ship: quantityRemaining, // Défaut: quantité restante (le trigger DB ajuste le stock)
          stock_available: stockAvailable,
          unit_price_ht: item.unit_price_ht,
        };
      });
    },
    []
  );

  /**
   * Valider expédition
   * Appelle la Server Action validateSalesShipment()
   */
  const validateShipment = useCallback(
    async (
      payload: Omit<
        ValidateShipmentPayload,
        'carrier_info' | 'shipping_address'
      > & {
        tracking_number?: string;
        delivery_method?: 'pickup' | 'hand_delivery' | 'manual' | 'packlink';
        carrier_name?: string;
        carrier_service?: string;
        shipping_cost?: number;
        estimated_delivery_at?: string;
        /** Référence expédition Packlink (ex: FR2026PRO0000890560) */
        packlink_shipment_id?: string;
        /** Statut transport Packlink (Verone paie Packlink, PAS le paiement client) */
        packlink_status?:
          | 'a_payer'
          | 'paye'
          | 'in_transit'
          | 'delivered'
          | 'incident';
      }
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setValidating(true);
        setError(null);
        const { validateSalesShipment } = await import(
          '../actions/sales-shipments'
        );
        return await validateSalesShipment(payload);
      } catch (err) {
        console.error('Erreur validation expédition:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        };
      } finally {
        setValidating(false);
      }
    },
    []
  );

  /**
   * Charger historique expéditions
   * Source primaire: sales_order_shipments (nouvelles expéditions)
   * Fallback: stock_movements avec reference_type='sale' (legacy)
   */
  const loadShipmentHistory = useCallback(
    async (soId: string): Promise<ShipmentHistory[]> => {
      try {
        // 1. Source primaire : sales_order_shipments (nouvelles expéditions)
        const { data: shipments, error: shipmentsError } = await supabase
          .from('sales_order_shipments')
          .select(
            `
            id, shipped_at, tracking_number, notes, quantity_shipped, product_id, shipped_by,
            products:product_id (name, sku, product_images!left(public_url, is_primary))
          `
          )
          .eq('sales_order_id', soId)
          .order('shipped_at', { ascending: false });

        if (!shipmentsError && shipments && shipments.length > 0) {
          // Résoudre les noms des expéditeurs (shipped_by UUID → nom)
          const shippedByIds = [
            ...new Set(
              shipments.filter(s => s.shipped_by).map(s => s.shipped_by)
            ),
          ];
          const profilesMap = new Map<string, string>();
          if (shippedByIds.length > 0) {
            const { data: profiles } = await supabase
              .from('user_profiles')
              .select('user_id, first_name, last_name')
              .in('user_id', shippedByIds);
            if (profiles) {
              for (const p of profiles) {
                profilesMap.set(
                  p.user_id,
                  `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
                );
              }
            }
          }

          const grouped = new Map<string, ShipmentHistory>();
          for (const s of shipments) {
            const key = s.shipped_at;
            const product = s.products as unknown as {
              name: string;
              sku: string;
              product_images?: Array<{
                public_url: string;
                is_primary: boolean;
              }>;
            } | null;

            // Extraire image principale
            const primaryImage = product?.product_images?.find(
              img => img.is_primary
            );
            const imageUrl =
              primaryImage?.public_url ??
              product?.product_images?.[0]?.public_url ??
              undefined;

            if (!grouped.has(key)) {
              grouped.set(key, {
                shipment_id: s.id,
                shipped_at: s.shipped_at,
                carrier_name: 'Manuel',
                items: [],
                total_quantity: 0,
                delivery_status: 'delivered',
                tracking_number: s.tracking_number ?? undefined,
                shipped_by_name: s.shipped_by
                  ? (profilesMap.get(s.shipped_by) ?? undefined)
                  : undefined,
                notes: s.notes ?? undefined,
              });
            }
            const h = grouped.get(key)!;
            h.items.push({
              product_name: product?.name ?? 'Produit inconnu',
              product_sku: product?.sku ?? '-',
              quantity_shipped: s.quantity_shipped,
              product_image_url: imageUrl,
            });
            h.total_quantity += s.quantity_shipped;
          }
          return Array.from(grouped.values());
        }

        // 2. Fallback : stock_movements legacy (reference_type = 'sale')
        const { data: movements, error: movementsError } = await supabase
          .from('stock_movements')
          .select(
            `
            id, quantity_change, performed_at, notes, product_id,
            carrier_name, tracking_number,
            products (name, sku)
          `
          )
          .eq('reference_type', 'sale')
          .eq('reference_id', soId)
          .eq('movement_type', 'OUT')
          .order('performed_at', { ascending: false });

        if (movementsError) {
          console.error('Erreur chargement historique legacy:', movementsError);
          return [];
        }

        const grouped = new Map<string, ShipmentHistory>();
        movements?.forEach(m => {
          const key = m.performed_at;
          const product = m.products as unknown as {
            name: string;
            sku: string;
          };
          if (!grouped.has(key)) {
            grouped.set(key, {
              shipment_id: m.id,
              shipped_at: m.performed_at,
              carrier_name: m.carrier_name ?? 'Manuel',
              tracking_number: m.tracking_number ?? undefined,
              items: [],
              total_quantity: 0,
              delivery_status: 'delivered',
            });
          }
          const h = grouped.get(key)!;
          h.items.push({
            product_name: product.name,
            product_sku: product.sku,
            quantity_shipped: Math.abs(m.quantity_change),
          });
          h.total_quantity += Math.abs(m.quantity_change);
        });

        return Array.from(grouped.values());
      } catch (err) {
        console.error('Exception historique expéditions:', err);
        return [];
      }
    },
    [supabase]
  );

  /**
   * Charger stats dashboard expéditions
   */
  const loadShipmentStats =
    useCallback(async (): Promise<ReceptionShipmentStats> => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // SOs confirmés en attente expédition
        const { count: pending } = await supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'validated');

        // SOs partiellement expédiés
        const { count: partial } = await supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'partially_shipped');

        // SOs complètement expédiés aujourd'hui
        const { count: completedToday } = await supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'shipped')
          .gte('shipped_at', today.toISOString());

        // SOs en retard (expected_delivery_date < today)
        const { count: overdue } = await supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['validated', 'partially_shipped'])
          .not('expected_delivery_date', 'is', null)
          .lt('expected_delivery_date', today.toISOString().split('T')[0]);

        // SOs urgents (expected_delivery_date < today + 3 jours)
        const threeDays = new Date(today);
        threeDays.setDate(threeDays.getDate() + 3);

        const { count: urgent } = await supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['validated', 'partially_shipped'])
          .not('expected_delivery_date', 'is', null)
          .gte('expected_delivery_date', today.toISOString().split('T')[0])
          .lte('expected_delivery_date', threeDays.toISOString().split('T')[0]);

        return {
          total_pending: pending ?? 0,
          total_partial: partial ?? 0,
          total_completed_today: completedToday ?? 0,
          total_overdue: overdue ?? 0,
          total_urgent: urgent ?? 0,
        };
      } catch (err) {
        console.error('Erreur chargement stats expéditions:', err);
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
   * Charger liste SOs prêts à expédition (pour page /stocks/expeditions)
   */
  const loadSalesOrdersReadyForShipment = useCallback(
    async (filters?: {
      status?: string;
      search?: string;
      urgent_only?: boolean;
      overdue_only?: boolean;
    }) => {
      try {
        setLoading(true);
        setError(null);

        // Déterminer les statuts à filtrer
        const defaultStatuses = ['validated', 'partially_shipped'] as const;

        let query = supabase
          .from('sales_orders')
          .select(
            `
          id,
          order_number,
          status,
          created_at,
          expected_delivery_date,
          shipped_at,
          customer_id,
          customer_type,
          individual_customer_id,
          sales_order_items (
            id,
            product_id,
            quantity,
            quantity_shipped,
            unit_price_ht,
            products (
              id,
              name,
              sku,
              stock_real,
              product_images!left (
                public_url,
                is_primary
              )
            )
          )
        `
          )
          .in('status', defaultStatuses)
          .order('expected_delivery_date', {
            ascending: true,
            nullsFirst: false,
          });

        // Filtres
        if (filters?.status) {
          // Remplacer le filtre par défaut si un statut spécifique est demandé
          query = supabase
            .from('sales_orders')
            .select(
              `
            id,
            order_number,
            status,
            created_at,
            expected_delivery_date,
            shipped_at,
            customer_id,
            customer_type,
            individual_customer_id,
            sales_order_items (
              id,
              product_id,
              quantity,
              quantity_shipped,
              unit_price_ht,
              products (
                id,
                name,
                sku,
                stock_real,
                product_images!left (
                  public_url,
                  is_primary
                )
              )
            )
          `
            )
            .eq(
              'status',
              filters.status as
                | 'draft'
                | 'partially_shipped'
                | 'shipped'
                | 'delivered'
                | 'cancelled'
                | 'pending_approval'
                | 'validated'
                | 'closed'
            )
            .order('expected_delivery_date', {
              ascending: true,
              nullsFirst: false,
            });
        }

        if (filters?.search) {
          // TODO: Recherche client après implémentation RPC get_customer_name()
          query = query.ilike('order_number', `%${filters.search}%`);
        }

        const { data: orders, error: fetchError } = await query;

        if (fetchError) {
          console.error('Erreur chargement SOs:', fetchError);
          setError(fetchError.message);
          return [];
        }

        if (!orders || orders.length === 0) {
          return [];
        }

        // Charger noms clients selon customer_type (relation polymorphique)
        const orgIds = orders
          .filter(o => o.customer_type === 'organization' && o.customer_id)
          .map(o => o.customer_id)
          .filter((id): id is string => id !== null);

        const indivIds = orders
          .filter(
            o => o.customer_type === 'individual' && o.individual_customer_id
          )
          .map(o => o.individual_customer_id)
          .filter((id): id is string => id !== null);

        // Query organisations si nécessaire
        const organisationsMap = new Map();
        if (orgIds.length > 0) {
          const { data: orgs } = await supabase
            .from('organisations')
            .select('id, legal_name, trade_name')
            .in('id', orgIds);

          if (orgs) {
            orgs.forEach(org =>
              organisationsMap.set(org.id, org.trade_name ?? org.legal_name)
            );
          }
        }

        // Query individual_customers si nécessaire
        const individualsMap = new Map();
        if (indivIds.length > 0) {
          const { data: indivs } = await supabase
            .from('individual_customers')
            .select('id, first_name, last_name')
            .in('id', indivIds);

          if (indivs) {
            indivs.forEach(indiv =>
              individualsMap.set(
                indiv.id,
                `${indiv.first_name} ${indiv.last_name}`
              )
            );
          }
        }

        // Enrichir orders avec customer_name
        const enrichedOrders = orders.map(order => ({
          ...order,
          customer_name:
            order.customer_type === 'organization'
              ? ((organisationsMap.get(order.customer_id) as
                  | string
                  | undefined) ?? 'Organisation inconnue')
              : order.individual_customer_id
                ? ((individualsMap.get(order.individual_customer_id) as
                    | string
                    | undefined) ?? 'Client inconnu')
                : 'Particulier',
        }));

        return enrichedOrders;
      } catch (err) {
        console.error('Exception chargement SOs:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Charger historique des commandes expédiées (pour onglet Historique)
   * shipped = statut final (delivered réservé futur Packlink/Chronotruck)
   */
  const loadShippedOrdersHistory = useCallback(
    async (filters?: { status?: string; search?: string }) => {
      try {
        setLoading(true);
        setError(null);

        // Statut unique: shipped (delivered supprimé du workflow actif)
        type ShippedStatus = 'shipped';
        let statusesToLoad: ShippedStatus[] = ['shipped'];
        if (filters?.status && filters.status !== 'all') {
          statusesToLoad = [filters.status as ShippedStatus];
        }

        let query = supabase
          .from('sales_orders')
          .select(
            `
            id,
            order_number,
            status,
            created_at,
            expected_delivery_date,
            shipped_at,
            delivered_at,
            customer_id,
            customer_type,
            individual_customer_id,
            sales_order_items (
              id,
              product_id,
              quantity,
              quantity_shipped,
              unit_price_ht,
              products (
                id,
                name,
                sku,
                stock_real,
                product_images!left (
                  public_url,
                  is_primary
                )
              )
            )
          `
          )
          .in('status', statusesToLoad)
          .order('shipped_at', { ascending: false, nullsFirst: false });

        if (filters?.search) {
          query = query.ilike('order_number', `%${filters.search}%`);
        }

        const { data: orders, error: fetchError } = await query;

        if (fetchError) {
          console.error('Erreur chargement historique SOs:', fetchError);
          setError(fetchError.message);
          return [];
        }

        if (!orders || orders.length === 0) {
          return [];
        }

        // Charger noms clients selon customer_type (relation polymorphique)
        const orgIds = orders
          .filter(o => o.customer_type === 'organization' && o.customer_id)
          .map(o => o.customer_id)
          .filter((id): id is string => id !== null);

        const indivIds = orders
          .filter(
            o => o.customer_type === 'individual' && o.individual_customer_id
          )
          .map(o => o.individual_customer_id)
          .filter((id): id is string => id !== null);

        // Query organisations si nécessaire
        const organisationsMap = new Map();
        if (orgIds.length > 0) {
          const { data: orgs } = await supabase
            .from('organisations')
            .select('id, legal_name, trade_name')
            .in('id', orgIds);

          if (orgs) {
            orgs.forEach(org =>
              organisationsMap.set(org.id, org.trade_name ?? org.legal_name)
            );
          }
        }

        // Query individual_customers si nécessaire
        const individualsMap = new Map();
        if (indivIds.length > 0) {
          const { data: indivs } = await supabase
            .from('individual_customers')
            .select('id, first_name, last_name')
            .in('id', indivIds);

          if (indivs) {
            indivs.forEach(indiv =>
              individualsMap.set(
                indiv.id,
                `${indiv.first_name} ${indiv.last_name}`
              )
            );
          }
        }

        // Enrichir orders avec customer_name
        const enrichedOrders = orders.map(order => ({
          ...order,
          customer_name:
            order.customer_type === 'organization'
              ? ((organisationsMap.get(order.customer_id) as
                  | string
                  | undefined) ?? 'Organisation inconnue')
              : order.individual_customer_id
                ? ((individualsMap.get(order.individual_customer_id) as
                    | string
                    | undefined) ?? 'Client inconnu')
                : 'Particulier',
        }));

        return enrichedOrders;
      } catch (err) {
        console.error('Exception chargement historique SOs:', err);
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
    loadSalesOrderForShipment,
    prepareShipmentItems,
    validateShipment,
    loadShipmentHistory,
    loadShipmentStats,
    loadSalesOrdersReadyForShipment,
    loadShippedOrdersHistory,
  };
}
