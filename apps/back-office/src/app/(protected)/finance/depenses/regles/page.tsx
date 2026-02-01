'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import { useToast } from '@verone/common/hooks';
import { getPcgCategory } from '@verone/finance';
import {
  OrganisationLinkingModal,
  QuickClassificationModal,
  RuleModal,
} from '@verone/finance/components';
import {
  useUniqueLabels,
  useMatchingRules,
  type MatchingRule,
} from '@verone/finance/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@verone/ui';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Settings,
  Tag,
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
  const searchParams = useSearchParams();
  const router = useRouter();

  // Pré-remplissage depuis classification (query params)
  const createFromClassification = searchParams.get('create') === 'true';
  const prefillLabel = searchParams.get('label') ?? '';
  const _prefillCategory = searchParams.get('category') ?? '';
  const _prefillTva = searchParams.get('tva') ?? '';

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
    previewApply,
    confirmApply,
    refetch: refetchRules,
  } = useMatchingRules();

  // État du modal de liaison
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<{
    label: string;
    transactionCount: number;
    totalAmount: number;
  } | null>(null);

  // État du modal d'édition de règle
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MatchingRule | null>(null);

  // État du modal de classification (catégorie seule, sans organisation)
  const [classifyModalOpen, setClassifyModalOpen] = useState(false);
  const [classifyLabel, setClassifyLabel] = useState<{
    label: string;
    transactionCount: number;
    totalAmount: number;
  } | null>(null);

  // État des recherches
  const [labelsSearch, setLabelsSearch] = useState('');
  const [rulesSearch, setRulesSearch] = useState('');

  // État des onglets règles (complètes/incomplètes)
  const [rulesTab, setRulesTab] = useState<'complete' | 'incomplete'>(
    'incomplete'
  );

  // Filtrage des libellés non classés
  const filteredLabels = labels.filter(label =>
    label.label.toLowerCase().includes(labelsSearch.toLowerCase())
  );

  // Filtrage des règles actives par recherche
  const searchFilteredRules = rules.filter(
    rule =>
      rule.match_value.toLowerCase().includes(rulesSearch.toLowerCase()) ||
      rule.organisation_name
        ?.toLowerCase()
        .includes(rulesSearch.toLowerCase())
  );

  // Séparation règles complètes / incomplètes
  // Incomplète = pas de catégorie OU 0 éléments classés
  const completeRules = searchFilteredRules.filter(
    rule => rule.default_category && rule.matched_expenses_count > 0
  );
  const incompleteRules = searchFilteredRules.filter(
    rule => !rule.default_category || rule.matched_expenses_count === 0
  );

  // Règles affichées selon l'onglet sélectionné
  const filteredRules =
    rulesTab === 'complete' ? completeRules : incompleteRules;

  // Auto-ouvrir le modal si on vient de la classification
  useEffect(() => {
    if (createFromClassification && prefillLabel) {
      setSelectedLabel({
        label: prefillLabel,
        transactionCount: 0,
        totalAmount: 0,
      });
      setModalOpen(true);

      // Nettoyer l'URL après ouverture du modal
      router.replace('/finance/depenses/regles', { scroll: false });
    }
  }, [createFromClassification, prefillLabel, router]);

  // Ouvrir le modal pour lier un libellé (organisation)
  const handleLinkLabel = (
    label: string,
    transactionCount: number,
    totalAmount: number
  ) => {
    setSelectedLabel({ label, transactionCount, totalAmount });
    setModalOpen(true);
  };

  // Ouvrir le modal pour classifier un libellé (catégorie seule)
  const handleClassifyLabel = (
    label: string,
    transactionCount: number,
    totalAmount: number
  ) => {
    setClassifyLabel({ label, transactionCount, totalAmount });
    setClassifyModalOpen(true);
  };

  // Succès de la classification
  const handleClassifySuccess = async () => {
    toast({
      title: 'Catégorie appliquée',
      description: 'Le libellé a été classifié et la règle créée.',
    });
    await Promise.all([refetchLabels(), refetchRules()]);
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

  // Ouvrir le modal d'édition d'une règle
  const handleEditRule = (rule: MatchingRule) => {
    setEditingRule(rule);
    setEditModalOpen(true);
  };

  // Sauvegarder les modifications d'une règle
  const _handleSaveRule = async (
    ruleId: string,
    data: {
      organisation_id?: string | null;
      default_category?: string | null;
      enabled?: boolean;
    }
  ): Promise<boolean> => {
    try {
      await updateRule(ruleId, data);
      toast({
        title: 'Règle modifiée',
        description: 'Les modifications ont été enregistrées.',
      });
      await refetchRules();
      return true;
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la modification',
        variant: 'destructive',
      });
      return false;
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
              onClick={() => {
                void Promise.all([refetchLabels(), refetchRules()]).catch(
                  error => {
                    console.error(
                      '[DepensesReglesPage] Refresh failed:',
                      error
                    );
                  }
                );
              }}
              disabled={isLoading}
            >
              <RefreshCw
                size={16}
                className={isLoading ? 'animate-spin' : ''}
              />
              Actualiser
            </Button>
            <Button
              onClick={() => {
                void handleApplyAll().catch(error => {
                  console.error(
                    '[DepensesReglesPage] Apply all failed:',
                    error
                  );
                });
              }}
              disabled={rules.length === 0}
            >
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
              {labels.length > 0 && (
                <div className="relative mt-2">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    placeholder="Rechercher un libellé..."
                    value={labelsSearch}
                    onChange={e => setLabelsSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}
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
              ) : filteredLabels.length === 0 ? (
                <div className="py-8 text-center">
                  <Search className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-slate-600">
                    Aucun libellé trouvé pour "{labelsSearch}"
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] space-y-2 overflow-y-auto">
                  {filteredLabels.map(label => (
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
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleClassifyLabel(
                              label.label,
                              label.transaction_count,
                              label.total_amount
                            )
                          }
                          title="Classifier (catégorie seule)"
                        >
                          <Tag size={14} className="mr-1" />
                          Classer
                        </Button>
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
                          title="Lier à une organisation"
                        >
                          <LinkIcon size={14} className="mr-1" />
                          Lier
                        </Button>
                      </div>
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
              {rules.length > 0 && (
                <>
                  <Tabs
                    value={rulesTab}
                    onValueChange={v =>
                      setRulesTab(v as 'complete' | 'incomplete')
                    }
                    className="mt-3"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="incomplete" className="text-sm">
                        À compléter
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-amber-100 text-amber-700"
                        >
                          {incompleteRules.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="complete" className="text-sm">
                        Complètes
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-green-100 text-green-700"
                        >
                          {completeRules.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="relative mt-2">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      placeholder="Rechercher une règle..."
                      value={rulesSearch}
                      onChange={e => setRulesSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </>
              )}
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
              ) : filteredRules.length === 0 ? (
                <div className="py-8 text-center">
                  {rulesSearch ? (
                    <>
                      <Search className="mx-auto h-12 w-12 text-slate-300" />
                      <p className="mt-2 text-slate-600">
                        Aucune règle trouvée pour "{rulesSearch}"
                      </p>
                    </>
                  ) : rulesTab === 'incomplete' ? (
                    <>
                      <Check className="mx-auto h-12 w-12 text-green-500" />
                      <p className="mt-2 text-slate-600">
                        Toutes les règles sont complètes !
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mx-auto h-12 w-12 text-slate-300" />
                      <p className="mt-2 text-slate-600">
                        Aucune règle complète
                      </p>
                      <p className="text-sm text-slate-500">
                        Complétez les règles dans l'onglet "À compléter"
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="max-h-[600px] space-y-3 overflow-y-auto">
                  {filteredRules.map(rule => {
                    const pcgCategory = getPcgCategory(
                      rule.default_category ?? ''
                    );
                    const missingCategory = !rule.default_category;
                    const noMatches = rule.matched_expenses_count === 0;
                    return (
                      <div
                        key={rule.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 cursor-pointer transition-all hover:shadow-md hover:border-blue-300"
                        onClick={() => handleEditRule(rule)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-slate-900">
                              {rule.match_value}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Building2 size={14} className="text-slate-400" />
                              <span className="truncate text-sm text-slate-600">
                                {rule.organisation_name ?? 'Non assigné'}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${missingCategory ? 'border-amber-300 bg-amber-50 text-amber-700' : ''}`}
                              >
                                {missingCategory
                                  ? '⚠️ Catégorie manquante'
                                  : (pcgCategory?.label ??
                                    rule.default_category)}
                              </Badge>
                              <Badge
                                variant="default"
                                className={`text-xs ${noMatches ? 'bg-amber-100 text-amber-700' : ''}`}
                              >
                                {noMatches
                                  ? '⚠️ 0 classée'
                                  : `${rule.matched_expenses_count} classée(s)`}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              void handleDeleteRule(rule.id).catch(error => {
                                console.error(
                                  '[DepensesReglesPage] Delete rule failed:',
                                  error
                                );
                              });
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </Button>
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
          onSuccess={() => {
            void handleLinkSuccess().catch(error => {
              console.error(
                '[DepensesReglesPage] Link success handler failed:',
                error
              );
            });
          }}
        />
      )}

      {/* Modal d'édition de règle */}
      <RuleModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        rule={editingRule}
        onUpdate={updateRule}
        previewApply={previewApply}
        confirmApply={confirmApply}
        onSuccess={() => {
          setEditingRule(null);
          void refetchRules().catch(error => {
            console.error('[DepensesReglesPage] Refetch rules failed:', error);
          });
        }}
      />

      {/* Modal de classification (catégorie seule, sans organisation) */}
      {classifyLabel && (
        <QuickClassificationModal
          open={classifyModalOpen}
          onOpenChange={setClassifyModalOpen}
          label={classifyLabel.label}
          amount={classifyLabel.totalAmount}
          transactionCount={classifyLabel.transactionCount}
          onSuccess={() => {
            void handleClassifySuccess().catch(error => {
              console.error(
                '[DepensesReglesPage] Classify success handler failed:',
                error
              );
            });
          }}
        />
      )}
    </div>
  );
}
