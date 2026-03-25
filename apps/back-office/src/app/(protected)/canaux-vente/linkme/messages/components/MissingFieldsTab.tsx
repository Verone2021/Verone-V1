'use client';

import { useState, useMemo } from 'react';
import { Badge, Card, CardContent, Skeleton } from '@verone/ui';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import type { OrderWithMissing, ClickableCategory } from './types';
import { hasPendingRequest } from './types';
import { OrderCard } from './OrderCard';
import { SendInfoRequestDialog } from './SendInfoRequestDialog';
import { ContactEditDialog } from './ContactEditDialog';
import { AddressEditDialog } from './AddressEditDialog';

interface MissingFieldsTabProps {
  orders: OrderWithMissing[] | undefined;
  isLoading: boolean;
}

export function MissingFieldsTab({ orders, isLoading }: MissingFieldsTabProps) {
  const [dialogOrder, setDialogOrder] = useState<OrderWithMissing | null>(null);
  const [editOrder, setEditOrder] = useState<OrderWithMissing | null>(null);
  const [editCategory, setEditCategory] = useState<ClickableCategory | null>(
    null
  );

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => !hasPendingRequest(order));
  }, [orders]);

  const handleCategoryClick = (
    order: OrderWithMissing,
    cat: ClickableCategory
  ) => {
    if (cat === 'organisation') {
      toast.info('Modifiez le SIRET depuis la fiche organisation');
      return;
    }
    setEditOrder(order);
    setEditCategory(cat);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="destructive">
          {filteredOrders.length} commande(s) sans demande
        </Badge>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-300" />
            <p className="font-medium">
              Toutes les commandes ont une demande en cours
            </p>
            <p className="text-sm mt-1">
              Consultez l&apos;onglet &laquo; En attente de retour &raquo;
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            variant="missing"
            onSendRequest={() => setDialogOrder(order)}
            onCategoryClick={cat => handleCategoryClick(order, cat)}
          />
        ))
      )}

      {dialogOrder && (
        <SendInfoRequestDialog
          order={dialogOrder}
          open={!!dialogOrder}
          onOpenChange={open => !open && setDialogOrder(null)}
        />
      )}

      {editOrder &&
        editCategory &&
        (editCategory === 'delivery_address' ? (
          <AddressEditDialog
            order={orders?.find(o => o.id === editOrder.id) ?? editOrder}
            open
            onOpenChange={open => {
              if (!open) {
                setEditOrder(null);
                setEditCategory(null);
              }
            }}
          />
        ) : (
          <ContactEditDialog
            order={orders?.find(o => o.id === editOrder.id) ?? editOrder}
            contactFor={
              editCategory as 'responsable' | 'billing' | 'delivery_contact'
            }
            open
            onOpenChange={open => {
              if (!open) {
                setEditOrder(null);
                setEditCategory(null);
              }
            }}
          />
        ))}
    </div>
  );
}
