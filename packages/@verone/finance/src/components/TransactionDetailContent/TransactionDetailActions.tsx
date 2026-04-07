'use client';

import type { UnifiedTransaction } from '../../hooks/use-unified-transactions';
import type { TransactionHandlers } from './useTransactionHandlers';
import { Button, Separator } from '@verone/ui';
import {
  Settings,
  Tag,
  Building2,
  FileText,
  Lock,
  FileX,
  FileCheck,
} from 'lucide-react';
import { cn } from '@verone/utils';

// =====================================================================
// COMPONENT — Action buttons block (shared between compact + expanded)
// =====================================================================

interface TransactionDetailActionsProps {
  transaction: UnifiedTransaction;
  compact: boolean;
  isLockedByRule: boolean;
  handlers: TransactionHandlers;
  setShowRapprochementModal: (open: boolean) => void;
  setShowClassificationModal: (open: boolean) => void;
  setShowOrganisationModal: (open: boolean) => void;
}

export function TransactionDetailActions({
  transaction,
  compact,
  isLockedByRule,
  handlers,
  setShowRapprochementModal,
  setShowClassificationModal,
  setShowOrganisationModal,
}: TransactionDetailActionsProps) {
  return (
    <>
      {isLockedByRule && (
        <>
          <div
            className={cn(
              'bg-amber-50 border border-amber-200 rounded-lg',
              compact ? 'p-1 mb-0.5' : 'p-2 mb-1'
            )}
          >
            <div className="flex items-center gap-1.5 text-amber-700">
              <Lock className="h-3 w-3" />
              <span
                className={cn(
                  'font-medium',
                  compact ? 'text-[10px]' : 'text-xs'
                )}
              >
                Géré par règle
              </span>
            </div>
            <p
              className={cn(
                'text-amber-600 mt-0',
                compact ? 'text-[9px]' : 'text-[11px]'
              )}
            >
              Modifier via les règles ou la page Dépenses.
            </p>
          </div>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start gap-1.5',
              compact ? 'h-7 text-xs' : 'h-8 text-sm'
            )}
            onClick={handlers.handleViewRule}
          >
            <Settings className="h-3 w-3" />
            Voir / Modifier la règle
          </Button>
        </>
      )}
      {!isLockedByRule && !transaction.category_pcg && (
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start gap-1.5',
            compact ? 'h-7 text-xs' : 'h-8 text-sm'
          )}
          onClick={() => setShowClassificationModal(true)}
          data-testid="btn-classify-pcg"
        >
          <Tag className="h-3 w-3" />
          Classer PCG
        </Button>
      )}
      {!isLockedByRule &&
        !transaction.organisation_name &&
        transaction.side === 'debit' && (
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start gap-1.5',
              compact ? 'h-7 text-xs' : 'h-8 text-sm'
            )}
            onClick={() => setShowOrganisationModal(true)}
            data-testid="btn-link-org"
          >
            <Building2 className="h-3 w-3" />
            Lier organisation
          </Button>
        )}
      <Button
        variant="outline"
        className={cn(
          'w-full justify-start gap-1.5',
          compact ? 'h-7 text-xs' : 'h-8 text-sm'
        )}
        onClick={() => setShowRapprochementModal(true)}
      >
        <FileText className="h-3 w-3" />
        Rapprocher commande
      </Button>
      <Separator className="my-0.5" />
      {transaction.justification_optional ? (
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start gap-1.5 text-green-600 hover:text-green-700',
            compact ? 'h-7 text-xs' : 'h-8 text-sm'
          )}
          onClick={() => {
            void handlers
              .handleToggleJustificationOptional(false)
              .catch(error => {
                console.error(
                  '[TransactionDetailContent] Toggle justification failed:',
                  error
                );
              });
          }}
        >
          <FileCheck className="h-3 w-3" />
          Justificatif requis
        </Button>
      ) : (
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-1.5 text-muted-foreground',
            compact ? 'h-7 text-xs' : 'h-8 text-sm'
          )}
          onClick={() => {
            void handlers
              .handleToggleJustificationOptional(true)
              .catch(error => {
                console.error(
                  '[TransactionDetailContent] Toggle justification failed:',
                  error
                );
              });
          }}
        >
          <FileX className="h-3 w-3" />
          Justificatif facultatif
        </Button>
      )}
    </>
  );
}
