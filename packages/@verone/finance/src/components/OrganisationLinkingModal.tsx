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
  ArrowLeft,
  ArrowRight,
  Loader2,
  Building2,
  Sparkles,
  Search,
} from 'lucide-react';

import { CategoryCardGrid, suggestCategory } from './CategoryCardGrid';
import { useMatchingRules } from '../hooks/use-matching-rules';
import { PCG_SUGGESTED_CATEGORIES } from '../lib/pcg-categories';

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

// Modern Step Indicator with glassmorphism and animations
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step; label: string; icon: string }[] = [
    { key: 'who', label: 'Organisation', icon: '🏢' },
    { key: 'type', label: 'Type', icon: '🏷️' },
    { key: 'category', label: 'Catégorie', icon: '📊' },
    { key: 'confirm', label: 'Confirmer', icon: '✅' },
  ];

  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="relative mx-auto w-full max-w-md px-4 py-4">
      {/* Background track */}
      <div className="absolute left-8 right-8 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-100" />

      {/* Progress bar */}
      <div
        className="absolute left-8 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
        style={{
          width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 32px)`,
        }}
      />

      <div className="relative flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-300',
                  isCompleted &&
                    'bg-green-500 text-white shadow-lg shadow-green-500/30',
                  isCurrent &&
                    'bg-blue-500 text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-100 scale-110',
                  isPending &&
                    'bg-white text-slate-400 border-2 border-slate-200'
                )}
              >
                {isCompleted ? (
                  <Check
                    size={18}
                    className="animate-in zoom-in duration-200"
                  />
                ) : (
                  <span className="text-base">{step.icon}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-300',
                  isCurrent
                    ? 'text-blue-600'
                    : isCompleted
                      ? 'text-green-600'
                      : 'text-slate-400'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Organisation card component for search results
function OrganisationCard({
  org,
  isSelected,
  onSelect,
}: {
  org: Organisation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200',
        'hover:shadow-md hover:scale-[1.02]',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10'
          : 'border-slate-200 bg-white hover:border-slate-300'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
          isSelected
            ? 'bg-blue-500 text-white'
            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
        )}
      >
        <Building2 size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-slate-900">
          {org.legal_name}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {org.is_service_provider ? (
            <>
              <Settings size={12} className="text-blue-500" />
              <span>Prestataire de services</span>
            </>
          ) : (
            <>
              <Package size={12} className="text-amber-500" />
              <span>Fournisseur de biens</span>
            </>
          )}
        </div>
      </div>
      {isSelected && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
          <Check size={14} className="text-white" />
        </div>
      )}
    </button>
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
  const [category, setCategory] = useState<string | null>(null);
  const [createRule, setCreateRule] = useState(true);
  const [applyToHistory, setApplyToHistory] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { create: createMatchingRule, applyOne } = useMatchingRules();

  // Suggestion de catégorie basée sur le label
  const suggestedCategory = suggestCategory(label);

  // Format currency
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(Math.abs(amount));

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

  // Fetch organisations based on search - starts immediately
  const searchOrganisations = useCallback(async (query: string) => {
    // Start search immediately (no minimum characters)
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
      setOrganisations((data || []) as Organisation[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('[OrganisationLinkingModal] Search error:', message);
      setOrganisations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search (reduced to 200ms for responsiveness)
  useEffect(() => {
    const timer = setTimeout(() => {
      searchOrganisations(searchQuery);
    }, 200);
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
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        {/* Header with gradient background */}
        <div className="border-b bg-gradient-to-br from-slate-50 to-white px-6 pt-6 pb-2">
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

          <StepIndicator currentStep={step} />
        </div>

        {/* Content area with fixed height for smooth transitions */}
        <div className="min-h-[380px] overflow-y-auto px-6 py-6">
          {/* Step 1: Who */}
          {step === 'who' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <Label className="mb-2 flex items-center gap-2 text-base font-semibold">
                  <Search size={16} className="text-slate-400" />
                  Rechercher une organisation
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Tapez pour rechercher..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-12 pl-4 pr-10 text-base"
                  />
                  {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>
              </div>

              {/* Search results */}
              {organisations.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-slate-500">
                    {organisations.length} résultat
                    {organisations.length > 1 ? 's' : ''} trouvé
                    {organisations.length > 1 ? 's' : ''}
                  </Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {organisations.map(org => (
                      <OrganisationCard
                        key={org.id}
                        org={org}
                        isSelected={selectedOrg?.id === org.id}
                        onSelect={() => {
                          setSelectedOrg(org);
                          setIsCreatingNew(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No results state */}
              {!isLoading &&
                searchQuery.length > 0 &&
                organisations.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
                    <div className="text-4xl">🔍</div>
                    <p className="mt-2 font-medium text-slate-600">
                      Aucune organisation trouvée
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Créez cette organisation ci-dessous
                    </p>
                  </div>
                )}

              {/* Afficher la création SEULEMENT si pas de résultats ET pas d'org sélectionnée */}
              {!selectedOrg &&
                organisations.length === 0 &&
                searchQuery.length > 0 && (
                  <>
                    {/* Divider */}
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-3 text-sm font-medium text-slate-400">
                          ou créer une nouvelle
                        </span>
                      </div>
                    </div>

                    {/* Create new button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(true);
                        setSelectedOrg(null);
                      }}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200',
                        'hover:shadow-md',
                        isCreatingNew
                          ? 'border-green-500 bg-green-50 shadow-md shadow-green-500/10'
                          : 'border-dashed border-slate-300 bg-white hover:border-green-400 hover:bg-green-50/50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                          isCreatingNew
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-green-100 group-hover:text-green-600'
                        )}
                      >
                        <Plus size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900">
                          Créer l&apos;organisation
                        </div>
                        <div className="text-sm text-slate-500">
                          &quot;{searchQuery || label}&quot; sera ajoutée comme
                          fournisseur
                        </div>
                      </div>
                      {isCreatingNew && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  </>
                )}

              {/* New org name input */}
              {isCreatingNew && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label
                    htmlFor="newOrgName"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Nom de l&apos;organisation
                  </Label>
                  <Input
                    id="newOrgName"
                    value={newOrgName}
                    onChange={e => setNewOrgName(e.target.value)}
                    placeholder="Nom légal de l'organisation"
                    className="h-11"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Type */}
          {step === 'type' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-900">
                  Quel type d&apos;organisation ?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Cette information aide à mieux catégoriser vos dépenses
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Goods supplier */}
                <button
                  type="button"
                  onClick={() => setProviderType('goods')}
                  className={cn(
                    'group relative flex flex-col items-center gap-4 rounded-2xl border-2 p-6 transition-all duration-200',
                    'hover:shadow-lg hover:scale-[1.02]',
                    providerType === 'goods'
                      ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/20'
                      : 'border-slate-200 bg-white hover:border-amber-300'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-16 w-16 items-center justify-center rounded-2xl transition-all',
                      providerType === 'goods'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-amber-100 text-amber-600 group-hover:bg-amber-200'
                    )}
                  >
                    <Package size={32} />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-900">
                      Fournisseur de biens
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Produits physiques, marchandises, équipements, matériaux
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      IKEA
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Leroy Merlin
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Amazon
                    </Badge>
                  </div>
                  {providerType === 'goods' && (
                    <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 shadow-lg">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </button>

                {/* Service provider */}
                <button
                  type="button"
                  onClick={() => setProviderType('services')}
                  className={cn(
                    'group relative flex flex-col items-center gap-4 rounded-2xl border-2 p-6 transition-all duration-200',
                    'hover:shadow-lg hover:scale-[1.02]',
                    providerType === 'services'
                      ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-16 w-16 items-center justify-center rounded-2xl transition-all',
                      providerType === 'services'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                    )}
                  >
                    <Settings size={32} />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-900">
                      Prestataire de services
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Abonnements, télécom, SaaS, conseil, assurances
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      Free
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      OVH
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Vercel
                    </Badge>
                  </div>
                  {providerType === 'services' && (
                    <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 shadow-lg">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Category */}
          {step === 'category' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-900">
                  Catégorie comptable
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Sélectionnez la catégorie pour classifier cette dépense
                </p>
              </div>
              <CategoryCardGrid
                value={category}
                onChange={setCategory}
                suggestedCategory={suggestedCategory}
              />
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-green-500 shadow-lg shadow-green-500/30">
                  <Sparkles size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Prêt à classifier !
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Vérifiez les informations ci-dessous
                </p>
              </div>

              {/* Summary card */}
              <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-500">
                        Libellé
                      </span>
                      <div className="mt-0.5 font-mono text-sm text-slate-900">
                        {label}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {transactionCount} transaction
                      {transactionCount > 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-xl',
                        providerType === 'services'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-amber-100 text-amber-600'
                      )}
                    >
                      {providerType === 'services' ? (
                        <Settings size={22} />
                      ) : (
                        <Package size={22} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-500">
                        Organisation
                      </div>
                      <div className="font-semibold text-slate-900">
                        {selectedOrg?.legal_name || newOrgName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {providerType === 'services'
                          ? 'Prestataire de services'
                          : 'Fournisseur de biens'}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                      📊
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-500">
                        Catégorie comptable
                      </div>
                      <div className="font-semibold text-slate-900">
                        {category && (
                          <>
                            {PCG_SUGGESTED_CATEGORIES.find(
                              c => c.code === category
                            )?.label || category}
                            <span className="ml-2 text-xs text-slate-400">
                              ({category})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all',
                    createRule
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={createRule}
                    onChange={e => setCreateRule(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-slate-900">
                      Créer une règle automatique
                    </div>
                    <div className="mt-0.5 text-sm text-slate-500">
                      Les futures transactions &quot;{label}&quot; seront
                      classées automatiquement
                    </div>
                  </div>
                </label>

                {createRule && (
                  <label
                    className={cn(
                      'ml-6 flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all animate-in fade-in slide-in-from-top-2',
                      applyToHistory
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={applyToHistory}
                      onChange={e => setApplyToHistory(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-slate-300 text-green-500 focus:ring-green-500"
                    />
                    <div>
                      <div className="font-medium text-slate-900">
                        Appliquer aux transactions existantes
                      </div>
                      <div className="mt-0.5 text-sm text-slate-500">
                        {transactionCount > 0
                          ? `${transactionCount} transaction${transactionCount > 1 ? 's' : ''} sera${transactionCount > 1 ? 'ont' : ''} classée${transactionCount > 1 ? 's' : ''} immédiatement`
                          : 'Classer les transactions existantes avec ce libellé'}
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex justify-between border-t bg-slate-50/50 px-6 py-4">
          {step !== 'who' ? (
            <Button
              variant="outline"
              onClick={goBack}
              disabled={isSubmitting}
              className="gap-2"
            >
              <ArrowLeft size={16} />
              Retour
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-500 hover:text-slate-900"
            >
              Annuler
            </Button>
          )}

          {step === 'confirm' ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canGoNext()}
              className="gap-2 bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/30 hover:from-green-600 hover:to-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Confirmer et classer
                </>
              )}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canGoNext()} className="gap-2">
              Suivant
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
