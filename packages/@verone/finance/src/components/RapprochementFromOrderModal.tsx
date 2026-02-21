'use client';

/**
 * RapprochementFromOrderModal - Dialog wrapper around RapprochementContent
 *
 * Thin wrapper that preserves the existing API for consumers:
 * - SalesOrdersTable.tsx
 * - commandes/fournisseurs/page.tsx
 *
 * The actual logic lives in RapprochementContent (headless).
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Package } from 'lucide-react';

import {
  RapprochementContent,
  type OrderForLink,
} from './RapprochementContent';

interface RapprochementFromOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderForLink | null;
  onSuccess?: () => void;
  orderType?: 'sales_order' | 'purchase_order';
}

export type { OrderForLink };

export function RapprochementFromOrderModal({
  open,
  onOpenChange,
  order,
  onSuccess,
  orderType = 'sales_order',
}: RapprochementFromOrderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Lier à une transaction
          </DialogTitle>
          <DialogDescription>
            Sélectionnez la transaction bancaire correspondant à cette commande
          </DialogDescription>
        </DialogHeader>

        <RapprochementContent
          order={order}
          onSuccess={() => {
            onSuccess?.();
            onOpenChange(false);
          }}
          orderType={orderType}
        />
      </DialogContent>
    </Dialog>
  );
}
