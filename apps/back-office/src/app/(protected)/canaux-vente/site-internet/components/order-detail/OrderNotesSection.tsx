'use client';

import { MessageSquare } from 'lucide-react';

import { OrderInternalNotesTimeline } from './OrderInternalNotesTimeline';

interface Props {
  orderId: string;
}

export function OrderNotesSection({ orderId }: Props) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        Notes internes
      </h3>
      <OrderInternalNotesTimeline salesOrderId={orderId} />
    </div>
  );
}
