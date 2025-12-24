'use client';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@verone/ui';
import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@verone/ui/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Search,
  Plus,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { CategoryCardGrid, suggestCategory } from './CategoryCardGrid';
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '../hooks/use-expenses';
import { useMatchingRules } from '../hooks/use-matching-rules';

// Types
interface Organisation {
  id: string;
  legal_name: string;
  type: string;
  is_service_provider: boolean;
}

interface OrganisationLinkingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  transactionCount?: number;
  totalAmount?: number;
  onSuccess?: () => void;
}

type Step = 'who' | 'type' | 'category' | 'confirm';
type ProviderType = 'goods' | 'services';

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'who', label: 'Tiers' },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Catégorie' },
    { key: 'confirm', label: 'Confirmer' },
  ];

  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
              index < currentIndex
                ? 'bg-green-500 text-white'
                : index === currentIndex
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 text-slate-500'
            )}
          >
            {index < currentIndex ? <Check size={14} /> : index + 1}
          </div>
          <span
            className={cn(
              'hidden text-sm sm:inline',
              index === currentIndex
                ? 'font-medium text-slate-900'
                : 'text-slate-500'
            )}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div className="h-px w-4 bg-slate-300 sm:w-8" />
          )}
        </div>
      ))}
    </div>
  );
}

export function OrganisationLinkingModal({
  open,
  onOpenChange,
  label,
  transactionCount = 0,
  totalAmount = 0,
  onSuccess,
}: OrganisationLinkingModalProps) {
  // State
  const [step, setStep] = useState<Step>('who');
  const [searchQuery, setSearchQuery] = useState(label);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newOrgName, setNewOrgName] = useState(label);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [createRule, setCreateRule] = useState(true);
  const [applyToHistory, setApplyToHistory] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { create: createMatchingRule, applyOne } = useMatchingRules();

  // Suggestion de catégorie basée sur le label
  const suggestedCategory = suggestCategory(label);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('who');
      setSearchQuery(label);
      setSelectedOrg(null);
      setIsCreatingNew(false);
      setNewOrgName(label);
      setProviderType(null);
      setCategory(suggestedCategory);
      setCreateRule(true);
      setApplyToHistory(true);
    }
  }, [open, label, suggestedCategory]);

  // Fetch organisations based on search
  const searchOrganisations = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
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
        .limit(10);

      if (error) throw error;
      setOrganisations((data || []) as Organisation[]);
    } catch (err) {
      console.error('[OrganisationLinkingModal] Search error:', err);
      setOrganisations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchOrganisations(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOrganisations]);

  // Handle organisation creation
  const handleCreateOrganisation = async (): Promise<Organisation | null> => {
    if (!newOrgName.trim() || !providerType) return null;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .insert({
          legal_name: newOrgName.trim(),
          type: 'supplier',
          is_service_provider: providerType === 'services',
          is_active: true,
        })
        .select('id, legal_name, type, is_service_provider')
        .single();

      if (error) throw error;
      return data as Organisation;
    } catch (err) {
      console.error('[OrganisationLinkingModal] Create org error:', err);
      return null;
    }
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!category) return;

    setIsSubmitting(true);
    try {
      let orgToUse = selectedOrg;

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

      // Create matching rule if requested
      if (createRule) {
        const newRule = await createMatchingRule({
          match_type: 'label_contains',
          match_value: label,
          organisation_id: orgToUse.id,
          default_category: category,
          default_role_type:
            providerType === 'services' ? 'partner' : 'supplier',
          priority: 100,
        });

        // Apply to history if requested
        if (applyToHistory && newRule) {
          await applyOne(newRule.id);
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('[OrganisationLinkingModal] Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation
  const canGoNext = (): boolean => {
    switch (step) {
      case 'who':
        return !!(selectedOrg || (isCreatingNew && newOrgName.trim()));
      case 'type':
        return !!providerType;
      case 'category':
        return !!category;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    switch (step) {
      case 'who':
        // Skip type step if org already exists (we know the type)
        if (selectedOrg && !isCreatingNew) {
          setProviderType(
            selectedOrg.is_service_provider ? 'services' : 'goods'
          );
          setStep('category');
        } else {
          setStep('type');
        }
        break;
      case 'type':
        setStep('category');
        break;
      case 'category':
        setStep('confirm');
        break;
    }
  };

  const goBack = () => {
    switch (step) {
      case 'type':
        setStep('who');
        break;
      case 'category':
        if (isCreatingNew) {
          setStep('type');
        } else {
          setStep('who');
        }
        break;
      case 'confirm':
        setStep('category');
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Associer à un tiers</DialogTitle>
          <DialogDescription>
            Libellé : <strong>{label}</strong>
            {transactionCount > 0 && (
              <span className="ml-2 text-slate-500">
                ({transactionCount} transaction{transactionCount > 1 ? 's' : ''}{' '}
                • {totalAmount.toFixed(2)} €)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        <div className="min-h-[280px] py-4">
          {/* Step 1: Who */}
          {step === 'who' && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">
                  Rechercher ou créer un tiers
                </Label>
                <Command className="rounded-lg border">
                  <CommandInput
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList className="max-h-48">
                    {isLoading && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                      </div>
                    )}
                    {!isLoading &&
                      organisations.length === 0 &&
                      searchQuery.length >= 2 && (
                        <CommandEmpty>Aucun résultat</CommandEmpty>
                      )}
                    <CommandGroup>
                      {organisations.map(org => (
                        <CommandItem
                          key={org.id}
                          onSelect={() => {
                            setSelectedOrg(org);
                            setIsCreatingNew(false);
                          }}
                          className={cn(
                            'cursor-pointer',
                            selectedOrg?.id === org.id && 'bg-blue-50'
                          )}
                        >
                          <div className="flex flex-1 items-center justify-between">
                            <span>{org.legal_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {org.is_service_provider
                                ? '🔧 Prestataire'
                                : '📦 Fournisseur'}
                            </Badge>
                          </div>
                          {selectedOrg?.id === org.id && (
                            <Check className="ml-2 h-4 w-4 text-blue-500" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">ou</span>
                </div>
              </div>

              <Button
                variant={isCreatingNew ? 'default' : 'outline'}
                className="w-full"
                onClick={() => {
                  setIsCreatingNew(true);
                  setSelectedOrg(null);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer "{searchQuery || label}" comme nouveau tiers
              </Button>

              {isCreatingNew && (
                <div>
                  <Label htmlFor="newOrgName">Nom du tiers</Label>
                  <Input
                    id="newOrgName"
                    value={newOrgName}
                    onChange={e => setNewOrgName(e.target.value)}
                    placeholder="Nom de l'organisation"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Type */}
          {step === 'type' && (
            <div className="space-y-4">
              <Label>Quel type de tiers ?</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setProviderType('goods')}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:bg-slate-50',
                    providerType === 'goods'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-slate-200'
                  )}
                >
                  <Package className="h-10 w-10 text-amber-600" />
                  <div className="text-center">
                    <div className="font-medium">Fournisseur de biens</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Produits, marchandises, équipements
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProviderType('services')}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:bg-slate-50',
                    providerType === 'services'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-slate-200'
                  )}
                >
                  <Settings className="h-10 w-10 text-blue-600" />
                  <div className="text-center">
                    <div className="font-medium">Prestataire de services</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Abonnements, télécom, SaaS, conseil
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-center text-xs text-slate-500">
                Ex: IKEA, Leroy Merlin = Fournisseur | Free, OVH,
                Expert-comptable = Prestataire
              </p>
            </div>
          )}

          {/* Step 3: Category */}
          {step === 'category' && (
            <div className="space-y-4">
              <Label>Catégorie comptable</Label>
              <CategoryCardGrid
                value={category}
                onChange={setCategory}
                suggestedCategory={suggestedCategory}
              />
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-slate-50 p-4">
                <h4 className="mb-3 font-medium">Résumé</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Libellé :</span>
                    <span className="font-medium">{label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiers :</span>
                    <span className="font-medium">
                      {selectedOrg?.legal_name || newOrgName}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {providerType === 'services'
                          ? '🔧 Prestataire'
                          : '📦 Fournisseur'}
                      </Badge>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Catégorie :</span>
                    <span className="font-medium">
                      {category && (
                        <>
                          {
                            EXPENSE_CATEGORIES.find(c => c.id === category)
                              ?.emoji
                          }{' '}
                          {
                            EXPENSE_CATEGORIES.find(c => c.id === category)
                              ?.label
                          }
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={createRule}
                    onChange={e => setCreateRule(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium">
                      Créer une règle automatique
                    </div>
                    <div className="text-xs text-slate-500">
                      Les futures transactions "{label}" seront classées
                      automatiquement.
                    </div>
                  </div>
                </label>

                {createRule && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={applyToHistory}
                      onChange={e => setApplyToHistory(e.target.checked)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-medium">
                        Appliquer aux transactions existantes
                      </div>
                      <div className="text-xs text-slate-500">
                        {transactionCount > 0
                          ? `${transactionCount} transaction${transactionCount > 1 ? 's' : ''} sera${transactionCount > 1 ? 'ont' : ''} classée${transactionCount > 1 ? 's' : ''} immédiatement.`
                          : 'Classer les transactions existantes avec ce libellé.'}
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between border-t pt-4">
          {step !== 'who' ? (
            <Button variant="outline" onClick={goBack} disabled={isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          )}

          {step === 'confirm' ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canGoNext()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmer et classer
                </>
              )}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canGoNext()}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
