'use client';

/**
 * Hook pour la gestion des commandes clients
 * Gère le workflow : devis → commande → préparation → expédition → livraison
 */

import { useState, useCallback, useMemo, useRef } from 'react';

import { useToast } from '@verone/common/hooks';
import { useStockMovements } from '@verone/stock/hooks/use-stock-movements';
import { createClient } from '@verone/utils/supabase/client';

// Types pour les commandes clients
export type SalesOrderStatus =
  | 'pending_approval'
  | 'draft'
  | 'validated'
  | 'partially_shipped'
  | 'shipped'
  | 'cancelled';

export type ManualPaymentType =
  | 'cash'
  | 'check'
  | 'transfer_other'
  | 'card'
  | 'compensation'
  | 'verified_bubble';

export interface OrderPayment {
  id: string;
  payment_type: ManualPaymentType;
  amount: number;
  payment_date: string;
  reference: string | null;
  note: string | null;
  created_at: string;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_type: 'organization' | 'individual';
  individual_customer_id?: string | null;
  status: SalesOrderStatus;
  payment_status_v2?: 'pending' | 'partially_paid' | 'paid' | 'overpaid' | null; // Statut calculé via rapprochement bancaire
  // 🆕 Paiement manuel
  manual_payment_type?: ManualPaymentType | null;
  manual_payment_date?: string | null;
  manual_payment_reference?: string | null;
  manual_payment_note?: string | null;
  manual_payment_by?: string | null;
  currency: string;
  tax_rate: number;
  eco_tax_total: number;
  eco_tax_vat_rate: number | null;
  total_ht: number;
  total_ttc: number;
  paid_amount?: number;
  order_date?: string | null;
  expected_delivery_date?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  shipping_address?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  billing_address?: any;
  payment_terms?: string;
  notes?: string;
  channel_id?: string | null; // 🆕 Canal vente (b2b, ecommerce, retail, wholesale) - Pour traçabilité stock
  // 🆕 Relation jointe pour affichage nom canal
  sales_channel?: {
    id: string;
    name: string;
    code?: string;
  } | null;

  // Workflow users et timestamps
  created_by: string;
  confirmed_by?: string;
  shipped_by?: string;
  delivered_by?: string;

  // 🆕 Info créateur (nom, prénom, email)
  creator?: {
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;

  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  paid_at?: string;
  warehouse_exit_at?: string;
  warehouse_exit_by?: string;

  created_at: string;
  updated_at: string;

  // Facture associée (financial_documents)
  invoice_id?: string | null;
  invoice_qonto_id?: string | null;
  invoice_number?: string | null;

  // 🆕 Rapprochement bancaire (jointure transaction_document_links)
  is_matched?: boolean;
  matched_transaction_id?: string | null;
  matched_transaction_label?: string | null;
  matched_transaction_amount?: number | null;
  matched_transaction_emitted_at?: string | null; // Date de paiement
  matched_transaction_attachment_ids?: string[] | null; // Pour lien Qonto

  // Relations jointes (polymorphiques selon customer_type)
  organisations?: {
    id: string;
    name?: string; // ✅ AJOUTÉ - Nom d'affichage (calculé côté client)
    legal_name: string;
    trade_name: string | null;
    email?: string;
    phone?: string;
    website?: string;
    address_line1?: string;
    address_line2?: string;
    postal_code?: string;
    city?: string;
    region?: string;
    enseigne_id?: string | null; // 🆕 AJOUTÉ - Pour filtrer organisations indépendantes vs enseignes
    siret?: string | null;
    vat_number?: string | null;
    billing_address_line1?: string | null;
    billing_address_line2?: string | null;
    billing_city?: string | null;
    billing_postal_code?: string | null;
    billing_country?: string | null;
  };
  individual_customers?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    postal_code?: string;
    city?: string;
  };
  sales_order_items?: SalesOrderItem[];

  // Contact IDs (FK vers table contacts)
  billing_contact_id?: string | null;
  delivery_contact_id?: string | null;
  responsable_contact_id?: string | null;

  // Relations contacts (jointes)
  billing_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  delivery_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  responsable_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
  } | null;

  // LinkMe specific fields
  created_by_affiliate_id?: string | null;
  linkme_selection_id?: string | null;
  pending_admin_validation?: boolean;

  // Frais additionnels (HT)
  shipping_cost_ht?: number;
  insurance_cost_ht?: number;
  handling_cost_ht?: number;
  // TVA appliquée aux frais (différente de la TVA produits)
  fees_vat_rate?: number; // Ex: 0.20 = 20%
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  tax_rate: number; // Taux de TVA par ligne (ex: 0.2000 = 20%)
  discount_percentage: number;
  total_ht: number;
  quantity_shipped: number;
  expected_delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Échantillon
  is_sample: boolean; // Indique si cette ligne est un échantillon envoyé au client

  // LinkMe retrocession
  retrocession_amount?: number | null;
  retrocession_rate?: number | null;

  // Relations jointes
  products?: {
    id: string;
    name: string;
    sku: string;
    stock_quantity?: number;
    stock_real?: number;
    stock_forecasted_in?: number;
    stock_forecasted_out?: number;
    primary_image_url?: string | null;
  };
}

export interface CreateSalesOrderData {
  customer_id: string;
  customer_type: 'organization' | 'individual';
  individual_customer_id?: string | null;
  order_date?: string | null;
  channel_id?: string | null; // 🆕 Canal vente (optional - si null, pas de traçabilité stock)
  eco_tax_vat_rate?: number | null;
  expected_delivery_date?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  shipping_address?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  billing_address?: any;
  payment_terms?: string;
  payment_terms_type?: string | null;
  payment_terms_notes?: string;
  notes?: string;
  // Frais additionnels clients
  shipping_cost_ht?: number;
  insurance_cost_ht?: number;
  handling_cost_ht?: number;
  // TVA appliquée aux frais (différente de la TVA produits)
  fees_vat_rate?: number; // Ex: 0.20 = 20%
  items: CreateSalesOrderItemData[];
}

export interface CreateSalesOrderItemData {
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  tax_rate?: number; // Taux de TVA (défaut: 0.20 = 20%)
  discount_percentage?: number;
  eco_tax?: number; // Éco-taxe par ligne (défaut: 0)
  expected_delivery_date?: string;
  notes?: string;
  is_sample?: boolean; // Marquer comme échantillon envoyé au client
}

export interface UpdateSalesOrderData {
  expected_delivery_date?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  shipping_address?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  billing_address?: any;
  payment_terms?: string;
  notes?: string;
}

export interface ShipItemData {
  item_id: string;
  quantity_shipped: number;
  notes?: string;
}

interface SalesOrderFilters {
  customer_id?: string;
  status?: SalesOrderStatus;
  channel_id?: string; // Filtre par canal de vente (LinkMe, Site Internet, etc.)
  date_from?: string;
  date_to?: string;
  order_number?: string;
}

interface SalesOrderStats {
  total_orders: number;
  total_value: number; // Maintenu pour compatibilité (alias de total_ttc)
  total_ht: number; // Total HT
  total_tva: number; // Total TVA
  total_ttc: number; // Total TTC
  average_basket: number; // Panier moyen (total_ttc / total_orders)
  pending_orders: number; // draft + validated
  shipped_orders: number;
  cancelled_orders: number;
  orders_by_status: {
    draft: number;
    validated: number;
    partially_shipped: number;
    shipped: number;
    cancelled: number;
  };
}

// ============================================================================
// FSM - Finite State Machine pour validation transitions status
// ============================================================================

/**
 * Machine à états finis (FSM) - Transitions autorisées
 * Workflow: draft → validated → partially_shipped → shipped → delivered
 * Annulation possible à tout moment (sauf delivered)
 * Dévalidation (validated → draft) autorisée si aucune expédition
 */
const STATUS_TRANSITIONS: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  pending_approval: ['draft', 'cancelled'],
  draft: ['validated', 'cancelled'],
  validated: ['draft', 'partially_shipped', 'shipped', 'cancelled'], // 'draft' pour dévalidation
  partially_shipped: ['shipped', 'cancelled'],
  shipped: [], // État final - futur: delivered via Packlink/Chronotruck
  cancelled: [], // État final
};

/**
 * Valider transition status selon FSM
 * @throws Error si transition invalide
 */
function validateStatusTransition(
  currentStatus: SalesOrderStatus,
  newStatus: SalesOrderStatus
): void {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Transition invalide: ${currentStatus} → ${newStatus}. ` +
        `Transitions autorisées: ${allowedTransitions.join(', ') || 'aucune'}`
    );
  }
}

/**
 * Vérifier si status est final (pas de transition possible)
 */
function isFinalStatus(status: SalesOrderStatus): boolean {
  return STATUS_TRANSITIONS[status].length === 0;
}

/**
 * Obtenir transitions autorisées depuis un status
 */
function getAllowedTransitions(status: SalesOrderStatus): SalesOrderStatus[] {
  return STATUS_TRANSITIONS[status];
}

export function useSalesOrders() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<SalesOrder | null>(null);
  // ✅ FIX: useRef pour currentOrder dans les callbacks (évite re-création de 7 callbacks à chaque changement)
  const currentOrderRef = useRef(currentOrder);
  currentOrderRef.current = currentOrder;
  const [stats, setStats] = useState<SalesOrderStats | null>(null);
  const { toast } = useToast();
  // ✅ FIX: useMemo pour éviter recréation du client à chaque render
  const supabase = useMemo(() => createClient(), []);
  const { createMovement: _createMovement, getAvailableStock } =
    useStockMovements();

  // Récupérer toutes les commandes avec filtres
  const fetchOrders = useCallback(
    async (filters?: SalesOrderFilters) => {
      console.warn('[FETCH] Début fetchOrders, filtres:', filters);
      setLoading(true);
      try {
        let query = supabase
          .from('sales_orders')
          .select(
            `
          *,
          sales_channel:sales_channels!left(id, name, code),
          billing_contact:contacts!sales_orders_billing_contact_id_fkey(id, first_name, last_name, email, phone),
          delivery_contact:contacts!sales_orders_delivery_contact_id_fkey(id, first_name, last_name, email, phone),
          responsable_contact:contacts!sales_orders_responsable_contact_id_fkey(id, first_name, last_name, email, phone),
          sales_order_items (
            *,
            products (
              id,
              name,
              sku,
              stock_quantity,
              stock_real,
              stock_forecasted_in,
              stock_forecasted_out,
              product_images!left (
                public_url,
                is_primary
              )
            )
          )
        `
          )
          .order('created_at', { ascending: false });

        // Appliquer les filtres
        if (filters?.customer_id) {
          query = query.eq('customer_id', filters.customer_id);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.date_from) {
          query = query.gte('created_at', filters.date_from);
        }
        if (filters?.date_to) {
          query = query.lte('created_at', filters.date_to);
        }
        if (filters?.order_number) {
          query = query.ilike('order_number', `%${filters.order_number}%`);
        }
        if (filters?.channel_id) {
          query = query.eq('channel_id', filters.channel_id);
        }

        const { data: ordersData, error } = await query;

        console.warn(
          '[FETCH] Données reçues:',
          ordersData?.length,
          'commandes'
        );
        if (error) console.error('[FETCH] Erreur:', error);

        if (error) throw error;

        // 🆕 Récupérer les rapprochements bancaires (batch pour performance)
        const orderIds = (ordersData ?? []).map(o => o.id);
        const matchedOrdersMap = new Map<
          string,
          {
            transaction_id: string;
            label: string;
            amount: number;
            emitted_at: string | null;
            attachment_ids: string[] | null;
          }
        >();

        if (orderIds.length > 0) {
          const { data: links } = await supabase
            .from('transaction_document_links')
            .select(
              `
              sales_order_id,
              transaction_id,
              bank_transactions!inner (
                id,
                label,
                amount,
                emitted_at,
                attachment_ids
              )
            `
            )
            .in('sales_order_id', orderIds)
            .eq('link_type', 'sales_order');

          for (const link of links ?? []) {
            if (link.sales_order_id && link.bank_transactions) {
              const bt = link.bank_transactions as {
                id: string;
                label: string | null;
                amount: number | null;
                emitted_at: string | null;
                attachment_ids: string[] | null;
              };
              matchedOrdersMap.set(link.sales_order_id, {
                transaction_id: bt.id,
                label: bt.label ?? '',
                amount: bt.amount ?? 0,
                emitted_at: bt.emitted_at ?? null,
                attachment_ids: bt.attachment_ids ?? null,
              });
            }
          }
        }

        // 🆕 Récupérer les factures associées (batch pour performance)
        const invoiceMap = new Map<
          string,
          { id: string; qontoId: string | null; number: string }
        >();
        if (orderIds.length > 0) {
          const { data: invoicesData } = await supabase
            .from('financial_documents')
            .select('id, sales_order_id, document_number, qonto_invoice_id')
            .in('sales_order_id', orderIds)
            .eq('document_type', 'customer_invoice')
            .is('deleted_at', null);

          for (const inv of invoicesData ?? []) {
            if (inv.sales_order_id) {
              invoiceMap.set(inv.sales_order_id, {
                id: inv.id,
                qontoId: inv.qonto_invoice_id,
                number: inv.document_number,
              });
            }
          }
        }

        // 🆕 Récupérer les infos des créateurs (batch pour performance)
        const uniqueCreatorIds = [
          ...new Set(
            (ordersData ?? [])
              .map(o => o.created_by)
              .filter((id): id is string => !!id)
          ),
        ];
        const creatorsMap = new Map<
          string,
          { first_name: string; last_name: string; email: string | null }
        >();

        if (uniqueCreatorIds.length > 0) {
          // ✅ OPTIMISÉ: 1 seule requête batch au lieu de N RPC calls
          // Note: email n'est pas dans user_profiles (dans auth.users), on le laisse null
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', uniqueCreatorIds);

          // Mapper les profils directement (pas de boucle avec RPC)
          for (const profile of profiles ?? []) {
            if (profile.user_id) {
              creatorsMap.set(profile.user_id, {
                first_name: profile.first_name ?? 'Utilisateur',
                last_name: profile.last_name ?? '',
                email: null, // email pas accessible depuis user_profiles
              });
            }
          }
        }

        // ✅ OPTIMISÉ: Batch fetch des clients (2 requêtes au lieu de N)
        // Collecter tous les IDs par type de client
        const orgIds = (ordersData ?? [])
          .filter(o => o.customer_type === 'organization' && o.customer_id)
          .map(o => o.customer_id)
          .filter((id): id is string => id !== null);
        const individualIds = (ordersData ?? [])
          .filter(
            o => o.customer_type === 'individual' && o.individual_customer_id
          )
          .map(o => o.individual_customer_id)
          .filter((id): id is string => id !== null);

        // Batch fetch organisations (1 seule requête)
        const orgsMap = new Map<string, Record<string, unknown>>();
        if (orgIds.length > 0) {
          const { data: orgs } = await supabase
            .from('organisations')
            .select(
              'id, legal_name, trade_name, email, phone, website, address_line1, address_line2, postal_code, city, region, enseigne_id, siret, vat_number, billing_address_line1, billing_address_line2, billing_city, billing_postal_code, billing_country'
            )
            .in('id', orgIds);
          for (const org of orgs ?? []) {
            orgsMap.set(org.id, org);
          }
        }

        // Batch fetch individual_customers (1 seule requête)
        const individualsMap = new Map<string, Record<string, unknown>>();
        if (individualIds.length > 0) {
          const { data: individuals } = await supabase
            .from('individual_customers')
            .select(
              'id, first_name, last_name, email, phone, address_line1, address_line2, postal_code, city'
            )
            .in('id', individualIds);
          for (const ind of individuals ?? []) {
            individualsMap.set(ind.id, ind);
          }
        }

        // Mapper les commandes avec les données clients (sans requêtes supplémentaires)
        const ordersWithCustomers = (ordersData ?? []).map(order => {
          let customerData: Record<string, Record<string, unknown>> | null =
            null;

          if (order.customer_type === 'organization' && order.customer_id) {
            const org = orgsMap.get(order.customer_id);
            customerData = org ? { organisations: org } : null;
          } else if (
            order.customer_type === 'individual' &&
            order.individual_customer_id
          ) {
            const individual = individualsMap.get(order.individual_customer_id);
            customerData = individual
              ? { individual_customers: individual }
              : null;
          }

          // Enrichir les produits avec primary_image_url (BR-TECH-002)
          const enrichedItems = (order.sales_order_items ?? []).map(item => ({
            ...item,
            products: item.products
              ? {
                  ...item.products,
                  primary_image_url:
                    item.products.product_images?.[0]?.public_url ?? null,
                }
              : null,
          }));

          // Info créateur
          const creatorInfo = order.created_by
            ? creatorsMap.get(order.created_by)
            : null;

          // Info rapprochement bancaire
          const matchInfo = matchedOrdersMap.get(order.id);

          return {
            ...order,
            sales_order_items: enrichedItems,
            creator: creatorInfo ?? null,
            invoice_id: invoiceMap.get(order.id)?.id ?? null,
            invoice_qonto_id: invoiceMap.get(order.id)?.qontoId ?? null,
            invoice_number: invoiceMap.get(order.id)?.number ?? null,
            is_matched: !!matchInfo,
            matched_transaction_id: matchInfo?.transaction_id ?? null,
            matched_transaction_label: matchInfo?.label ?? null,
            matched_transaction_amount: matchInfo?.amount ?? null,
            matched_transaction_emitted_at: matchInfo?.emitted_at ?? null,
            matched_transaction_attachment_ids:
              matchInfo?.attachment_ids ?? null,
            ...customerData,
          };
        });

        console.warn(
          '[FETCH] Mise à jour state avec',
          ordersWithCustomers.length,
          'commandes'
        );
        setOrders(ordersWithCustomers as unknown as SalesOrder[]);
        console.warn('[FETCH] fetchOrders terminé avec succès');
      } catch (error: unknown) {
        const errMsg =
          error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(
          '[FETCH] Erreur lors de la récupération des commandes:',
          errMsg,
          error
        );
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les commandes',
          variant: 'destructive',
        });
      } finally {
        console.warn('[FETCH] fetchOrders finally block');
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  // Récupérer une commande spécifique
  const fetchOrder = useCallback(
    async (orderId: string): Promise<SalesOrder | null> => {
      setLoading(true);
      try {
        const { data: orderData, error } = await supabase
          .from('sales_orders')
          .select(
            `
          *,
          sales_channel:sales_channels!left(id, name, code),
          billing_contact:contacts!sales_orders_billing_contact_id_fkey(id, first_name, last_name, email, phone),
          delivery_contact:contacts!sales_orders_delivery_contact_id_fkey(id, first_name, last_name, email, phone),
          responsable_contact:contacts!sales_orders_responsable_contact_id_fkey(id, first_name, last_name, email, phone),
          sales_order_items (
            *,
            products (
              id,
              name,
              sku,
              stock_quantity,
              stock_real,
              stock_forecasted_in,
              stock_forecasted_out,
              product_images!left (
                public_url,
                is_primary
              )
            )
          )
        `
          )
          .eq('id', orderId)
          .single();

        if (error) throw error;

        // Fetch manuel des données client selon le type (relation polymorphique)
        let customerData: Record<
          string,
          Record<string, unknown> | null
        > | null = null;

        if (
          orderData.customer_type === 'organization' &&
          orderData.customer_id
        ) {
          const { data: org } = await supabase
            .from('organisations')
            .select(
              'id, legal_name, trade_name, email, phone, website, address_line1, address_line2, postal_code, city, region, siret, vat_number'
            )
            .eq('id', orderData.customer_id)
            .single();
          customerData = { organisations: org };
        } else if (
          orderData.customer_type === 'individual' &&
          orderData.individual_customer_id
        ) {
          const { data: individual } = await supabase
            .from('individual_customers')
            .select(
              'id, first_name, last_name, email, phone, address_line1, address_line2, postal_code, city'
            )
            .eq('id', orderData.individual_customer_id)
            .single();
          customerData = { individual_customers: individual };
        }

        // Enrichir les produits avec primary_image_url (BR-TECH-002)
        const enrichedItems = (orderData.sales_order_items ?? []).map(item => ({
          ...item,
          products: item.products
            ? {
                ...item.products,
                primary_image_url:
                  item.products.product_images?.[0]?.public_url ?? null,
              }
            : null,
        }));

        // 🆕 Récupérer info créateur via RPC
        let creatorInfo: {
          first_name: string;
          last_name: string;
          email: string | null;
        } | null = null;

        if (orderData.created_by) {
          const { data: userInfo } = await supabase.rpc('get_user_info', {
            p_user_id: orderData.created_by,
          });

          const userInfoArray = userInfo as unknown as Array<{
            first_name: string | null;
            last_name: string | null;
            email: string | null;
          }> | null;

          if (userInfoArray && userInfoArray.length > 0) {
            creatorInfo = {
              first_name: userInfoArray[0].first_name ?? 'Utilisateur',
              last_name: userInfoArray[0].last_name ?? '',
              email: userInfoArray[0].email ?? null,
            };
          }
        }

        // 🆕 Récupérer info rapprochement bancaire
        let matchInfo: {
          transaction_id: string;
          label: string;
          amount: number;
          emitted_at: string | null;
          attachment_ids: string[] | null;
        } | null = null;

        const { data: linkData } = await supabase
          .from('transaction_document_links')
          .select(
            `
            transaction_id,
            bank_transactions!inner (
              id,
              label,
              amount,
              emitted_at,
              attachment_ids
            )
          `
          )
          .eq('sales_order_id', orderId)
          .eq('link_type', 'sales_order')
          .maybeSingle();

        if (linkData?.bank_transactions) {
          const bt = linkData.bank_transactions as {
            id: string;
            label: string | null;
            amount: number | null;
            emitted_at: string | null;
            attachment_ids: string[] | null;
          };
          matchInfo = {
            transaction_id: bt.id,
            label: bt.label ?? '',
            amount: bt.amount ?? 0,
            emitted_at: bt.emitted_at ?? null,
            attachment_ids: bt.attachment_ids ?? null,
          };
        }

        const orderWithCustomer = {
          ...orderData,
          sales_order_items: enrichedItems,
          creator: creatorInfo,
          // 🆕 Rapprochement
          is_matched: !!matchInfo,
          matched_transaction_id: matchInfo?.transaction_id ?? null,
          matched_transaction_label: matchInfo?.label ?? null,
          matched_transaction_amount: matchInfo?.amount ?? null,
          matched_transaction_emitted_at: matchInfo?.emitted_at ?? null,
          matched_transaction_attachment_ids: matchInfo?.attachment_ids ?? null,
          ...customerData,
        };

        setCurrentOrder(orderWithCustomer as unknown as SalesOrder);
        return orderWithCustomer as unknown as SalesOrder;
      } catch (error) {
        console.error('Erreur lors de la récupération de la commande:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer la commande',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  // Récupérer les statistiques
  const fetchStats = useCallback(
    async (filters?: SalesOrderFilters) => {
      try {
        let query = supabase
          .from('sales_orders')
          .select('status, total_ht, total_ttc');

        if (filters?.date_from) {
          query = query.gte('created_at', filters.date_from);
        }
        if (filters?.date_to) {
          query = query.lte('created_at', filters.date_to);
        }

        const { data, error } = await query;

        if (error) throw error;

        const statsData = data?.reduce(
          (acc, order) => {
            acc.total_orders++;
            acc.total_ht += order.total_ht ?? 0;
            acc.total_ttc += order.total_ttc ?? 0;

            // Compteurs par statut
            switch (order.status) {
              case 'draft':
                acc.orders_by_status.draft++;
                acc.pending_orders++;
                break;
              case 'validated':
                acc.orders_by_status.validated++;
                acc.pending_orders++;
                break;
              case 'partially_shipped':
                acc.orders_by_status.partially_shipped++;
                acc.pending_orders++;
                break;
              case 'shipped':
                acc.orders_by_status.shipped++;
                acc.shipped_orders++;
                break;
              case 'cancelled':
                acc.orders_by_status.cancelled++;
                acc.cancelled_orders++;
                break;
            }
            return acc;
          },
          {
            total_orders: 0,
            total_ht: 0,
            total_ttc: 0,
            total_tva: 0, // Calculé après
            total_value: 0, // Calculé après (alias total_ttc)
            average_basket: 0, // Calculé après
            pending_orders: 0,
            shipped_orders: 0,
            cancelled_orders: 0,
            orders_by_status: {
              draft: 0,
              validated: 0,
              partially_shipped: 0,
              shipped: 0,
              cancelled: 0,
            },
          }
        );

        if (statsData) {
          // Calculer total_tva
          statsData.total_tva = statsData.total_ttc - statsData.total_ht;

          // Calculer panier moyen (seulement si commandes > 0)
          statsData.average_basket =
            statsData.total_orders > 0
              ? statsData.total_ttc / statsData.total_orders
              : 0;

          // Maintenir total_value pour compatibilité (= total_ttc)
          statsData.total_value = statsData.total_ttc;
        }

        setStats(statsData ?? null);
      } catch (error: unknown) {
        const errMsg =
          error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(
          'Erreur lors de la récupération des statistiques:',
          errMsg
        );
      }
    },
    [supabase]
  );

  // Vérifier la disponibilité du stock pour une commande
  const checkStockAvailability = useCallback(
    async (items: CreateSalesOrderItemData[]) => {
      const availabilityCheck: Array<{
        product_id: string;
        requested_quantity: number;
        available_stock: unknown;
        is_available: boolean;
      }> = [];

      for (const item of items) {
        const availableStock = await getAvailableStock(item.product_id);
        availabilityCheck.push({
          product_id: item.product_id,
          requested_quantity: item.quantity,
          available_stock: availableStock,
          is_available: (availableStock as unknown as number) >= item.quantity,
        });
      }

      return availabilityCheck;
    },
    [getAvailableStock]
  );

  // Obtenir le stock disponible avec prévisionnel
  const getStockWithForecasted = useCallback(
    async (productId: string) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('stock_real, stock_forecasted_in, stock_forecasted_out')
          .eq('id', productId)
          .single();

        if (error) throw error;

        return {
          stock_real: data?.stock_real ?? 0,
          stock_forecasted_in: data?.stock_forecasted_in ?? 0,
          stock_forecasted_out: data?.stock_forecasted_out ?? 0,
          stock_available:
            (data?.stock_real ?? 0) +
            (data?.stock_forecasted_in ?? 0) -
            (data?.stock_forecasted_out ?? 0),
          stock_future:
            (data?.stock_real ?? 0) + (data?.stock_forecasted_in ?? 0),
        };
      } catch (error) {
        console.error('Erreur lors de la récupération du stock:', error);
        return {
          stock_real: 0,
          stock_forecasted_in: 0,
          stock_forecasted_out: 0,
          stock_available: 0,
          stock_future: 0,
        };
      }
    },
    [supabase]
  );

  // Marquer une commande comme payée
  const markAsPaid = useCallback(
    async (orderId: string, amount?: number) => {
      setLoading(true);
      try {
        const { data: order } = await supabase
          .from('sales_orders')
          .select('total_ttc')
          .eq('id', orderId)
          .single();

        if (!order) throw new Error('Commande non trouvée');

        const paidAmount = amount ?? order.total_ttc;

        const { error } = await supabase.rpc('mark_payment_received', {
          p_order_id: orderId,
          p_amount: paidAmount,
        });

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Paiement enregistré avec succès',
        });

        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Erreur inconnue';
        console.error("Erreur lors de l'enregistrement du paiement:", error);
        toast({
          title: 'Erreur',
          description: message ?? "Impossible d'enregistrer le paiement",
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchOrder]
  );

  // Marquer comme payé manuellement (insère dans order_payments via RPC)
  const markAsManuallyPaid = useCallback(
    async (
      orderId: string,
      paymentType: ManualPaymentType,
      amount: number,
      options?: {
        reference?: string;
        note?: string;
        date?: Date;
      }
    ) => {
      setLoading(true);
      try {
        // RPC inserts into order_payments + recalculates paid_amount
        const { error: rpcError } = await supabase.rpc(
          'mark_payment_received',
          {
            p_order_id: orderId,
            p_amount: amount,
            p_payment_type: paymentType,
            p_reference: options?.reference ?? null,
            p_note: options?.note ?? null,
            p_date: options?.date?.toISOString() ?? null,
          }
        );

        if (rpcError) throw rpcError;

        // Update legacy manual_payment_* fields for backward compat
        const { error: updateError } = await supabase
          .from('sales_orders')
          .update({
            manual_payment_type: paymentType,
            manual_payment_date:
              options?.date?.toISOString() ?? new Date().toISOString(),
            manual_payment_reference: options?.reference ?? null,
            manual_payment_note: options?.note ?? null,
          } as Record<string, unknown>)
          .eq('id', orderId);

        if (updateError) throw updateError;

        const paymentLabels: Record<ManualPaymentType, string> = {
          cash: 'Espèces',
          check: 'Chèque',
          transfer_other: 'Virement autre banque',
          card: 'Carte bancaire',
          compensation: 'Compensation',
          verified_bubble: 'Vérifié Bubble',
        };

        toast({
          title: 'Paiement manuel enregistré',
          description: `Type: ${paymentLabels[paymentType]} — ${amount.toFixed(2)} €`,
        });

        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('Erreur lors du paiement manuel:', error);
        toast({
          title: 'Erreur',
          description: message ?? "Impossible d'enregistrer le paiement manuel",
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchOrder]
  );

  // Fetch manual payments for an order from order_payments table
  const fetchOrderPayments = useCallback(
    async (orderId: string): Promise<OrderPayment[]> => {
      const { data, error } = await supabase
        .from('order_payments')
        .select(
          'id, payment_type, amount, payment_date, reference, note, created_at'
        )
        .eq('sales_order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching order payments:', error);
        return [];
      }
      return (data ?? []) as OrderPayment[];
    },
    [supabase]
  );

  // Delete a manual payment from order_payments
  const deleteManualPayment = useCallback(
    async (paymentId: string) => {
      const { error } = await supabase.rpc('delete_order_payment', {
        p_payment_id: paymentId,
      });

      if (error) {
        console.error('Error deleting payment:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le paiement',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Paiement supprimé',
        description: 'Le paiement manuel a été supprimé',
      });

      await fetchOrders();
    },
    [supabase, toast, fetchOrders]
  );

  // Marquer la sortie entrepôt
  const markWarehouseExit = useCallback(
    async (orderId: string) => {
      setLoading(true);
      try {
        const { error } = await supabase.rpc('mark_warehouse_exit', {
          p_order_id: orderId,
        });

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Sortie entrepôt enregistrée avec succès',
        });

        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: unknown) {
        console.error('Erreur lors de la sortie entrepôt:', error);
        const errMsg =
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer la sortie entrepôt";
        toast({
          title: 'Erreur',
          description: errMsg,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchOrder]
  );

  // Créer une nouvelle commande avec vérification de stock
  const createOrder = useCallback(
    async (data: CreateSalesOrderData, autoReserve = false) => {
      setLoading(true);
      try {
        // 1. Vérifier la disponibilité du stock (sans bloquer)
        const stockCheck = await checkStockAvailability(data.items);
        const unavailableItems = stockCheck.filter(item => !item.is_available);

        // ⚠️ NOUVEAU: Ne plus bloquer, juste logger les produits en stock insuffisant
        if (unavailableItems.length > 0) {
          const itemNames = await Promise.all(
            unavailableItems.map(async item => {
              const { data: product } = await supabase
                .from('products')
                .select('name, stock_real, stock_forecasted_out')
                .eq('id', item.product_id)
                .single();
              return {
                name: product?.name ?? item.product_id,
                product_id: item.product_id,
                requested: item.requested_quantity,
                available: item.available_stock,
                current_forecasted_out: product?.stock_forecasted_out ?? 0,
                stock_real: product?.stock_real ?? 0,
              };
            })
          );

          console.warn('⚠️ Commande avec stock insuffisant:', itemNames);

          // Afficher un toast informatif (non bloquant)
          toast({
            title: '⚠️ Attention Stock',
            description: `Stock insuffisant pour ${itemNames.length} produit(s). La commande sera créée en stock prévisionnel négatif.`,
            variant: 'default',
          });
        }

        // 2. Générer le numéro de commande
        const { data: soNumber, error: numberError } =
          await supabase.rpc('generate_so_number');

        if (numberError) throw numberError;

        // 3. Calculer les totaux
        const totalHT = data.items.reduce((sum, item) => {
          const itemTotal =
            item.quantity *
            item.unit_price_ht *
            (1 - (item.discount_percentage ?? 0) / 100);
          return sum + itemTotal;
        }, 0);

        const totalTTC = totalHT * (1 + 0.2); // TVA par défaut

        // 4. Créer la commande
        const { data: order, error: orderError } = await supabase
          .from('sales_orders')
          .insert([
            {
              order_number: soNumber,
              customer_id:
                data.customer_type === 'organization' ? data.customer_id : null,
              customer_type: data.customer_type,
              individual_customer_id:
                data.customer_type === 'individual'
                  ? (data.individual_customer_id ?? data.customer_id)
                  : null,
              order_date: data.order_date ?? null,
              channel_id: data.channel_id ?? null, // 🆕 Canal vente pour traçabilité stock
              expected_delivery_date: data.expected_delivery_date ?? null,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSONB address passthrough
              shipping_address: data.shipping_address,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSONB address passthrough
              billing_address: data.billing_address,
              payment_terms: data.payment_terms,
              notes: data.notes,
              total_ht: totalHT,
              total_ttc: totalTTC,
              created_by: (await supabase.auth.getUser()).data.user?.id,
              tax_rate: 0.2, // TVA FR par defaut (triggers utilisent item.tax_rate pour TTC)
              // Frais additionnels clients
              shipping_cost_ht: data.shipping_cost_ht ?? 0,
              insurance_cost_ht: data.insurance_cost_ht ?? 0,
              handling_cost_ht: data.handling_cost_ht ?? 0,
            },
          ] as never)
          .select()
          .single();

        if (orderError) throw orderError;

        // 5. Créer les items via INSERT direct
        const { error: itemsError } = await supabase
          .from('sales_order_items')
          .insert(
            data.items.map(item => ({
              sales_order_id: order.id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price_ht: item.unit_price_ht,
              tax_rate: item.tax_rate ?? 0.2, // TVA par défaut 20%
              discount_percentage: item.discount_percentage ?? 0,
              eco_tax: item.eco_tax ?? 0, // Éco-taxe (défaut 0)
              expected_delivery_date: item.expected_delivery_date ?? null,
              notes: item.notes,
              is_sample: item.is_sample ?? false, // Échantillon (défaut false)
            }))
          );

        if (itemsError) throw itemsError;

        // 6. 🆕 NOUVEAU: Mettre à jour stock_forecasted_out selon le statut de la commande
        // RÈGLE MÉTIER:
        // - Brouillon (draft): Aucun impact stock
        // - Validée (validated): Impact stock_forecasted_out pour TOUS les produits
        // - Expédiée/Livrée: Impact stock_real (géré par workflows séparés)

        // On met à jour stock_forecasted_out UNIQUEMENT si la commande est créée directement en statut 'validated'
        // Sinon, la mise à jour se fera lors de la validation (transition draft → validated)
        const initialStatus = order.status ?? 'draft'; // Par défaut: brouillon

        if (initialStatus === 'validated') {
          // Commande validée → Impact stock prévisionnel pour TOUS les produits
          for (const item of data.items) {
            // Récupérer les valeurs actuelles
            const { data: product, error: productError } = await supabase
              .from('products')
              .select('stock_real, stock_forecasted_out')
              .eq('id', item.product_id)
              .single();

            if (productError) {
              console.error(
                'Erreur récupération produit pour forecast:',
                productError
              );
              continue;
            }

            const currentReal = product?.stock_real ?? 0;
            const currentForecastedOut = product?.stock_forecasted_out ?? 0;

            // Nouvelle quantité prévue en sortie (additionnée)
            const newForecastedOut = currentForecastedOut + item.quantity;

            // Mettre à jour le stock prévisionnel
            const { error: updateError } = await supabase
              .from('products')
              .update({
                stock_forecasted_out: newForecastedOut,
              })
              .eq('id', item.product_id);

            if (updateError) {
              console.error(
                'Erreur mise à jour stock prévisionnel:',
                updateError
              );
            } else {
              console.warn(
                `[STOCK] Stock prévisionnel mis à jour pour produit ${item.product_id}: forecasted_out=${newForecastedOut}, disponible=${currentReal - newForecastedOut}`
              );

              // Si le stock disponible devient négatif, le trigger notify_negative_forecast_stock()
              // créera automatiquement une notification pour commander chez le fournisseur
            }
          }
        } else {
          console.warn(
            `[STOCK] Commande créée en statut '${initialStatus}' - Pas d'impact stock prévisionnel (sera mis à jour lors de la validation)`
          );
        }

        // 7. Réserver le stock automatiquement si demandé (seulement pour items disponibles)
        if (autoReserve) {
          try {
            const userId = (await supabase.auth.getUser()).data.user?.id;

            for (const item of data.items) {
              // Ne réserver que si stock disponible
              const stockInfo = stockCheck.find(
                s => s.product_id === item.product_id
              );
              if (stockInfo?.is_available) {
                await supabase.from('stock_reservations').insert([
                  {
                    product_id: item.product_id,
                    reserved_quantity: item.quantity,
                    reference_type: 'sales_order',
                    reference_id: order.id,
                    reserved_by: userId,
                    expires_at: data.expected_delivery_date
                      ? new Date(
                          new Date(data.expected_delivery_date).getTime() +
                            7 * 24 * 60 * 60 * 1000
                        ).toISOString()
                      : null, // 7 jours après la livraison prévue
                  },
                ] as never);
              }
            }
          } catch (reservationError) {
            console.warn(
              'Erreur lors de la réservation automatique:',
              reservationError
            );
            // Ne pas faire échouer la création de commande pour une erreur de réservation
          }
        }

        toast({
          title: 'Succès',
          description: `Commande ${soNumber} créée avec succès`,
        });

        // Refresh liste en best-effort (non bloquant)
        try {
          await fetchOrders();
        } catch (refreshError) {
          // Log pour debug, mais ne pas faire échouer createOrder
          console.warn(
            '[createOrder] fetchOrders refresh failed (non-blocking):',
            refreshError
          );
        }
        return order;
      } catch (error: unknown) {
        // PostgREST errors ne se sérialisent pas avec JSON.stringify → logguer les propriétés
        const errMsg =
          error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null && 'message' in error
              ? String((error as Record<string, unknown>).message)
              : String(error);
        console.error('[createOrder] Erreur:', errMsg, error);
        toast({
          title: 'Erreur',
          description: errMsg ?? 'Impossible de créer la commande',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, checkStockAvailability]
  );

  // Mettre à jour une commande (métadonnées uniquement)
  const updateOrder = useCallback(
    async (orderId: string, data: UpdateSalesOrderData) => {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('sales_orders')
          .update(data)
          .eq('id', orderId);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Commande mise à jour avec succès',
        });

        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: unknown) {
        console.error('Erreur lors de la mise à jour:', error);
        const errMsg =
          error instanceof Error
            ? error.message
            : 'Impossible de mettre à jour la commande';
        toast({
          title: 'Erreur',
          description: errMsg,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchOrder]
  );

  // Mettre à jour une commande avec ses items (édition complète)
  const updateOrderWithItems = useCallback(
    async (
      orderId: string,
      data: UpdateSalesOrderData,
      items: CreateSalesOrderItemData[]
    ) => {
      setLoading(true);
      try {
        // 1. Vérifier que la commande n'est pas payée (règle métier stricte)
        const { data: existingOrder, error: fetchError } = await supabase
          .from('sales_orders')
          .select('payment_status_v2, status, order_number')
          .eq('id', orderId)
          .single();

        if (fetchError) throw fetchError;
        if (!existingOrder) throw new Error('Commande non trouvée');

        if (existingOrder.payment_status_v2 === 'paid') {
          throw new Error('Impossible de modifier une commande déjà payée');
        }

        // 2. Récupérer les items existants AVANT la vérification du stock
        const { data: existingItems, error: itemsError } = await supabase
          .from('sales_order_items')
          .select(
            'id, product_id, quantity, unit_price_ht, discount_percentage'
          )
          .eq('sales_order_id', orderId);

        if (itemsError) throw itemsError;

        // 3. Vérifier la disponibilité du stock en tenant compte des quantités actuelles
        const existingItemsMap = new Map(
          (existingItems ?? []).map(item => [item.product_id, item])
        );

        // Pour chaque item demandé, vérifier le stock disponible
        const stockCheckResults: Array<{
          product_id: string;
          requested_quantity: number;
          currently_allocated: number;
          available_stock: number;
          effective_available_stock: number;
          additional_needed: number;
          is_available: boolean;
        }> = [];
        for (const item of items) {
          const availableStockData = await getAvailableStock(item.product_id);
          const availableStock = availableStockData.stock_available ?? 0;

          // Quantité actuellement allouée dans cette commande
          const currentlyAllocated =
            existingItemsMap.get(item.product_id)?.quantity ?? 0;

          // Stock disponible réel = stock disponible + quantité actuellement allouée
          const effectiveAvailableStock = availableStock + currentlyAllocated;

          // Quantité additionnelle demandée
          const additionalQuantityNeeded = item.quantity - currentlyAllocated;

          stockCheckResults.push({
            product_id: item.product_id,
            requested_quantity: item.quantity,
            currently_allocated: currentlyAllocated,
            available_stock: availableStock,
            effective_available_stock: effectiveAvailableStock,
            additional_needed: additionalQuantityNeeded,
            is_available: effectiveAvailableStock >= item.quantity,
          });
        }

        const unavailableItems = stockCheckResults.filter(
          item => !item.is_available
        );

        if (unavailableItems.length > 0) {
          const itemNames = await Promise.all(
            unavailableItems.map(async item => {
              const { data: product } = await supabase
                .from('products')
                .select('name')
                .eq('id', item.product_id)
                .single();
              return `${product?.name ?? item.product_id} (demandé: ${item.requested_quantity}, disponible: ${item.effective_available_stock})`;
            })
          );

          // BACKORDERS AUTORISÉS: Warning au lieu de throw (Politique 2025-10-14)
          // Stock négatif = backorder selon standards ERP 2025
          console.warn(
            `⚠️ Stock insuffisant (backorder autorisé): ${itemNames.join(', ')}`
          );
        }

        // 4. Calculer le diff des items (existingItems et existingItemsMap déjà créés ci-dessus)
        const newItemsMap = new Map(items.map(item => [item.product_id, item]));

        // Items à supprimer (présents dans existing mais pas dans new)
        const itemsToDelete = (existingItems ?? []).filter(
          item => !newItemsMap.has(item.product_id)
        );

        // Items à ajouter (présents dans new mais pas dans existing)
        const itemsToAdd = items.filter(
          item => !existingItemsMap.has(item.product_id)
        );

        // Items à mettre à jour (présents dans les deux, mais modifiés)
        const itemsToUpdate = items.filter(newItem => {
          const existingItem = existingItemsMap.get(newItem.product_id);
          if (!existingItem) return false;

          return (
            existingItem.quantity !== newItem.quantity ||
            existingItem.unit_price_ht !== newItem.unit_price_ht ||
            (existingItem.discount_percentage ?? 0) !==
              (newItem.discount_percentage ?? 0)
          );
        });

        // 5. Supprimer les items obsolètes
        if (itemsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('sales_order_items')
            .delete()
            .in(
              'id',
              itemsToDelete.map(item => item.id)
            );

          if (deleteError) throw deleteError;
        }

        // 6. Ajouter les nouveaux items
        if (itemsToAdd.length > 0) {
          const { error: insertError } = await supabase
            .from('sales_order_items')
            .insert(
              itemsToAdd.map(item => ({
                sales_order_id: orderId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price_ht: item.unit_price_ht,
                tax_rate: item.tax_rate ?? 0.2, // TVA par défaut 20%
                discount_percentage: item.discount_percentage ?? 0,
                eco_tax: item.eco_tax ?? 0, // Éco-taxe (défaut 0)
                expected_delivery_date: item.expected_delivery_date,
                notes: item.notes,
                is_sample: item.is_sample ?? false, // Échantillon (défaut false)
              }))
            );

          if (insertError) throw insertError;
        }

        // 7. ✅ OPTIMISÉ: Mettre à jour les items modifiés (1 upsert au lieu de N UPDATE)
        if (itemsToUpdate.length > 0) {
          const updatePayloads = itemsToUpdate
            .map(itemToUpdate => {
              const existingItem = existingItemsMap.get(
                itemToUpdate.product_id
              );
              if (!existingItem) return null;
              return {
                id: existingItem.id,
                sales_order_id: orderId,
                product_id: itemToUpdate.product_id,
                quantity: itemToUpdate.quantity,
                unit_price_ht: itemToUpdate.unit_price_ht,
                tax_rate: itemToUpdate.tax_rate ?? 0.2,
                discount_percentage: itemToUpdate.discount_percentage ?? 0,
                eco_tax: itemToUpdate.eco_tax ?? 0,
                expected_delivery_date: itemToUpdate.expected_delivery_date,
                notes: itemToUpdate.notes,
                is_sample: itemToUpdate.is_sample ?? false,
              };
            })
            .filter(Boolean);

          if (updatePayloads.length > 0) {
            const { error: updateItemsError } = await supabase
              .from('sales_order_items')
              .upsert(updatePayloads as never);

            if (updateItemsError) throw updateItemsError;
          }
        }

        // 8. Recalculer les totaux de la commande
        const totalHT = items.reduce((sum, item) => {
          const itemTotal =
            item.quantity *
            item.unit_price_ht *
            (1 - (item.discount_percentage ?? 0) / 100);
          return sum + itemTotal;
        }, 0);

        const totalTTC = totalHT * (1 + 0.2); // TVA par défaut

        // 9. Mettre à jour les métadonnées et les totaux de la commande
        const { error: updateOrderError } = await supabase
          .from('sales_orders')
          .update({
            ...data,
            total_ht: totalHT,
            total_ttc: totalTTC,
          })
          .eq('id', orderId);

        if (updateOrderError) throw updateOrderError;

        toast({
          title: 'Succès',
          description: `Commande ${existingOrder.order_number} mise à jour avec succès`,
        });

        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) {
          await fetchOrder(orderId);
        }

        return true;
      } catch (error: unknown) {
        console.error('Erreur lors de la mise à jour de la commande:', error);
        const errMsg =
          error instanceof Error
            ? error.message
            : 'Impossible de mettre à jour la commande';
        toast({
          title: 'Erreur',
          description: errMsg,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchOrder, getAvailableStock]
  );

  // Changer le statut d'une commande
  // 🔧 FIX RLS 403: Utilise Server Action pour transmission JWT correcte au contexte PostgreSQL RLS
  // 🆕 INTÉGRATION FSM: Validation transitions avant update
  const updateStatus = useCallback(
    async (orderId: string, newStatus: SalesOrderStatus) => {
      setLoading(true);
      try {
        // Récupérer l'utilisateur courant pour le passer au trigger stock_movements
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) {
          throw new Error('Utilisateur non authentifié');
        }

        // 🔑 FSM VALIDATION: Récupérer status actuel et valider transition
        const { data: currentOrderData, error: fetchError } = await supabase
          .from('sales_orders')
          .select('status')
          .eq('id', orderId)
          .single();

        if (fetchError) throw fetchError;
        if (!currentOrderData) throw new Error('Commande introuvable');

        const currentStatus = currentOrderData.status as SalesOrderStatus;

        // Valider transition FSM (throws Error si invalide)
        validateStatusTransition(currentStatus, newStatus);
        console.warn(
          `[FSM] Transition validée: ${currentStatus} → ${newStatus}`
        );

        // ✅ DÉVALIDATION: Bloquer si expédition a commencé (même règle que PO)
        if (currentStatus === 'validated' && newStatus === 'draft') {
          const { data: items } = await supabase
            .from('sales_order_items')
            .select('quantity_shipped')
            .eq('sales_order_id', orderId);

          const hasShipped = items?.some(
            item => (item.quantity_shipped ?? 0) > 0
          );
          if (hasShipped) {
            throw new Error(
              'Impossible de dévalider : des expéditions ont déjà été effectuées'
            );
          }
          console.warn(
            `[DEVALIDATION] Aucune expédition, dévalidation autorisée`
          );

          // ✅ DÉVALIDATION: Bloquer si facture finalisée/payée existe
          const { data: invoices } = await supabase
            .from('financial_documents')
            .select('id, document_number, workflow_status')
            .eq('sales_order_id', orderId)
            .eq('document_type', 'customer_invoice')
            .in('workflow_status', ['finalized', 'paid'])
            .is('deleted_at', null)
            .limit(1);

          if (invoices && invoices.length > 0) {
            const invoice = invoices[0];
            const statusLabel =
              invoice.workflow_status === 'paid' ? 'payée' : 'définitive';
            throw new Error(
              `Impossible de dévalider : la facture ${invoice.document_number} est ${statusLabel}. ` +
                `Créez d'abord un avoir pour annuler cette facture.`
            );
          }
          console.warn(
            `[DEVALIDATION] Aucune facture finalisée, dévalidation autorisée`
          );
        }

        // ✅ Mettre à jour le statut dans la base de données
        const updateFields: Record<string, string | null> = {
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
        // Dévalidation : remettre confirmed_at à null (supprime le point vert)
        if (newStatus === 'draft') {
          updateFields.confirmed_at = null;
          updateFields.confirmed_by = null;
        }
        const { error: updateError } = await supabase
          .from('sales_orders')
          .update(updateFields)
          .eq('id', orderId);

        if (updateError) {
          throw new Error(
            updateError.message ?? 'Erreur lors de la mise à jour du statut'
          );
        }
        console.warn(`[STATUS] Statut mis à jour: ${newStatus}`);

        // Libérer les réservations de stock en cas d'annulation OU dévalidation (via client car pas bloqué par RLS)
        if (newStatus === 'cancelled' || newStatus === 'draft') {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          await supabase
            .from('stock_reservations')
            .update({
              released_at: new Date().toISOString(),
              released_by: userId,
            })
            .eq('reference_type', 'sales_order')
            .eq('reference_id', orderId)
            .is('released_at', null);
          console.warn(
            `[STOCK] Réservations libérées pour commande ${orderId}`
          );
        }

        toast({
          title: 'Succès',
          description: `Commande marquée comme ${newStatus}`,
        });

        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) {
          await fetchOrder(orderId);
        }

        // ✅ Notifier les composants d'alertes stock pour rafraîchissement immédiat
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('stock-alerts-refresh'));
          console.warn('[EVENT] stock-alerts-refresh émis');
        }
      } catch (error: unknown) {
        console.error('Erreur lors du changement de statut:', error);
        const errMsg =
          error instanceof Error
            ? error.message
            : 'Impossible de changer le statut';
        toast({
          title: 'Erreur',
          description: errMsg,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchOrder]
  );

  // Expédier des items (totalement ou partiellement)
  const shipItems = useCallback(
    async (orderId: string, itemsToShip: ShipItemData[]) => {
      setLoading(true);
      try {
        // 1. Mettre à jour les quantités expédiées
        for (const item of itemsToShip) {
          // Récupérer la quantité actuelle
          const { data: currentItem, error: fetchError } = await supabase
            .from('sales_order_items')
            .select('quantity_shipped')
            .eq('id', item.item_id)
            .single();

          if (fetchError) throw fetchError;

          // Mettre à jour avec la nouvelle quantité
          const newQuantity =
            (currentItem.quantity_shipped ?? 0) + item.quantity_shipped;

          const { error: updateError } = await supabase
            .from('sales_order_items')
            .update({
              quantity_shipped: newQuantity,
            })
            .eq('id', item.item_id);

          if (updateError) throw updateError;

          // Note: Le mouvement de stock est créé automatiquement par le trigger
          // handle_sales_order_stock() qui détecte le changement de quantity_shipped
        }

        // 2. Vérifier si la commande est entièrement expédiée
        const { data: orderItems, error: checkError } = await supabase
          .from('sales_order_items')
          .select('quantity, quantity_shipped')
          .eq('sales_order_id', orderId);

        if (checkError) throw checkError;

        const isFullyShipped = orderItems?.every(
          item => item.quantity_shipped >= item.quantity
        );
        const isPartiallyShipped = orderItems?.some(
          item => item.quantity_shipped > 0
        );

        let newStatus: SalesOrderStatus = 'validated';
        if (isFullyShipped) {
          newStatus = 'shipped';
        } else if (isPartiallyShipped) {
          newStatus = 'partially_shipped';
        }

        // 5. Mettre à jour le statut de la commande
        await updateStatus(orderId, newStatus);

        toast({
          title: 'Succès',
          description: 'Expédition enregistrée avec succès',
        });
      } catch (error: unknown) {
        console.error("Erreur lors de l'expédition:", error);
        const errMsg =
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer l'expédition";
        toast({
          title: 'Erreur',
          description: errMsg,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, updateStatus]
  );

  // Supprimer une commande (draft seulement)
  const deleteOrder = useCallback(
    async (orderId: string) => {
      setLoading(true);
      try {
        // Libérer les réservations en premier
        const userId = (await supabase.auth.getUser()).data.user?.id;
        await supabase
          .from('stock_reservations')
          .update({
            released_at: new Date().toISOString(),
            released_by: userId,
          })
          .eq('reference_type', 'sales_order')
          .eq('reference_id', orderId)
          .is('released_at', null);

        console.warn('[DELETE] Début suppression commande:', orderId);

        // Vérifier d'abord le statut de la commande
        const { data: order, error: fetchError } = await supabase
          .from('sales_orders')
          .select('status')
          .eq('id', orderId)
          .single();

        console.warn('[DELETE] Statut récupéré:', order, 'Erreur:', fetchError);

        if (fetchError) {
          console.error('❌ [DELETE] Erreur fetch status:', fetchError);
          throw fetchError;
        }

        // Sécurité : seules les commandes draft ou cancelled peuvent être supprimées
        if (order.status !== 'draft' && order.status !== 'cancelled') {
          console.error('🚫 [DELETE] Statut invalide:', order.status);
          throw new Error(
            'Seules les commandes en brouillon ou annulées peuvent être supprimées'
          );
        }

        console.warn('[DELETE] Validation statut OK, suppression en cours...');

        // Supprimer la commande (avec count pour vérifier si suppression effective)
        const { data, error, count } = await supabase
          .from('sales_orders')
          .delete()
          .eq('id', orderId)
          .select();

        console.warn(
          '[DELETE] Résultat suppression - Data:',
          data,
          'Count:',
          count,
          'Erreur:',
          error
        );

        if (error) {
          console.error('❌ [DELETE] Erreur Supabase delete:', error);
          throw error;
        }

        // Vérifier si la suppression a réellement eu lieu (RLS peut bloquer silencieusement)
        if (!data || data.length === 0) {
          console.error(
            '❌ [DELETE] RLS POLICY BLOQUE LA SUPPRESSION - Aucune ligne affectée'
          );
          throw new Error(
            'Impossible de supprimer : permissions insuffisantes (RLS policy). Vérifiez que vous êtes le créateur de la commande.'
          );
        }

        console.warn(
          '[DELETE] Suppression réussie !',
          data.length,
          'ligne(s) supprimée(s)'
        );

        toast({
          title: 'Succès',
          description: 'Commande supprimée avec succès',
        });

        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) {
          setCurrentOrder(null);
        }
      } catch (error: unknown) {
        console.error('Erreur lors de la suppression:', error);
        const errMsg =
          error instanceof Error
            ? error.message
            : 'Impossible de supprimer la commande';
        toast({
          title: 'Erreur',
          description: errMsg,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders]
  );

  return {
    // État
    loading,
    orders,
    currentOrder,
    stats,

    // Actions principales
    fetchOrders,
    fetchOrder,
    fetchStats,
    createOrder,
    updateOrder,
    updateOrderWithItems,
    updateStatus,
    shipItems,
    deleteOrder,
    markAsPaid,
    markAsManuallyPaid,
    fetchOrderPayments,
    deleteManualPayment,
    markWarehouseExit,

    // Utilitaires
    checkStockAvailability,
    getStockWithForecasted,
    setCurrentOrder,

    // 🆕 FSM Helpers (pour UI)
    getAllowedTransitions,
    isFinalStatus,
  };
}

// ============================================================================
// EXPORTS FSM pour composants UI
// ============================================================================

export { getAllowedTransitions, isFinalStatus, validateStatusTransition };
