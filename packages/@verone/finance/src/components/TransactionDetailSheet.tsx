'use client';

import type { UnifiedTransaction } from '../hooks/use-unified-transactions';
import { TransactionDetailContent } from './TransactionDetailContent';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@verone/ui';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

export interface TransactionDetailSheetProps {
  transaction: UnifiedTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => Promise<void>;
  /** Optional: auto-open rapprochement modal when Sheet opens */
  autoOpenRapprochement?: boolean;
  /** Optional: auto-open upload modal when Sheet opens */
  autoOpenUpload?: boolean;
  /** Optional: suggestions map for rule display (from useAutoClassification) */
  suggestionsMap?: Map<
    string,
    { matchedRule?: { id: string } | null } | undefined
  >;
}

// =====================================================================
// COMPONENT — Thin Sheet wrapper around TransactionDetailContent
// =====================================================================

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
  onRefresh,
  autoOpenRapprochement = false,
  autoOpenUpload = false,
  suggestionsMap,
}: TransactionDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-[360px] sm:max-w-[360px]"
        data-testid="tx-side-panel"
      >
        {transaction && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-1 text-sm">
                {transaction.side === 'credit' ? (
                  <ArrowDownLeft className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowUpRight className="h-3 w-3 text-red-600" />
                )}
                Detail transaction
              </SheetTitle>
              <SheetDescription className="sr-only">
                Détails de la transaction sélectionnée
              </SheetDescription>
            </SheetHeader>
            <TransactionDetailContent
              key={transaction.id}
              transaction={transaction}
              onRefresh={onRefresh}
              suggestionsMap={suggestionsMap}
              autoOpenRapprochement={autoOpenRapprochement}
              autoOpenUpload={autoOpenUpload}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
