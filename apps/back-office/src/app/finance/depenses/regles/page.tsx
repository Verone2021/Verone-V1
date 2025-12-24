'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useToast } from '@verone/common/hooks';
import {
  useUniqueLabels,
  useMatchingRules,
  EXPENSE_CATEGORIES,
  type CreateRuleData,
} from '@verone/finance/hooks';
import { useOrganisations } from '@verone/organisations/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { RadioGroup, RadioGroupItem } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  FileText,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Zap,
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
    create: createRule,
    remove: deleteRule,
    update: updateRule,
    applyAll,
    applyOne,
    refetch: refetchRules,
  } = useMatchingRules();
  const { organisations, loading: orgsLoading } = useOrganisations();

  // État du modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  // État du formulaire
  const [matchType, setMatchType] = useState<'label_contains' | 'label_exact'>(
    'label_contains'
  );
  const [matchValue, setMatchValue] = useState('');
  const [organisationId, setOrganisationId] = useState('');
  const [roleType, setRoleType] = useState<'supplier' | 'partner'>('supplier');
  const [category, setCategory] = useState('');
  const [applyToHistory, setApplyToHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État de recherche organisation
  const [orgSearch, setOrgSearch] = useState('');

  // Filtrer les organisations (tous les fournisseurs)
  const filteredOrgs = organisations
    .filter(org => {
      const matchesSearch =
        !orgSearch ||
        org.legal_name?.toLowerCase().includes(orgSearch.toLowerCase());
      const matchesType = org.type === 'supplier';
      return matchesSearch && matchesType;
    })
    .sort((a, b) => (a.legal_name || '').localeCompare(b.legal_name || ''));

  // Ouvrir le modal pour créer une règle
  const handleCreateRule = (label: string) => {
    setSelectedLabel(label);
    setMatchValue(label);
    setMatchType('label_contains');
    setOrganisationId('');
    setRoleType('supplier');
    setCategory('');
    setApplyToHistory(true);
    setOrgSearch('');
    setModalOpen(true);
  };

  // Soumettre la création de règle
  const handleSubmit = async () => {
    if (!matchValue.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le libellé à matcher est requis.',
        variant: 'destructive',
      });
      return;
    }

    if (!organisationId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une organisation.',
        variant: 'destructive',
      });
      return;
    }

    if (!category) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une catégorie.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateRuleData = {
        match_type: matchType,
        match_value: matchValue.trim(),
        display_label: matchValue.trim(),
        organisation_id: organisationId,
        default_category: category,
        default_role_type: roleType,
      };

      const newRule = await createRule(data);

      if (newRule && applyToHistory) {
        // Appliquer la règle à l'historique
        const classified = await applyOne(newRule.id);
        toast({
          title: 'Règle créée',
          description: `Règle créée et ${classified} dépense(s) classée(s).`,
        });
      } else {
        toast({
          title: 'Règle créée',
          description: 'La règle a été créée avec succès.',
        });
      }

      // Rafraîchir les données
      await Promise.all([refetchLabels(), refetchRules()]);

      setModalOpen(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="bg-white border-b border-slate-200 px-6 py-4">
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
                Créez des règles pour classifier automatiquement vos dépenses
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche: Libellés non classés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Libellés non classés
                <Badge variant="secondary">{labels.length}</Badge>
              </CardTitle>
              <CardDescription>
                Cliquez sur un libellé pour créer une règle de classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {labelsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
                  <p className="mt-2 text-slate-500">Chargement...</p>
                </div>
              ) : labels.length === 0 ? (
                <div className="text-center py-8">
                  <Check className="mx-auto h-12 w-12 text-green-500" />
                  <p className="mt-2 text-slate-600">
                    Toutes les dépenses sont classées !
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {labels.map(label => (
                    <div
                      key={label.label}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {label.label}
                        </p>
                        <p className="text-sm text-slate-500">
                          {label.transaction_count} transaction(s) •{' '}
                          {formatAmount(label.total_amount)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateRule(label.label)}
                      >
                        <Plus size={14} className="mr-1" />
                        Créer
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
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
                  <p className="mt-2 text-slate-500">Chargement...</p>
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-slate-600">Aucune règle créée</p>
                  <p className="text-sm text-slate-500">
                    Créez une règle depuis la colonne de gauche
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {rules.map(rule => (
                    <div
                      key={rule.id}
                      className={`p-3 rounded-lg border ${
                        rule.enabled
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-50 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {rule.display_label || rule.match_value}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-600 truncate">
                              {rule.organisation_name || 'Non assigné'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {EXPENSE_CATEGORIES.find(
                                c => c.id === rule.default_category
                              )?.label || rule.default_category}
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de création de règle */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent dialogSize="lg">
          <DialogHeader>
            <DialogTitle>Créer une règle pour "{selectedLabel}"</DialogTitle>
            <DialogDescription>
              Associez ce libellé à une organisation et une catégorie
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Libellé à matcher */}
            <div className="space-y-2">
              <Label>Libellé à matcher</Label>
              <Input
                value={matchValue}
                onChange={e => setMatchValue(e.target.value)}
                placeholder="Ex: GOCARDLESS"
              />
              <RadioGroup
                value={matchType}
                onValueChange={v =>
                  setMatchType(v as 'label_contains' | 'label_exact')
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="label_contains" id="contains" />
                  <Label htmlFor="contains" className="cursor-pointer">
                    Contient
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="label_exact" id="exact" />
                  <Label htmlFor="exact" className="cursor-pointer">
                    Correspondance exacte
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Organisation */}
            <div className="space-y-2">
              <Label>
                Organisation <span className="text-red-500">*</span>
              </Label>
              <Input
                value={orgSearch}
                onChange={e => setOrgSearch(e.target.value)}
                placeholder="Rechercher un fournisseur..."
                className="mb-2"
              />
              <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                {orgsLoading ? (
                  <div className="p-4 text-center text-slate-500">
                    Chargement...
                  </div>
                ) : filteredOrgs.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    Aucun fournisseur trouvé
                  </div>
                ) : (
                  filteredOrgs.map(org => (
                    <div
                      key={org.id}
                      className={`p-2 cursor-pointer hover:bg-slate-50 flex items-center gap-2 ${
                        organisationId === org.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setOrganisationId(org.id)}
                    >
                      {organisationId === org.id && (
                        <Check size={14} className="text-blue-600" />
                      )}
                      <Building2
                        size={14}
                        className={
                          organisationId === org.id
                            ? 'text-blue-600'
                            : 'text-slate-400'
                        }
                      />
                      <span className="truncate">{org.legal_name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Type de rôle */}
            <div className="space-y-2">
              <Label>
                Type <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={roleType}
                onValueChange={v => setRoleType(v as 'supplier' | 'partner')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="supplier" id="supplier" />
                  <Label htmlFor="supplier" className="cursor-pointer">
                    Fournisseur matériel
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partner" id="partner" />
                  <Label htmlFor="partner" className="cursor-pointer">
                    Prestataire de service
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label>
                Catégorie <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie..." />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Option d'application à l'historique */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="applyHistory"
                checked={applyToHistory}
                onCheckedChange={checked => setApplyToHistory(checked === true)}
              />
              <Label htmlFor="applyHistory" className="cursor-pointer">
                Appliquer à toutes les dépenses existantes avec ce libellé
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Créer la règle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
