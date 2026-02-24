'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollArea,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  CheckCircle2,
  FileText,
  Loader2,
  Search,
  ShoppingCart,
} from 'lucide-react';

/**
 * Interface unifiée pour les commandes utilisées dans les documents
 * (factures, devis, avoirs). Remplace IOrderForInvoice et IOrderForQuote.
 */
/**
 * Adresse structurée pour facturation/livraison
 */
export interface IDocumentAddress {
  address_line1: string;
  address_line2?: string;
  postal_code: string;
  city: string;
  country: string;
}

export interface IOrderForDocument {
  id: string;
  order_number: string;
  total_ht: number;
  total_ttc: number;
  tax_rate: number;
  currency: string;
  payment_terms?: string; // Optionnel pour compatibilité avec devis
  customer_id?: string | null;
  customer_type?: string | null;
  // Adresses (JSONB de la commande)
  billing_address?: IDocumentAddress | null;
  shipping_address?: IDocumentAddress | null;
  // Frais de service
  shipping_cost_ht?: number | null;
  handling_cost_ht?: number | null;
  insurance_cost_ht?: number | null;
  fees_vat_rate?: number | null;
  organisations?: {
    name?: string;
    trade_name?: string | null;
    legal_name?: string | null;
    email?: string | null;
    // Adresses organisation (fallback)
    address_line1?: string | null;
    city?: string | null;
    postal_code?: string | null;
    country?: string | null;
    billing_address_line1?: string | null;
    billing_city?: string | null;
    billing_postal_code?: string | null;
    billing_country?: string | null;
    shipping_address_line1?: string | null;
    shipping_city?: string | null;
    shipping_postal_code?: string | null;
    shipping_country?: string | null;
    has_different_shipping_address?: boolean | null;
    siret?: string | null;
    vat_number?: string | null;
  } | null;
  individual_customers?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  sales_order_items?: Array<{
    id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate: number;
    products?: {
      name: string;
    } | null;
  }>;
}

/**
 * Interface pour les lignes personnalisées (libellés custom)
 */
export interface ICustomLine {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
}

// Alias pour rétrocompatibilité avec les factures
export type IOrderForInvoice = IOrderForDocument;

// Alias pour rétrocompatibilité avec les devis
export type IOrderForQuote = IOrderForDocument;

export interface OrderSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrder: (order: IOrderForDocument) => void;
}

interface OrderListItem {
  id: string;
  order_number: string;
  total_ht: number;
  total_ttc: number;
  tax_rate: number;
  currency: string;
  payment_terms: string;
  status: string;
  created_at: string;
  customer_id: string | null;
  customer_type: string;
  customer_name: string;
  customer_email: string | null;
  payment_status_v2: string | null;
}

export function OrderSelectModal({
  open,
  onOpenChange,
  onSelectOrder,
}: OrderSelectModalProps): React.ReactNode {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const supabase = createClient();

  // Charger les commandes clients confirmees ou livrees
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Requete pour toutes les commandes validees
      const { data: ordersData, error: ordersError } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          total_ht,
          total_ttc,
          tax_rate,
          currency,
          payment_terms,
          status,
          created_at,
          customer_id,
          customer_type,
          payment_status_v2
        `
        )
        .in('status', ['validated', 'shipped'])
        .or('payment_status_v2.is.null,payment_status_v2.neq.paid')
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersError) {
        console.error('[OrderSelect] Error loading orders:', ordersError);
        setOrders([]);
        return;
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // Collecter les IDs de clients par type
      const orgIds = ordersData
        .filter(o => o.customer_type === 'organization')
        .map(o => o.customer_id)
        .filter((id): id is string => id !== null);
      const indivIds = ordersData
        .filter(o => o.customer_type === 'individual')
        .map(o => o.customer_id)
        .filter((id): id is string => id !== null);

      // Fetch organisations
      const orgMap = new Map<string, { name: string; email: string | null }>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organisations')
          .select('id, legal_name, trade_name, email')
          .in('id', orgIds);
        if (orgs) {
          for (const org of orgs) {
            orgMap.set(org.id, {
              name: org.trade_name || org.legal_name || 'Organisation',
              email: org.email,
            });
          }
        }
      }

      // Fetch individual customers
      const indivMap = new Map<
        string,
        { name: string; email: string | null }
      >();
      if (indivIds.length > 0) {
        const { data: indivs } = await supabase
          .from('individual_customers')
          .select('id, first_name, last_name, email')
          .in('id', indivIds);
        if (indivs) {
          for (const indiv of indivs) {
            indivMap.set(indiv.id, {
              name:
                `${indiv.first_name || ''} ${indiv.last_name || ''}`.trim() ||
                'Client',
              email: indiv.email,
            });
          }
        }
      }

      // Filter out already-invoiced orders (unless credit note cancels them)
      const orderIds = ordersData.map(o => o.id);
      const invoicedOrderIds = new Set<string>();

      if (orderIds.length > 0) {
        const { data: docs } = await supabase
          .from('financial_documents')
          .select('sales_order_id, document_type')
          .in('sales_order_id', orderIds)
          .is('deleted_at', null)
          .neq('workflow_status', 'cancelled');

        // Count invoices and credit notes per order
        const invoiceCount = new Map<string, number>();
        const creditNoteCount = new Map<string, number>();

        for (const doc of docs || []) {
          const orderId = doc.sales_order_id;
          if (!orderId) continue;
          if (doc.document_type === 'customer_invoice') {
            invoiceCount.set(orderId, (invoiceCount.get(orderId) || 0) + 1);
          } else if (doc.document_type === 'customer_credit_note') {
            creditNoteCount.set(
              orderId,
              (creditNoteCount.get(orderId) || 0) + 1
            );
          }
        }

        // Order is NOT available if it has more invoices than credit notes
        for (const [orderId, count] of invoiceCount) {
          const credits = creditNoteCount.get(orderId) || 0;
          if (count > credits) {
            invoicedOrderIds.add(orderId);
          }
        }
      }

      // Filter: exclude already-invoiced orders
      const availableOrders = ordersData.filter(
        o => !invoicedOrderIds.has(o.id)
      );

      // Transformer les commandes avec les infos client
      const allOrders: OrderListItem[] = availableOrders.map(order => {
        let customerInfo = { name: 'Client', email: null as string | null };

        if (order.customer_type === 'organization' && order.customer_id) {
          customerInfo = orgMap.get(order.customer_id) || customerInfo;
        } else if (order.customer_type === 'individual' && order.customer_id) {
          customerInfo = indivMap.get(order.customer_id) || customerInfo;
        }

        return {
          id: order.id,
          order_number: order.order_number,
          total_ht: order.total_ht || 0,
          total_ttc: order.total_ttc || 0,
          tax_rate: order.tax_rate || 20,
          currency: order.currency || 'EUR',
          payment_terms: order.payment_terms || 'immediate',
          status: order.status,
          created_at: order.created_at,
          customer_id: order.customer_id,
          customer_type: order.customer_type,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          payment_status_v2: order.payment_status_v2 ?? null,
        };
      });

      setOrders(allOrders);
    } catch (error) {
      console.error('[OrderSelect] Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Charger les commandes a l'ouverture
  useEffect(() => {
    if (open) {
      void loadOrders();
      setSearch('');
      setSelectedOrderId(null);
    }
  }, [open, loadOrders]);

  // Filtrer par recherche
  const filteredOrders = orders.filter(order => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(searchLower) ||
      order.customer_name.toLowerCase().includes(searchLower)
    );
  });

  // Selectionner une commande et charger les details complets
  const handleSelectOrder = async (orderId: string): Promise<void> => {
    setLoadingOrder(true);
    setSelectedOrderId(orderId);

    try {
      // Charger les details complets de la commande (avec adresses)
      const { data: order, error } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          total_ht,
          total_ttc,
          tax_rate,
          currency,
          payment_terms,
          customer_type,
          customer_id,
          billing_address,
          shipping_address,
          shipping_cost_ht,
          handling_cost_ht,
          insurance_cost_ht,
          fees_vat_rate,
          sales_order_items(
            id,
            quantity,
            unit_price_ht,
            tax_rate,
            products(name)
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (error || !order) {
        console.error('[OrderSelect] Error loading order details:', error);
        return;
      }

      // Fetch customer info based on type
      let customerOrg: IOrderForDocument['organisations'] = null;
      let customerIndiv: {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
      } | null = null;

      if (order.customer_type === 'organization' && order.customer_id) {
        const { data: org } = await supabase
          .from('organisations')
          .select(
            'legal_name, trade_name, email, address_line1, city, postal_code, country, billing_address_line1, billing_city, billing_postal_code, billing_country, shipping_address_line1, shipping_city, shipping_postal_code, shipping_country, has_different_shipping_address, siret, vat_number'
          )
          .eq('id', order.customer_id)
          .single();
        if (org) {
          customerOrg = {
            name: org.trade_name || org.legal_name,
            legal_name: org.legal_name,
            trade_name: org.trade_name,
            email: org.email,
            address_line1: org.address_line1,
            city: org.city,
            postal_code: org.postal_code,
            country: org.country,
            billing_address_line1: org.billing_address_line1,
            billing_city: org.billing_city,
            billing_postal_code: org.billing_postal_code,
            billing_country: org.billing_country,
            shipping_address_line1: org.shipping_address_line1,
            shipping_city: org.shipping_city,
            shipping_postal_code: org.shipping_postal_code,
            shipping_country: org.shipping_country,
            has_different_shipping_address: org.has_different_shipping_address,
            siret: org.siret,
            vat_number: org.vat_number,
          };
        }
      } else if (order.customer_type === 'individual' && order.customer_id) {
        const { data: indiv } = await supabase
          .from('individual_customers')
          .select('first_name, last_name, email')
          .eq('id', order.customer_id)
          .single();
        if (indiv) {
          customerIndiv = {
            first_name: indiv.first_name,
            last_name: indiv.last_name,
            email: indiv.email,
          };
        }
      }

      // Transformer en IOrderForDocument (unifié pour factures et devis)
      const orderForDocument: IOrderForDocument = {
        id: order.id,
        order_number: order.order_number,
        total_ht: order.total_ht || 0,
        total_ttc: order.total_ttc || 0,
        tax_rate: order.tax_rate || 20,
        currency: order.currency || 'EUR',
        payment_terms: order.payment_terms || 'immediate',
        customer_id: order.customer_id,
        customer_type: order.customer_type,
        billing_address: order.billing_address as IDocumentAddress | null,
        shipping_address: order.shipping_address as IDocumentAddress | null,
        shipping_cost_ht: order.shipping_cost_ht ?? null,
        handling_cost_ht: order.handling_cost_ht ?? null,
        insurance_cost_ht: order.insurance_cost_ht ?? null,
        fees_vat_rate: order.fees_vat_rate ?? null,
        organisations: customerOrg,
        individual_customers: customerIndiv,
        sales_order_items: order.sales_order_items || [],
      };

      onSelectOrder(orderForDocument);
      onOpenChange(false);
    } catch (error) {
      console.error('[OrderSelect] Error:', error);
    } finally {
      setLoadingOrder(false);
    }
  };

  const formatAmount = (amount: number, currency = 'EUR'): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Selectionner une commande
          </DialogTitle>
          <DialogDescription>
            Commandes validees sans facture active (hors payees)
          </DialogDescription>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numero ou client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Liste des commandes */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune commande trouvee</p>
              <p className="text-sm mt-1">
                Seules les commandes validees sont affichees
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map(order => (
                <Card
                  key={order.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedOrderId === order.id
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                  onClick={() => void handleSelectOrder(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {order.order_number}
                        </span>
                        {selectedOrderId === order.id && loadingOrder && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {selectedOrderId === order.id && !loadingOrder && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatAmount(order.total_ttc, order.currency)}
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs text-muted-foreground capitalize">
                          {order.status}
                        </span>
                        {order.payment_status_v2 === 'partially_paid' && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                            Partiel. payée
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
