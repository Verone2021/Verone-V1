'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useToast } from '@verone/common/hooks';
import { getPcgCategory } from '@verone/finance';
import { OrganisationLinkingModal } from '@verone/finance/components';
import { useUniqueLabels, useMatchingRules } from '@verone/finance/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Settings,
  Trash2,
  Zap,
  Link as LinkIcon,
} from 'lucide-react';

// Format montant en euros
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(amount));
}

export default function ReglesPage() {
  const { toast } = useToast();

  // Hooks de données
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
    refetch: refetchRules,
  } = useMatchingRules();

  // État du modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<{
    label: string;
    transactionCount: number;
    totalAmount: number;
  } | null>(null);

  // Ouvrir le modal pour lier un libellé
  const handleLinkLabel = (
    label: string,
    transactionCount: number,
    totalAmount: number
  ) => {
    setSelectedLabel({ label, transactionCount, totalAmount });
    setModalOpen(true);
  };

  // Succès de la liaison
  const handleLinkSuccess = async () => {
    toast({
      title: 'Tiers associé',
      description: 'Le libellé a été associé et la règle créée.',
    });
    await Promise.all([refetchLabels(), refetchRules()]);
  };

  // Appliquer toutes les règles
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

  // Supprimer une règle
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

  // Toggle enabled
  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await updateRule(ruleId, { enabled: !enabled });
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
    }
  };

  const isLoading = labelsLoading || rulesLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/finance/depenses">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={16} className="mr-2" />
                Retour aux dépenses
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Règles de Classification
              </h1>
              <p className="text-sm text-slate-600">
                Associez vos libellés à des organisations pour classifier
                automatiquement vos dépenses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => Promise.all([refetchLabels(), refetchRules()])}
              disabled={isLoading}
            >
              <RefreshCw
                size={16}
                className={isLoading ? 'animate-spin' : ''}
              />
              Actualiser
            </Button>
            <Button onClick={handleApplyAll} disabled={rules.length === 0}>
              <Zap size={16} className="mr-2" />
              Appliquer toutes les règles
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Colonne gauche: Libellés non classés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Libellés non classés
                <Badge variant="secondary">{labels.length}</Badge>
              </CardTitle>
              <CardDescription>
                Cliquez sur "Lier" pour associer un libellé à une organisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {labelsLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
                  <p className="mt-2 text-slate-500">Chargement...</p>
                </div>
              ) : labels.length === 0 ? (
                <div className="py-8 text-center">
                  <Check className="mx-auto h-12 w-12 text-green-500" />
                  <p className="mt-2 text-slate-600">
                    Toutes les dépenses sont classées !
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] space-y-2 overflow-y-auto">
                  {labels.map(label => (
                    <div
                      key={label.label}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">
                          {label.label}
                        </p>
                        <p className="text-sm text-slate-500">
                          {label.transaction_count} transaction(s) •{' '}
                          {formatAmount(label.total_amount)}
                        </p>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          handleLinkLabel(
                            label.label,
                            label.transaction_count,
                            label.total_amount
                          )
                        }
                      >
                        <LinkIcon size={14} className="mr-1" />
                        Lier
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Colonne droite: Règles actives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={20} />
                Règles actives
                <Badge variant="secondary">{rules.length}</Badge>
              </CardTitle>
              <CardDescription>
                Règles qui classifient automatiquement les dépenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
                  <p className="mt-2 text-slate-500">Chargement...</p>
                </div>
              ) : rules.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-slate-600">Aucune règle créée</p>
                  <p className="text-sm text-slate-500">
                    Liez des libellés à des organisations depuis la colonne de
                    gauche
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] space-y-3 overflow-y-auto">
                  {rules.map(rule => {
                    const pcgCategory = getPcgCategory(
                      rule.default_category ?? ''
                    );
                    return (
                      <div
                        key={rule.id}
                        className={`rounded-lg border p-3 ${
                          rule.enabled
                            ? 'border-slate-200 bg-white'
                            : 'border-slate-100 bg-slate-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-slate-900">
                              {rule.match_value}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Building2 size={14} className="text-slate-400" />
                              <span className="truncate text-sm text-slate-600">
                                {rule.organisation_name || 'Non assigné'}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {pcgCategory?.label ||
                                  rule.default_category ||
                                  '-'}
                              </Badge>
                              <Badge
                                variant={rule.enabled ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {rule.matched_expenses_count} classée(s)
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggleRule(rule.id, rule.enabled)
                              }
                              title={rule.enabled ? 'Désactiver' : 'Activer'}
                            >
                              {rule.enabled ? (
                                <Check size={14} className="text-green-600" />
                              ) : (
                                <Play size={14} className="text-slate-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de liaison - Nouveau workflow */}
      {selectedLabel && (
        <OrganisationLinkingModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          label={selectedLabel.label}
          transactionCount={selectedLabel.transactionCount}
          totalAmount={selectedLabel.totalAmount}
          onSuccess={handleLinkSuccess}
        />
      )}
    </div>
  );
}
