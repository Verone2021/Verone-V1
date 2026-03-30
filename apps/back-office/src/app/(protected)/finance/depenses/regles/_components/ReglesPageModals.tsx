'use client';

import {
  OrganisationLinkingModal,
  QuickClassificationModal,
  RuleModal,
} from '@verone/finance/components';
import {
  type MatchingRule,
  type UseMatchingRulesReturn,
} from '@verone/finance/hooks';

interface LabelSelection {
  label: string;
  transactionCount: number;
  totalAmount: number;
}

interface ReglesPageModalsProps {
  // Organisation linking modal
  linkModalOpen: boolean;
  setLinkModalOpen: (open: boolean) => void;
  selectedLabel: LabelSelection | null;
  onLinkSuccess: () => void;

  // Rule edit modal
  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  editingRule: MatchingRule | null;
  updateRule: UseMatchingRulesReturn['update'];
  previewApply: UseMatchingRulesReturn['previewApply'];
  confirmApply: UseMatchingRulesReturn['confirmApply'];
  onEditSuccess: () => void;

  // Quick classification modal
  classifyModalOpen: boolean;
  setClassifyModalOpen: (open: boolean) => void;
  classifyLabel: LabelSelection | null;
  onClassifySuccess: () => void;
}

export function ReglesPageModals({
  linkModalOpen,
  setLinkModalOpen,
  selectedLabel,
  onLinkSuccess,
  editModalOpen,
  setEditModalOpen,
  editingRule,
  updateRule,
  previewApply,
  confirmApply,
  onEditSuccess,
  classifyModalOpen,
  setClassifyModalOpen,
  classifyLabel,
  onClassifySuccess,
}: ReglesPageModalsProps) {
  return (
    <>
      {selectedLabel && (
        <OrganisationLinkingModal
          open={linkModalOpen}
          onOpenChange={setLinkModalOpen}
          label={selectedLabel.label}
          transactionCount={selectedLabel.transactionCount}
          totalAmount={selectedLabel.totalAmount}
          onSuccess={() => {
            void onLinkSuccess();
          }}
        />
      )}

      <RuleModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        rule={editingRule}
        onUpdate={async (ruleId, data) => {
          return updateRule(ruleId, data);
        }}
        previewApply={previewApply}
        confirmApply={confirmApply}
        onSuccess={onEditSuccess}
      />

      {classifyLabel && (
        <QuickClassificationModal
          open={classifyModalOpen}
          onOpenChange={setClassifyModalOpen}
          label={classifyLabel.label}
          amount={classifyLabel.totalAmount}
          transactionCount={classifyLabel.transactionCount}
          onSuccess={() => {
            void onClassifySuccess();
          }}
        />
      )}
    </>
  );
}
