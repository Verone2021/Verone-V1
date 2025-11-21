'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { Badge } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { ArrowDownToLine, ArrowUpFromLine, Package } from 'lucide-react';

interface ForecastBreakdownModalProps {
  productId: string | null;
  productName?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ForecastOrder {
  order_number: string;
  order_id: string;
  quantity: number;
  status: string;
  type: 'sales' | 'purchase';
}

export function ForecastBreakdownModal({
  productId,
  productName,
  isOpen,
  onClose,
}: ForecastBreakdownModalProps) {
  const [loading, setLoading] = useState(false);
  const [incomingOrders, setIncomingOrders] = useState<ForecastOrder[]>([]);
  const [outgoingOrders, setOutgoingOrders] = useState<ForecastOrder[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && productId) {
      fetchForecastDetails();
    }
  }, [isOpen, productId]);

  const fetchForecastDetails = async () => {
    if (!productId) return;
    setLoading(true);

    try {
      // Commandes clients (sorties prévues)
      const { data: salesOrders } = await supabase
        .from('sales_order_items')
        .select('quantity, sales_orders!inner(id, order_number, status)')
        .eq('product_id', productId)
        .eq('sales_orders.status', 'validated');

      const outgoing =
        salesOrders?.map(item => ({
          order_number: item.sales_orders.order_number,
          order_id: item.sales_orders.id,
          quantity: item.quantity,
          status: item.sales_orders.status,
          type: 'sales' as const,
        })) || [];

      // Commandes fournisseurs (entrées prévues)
      const { data: purchaseOrders } = await supabase
        .from('purchase_order_items')
        .select('quantity, purchase_orders!inner(id, po_number, status)')
        .eq('product_id', productId)
        .in('purchase_orders.status', ['validated', 'validated']);

      const incoming =
        purchaseOrders?.map(item => ({
          order_number: item.purchase_orders.po_number,
          order_id: item.purchase_orders.id,
          quantity: item.quantity,
          status: item.purchase_orders.status,
          type: 'purchase' as const,
        })) || [];

      setIncomingOrders(incoming);
      setOutgoingOrders(outgoing);
    } catch (error) {
      console.error('Erreur chargement prévisionnel:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Détails Prévisionnel
          </DialogTitle>
          <DialogDescription>
            {productName
              ? `Produit: ${productName}`
              : 'Commandes impactant le stock prévisionnel'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="outgoing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="outgoing" className="flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Sorties Prévues ({outgoingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Entrées Prévues ({incomingOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outgoing" className="space-y-3 mt-4">
            {loading ? (
              <p className="text-sm text-gray-500">Chargement...</p>
            ) : outgoingOrders.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune sortie prévue</p>
            ) : (
              outgoingOrders.map(order => (
                <div
                  key={order.order_id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <Link
                    href={`/commandes/clients?highlight=${order.order_id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {order.order_number}
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-red-300 text-red-600"
                    >
                      -{order.quantity} unités
                    </Badge>
                    <Badge variant="secondary">{order.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="incoming" className="space-y-3 mt-4">
            {loading ? (
              <p className="text-sm text-gray-500">Chargement...</p>
            ) : incomingOrders.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune entrée prévue</p>
            ) : (
              incomingOrders.map(order => (
                <div
                  key={order.order_id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <Link
                    href={`/commandes/fournisseurs?highlight=${order.order_id}`}
                    className="text-sm font-medium text-green-600 hover:underline"
                  >
                    {order.order_number}
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-green-300 text-green-600"
                    >
                      +{order.quantity} unités
                    </Badge>
                    <Badge variant="secondary">{order.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
