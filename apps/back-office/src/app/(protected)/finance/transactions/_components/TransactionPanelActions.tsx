'use client';

import type { UnifiedTransaction } from '@verone/finance/hooks';
import { Button, Separator } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  FileText,
  Building2,
  Settings,
  Tag,
  Lock,
  FileX,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface TransactionPanelActionsProps {
  transaction: UnifiedTransaction;
  isLockedByRule: boolean;
  onRefresh: () => Promise<void>;
  onOpenClassificationModal: () => void;
  onOpenOrganisationModal: () => void;
  onOpenRapprochementModal: () => void;
  onViewRule: () => void;
}

export function TransactionPanelActions({
  transaction,
  isLockedByRule,
  onRefresh,
  onOpenClassificationModal,
  onOpenOrganisationModal,
  onOpenRapprochementModal,
  onViewRule,
}: TransactionPanelActionsProps) {
  const handleToggleJustificationOptional = async (optional: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bank_transactions')
        .update({ justification_optional: optional })
        .eq('id', transaction.id);

      if (error) throw error;
      toast.success(
        optional ? 'Justificatif marqué facultatif' : 'Justificatif requis'
      );
      await onRefresh();
    } catch (_err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium text-muted-foreground">Actions</p>

      {isLockedByRule && (
        <>
          <div className="p-1 bg-amber-50 border border-amber-200 rounded-lg mb-0.5">
            <div className="flex items-center gap-1.5 text-amber-700">
              <Lock className="h-3 w-3" />
              <span className="text-[10px] font-medium">Géré par règle</span>
            </div>
            <p className="text-[9px] text-amber-600 mt-0">
              Modifier via les règles ou la page Dépenses.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-1.5 h-7 text-xs"
            onClick={onViewRule}
          >
            <Settings className="h-3 w-3" />
            Voir / Modifier la règle
          </Button>
        </>
      )}

      {!isLockedByRule && !transaction.category_pcg && (
        <Button
          variant="outline"
          className="w-full justify-start gap-1.5 h-7 text-xs"
          onClick={onOpenClassificationModal}
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
            className="w-full justify-start gap-1.5 h-7 text-xs"
            onClick={onOpenOrganisationModal}
            data-testid="btn-link-org"
          >
            <Building2 className="h-3 w-3" />
            Lier organisation
          </Button>
        )}

      <Button
        variant="outline"
        className="w-full justify-start gap-1.5 h-7 text-xs"
        onClick={onOpenRapprochementModal}
      >
        <FileText className="h-3 w-3" />
        Rapprocher commande
      </Button>

      <Separator className="my-0.5" />

      {transaction.justification_optional ? (
        <Button
          variant="outline"
          className="w-full justify-start gap-1.5 h-7 text-xs text-green-600 hover:text-green-700"
          onClick={() => {
            void handleToggleJustificationOptional(false).catch(error => {
              console.error(
                '[Transactions] Toggle justification failed:',
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
          className="w-full justify-start gap-1.5 h-7 text-xs text-muted-foreground"
          onClick={() => {
            void handleToggleJustificationOptional(true).catch(error => {
              console.error(
                '[Transactions] Toggle justification failed:',
                error
              );
            });
          }}
        >
          <FileX className="h-3 w-3" />
          Justificatif facultatif
        </Button>
      )}
    </div>
  );
}
