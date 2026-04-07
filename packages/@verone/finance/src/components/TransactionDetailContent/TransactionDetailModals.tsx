'use client';

import type { UnifiedTransaction } from '../../hooks/use-unified-transactions';
import type {
  MatchingRule,
  UseMatchingRulesReturn,
} from '../../hooks/use-matching-rules';
import type { TransactionForUpload } from '../InvoiceUploadModal';
import { RapprochementModal } from '../RapprochementModal';
import { InvoiceUploadModal } from '../InvoiceUploadModal';
import { QuickClassificationModal } from '../QuickClassificationModal';
import { OrganisationLinkingModal } from '../OrganisationLinkingModal';
import { RuleModal } from '../RuleModal';
import { toast } from 'sonner';

// =====================================================================
// COMPONENT — All modals (5) for TransactionDetailContent
// =====================================================================

interface TransactionDetailModalsProps {
  transaction: UnifiedTransaction;
  transactionForUpload: TransactionForUpload;
  onRefresh: () => Promise<void>;
  suggestionsMap?: Map<
    string,
    { matchedRule?: { id: string } | null } | undefined
  >;
  // Modal open states
  showClassificationModal: boolean;
  setShowClassificationModal: (open: boolean) => void;
  showOrganisationModal: boolean;
  setShowOrganisationModal: (open: boolean) => void;
  showRapprochementModal: boolean;
  setShowRapprochementModal: (open: boolean) => void;
  showUploadModal: boolean;
  setShowUploadModal: (open: boolean) => void;
  showRuleModal: boolean;
  setShowRuleModal: (open: boolean) => void;
  editingRule: MatchingRule | null;
  setEditingRule: (rule: MatchingRule | null) => void;
  // Rule modal actions
  updateRule: UseMatchingRulesReturn['update'];
  previewApply: UseMatchingRulesReturn['previewApply'];
  confirmApply: UseMatchingRulesReturn['confirmApply'];
  refetchRules: UseMatchingRulesReturn['refetch'];
}

export function TransactionDetailModals({
  transaction,
  transactionForUpload,
  onRefresh,
  suggestionsMap,
  showClassificationModal,
  setShowClassificationModal,
  showOrganisationModal,
  setShowOrganisationModal,
  showRapprochementModal,
  setShowRapprochementModal,
  showUploadModal,
  setShowUploadModal,
  showRuleModal,
  setShowRuleModal,
  editingRule,
  setEditingRule,
  updateRule,
  previewApply,
  confirmApply,
  refetchRules,
}: TransactionDetailModalsProps) {
  return (
    <>
      <QuickClassificationModal
        open={showClassificationModal}
        onOpenChange={setShowClassificationModal}
        label={transaction.label ?? transaction.counterparty_name ?? ''}
        amount={transaction.amount}
        transactionId={transaction.id}
        counterpartyName={transaction.counterparty_name ?? undefined}
        currentCategory={transaction.category_pcg ?? undefined}
        existingRuleId={
          suggestionsMap
            ? suggestionsMap.get(transaction.id)?.matchedRule?.id
            : undefined
        }
        onSuccess={() => {
          void onRefresh().catch(error => {
            console.error(
              '[TransactionDetailContent] Refresh after success failed:',
              error
            );
          });
        }}
      />
      <OrganisationLinkingModal
        open={showOrganisationModal}
        onOpenChange={setShowOrganisationModal}
        label={transaction.counterparty_name ?? transaction.label ?? ''}
        transactionCount={1}
        totalAmount={transaction.amount}
        onSuccess={() => {
          void onRefresh().catch(error => {
            console.error(
              '[TransactionDetailContent] Refresh after success failed:',
              error
            );
          });
        }}
        transactionSide={transaction.side}
      />
      <RapprochementModal
        open={showRapprochementModal}
        onOpenChange={setShowRapprochementModal}
        transactionId={transaction.id}
        label={transaction.label ?? transaction.counterparty_name ?? ''}
        amount={transaction.amount ?? 0}
        counterpartyName={transaction.counterparty_name}
        onSuccess={() => {
          toast.success('Transaction rapprochee');
          void onRefresh().catch(error => {
            console.error('[TransactionDetailContent] Refresh failed:', error);
          });
          setShowRapprochementModal(false);
        }}
      />
      <InvoiceUploadModal
        transaction={transactionForUpload}
        open={showUploadModal}
        onOpenChange={open => {
          setShowUploadModal(open);
        }}
        onUploadComplete={() => {
          toast.success('Justificatif uploadé');
          void onRefresh().catch(error => {
            console.error('[TransactionDetailContent] Refresh failed:', error);
          });
          setShowUploadModal(false);
        }}
      />
      <RuleModal
        open={showRuleModal}
        onOpenChange={setShowRuleModal}
        rule={editingRule}
        onUpdate={updateRule}
        previewApply={previewApply}
        confirmApply={confirmApply}
        onSuccess={() => {
          setEditingRule(null);
          void refetchRules().catch(error => {
            console.error(
              '[TransactionDetailContent] Refetch rules failed:',
              error
            );
          });
          void onRefresh().catch(error => {
            console.error('[TransactionDetailContent] Refresh failed:', error);
          });
        }}
      />
    </>
  );
}
