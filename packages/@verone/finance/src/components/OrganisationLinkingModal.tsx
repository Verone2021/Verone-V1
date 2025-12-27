'use client';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@verone/ui';
import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@verone/ui/components/ui/dialog';
import { Input } from '@verone/ui/components/ui/input';
import { Label } from '@verone/ui/components/ui/label';
import { createClient } from '@verone/utils/supabase/client';
import {
  Package,
  Settings,
  Check,
  Plus,
  Loader2,
  Building2,
  Search,
  Info,
  AlertCircle,
  X,
} from 'lucide-react';

import { useMatchingRules } from '../hooks/use-matching-rules';
import { getPcgCategory } from '../lib/pcg-categories';

// Types
interface IOrganisation {
  id: string;
  legal_name: string;
  type: string;
  is_service_provider: boolean;
}

interface IExistingRule {
  id: string;
  match_value: string;
  default_category: string | null;
  organisation_id: string | null;
}

interface IOrganisationLinkingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  transactionCount?: number;
  totalAmount?: number;
  onSuccess?: () => void;
}

type ProviderType = 'supplier' | 'partner';

export function OrganisationLinkingModal({
  open,
  onOpenChange,
  label,
  transactionCount = 0,
  totalAmount = 0,
  onSuccess,
}: IOrganisationLinkingModalProps): React.JSX.Element {
  // State simplifié - PAS de steps, PAS de catégorie
  const [searchQuery, setSearchQuery] = useState<string>(label);
  const [organisations, setOrganisations] = useState<IOrganisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<IOrganisation | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newOrgName, setNewOrgName] = useState<string>(label);
  const [providerType, setProviderType] = useState<ProviderType>('partner');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [applyToHistory, setApplyToHistory] = useState<boolean>(true);

  const {
    rules,
    create: createMatchingRule,
    update: updateMatchingRule,
    applyOne,
  } = useMatchingRules();

  // État pour règle existante détectée
  const [existingRule, setExistingRule] = useState<IExistingRule | null>(null);

  // Format currency
  const formatAmount = (amount: number): string =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(Math.abs(amount));

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSearchQuery(label);
      setSelectedOrg(null);
      setIsCreatingNew(false);
      setNewOrgName(label);
      setProviderType('partner');
      setApplyToHistory(true);
      setExistingRule(null);
    }
  }, [open, label]);

  // Détecter les règles existantes pour ce libellé
  useEffect(() => {
    if (!open || !label || rules.length === 0) return;

    const matchingRule = rules.find(
      rule =>
        rule.match_type === 'label_contains' &&
        rule.match_value.toLowerCase() === label.toLowerCase()
    );

    if (matchingRule) {
      setExistingRule({
        id: matchingRule.id,
        match_value: matchingRule.match_value,
        default_category: matchingRule.default_category,
        organisation_id: matchingRule.organisation_id,
      });
    } else {
      setExistingRule(null);
    }
  }, [open, label, rules]);

  // Fetch organisations based on search
  const searchOrganisations = useCallback(
    async (query: string): Promise<void> => {
      if (!query || query.trim().length === 0) {
        setOrganisations([]);
        return;
      }

      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('organisations')
          .select('id, legal_name, type, is_service_provider')
          .or(`legal_name.ilike.%${query}%,trade_name.ilike.%${query}%`)
          .eq('type', 'supplier')
          .is('archived_at', null)
          .order('legal_name')
          .limit(8);

        if (error) throw error;
        setOrganisations((data ?? []) as IOrganisation[]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('[OrganisationLinkingModal] Search error:', message);
        setOrganisations([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      void searchOrganisations(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOrganisations]);

  // Auto-select if exact match found
  useEffect(() => {
    if (!open || selectedOrg || organisations.length === 0) return;

    // Chercher une correspondance exacte (case insensitive)
    const exactMatch = organisations.find(
      org => org.legal_name.toLowerCase() === label.toLowerCase()
    );

    if (exactMatch) {
      setSelectedOrg(exactMatch);
      setProviderType(exactMatch.is_service_provider ? 'partner' : 'supplier');
    }
  }, [open, organisations, label, selectedOrg]);

  // Handle organisation creation
  const handleCreateOrganisation = async (): Promise<IOrganisation | null> => {
    if (!newOrgName.trim()) return null;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .insert({
          legal_name: newOrgName.trim(),
          type: 'supplier',
          is_service_provider: providerType === 'partner',
          is_active: true,
        })
        .select('id, legal_name, type, is_service_provider')
        .single();

      if (error) throw error;
      return data as IOrganisation;
    } catch (err) {
      console.error('[OrganisationLinkingModal] Create org error:', err);
      return null;
    }
  };

  // Handle final submission - SIMPLIFIÉ
  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      let orgToUse: IOrganisation | null = selectedOrg;

      // Create new organisation if needed
      if (isCreatingNew && !selectedOrg) {
        orgToUse = await handleCreateOrganisation();
        if (!orgToUse) {
          throw new Error("Erreur lors de la création de l'organisation");
        }
      }

      if (!orgToUse) {
        throw new Error('Aucune organisation sélectionnée');
      }

      let ruleId: string | null = null;

      if (existingRule) {
        // UPDATE - garder la catégorie existante, juste ajouter org + type
        const success = await updateMatchingRule(existingRule.id, {
          organisation_id: orgToUse.id,
          default_role_type: providerType,
          // PAS de default_category - on garde l'existante !
        });
        if (success) {
          ruleId = existingRule.id;
        }
      } else {
        // CREATE nouvelle règle SANS catégorie (sera classé plus tard)
        const newRule = await createMatchingRule({
          match_type: 'label_contains',
          match_value: label,
          organisation_id: orgToUse.id,
          default_category: null, // Pas de catégorie
          default_role_type: providerType,
          priority: 100,
        });
        if (newRule) {
          ruleId = newRule.id;
        }
      }

      // Apply to history if requested
      if (applyToHistory && ruleId) {
        await applyOne(ruleId);
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('[OrganisationLinkingModal] Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(
    selectedOrg ?? (isCreatingNew && newOrgName.trim())
  );

  // Get category label
  const categoryLabel = existingRule?.default_category
    ? (getPcgCategory(existingRule.default_category)?.label ??
      existingRule.default_category)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg overflow-hidden p-0"
        data-testid="modal-link-org"
      >
        {/* Header */}
        <div className="border-b bg-gradient-to-br from-slate-50 to-white px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 shadow-lg shadow-blue-500/30">
                <Building2 size={18} className="text-white" />
              </div>
              Associer à une organisation
            </DialogTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant="secondary"
                className="gap-1 bg-slate-100 px-2.5 py-1 text-slate-700"
              >
                <span className="font-mono text-xs">{label}</span>
              </Badge>
              {transactionCount > 0 && (
                <span className="text-slate-500">
                  • {transactionCount} transaction
                  {transactionCount > 1 ? 's' : ''} •{' '}
                  {formatAmount(totalAmount)}
                </span>
              )}
            </div>
          </DialogHeader>

          {/* Banner règle existante */}
          {existingRule && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">
                  Règle existante détectée
                </p>
                <p className="mt-0.5 text-blue-700">
                  {categoryLabel
                    ? `Catégorie: ${categoryLabel} (sera conservée)`
                    : 'Sans catégorie'}
                </p>
              </div>
            </div>
          )}

          {/* Banner pas de règle */}
          {!existingRule && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-amber-600"
              />
              <div className="text-sm">
                <p className="font-medium text-amber-900">
                  Aucune règle existante
                </p>
                <p className="mt-0.5 text-amber-700">
                  Une nouvelle règle sera créée (sans catégorie)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content - TOUT EN UNE PAGE */}
        <div className="space-y-6 px-6 py-6">
          {/* 1. Organisation */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Search size={16} className="text-slate-400" />
              Organisation
            </Label>

            {/* Selected org display */}
            {selectedOrg && (
              <div className="flex items-center justify-between rounded-xl border-2 border-blue-500 bg-blue-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">
                      {selectedOrg.legal_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedOrg.is_service_provider
                        ? 'Prestataire de services'
                        : 'Fournisseur de biens'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrg(null)}
                  className="rounded-full p-1 hover:bg-blue-100"
                >
                  <X size={16} className="text-blue-600" />
                </button>
              </div>
            )}

            {/* Search input - hidden when org selected */}
            {!selectedOrg && (
              <>
                <div className="relative">
                  <Input
                    placeholder="Rechercher une organisation..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-11 pl-4 pr-10"
                  />
                  {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>

                {/* Search results */}
                {organisations.length > 0 && (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {organisations.map(org => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrg(org);
                          setIsCreatingNew(false);
                          // Auto-set provider type based on org
                          setProviderType(
                            org.is_service_provider ? 'partner' : 'supplier'
                          );
                        }}
                        className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50"
                      >
                        <Building2 size={16} className="text-slate-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {org.legal_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {org.is_service_provider
                              ? 'Prestataire'
                              : 'Fournisseur'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results / Create new */}
                {!isLoading &&
                  searchQuery.length > 0 &&
                  organisations.length === 0 && (
                    <div className="space-y-3">
                      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 py-4 text-center">
                        <p className="text-sm text-slate-500">
                          Aucune organisation trouvée
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNew(true);
                          setNewOrgName(searchQuery);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all',
                          isCreatingNew
                            ? 'border-green-500 bg-green-50'
                            : 'border-dashed border-slate-300 hover:border-green-400 hover:bg-green-50/50'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            isCreatingNew
                              ? 'bg-green-500 text-white'
                              : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          <Plus size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">
                            Créer &quot;{searchQuery}&quot;
                          </div>
                          <div className="text-xs text-slate-500">
                            Nouvelle organisation
                          </div>
                        </div>
                        {isCreatingNew && (
                          <Check size={16} className="text-green-600" />
                        )}
                      </button>
                    </div>
                  )}

                {/* New org name input */}
                {isCreatingNew && (
                  <Input
                    value={newOrgName}
                    onChange={e => setNewOrgName(e.target.value)}
                    placeholder="Nom de l'organisation"
                    className="h-11"
                    autoFocus
                  />
                )}
              </>
            )}
          </div>

          {/* 2. Type - toujours visible */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProviderType('supplier')}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                  providerType === 'supplier'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    providerType === 'supplier'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <Package size={20} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">Fournisseur</div>
                  <div className="text-xs text-slate-500">de biens</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProviderType('partner')}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                  providerType === 'partner'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    providerType === 'partner'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <Settings size={20} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">Prestataire</div>
                  <div className="text-xs text-slate-500">de services</div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Apply to history */}
          <label
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all',
              applyToHistory
                ? 'border-green-500 bg-green-50'
                : 'border-slate-200 hover:bg-slate-50'
            )}
          >
            <input
              type="checkbox"
              checked={applyToHistory}
              onChange={e => setApplyToHistory(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-green-500"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">
                Appliquer aux transactions existantes
              </div>
              {transactionCount > 0 && (
                <div className="text-xs text-slate-500">
                  {transactionCount} transaction
                  {transactionCount > 1 ? 's' : ''} concernée
                  {transactionCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-between border-t bg-slate-50/50 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-500"
          >
            Annuler
          </Button>

          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !canSubmit}
            className="gap-2 bg-blue-500 hover:bg-blue-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check size={16} />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
