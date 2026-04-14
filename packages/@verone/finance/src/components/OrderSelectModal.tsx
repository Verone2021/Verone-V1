'use client';

import { useState } from 'react';

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
import {
  CheckCircle2,
  FileText,
  Loader2,
  Search,
  ShoppingCart,
} from 'lucide-react';

// Re-export types for backwards compatibility
export type {
  IDocumentAddress,
  IOrderForDocument,
  ICustomLine,
  IOrderForInvoice,
  IOrderForQuote,
  OrderSelectModalProps,
} from './order-select/types';

import type { OrderSelectModalProps } from './order-select/types';
import { useOrderSelect } from './order-select/use-order-select';

const DEFAULT_STATUSES = ['validated', 'shipped'] as const;

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(
    amount
  );
}

export function OrderSelectModal({
  open,
  onOpenChange,
  onSelectOrder,
  statuses = [...DEFAULT_STATUSES],
}: OrderSelectModalProps): React.ReactNode {
  const [search, setSearch] = useState('');

  const { orders, loading, selectedOrderId, loadingOrder, fetchOrderDetails } =
    useOrderSelect(open, statuses);

  const filteredOrders = orders.filter(order => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(searchLower) ||
      order.customer_name.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectOrder = (orderId: string): void => {
    void fetchOrderDetails(orderId).then(orderForDocument => {
      if (orderForDocument) {
        onSelectOrder(orderForDocument);
        onOpenChange(false);
      }
    });
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numero ou client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

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
                  onClick={() => handleSelectOrder(order.id)}
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
