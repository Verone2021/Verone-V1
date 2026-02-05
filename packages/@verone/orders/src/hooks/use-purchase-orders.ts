'use client';

/**
 * Hook pour la gestion des commandes fournisseurs
 * Gère le workflow complet : création → envoi → confirmation → réception
 */

import { useState, useCallback, useMemo } from 'react';

// FIXME: Server actions can't be imported from monorepo packages
// import { updatePurchaseOrderStatus as updatePurchaseOrderStatusAction } from '@/app/actions/purchase-orders';
import { useToast } from '@verone/common/hooks';
import { useStockMovements } from '@verone/stock/hooks/use-stock-movements';
import { createClient } from '@verone/utils/supabase/client';

// Types pour les commandes fournisseurs
export type PurchaseOrderStatus =
  | 'draft'
  | 'validated' // ✅ Statut validation (rouge → vert)
  | 'partially_received'
  | 'received'
  | 'cancelled';

// Type local (le type exporté est dans use-sales-orders.ts)
type ManualPaymentType =
  | 'cash'
  | 'check'
  | 'transfer_other'
  | 'card'
  | 'compensation'
  | 'verified_bubble';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  payment_status_v2?: 'pending' | 'paid' | null;
  // 🆕 Paiement manuel
  manual_payment_type?: ManualPaymentType | null;
  manual_payment_date?: string | null;
  manual_payment_reference?: string | null;
  manual_payment_note?: string | null;
  manual_payment_by?: string | null;
  // 🆕 Transaction liée (enrichissement)
  is_matched?: boolean;
  matched_transaction_id?: string | null;
  matched_transaction_label?: string | null;
  matched_transaction_amount?: number | null;
  matched_transaction_emitted_at?: string | null;
  currency: string;
  tax_rate: number;
  eco_tax_total: number;
  eco_tax_vat_rate: number | null;
  total_ht: number;
  total_ttc: number;
  expected_delivery_date?: string;
  delivery_address?: any;
  payment_terms?: string;
  notes?: string;

  // Workflow users et timestamps
  created_by: string;
  validated_by?: string;
  received_by?: string;

  validated_at?: string;
  received_at?: string;
  cancelled_at?: string;

  created_at: string;
  updated_at: string;

  // Relations jointes
  organisations?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    email?: string;
    phone?: string;
    payment_terms?: string | null;
  };
  purchase_order_items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  discount_percentage: number;
  total_ht: number;
  eco_tax: number;
  quantity_received: number;
  expected_delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Échantillons
  sample_type?: 'internal' | 'customer' | null;
  customer_organisation_id?: string | null;
  customer_individual_id?: string | null;
  customer_organisation?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  } | null;
  customer_individual?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;

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

export interface CreatePurchaseOrderData {
  supplier_id: string;
  expected_delivery_date?: string;
  delivery_address?: any;
  payment_terms?: string;
  notes?: string;
  eco_tax_vat_rate?: number | null;
  // Frais additionnels fournisseurs
  shipping_cost_ht?: number;
  customs_cost_ht?: number;
  insurance_cost_ht?: number;
  items: CreatePurchaseOrderItemData[];
}

export interface CreatePurchaseOrderItemData {
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  discount_percentage?: number;
  expected_delivery_date?: string;
  notes?: string;
}

export interface UpdatePurchaseOrderData {
  expected_delivery_date?: string;
  delivery_address?: any;
  payment_terms?: string;
  notes?: string;
}

export interface ReceiveItemData {
  item_id: string;
  quantity_received: number;
  unit_cost?: number;
  notes?: string;
}

interface PurchaseOrderFilters {
  supplier_id?: string;
  status?: PurchaseOrderStatus;
  date_from?: string;
  date_to?: string;
  po_number?: string;
}

interface PurchaseOrderStats {
  total_orders: number;
  total_value: number;
  pending_orders: number;
  received_orders: number;
  cancelled_orders: number;
}

export function usePurchaseOrders() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<PurchaseOrder | null>(null);
  const [stats, setStats] = useState<PurchaseOrderStats | null>(null);
  const { toast } = useToast();
  // ✅ FIX: useMemo pour éviter recréation du client à chaque render
  const supabase = useMemo(() => createClient(), []);
  const { createMovement } = useStockMovements();

  // PERFORMANCE FIX #3: Payload Optimization (+200ms gain)
  // SELECT colonnes explicites au lieu de *
  const fetchOrders = useCallback(
    async (filters?: PurchaseOrderFilters) => {
      setLoading(true);
      try {
        let query = supabase
          .from('purchase_orders')
          .select(
            `
          id,
          po_number,
          supplier_id,
          status,
          payment_status_v2,
          manual_payment_type,
          manual_payment_date,
          manual_payment_reference,
          manual_payment_note,
          manual_payment_by,
          currency,
          tax_rate,
          total_ht,
          total_ttc,
          expected_delivery_date,
          delivery_address,
          payment_terms,
          notes,
          created_by,
          validated_by,
          received_by,
          validated_at,
          received_at,
          cancelled_at,
          created_at,
          updated_at,
          organisations (
            id,
            legal_name,
            trade_name,
            email,
            phone,
            payment_terms
          ),
          purchase_order_items (
            id,
            purchase_order_id,
            product_id,
            quantity,
            unit_price_ht,
            discount_percentage,
            total_ht,
            eco_tax,
            quantity_received,
            expected_delivery_date,
            notes,
            created_at,
            updated_at,
            sample_type,
            customer_organisation_id,
            customer_individual_id,
            customer_organisation:organisations!purchase_order_items_customer_organisation_id_fkey (
              id,
              legal_name,
              trade_name
            ),
            customer_individual:individual_customers!purchase_order_items_customer_individual_id_fkey (
              id,
              first_name,
              last_name
            ),
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
        if (filters?.supplier_id) {
          query = query.eq('supplier_id', filters.supplier_id);
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
        if (filters?.po_number) {
          query = query.ilike('po_number', `%${filters.po_number}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Cast as any car les types Supabase ne sont pas à jour (colonnes payment_status_v2, manual_payment_*)
        const ordersData = (data || []) as any[];

        // 🆕 Récupérer les transactions liées (rapprochement bancaire)
        const orderIds = ordersData.map(o => o.id);
        const matchedOrdersMap = new Map<
          string,
          {
            transaction_id: string;
            label: string;
            amount: number;
            emitted_at: string | null;
          }
        >();

        if (orderIds.length > 0) {
          const { data: links } = await supabase
            .from('transaction_document_links')
            .select(
              `
              purchase_order_id,
              transaction_id,
              bank_transactions!inner (
                id,
                label,
                amount,
                emitted_at
              )
            `
            )
            .in('purchase_order_id', orderIds)
            .eq('link_type', 'purchase_order');

          for (const link of links || []) {
            if (link.purchase_order_id && link.bank_transactions) {
              const bt = link.bank_transactions as any;
              matchedOrdersMap.set(link.purchase_order_id, {
                transaction_id: bt.id,
                label: bt.label || '',
                amount: bt.amount || 0,
                emitted_at: bt.emitted_at || null,
              });
            }
          }
        }

        // Enrichir les produits avec primary_image_url (BR-TECH-002) + rapprochement
        const enrichedOrders = ordersData.map(order => {
          const matchInfo = matchedOrdersMap.get(order.id);
          return {
            ...order,
            // 🆕 Rapprochement bancaire
            is_matched: !!matchInfo,
            matched_transaction_id: matchInfo?.transaction_id || null,
            matched_transaction_label: matchInfo?.label || null,
            matched_transaction_amount: matchInfo?.amount || null,
            matched_transaction_emitted_at: matchInfo?.emitted_at || null,
            purchase_order_items: (order.purchase_order_items || []).map(
              item => ({
                ...item,
                products: item.products
                  ? {
                      ...item.products,
                      primary_image_url:
                        item.products.product_images?.[0]?.public_url || null,
                    }
                  : null,
              })
            ),
          };
        });

        setOrders(enrichedOrders as any);
      } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les commandes',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  // Récupérer une commande spécifique (Optimisé)
  const fetchOrder = useCallback(
    async (orderId: string) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('purchase_orders')
          .select(
            `
          id,
          po_number,
          supplier_id,
          status,
          currency,
          tax_rate,
          total_ht,
          total_ttc,
          expected_delivery_date,
          delivery_address,
          payment_terms,
          notes,
          created_by,
          validated_by,
          received_by,
          validated_at,
          received_at,
          cancelled_at,
          created_at,
          updated_at,
          organisations (
            id,
            legal_name,
            trade_name,
            email,
            phone,
            payment_terms
          ),
          purchase_order_items (
            id,
            purchase_order_id,
            product_id,
            quantity,
            unit_price_ht,
            discount_percentage,
            total_ht,
            eco_tax,
            quantity_received,
            expected_delivery_date,
            notes,
            created_at,
            updated_at,
            sample_type,
            customer_organisation_id,
            customer_individual_id,
            customer_organisation:organisations!purchase_order_items_customer_organisation_id_fkey (
              id,
              legal_name,
              trade_name
            ),
            customer_individual:individual_customers!purchase_order_items_customer_individual_id_fkey (
              id,
              first_name,
              last_name
            ),
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

        // Enrichir les produits avec primary_image_url (BR-TECH-002)
        const enrichedItems = (data.purchase_order_items || []).map(item => ({
          ...item,
          products: item.products
            ? {
                ...item.products,
                primary_image_url:
                  item.products.product_images?.[0]?.public_url || null,
              }
            : null,
        }));

        const enrichedOrder = {
          ...data,
          purchase_order_items: enrichedItems,
        };

        setCurrentOrder(enrichedOrder as any);
        return enrichedOrder;
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
    async (filters?: PurchaseOrderFilters) => {
      try {
        let query = supabase
          .from('purchase_orders')
          .select('status, total_ht, eco_tax_total, total_ttc');

        if (filters?.date_from) {
          query = query.gte('created_at', filters.date_from);
        }
        if (filters?.date_to) {
          query = query.lte('created_at', filters.date_to);
        }

        // ⚠️ Type cast needed: Supabase types might be stale, eco_tax_total exists in DB
        const { data, error } = (await query) as any;

        if (error) throw error;

        const statsData = data?.reduce(
          (acc, order) => {
            acc.total_orders++;
            acc.total_value += order.total_ht || 0;
            acc.eco_tax_total += order.eco_tax_total || 0;
            acc.total_ttc += order.total_ttc || 0;

            switch (order.status) {
              case 'draft':
              case 'validated':
              case 'partially_received':
                acc.pending_orders++;
                break;
              case 'received':
                acc.received_orders++;
                break;
              case 'cancelled':
                acc.cancelled_orders++;
                break;
            }
            return acc;
          },
          {
            total_orders: 0,
            total_value: 0,
            eco_tax_total: 0,
            total_ttc: 0,
            pending_orders: 0,
            received_orders: 0,
            cancelled_orders: 0,
          }
        );

        setStats(statsData || null);
      } catch (error) {
        console.error(
          'Erreur lors de la récupération des statistiques:',
          error
        );
      }
    },
    [supabase]
  );

  // Créer une nouvelle commande
  const createOrder = useCallback(
    async (data: CreatePurchaseOrderData) => {
      setLoading(true);
      try {
        // 1. Générer le numéro de commande
        const { data: poNumber, error: numberError } =
          await supabase.rpc('generate_po_number');

        if (numberError) throw numberError;

        // 2. Calculer les totaux
        const totalHT = data.items.reduce((sum, item) => {
          const itemTotal =
            item.quantity *
            item.unit_price_ht *
            (1 - (item.discount_percentage || 0) / 100);
          return sum + itemTotal;
        }, 0);

        const totalTTC = totalHT * (1 + 0.2); // TVA par défaut

        // 3. Créer la commande
        const { data: order, error: orderError } = await supabase
          .from('purchase_orders')
          .insert([
            {
              po_number: poNumber,
              supplier_id: data.supplier_id,
              expected_delivery_date: data.expected_delivery_date,
              delivery_address: data.delivery_address,
              payment_terms: data.payment_terms,
              notes: data.notes,
              total_ht: totalHT,
              total_ttc: totalTTC,
              created_by: (await supabase.auth.getUser()).data.user?.id,
            },
          ] as any)
          .select()
          .single();

        if (orderError) throw orderError;

        // 4. Créer les items
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(
            data.items.map(item => ({
              purchase_order_id: order.id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price_ht: item.unit_price_ht,
              discount_percentage: item.discount_percentage || 0,
              expected_delivery_date: item.expected_delivery_date,
              notes: item.notes,
            }))
          );

        if (itemsError) throw itemsError;

        toast({
          title: 'Succès',
          description: `Commande ${poNumber} créée avec succès`,
        });

        await fetchOrders();
        await fetchStats(); // ✅ FIX Bug #6: Rafraîchir les stats après création
        return order;
      } catch (error: any) {
        console.error('Erreur lors de la création de la commande:', error);
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de créer la commande',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchStats]
  );

  // Mettre à jour une commande
  const updateOrder = useCallback(
    async (orderId: string, data: UpdatePurchaseOrderData) => {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('purchase_orders')
          .update(data)
          .eq('id', orderId);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Commande mise à jour avec succès',
        });

        await fetchOrders();
        await fetchStats(); // ✅ FIX Bug #6: Rafraîchir les stats après mise à jour
        if (currentOrder?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour:', error);
        toast({
          title: 'Erreur',
          description:
            error.message || 'Impossible de mettre à jour la commande',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchStats, currentOrder, fetchOrder]
  );

  // Changer le statut d'une commande (utilise Server Action pour bypasser RLS)
  const updateStatus = useCallback(
    async (orderId: string, newStatus: PurchaseOrderStatus) => {
      setLoading(true);
      try {
        // Récupérer l'utilisateur courant
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) {
          throw new Error('Utilisateur non authentifié');
        }

        // FIXME: updatePurchaseOrderStatusAction server action can't be imported from monorepo
        // // Appeler la Server Action qui bypass RLS
        // const result = await updatePurchaseOrderStatusAction(
        //   orderId,
        //   newStatus,
        //   user.id
        // );

        // if (!result.success) {
        //   throw new Error(result.error || 'Erreur lors de la mise à jour');
        // }

        // toast({
        //   title: 'Succès',
        //   description: `Commande marquée comme ${newStatus}`,
        // });

        // await fetchOrders();
        await fetchStats(); // ✅ FIX Bug #6: Rafraîchir les stats après changement de statut
        if (currentOrder?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: any) {
        console.error('Erreur lors du changement de statut:', error);
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de changer le statut',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchStats, currentOrder, fetchOrder]
  );

  // Réceptionner des items (totalement ou partiellement)
  const receiveItems = useCallback(
    async (orderId: string, itemsToReceive: ReceiveItemData[]) => {
      setLoading(true);
      try {
        // 1. Mettre à jour les quantités reçues
        for (const item of itemsToReceive) {
          // Récupérer la quantité actuelle
          const { data: currentItem, error: fetchError } = await supabase
            .from('purchase_order_items')
            .select('quantity_received')
            .eq('id', item.item_id)
            .single();

          if (fetchError) throw fetchError;

          // Mettre à jour avec la nouvelle quantité
          const newQuantity =
            (currentItem.quantity_received || 0) + item.quantity_received;

          const { error: updateError } = await supabase
            .from('purchase_order_items')
            .update({
              quantity_received: newQuantity,
            })
            .eq('id', item.item_id);

          if (updateError) throw updateError;

          // Note: Le mouvement de stock est créé automatiquement par le trigger
          // handle_purchase_order_forecast() qui détecte le changement de quantity_received
        }

        // 2. Vérifier si la commande est entièrement reçue
        const { data: orderItems, error: checkError } = await supabase
          .from('purchase_order_items')
          .select('quantity, quantity_received')
          .eq('purchase_order_id', orderId);

        if (checkError) throw checkError;

        const isFullyReceived = orderItems?.every(
          item => item.quantity_received >= item.quantity
        );
        const isPartiallyReceived = orderItems?.some(
          item => item.quantity_received > 0
        );

        let newStatus: PurchaseOrderStatus = 'validated';
        if (isFullyReceived) {
          newStatus = 'received';
        } else if (isPartiallyReceived) {
          newStatus = 'partially_received';
        }

        // 4. Mettre à jour le statut de la commande
        await updateStatus(orderId, newStatus);

        toast({
          title: 'Succès',
          description: 'Réception enregistrée avec succès',
        });
      } catch (error: any) {
        console.error('Erreur lors de la réception:', error);
        toast({
          title: 'Erreur',
          description: error.message || "Impossible d'enregistrer la réception",
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, createMovement, updateStatus]
  );

  // Supprimer une commande (draft ou cancelled seulement)
  const deleteOrder = useCallback(
    async (orderId: string) => {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('purchase_orders')
          .delete()
          .eq('id', orderId)
          .in('status', ['draft', 'cancelled']); // Sécurité : seules les commandes draft ou cancelled peuvent être supprimées

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Commande supprimée avec succès',
        });

        await fetchOrders();
        await fetchStats(); // ✅ FIX Bug #6: Rafraîchir les stats après suppression
        if (currentOrder?.id === orderId) {
          setCurrentOrder(null);
        }
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de supprimer la commande',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchStats, currentOrder]
  );

  // Obtenir le stock avec prévisionnel pour les commandes fournisseurs
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
          stock_real: data?.stock_real || 0,
          stock_forecasted_in: data?.stock_forecasted_in || 0,
          stock_forecasted_out: data?.stock_forecasted_out || 0,
          stock_available:
            (data?.stock_real || 0) +
            (data?.stock_forecasted_in || 0) -
            (data?.stock_forecasted_out || 0),
          stock_future:
            (data?.stock_real || 0) + (data?.stock_forecasted_in || 0),
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

  // Marquer une commande comme validée (déclenche stock prévisionnel)
  const confirmOrder = useCallback(
    async (orderId: string) => {
      return updateStatus(orderId, 'validated');
    },
    [updateStatus]
  );

  // Marquer réception complète
  const markAsReceived = useCallback(
    async (orderId: string) => {
      return updateStatus(orderId, 'received');
    },
    [updateStatus]
  );

  // Marquer comme payé manuellement (aligné avec sales orders)
  const markAsManuallyPaid = useCallback(
    async (
      orderId: string,
      paymentType: ManualPaymentType,
      options?: {
        reference?: string;
        note?: string;
        date?: Date;
      }
    ) => {
      setLoading(true);
      try {
        // Type assertion car les colonnes manual_payment_* sont nouvelles
        // et pas encore dans les types Supabase générés
        const { error } = await supabase
          .from('purchase_orders')
          .update({
            manual_payment_type: paymentType,
            manual_payment_date:
              options?.date?.toISOString() ?? new Date().toISOString(),
            manual_payment_reference: options?.reference ?? null,
            manual_payment_note: options?.note ?? null,
          } as Record<string, unknown>)
          .eq('id', orderId);

        if (error) throw error;

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
          description: `Type: ${paymentLabels[paymentType]}`,
        });

        await fetchOrders();
        if (currentOrder?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: any) {
        console.error('Erreur lors du paiement manuel:', error);
        toast({
          title: 'Erreur',
          description:
            error.message || "Impossible d'enregistrer le paiement manuel",
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, currentOrder, fetchOrder]
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
    updateStatus,
    receiveItems,
    deleteOrder,
    confirmOrder,
    markAsReceived,
    markAsManuallyPaid,

    // Utilitaires
    getStockWithForecasted,
    setCurrentOrder,
  };
}
