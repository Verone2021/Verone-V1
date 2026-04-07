'use client';

import type { UnifiedTransaction } from '../../hooks/use-unified-transactions';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@verone/utils';

// =====================================================================
// COMPONENT — Technical details toggle section
// =====================================================================

interface TransactionDetailTechnicalDetailsProps {
  transaction: UnifiedTransaction;
  compact: boolean;
  showTechnicalDetails: boolean;
  setShowTechnicalDetails: (show: boolean) => void;
}

export function TransactionDetailTechnicalDetails({
  transaction,
  compact,
  showTechnicalDetails,
  setShowTechnicalDetails,
}: TransactionDetailTechnicalDetailsProps) {
  const rawData = transaction.raw_data as Record<string, unknown> | null;
  const reference =
    rawData && typeof rawData.reference === 'string' ? rawData.reference : null;

  if (!reference && !transaction.operation_type) return null;

  return (
    <div className={cn(compact ? 'mt-0.5' : 'mt-1')}>
      <button
        onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
        className={cn(
          'flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-full',
          compact ? 'text-[10px]' : 'text-xs'
        )}
      >
        {showTechnicalDetails ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        Détails techniques
      </button>
      {showTechnicalDetails && (
        <div
          className={cn(
            'p-1.5 bg-muted/30 rounded space-y-0.5',
            compact ? 'mt-0.5 text-[10px]' : 'mt-1 text-xs'
          )}
        >
          {reference && (
            <div>
              <span className="text-muted-foreground">Réf : </span>
              <span className="font-mono break-all">{reference}</span>
            </div>
          )}
          {transaction.operation_type && (
            <div>
              <span className="text-muted-foreground">Type : </span>
              <span className="font-mono">{transaction.operation_type}</span>
            </div>
          )}
          {transaction.transaction_id && (
            <div>
              <span className="text-muted-foreground">ID : </span>
              <span className="font-mono break-all">
                {transaction.transaction_id}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
