'use client';

import type { UnifiedTransaction } from '../hooks/use-unified-transactions';
import { TransactionDetailContent } from './TransactionDetailContent';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

export interface TransactionDetailDialogProps {
  transaction: UnifiedTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => Promise<void>;
  /** Optional: auto-open rapprochement modal when Dialog opens */
  autoOpenRapprochement?: boolean;
  /** Optional: auto-open upload modal when Dialog opens */
  autoOpenUpload?: boolean;
  /** Optional: suggestions map for rule display (from useAutoClassification) */
  suggestionsMap?: Map<
    string,
    { matchedRule?: { id: string } | null } | undefined
  >;
}

// =====================================================================
// COMPONENT — Thin Dialog wrapper around TransactionDetailContent
// =====================================================================

export function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
  onRefresh,
  autoOpenRapprochement = false,
  autoOpenUpload = false,
  suggestionsMap,
}: TransactionDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dialogSize="lg"
        className="overflow-y-auto max-h-[80vh]"
        data-testid="tx-detail-dialog"
      >
        {transaction && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1 text-sm">
                {transaction.side === 'credit' ? (
                  <ArrowDownLeft className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowUpRight className="h-3 w-3 text-red-600" />
                )}
                Detail transaction
              </DialogTitle>
              <DialogDescription className="sr-only">
                Détails de la transaction sélectionnée
              </DialogDescription>
            </DialogHeader>
            <TransactionDetailContent
              key={transaction.id}
              transaction={transaction}
              onRefresh={onRefresh}
              suggestionsMap={suggestionsMap}
              autoOpenRapprochement={autoOpenRapprochement}
              autoOpenUpload={autoOpenUpload}
              compact={false}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
