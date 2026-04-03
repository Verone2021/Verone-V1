'use client';

import {
  RapprochementModal,
  InvoiceUploadModal,
  QuickClassificationModal,
  OrganisationLinkingModal,
  RuleModal,
  type TransactionForUpload,
} from '@verone/finance/components';
import type { useMatchingRules, MatchingRule } from '@verone/finance/hooks';
import type { UnifiedTransaction } from '@verone/finance/hooks';

interface TransactionModalsProps {
  selectedTransaction: UnifiedTransaction | null;
  transactionForUpload: TransactionForUpload | null;
  suggestionsMap: Map<
    string,
    { matchedRule?: { id: string } | null } | undefined
  >;
  // Classification
  showClassificationModal: boolean;
  setShowClassificationModal: (open: boolean) => void;
  // Organisation
  showOrganisationModal: boolean;
  setShowOrganisationModal: (open: boolean) => void;
  // Rapprochement
  showRapprochementModal: boolean;
  setShowRapprochementModal: (open: boolean) => void;
  // Upload
  showUploadModal: boolean;
  setShowUploadModal: (open: boolean) => void;
  setUploadTransaction: (tx: UnifiedTransaction | null) => void;
  // Règle
  showRuleModal: boolean;
  setShowRuleModal: (open: boolean) => void;
  editingRule: MatchingRule | null;
  setEditingRule: (rule: MatchingRule | null) => void;
  updateRule: ReturnType<typeof useMatchingRules>['update'];
  previewApply: ReturnType<typeof useMatchingRules>['previewApply'];
  confirmApply: ReturnType<typeof useMatchingRules>['confirmApply'];
  refetchRules: ReturnType<typeof useMatchingRules>['refetch'];
  // Callbacks
  onRefresh: () => Promise<void>;
}

export function TransactionModals({
  selectedTransaction,
  transactionForUpload,
  suggestionsMap,
  showClassificationModal,
  setShowClassificationModal,
  showOrganisationModal,
  setShowOrganisationModal,
  showRapprochementModal,
  setShowRapprochementModal,
  showUploadModal,
  setShowUploadModal,
  setUploadTransaction,
  showRuleModal,
  setShowRuleModal,
  editingRule,
  setEditingRule,
  updateRule,
  previewApply,
  confirmApply,
  refetchRules,
  onRefresh,
}: TransactionModalsProps) {
  return (
    <>
      {/* Modal Classification PCG */}
      <QuickClassificationModal
        open={showClassificationModal}
        onOpenChange={setShowClassificationModal}
        label={
          selectedTransaction?.label ??
          selectedTransaction?.counterparty_name ??
          ''
        }
        amount={selectedTransaction?.amount}
        transactionId={selectedTransaction?.id}
        counterpartyName={selectedTransaction?.counterparty_name ?? undefined}
        currentCategory={selectedTransaction?.category_pcg ?? undefined}
        existingRuleId={
          selectedTransaction
            ? suggestionsMap.get(selectedTransaction.id)?.matchedRule?.id
            : undefined
        }
        transactionSide={selectedTransaction?.side}
        currentVatRate={selectedTransaction?.vat_rate}
        currentVatSource={
          selectedTransaction?.vat_source as
            | 'qonto_ocr'
            | 'manual'
            | null
            | undefined
        }
        currentVatBreakdown={selectedTransaction?.vat_breakdown}
        hasReconciliationVAT={
          (selectedTransaction?.reconciliation_vat_rates?.length ?? 0) > 0
        }
        onSuccess={() => {
          void onRefresh().catch(error => {
            console.error(
              '[Transactions] Refresh after success failed:',
              error
            );
          });
        }}
      />

      {/* Modal Organisation */}
      <OrganisationLinkingModal
        open={showOrganisationModal}
        onOpenChange={setShowOrganisationModal}
        label={
          selectedTransaction?.counterparty_name ??
          selectedTransaction?.label ??
          ''
        }
        transactionCount={1}
        totalAmount={selectedTransaction?.amount}
        onSuccess={() => {
          void onRefresh().catch(error => {
            console.error(
              '[Transactions] Refresh after success failed:',
              error
            );
          });
        }}
        transactionSide={selectedTransaction?.side}
      />

      {/* Modal Rapprochement */}
      <RapprochementModal
        open={showRapprochementModal}
        onOpenChange={open => {
          setShowRapprochementModal(open);
          if (!open) {
            void onRefresh().catch(error => {
              console.error(
                '[Transactions] Refresh on modal close failed:',
                error
              );
            });
          }
        }}
        transactionId={selectedTransaction?.id}
        transactionQontoId={selectedTransaction?.transaction_id}
        label={
          selectedTransaction?.label ??
          selectedTransaction?.counterparty_name ??
          ''
        }
        amount={selectedTransaction?.amount ?? 0}
        counterpartyName={selectedTransaction?.counterparty_name}
        organisationName={selectedTransaction?.organisation_name}
        organisationId={selectedTransaction?.counterparty_organisation_id}
        onSuccess={() => {
          void onRefresh().catch(error => {
            console.error('[Transactions] Refresh failed:', error);
          });
        }}
      />

      {/* Modal Upload */}
      <InvoiceUploadModal
        transaction={transactionForUpload}
        open={showUploadModal}
        onOpenChange={open => {
          setShowUploadModal(open);
          if (!open) setUploadTransaction(null);
        }}
        onUploadComplete={() => {
          void onRefresh().catch(error => {
            console.error('[Transactions] Refresh failed:', error);
          });
          setShowUploadModal(false);
          setUploadTransaction(null);
        }}
      />

      {/* Modal Règle (voir/modifier) */}
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
            console.error('[Transactions] Refetch rules failed:', error);
          });
          void onRefresh().catch(error => {
            console.error('[Transactions] Refresh failed:', error);
          });
        }}
      />
    </>
  );
}
