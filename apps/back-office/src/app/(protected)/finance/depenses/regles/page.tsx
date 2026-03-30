'use client';

import { useState, useEffect } from 'react';

import { useSearchParams, useRouter } from 'next/navigation';

import { useToast } from '@verone/common/hooks';
import {
  useUniqueLabels,
  useMatchingRules,
  type MatchingRule,
} from '@verone/finance/hooks';

import { ActiveRulesList } from './_components/ActiveRulesList';
import { ReglesPageHeader } from './_components/ReglesPageHeader';
import { ReglesPageModals } from './_components/ReglesPageModals';
import { UnclassifiedLabelsList } from './_components/UnclassifiedLabelsList';

interface LabelSelection {
  label: string;
  transactionCount: number;
  totalAmount: number;
}

export default function ReglesPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const createFromClassification = searchParams.get('create') === 'true';
  const prefillLabel = searchParams.get('label') ?? '';

  const {
    labels,
    isLoading: labelsLoading,
    refetch: refetchLabels,
  } = useUniqueLabels();
  const {
    rules,
    isLoading: rulesLoading,
    remove: deleteRule,
    update: updateRule,
    applyAll,
    previewApply,
    confirmApply,
    refetch: refetchRules,
  } = useMatchingRules();

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<LabelSelection | null>(
    null
  );

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MatchingRule | null>(null);

  const [classifyModalOpen, setClassifyModalOpen] = useState(false);
  const [classifyLabel, setClassifyLabel] = useState<LabelSelection | null>(
    null
  );

  useEffect(() => {
    if (createFromClassification && prefillLabel) {
      setSelectedLabel({
        label: prefillLabel,
        transactionCount: 0,
        totalAmount: 0,
      });
      setLinkModalOpen(true);
      router.replace('/finance/depenses/regles', { scroll: false });
    }
  }, [createFromClassification, prefillLabel, router]);

  const handleLinkLabel = (
    label: string,
    transactionCount: number,
    totalAmount: number
  ) => {
    setSelectedLabel({ label, transactionCount, totalAmount });
    setLinkModalOpen(true);
  };

  const handleClassifyLabel = (
    label: string,
    transactionCount: number,
    totalAmount: number
  ) => {
    setClassifyLabel({ label, transactionCount, totalAmount });
    setClassifyModalOpen(true);
  };

  const handleLinkSuccess = async () => {
    toast({
      title: 'Tiers associé',
      description: 'Le libellé a été associé et la règle créée.',
    });
    await Promise.all([refetchLabels(), refetchRules()]);
  };

  const handleClassifySuccess = async () => {
    toast({
      title: 'Catégorie appliquée',
      description: 'Le libellé a été classifié et la règle créée.',
    });
    await Promise.all([refetchLabels(), refetchRules()]);
  };

  const handleApplyAll = async () => {
    try {
      const result = await applyAll();
      toast({
        title: 'Règles appliquées',
        description: `${result.rulesApplied} règle(s) appliquée(s), ${result.expensesClassified} dépense(s) classée(s).`,
      });
      await Promise.all([refetchLabels(), refetchRules()]);
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'application",
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Supprimer cette règle ?')) return;
    try {
      await deleteRule(ruleId);
      toast({
        title: 'Règle supprimée',
        description: 'La règle a été supprimée.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    }
  };

  const handleEditRule = (rule: MatchingRule) => {
    setEditingRule(rule);
    setEditModalOpen(true);
  };

  const isLoading = labelsLoading || rulesLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      <ReglesPageHeader
        isLoading={isLoading}
        hasRules={rules.length > 0}
        onRefresh={() => {
          void Promise.all([refetchLabels(), refetchRules()]).catch(error => {
            console.error('[DepensesReglesPage] Refresh failed:', error);
          });
        }}
        onApplyAll={() => {
          void handleApplyAll().catch(error => {
            console.error('[DepensesReglesPage] Apply all failed:', error);
          });
        }}
      />

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <UnclassifiedLabelsList
            labels={labels}
            isLoading={labelsLoading}
            onClassify={handleClassifyLabel}
            onLink={handleLinkLabel}
          />
          <ActiveRulesList
            rules={rules}
            isLoading={rulesLoading}
            onEdit={handleEditRule}
            onDelete={ruleId => {
              void handleDeleteRule(ruleId).catch(error => {
                console.error(
                  '[DepensesReglesPage] Delete rule failed:',
                  error
                );
              });
            }}
          />
        </div>
      </div>

      <ReglesPageModals
        linkModalOpen={linkModalOpen}
        setLinkModalOpen={setLinkModalOpen}
        selectedLabel={selectedLabel}
        onLinkSuccess={() => {
          void handleLinkSuccess().catch(error => {
            console.error(
              '[DepensesReglesPage] Link success handler failed:',
              error
            );
          });
        }}
        editModalOpen={editModalOpen}
        setEditModalOpen={open => {
          setEditModalOpen(open);
          if (!open) setEditingRule(null);
        }}
        editingRule={editingRule}
        updateRule={updateRule}
        previewApply={previewApply}
        confirmApply={confirmApply}
        onEditSuccess={() => {
          setEditingRule(null);
          void refetchRules().catch(error => {
            console.error('[DepensesReglesPage] Refetch rules failed:', error);
          });
        }}
        classifyModalOpen={classifyModalOpen}
        setClassifyModalOpen={setClassifyModalOpen}
        classifyLabel={classifyLabel}
        onClassifySuccess={() => {
          void handleClassifySuccess().catch(error => {
            console.error(
              '[DepensesReglesPage] Classify success handler failed:',
              error
            );
          });
        }}
      />
    </div>
  );
}
