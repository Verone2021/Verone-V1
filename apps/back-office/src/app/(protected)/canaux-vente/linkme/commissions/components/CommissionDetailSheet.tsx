'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@verone/ui';
import { Wallet } from 'lucide-react';

import { CommissionDetailContent } from './CommissionDetailContent';

// ============================================
// TYPES
// ============================================

interface Commission {
  id: string;
  order_id: string;
  order_amount_ht: number;
  affiliate_commission: number;
  affiliate_commission_ttc: number | null;
  margin_rate_applied: number;
  order_number: string | null;
  status: string | null;
  total_payout_ht: number | null;
  total_payout_ttc: number | null;
  affiliate?: {
    display_name: string;
  } | null;
  sales_order?: {
    order_number: string;
    total_ht: number | null;
    total_ttc: number | null;
  } | null;
}

interface CommissionDetailSheetProps {
  commission: Commission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function CommissionDetailSheet({
  commission,
  open,
  onOpenChange,
}: CommissionDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[640px] sm:max-w-[640px] overflow-y-auto">
        {commission && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-orange-600" />
                Detail commission
              </SheetTitle>
              <SheetDescription className="sr-only">
                Detail de la commission et remuneration ligne par ligne
              </SheetDescription>
            </SheetHeader>
            <CommissionDetailContent
              key={commission.id}
              commission={commission}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
