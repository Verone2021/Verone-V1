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

import { type IOrderForInvoice } from './InvoiceCreateFromOrderModal';

export interface OrderSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrder: (order: IOrderForInvoice) => void;
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
  customer_id: string;
  customer_type: string;
  customer_name: string;
  customer_email: string | null;
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
          customer_type
        `
        )
        .eq('status', 'validated')
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
        .filter(o => o.customer_type === 'organisation')
        .map(o => o.customer_id);
      const indivIds = ordersData
        .filter(o => o.customer_type === 'individual')
        .map(o => o.customer_id);

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

      // Transformer les commandes avec les infos client
      const allOrders: OrderListItem[] = ordersData.map(order => {
        let customerInfo = { name: 'Client', email: null as string | null };

        if (order.customer_type === 'organisation') {
          customerInfo = orgMap.get(order.customer_id) || customerInfo;
        } else if (order.customer_type === 'individual') {
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
      // Charger les details complets de la commande
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
      let customerOrg: { name?: string; email?: string | null } | null = null;
      let customerIndiv: {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
      } | null = null;

      if (order.customer_type === 'organisation' && order.customer_id) {
        const { data: org } = await supabase
          .from('organisations')
          .select('legal_name, trade_name, email')
          .eq('id', order.customer_id)
          .single();
        if (org) {
          customerOrg = {
            name: org.trade_name || org.legal_name,
            email: org.email,
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

      // Transformer en IOrderForInvoice
      const orderForInvoice: IOrderForInvoice = {
        id: order.id,
        order_number: order.order_number,
        total_ht: order.total_ht || 0,
        total_ttc: order.total_ttc || 0,
        tax_rate: order.tax_rate || 20,
        currency: order.currency || 'EUR',
        payment_terms: order.payment_terms || 'immediate',
        organisations: customerOrg,
        individual_customers: customerIndiv,
        sales_order_items: order.sales_order_items || [],
      };

      onSelectOrder(orderForInvoice);
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
            Seules les commandes validees peuvent etre facturees
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
                      <p className="text-xs text-muted-foreground capitalize">
                        {order.status}
                      </p>
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
