'use client';

import type { UnifiedTransaction } from '../../hooks/use-unified-transactions';
import type { MatchingRule } from '../../hooks/use-matching-rules';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

// =====================================================================
// HOOK — All transaction mutation handlers
// =====================================================================

interface UseTransactionHandlersParams {
  transaction: UnifiedTransaction;
  onRefresh: () => Promise<void>;
  rules: MatchingRule[];
  setEditingRule: (rule: MatchingRule | null) => void;
  setShowRuleModal: (open: boolean) => void;
  setShowUploadModal: (open: boolean) => void;
}

export interface TransactionHandlers {
  handleToggleJustificationOptional: (optional: boolean) => Promise<void>;
  handleViewRule: () => void;
  handleUpdateNote: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  handleUpdatePaymentMethod: (value: string) => void;
  handleUpdateVat: (value: string) => void;
}

export function useTransactionHandlers({
  transaction,
  onRefresh,
  rules,
  setEditingRule,
  setShowRuleModal,
  setShowUploadModal: _setShowUploadModal,
}: UseTransactionHandlersParams): TransactionHandlers {
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

  const handleViewRule = () => {
    if (!transaction.applied_rule_id) return;
    const rule = rules.find(r => r.id === transaction.applied_rule_id);
    if (rule) {
      setEditingRule(rule);
      setShowRuleModal(true);
    } else {
      toast.error('Règle non trouvée');
    }
  };

  const handleUpdateNote = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value.trim() || null;
    if (newNote === (transaction.note ?? null)) return;
    void (async () => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from('bank_transactions')
          .update({ note: newNote })
          .eq('id', transaction.id);
        if (updateError) throw updateError;
        toast.success('Note sauvegardée');
        void onRefresh().catch(err => {
          console.error(
            '[TransactionDetailContent] Refresh after note update failed:',
            err
          );
        });
      } catch (err) {
        console.error('[Note update] Error:', err);
        toast.error('Erreur lors de la sauvegarde de la note');
      }
    })();
  };

  const handleUpdatePaymentMethod = (value: string) => {
    const newMethod = value === 'none' ? null : value;
    void (async () => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from('bank_transactions')
          .update({ payment_method: newMethod })
          .eq('id', transaction.id);
        if (updateError) throw updateError;
        toast.success('Mode de paiement mis à jour');
        void onRefresh().catch(err => {
          console.error(
            '[TransactionDetailContent] Refresh after payment method update failed:',
            err
          );
        });
      } catch (err) {
        console.error('[Payment method update] Error:', err);
        toast.error('Erreur lors de la mise à jour');
      }
    })();
  };

  const handleUpdateVat = (value: string) => {
    void (async () => {
      const newRate = value === 'none' ? null : parseFloat(value);
      try {
        const res = await fetch('/api/transactions/update-vat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_id: transaction.id,
            vat_rate: newRate,
          }),
        });
        if (res.ok) {
          void onRefresh().catch(error => {
            console.error(
              '[TransactionDetailContent] Refresh after update failed:',
              error
            );
          });
        }
      } catch (err) {
        console.error('[TVA update] Error:', err);
      }
    })();
  };

  return {
    handleToggleJustificationOptional,
    handleViewRule,
    handleUpdateNote,
    handleUpdatePaymentMethod,
    handleUpdateVat,
  };
}
