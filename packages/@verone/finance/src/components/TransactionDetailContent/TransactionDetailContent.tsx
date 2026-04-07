'use client';

import { useState } from 'react';

import type { TransactionDetailContentProps } from './types';
import type { MatchingRule } from '../../hooks/use-matching-rules';
import { useMatchingRules } from '../../hooks/use-matching-rules';
import { useTransactionHandlers } from './useTransactionHandlers';
import { TransactionDetailModals } from './TransactionDetailModals';
import { TransactionDetailCompactLayout } from './TransactionDetailCompactLayout';
import { TransactionDetailExpandedLayout } from './TransactionDetailExpandedLayout';

// =====================================================================
// COMPONENT — Orchestrator (state + hooks + layout branching)
// =====================================================================

export function TransactionDetailContent({
  transaction,
  onRefresh,
  suggestionsMap,
  autoOpenRapprochement = false,
  autoOpenUpload = false,
  compact = true,
}: TransactionDetailContentProps) {
  // Modal states
  const [showRapprochementModal, setShowRapprochementModal] = useState(
    autoOpenRapprochement
  );
  const [showUploadModal, setShowUploadModal] = useState(autoOpenUpload);
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [showOrganisationModal, setShowOrganisationModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<MatchingRule | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const {
    rules,
    update: updateRule,
    refetch: refetchRules,
    previewApply,
    confirmApply,
  } = useMatchingRules();

  const isLockedByRule = Boolean(transaction.applied_rule_id);

  const handlers = useTransactionHandlers({
    transaction,
    onRefresh,
    rules,
    setEditingRule,
    setShowRuleModal,
    setShowUploadModal,
  });

  const transactionForUpload = {
    id: transaction.id,
    transaction_id: transaction.transaction_id,
    label: transaction.label ?? '',
    counterparty_name: transaction.counterparty_name,
    amount: transaction.amount,
    currency: 'EUR' as const,
    emitted_at: transaction.emitted_at ?? '',
    has_attachment: transaction.has_attachment,
    matched_document_id: transaction.matched_document_id,
    order_number: null,
  };

  // Derived booleans (needed by both layouts)
  const isMissingCategory = !transaction.category_pcg && !isLockedByRule;
  const isMissingVat = !transaction.vat_rate && transaction.amount !== null;
  const attachmentIds = transaction.attachment_ids ?? [];
  const hasAttachment = attachmentIds.length > 0;
  const isMissingJustificatif =
    !hasAttachment && !transaction.justification_optional;

  const sharedLayoutProps = {
    transaction,
    onRefresh,
    isLockedByRule,
    handlers,
    showTechnicalDetails,
    setShowTechnicalDetails,
    setShowRapprochementModal,
    setShowClassificationModal,
    setShowOrganisationModal,
    setShowUploadModal,
  };

  return (
    <>
      {compact ? (
        <TransactionDetailCompactLayout {...sharedLayoutProps} />
      ) : (
        <TransactionDetailExpandedLayout
          {...sharedLayoutProps}
          isMissingCategory={isMissingCategory}
          isMissingVat={isMissingVat}
          isMissingJustificatif={isMissingJustificatif}
        />
      )}
      <TransactionDetailModals
        transaction={transaction}
        transactionForUpload={transactionForUpload}
        onRefresh={onRefresh}
        suggestionsMap={suggestionsMap}
        showClassificationModal={showClassificationModal}
        setShowClassificationModal={setShowClassificationModal}
        showOrganisationModal={showOrganisationModal}
        setShowOrganisationModal={setShowOrganisationModal}
        showRapprochementModal={showRapprochementModal}
        setShowRapprochementModal={setShowRapprochementModal}
        showUploadModal={showUploadModal}
        setShowUploadModal={setShowUploadModal}
        showRuleModal={showRuleModal}
        setShowRuleModal={setShowRuleModal}
        editingRule={editingRule}
        setEditingRule={setEditingRule}
        updateRule={updateRule}
        previewApply={previewApply}
        confirmApply={confirmApply}
        refetchRules={refetchRules}
      />
    </>
  );
}
