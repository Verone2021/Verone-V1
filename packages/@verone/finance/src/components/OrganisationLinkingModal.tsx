'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  User,
  Briefcase,
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

interface IIndividualCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface IExistingRule {
  id: string;
  match_value: string;
  match_patterns: string[] | null;
  default_category: string | null;
  organisation_id: string | null;
  individual_customer_id?: string | null;
  counterparty_type?: string | null;
}

interface IOrganisationLinkingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  transactionCount?: number;
  totalAmount?: number;
  onSuccess?: () => void;
  /** Transaction side determines which counterparty types to show */
  transactionSide?: 'credit' | 'debit';
}

// Counterparty types
// For debit: supplier (fournisseur de biens) or partner (prestataire de services)
// For credit: individual (client particulier B2C) or customer_pro (client professionnel B2B)
type CounterpartyType = 'supplier' | 'partner' | 'individual' | 'customer_pro';

// Unified counterparty (can be organisation OR individual customer)
interface ISelectedCounterparty {
  id: string;
  name: string;
  type: CounterpartyType;
  isOrganisation: boolean;
}

export function OrganisationLinkingModal({
  open,
  onOpenChange,
  label,
  transactionCount = 0,
  totalAmount = 0,
  onSuccess,
  transactionSide = 'debit',
}: IOrganisationLinkingModalProps): React.JSX.Element {
  const isCredit = transactionSide === 'credit';

  // State
  const [searchQuery, setSearchQuery] = useState<string>(label);
  const [searchResults, setSearchResults] = useState<ISelectedCounterparty[]>(
    []
  );
  const [selectedCounterparty, setSelectedCounterparty] =
    useState<ISelectedCounterparty | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>(label);
  const [newEmail, setNewEmail] = useState<string>('');
  const [counterpartyType, setCounterpartyType] = useState<CounterpartyType>(
    isCredit ? 'customer_pro' : 'partner'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // SLICE 2: Par défaut, on ne crée plus de règle automatiquement
  const [createRule, setCreateRule] = useState<boolean>(false);
  const [existingRule, setExistingRule] = useState<IExistingRule | null>(null);

  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    rules,
    create: createMatchingRule,
    update: updateMatchingRule,
  } = useMatchingRules();

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
      setSearchResults([]);
      setSelectedCounterparty(null);
      setIsCreatingNew(false);
      setNewName(label);
      setNewEmail('');
      setCounterpartyType(isCredit ? 'customer_pro' : 'partner');
      // SLICE 2: createRule décochée par défaut (sauf si règle existante)
      setCreateRule(false);
      setExistingRule(null);
    }
  }, [open, label, isCredit]);

  // Detect existing rules for this label
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
        match_patterns: matchingRule.match_patterns ?? null,
        default_category: matchingRule.default_category,
        organisation_id: matchingRule.organisation_id,
        individual_customer_id: (matchingRule as any).individual_customer_id,
        counterparty_type: (matchingRule as any).counterparty_type,
      });
    } else {
      setExistingRule(null);
    }
  }, [open, label, rules]);

  // Search based on counterparty type
  const searchCounterparties = useCallback(
    async (query: string, signal?: AbortSignal): Promise<void> => {
      // Guard: skip if query is empty or too short
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const supabase = createClient();
        const results: ISelectedCounterparty[] = [];

        if (counterpartyType === 'individual') {
          // Search in individual_customers table
          const { data, error } = await supabase
            .from('individual_customers')
            .select('id, first_name, last_name, email')
            .or(
              `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
            )
            .eq('is_active', true)
            .order('first_name')
            .limit(8)
            .abortSignal(signal as AbortSignal);

          if (error) throw error;

          results.push(
            ...(data ?? []).map((c: IIndividualCustomer) => ({
              id: c.id,
              name: `${c.first_name} ${c.last_name}`,
              type: 'individual' as CounterpartyType,
              isOrganisation: false,
            }))
          );
        } else {
          // Search in organisations table using unaccent RPC
          // Permet de trouver "AMÉRICO" en cherchant "americo"
          const orgType: 'customer' | 'supplier' =
            counterpartyType === 'customer_pro' ? 'customer' : 'supplier';

          const { data, error } = await supabase
            .rpc('search_organisations_unaccent', {
              p_query: query,
              p_type: orgType,
            })
            .abortSignal(signal as AbortSignal);

          if (error) throw error;

          // Mapper les résultats (le type est retourné par la RPC)
          results.push(
            ...(data ?? []).map(
              (org: {
                id: string;
                legal_name: string;
                type: string;
                is_service_provider: boolean;
              }) => ({
                id: org.id,
                name: org.legal_name,
                // Utiliser le type RÉEL de l'organisation, pas celui sélectionné dans les boutons
                type: org.is_service_provider
                  ? ('partner' as CounterpartyType)
                  : ('supplier' as CounterpartyType),
                isOrganisation: true,
              })
            )
          );
        }

        setSearchResults(results);
      } catch (err: unknown) {
        // Silently ignore AbortError (request was cancelled intentionally)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // For network errors, use warn instead of error to avoid Next.js dev overlay
        // These are expected errors (connectivity issues, etc.)
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[OrganisationLinkingModal] Search failed (network):',
            err instanceof Error ? err.message : 'Unknown error'
          );
        }
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [counterpartyType]
  );

  // Debounced search - ONLY when modal is open
  useEffect(() => {
    // Guard: don't search if modal is closed
    if (!open) {
      return;
    }

    // Cancel any previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const timer = setTimeout(() => {
      void searchCounterparties(
        searchQuery,
        abortControllerRef.current?.signal
      );
    }, 300);

    return () => {
      clearTimeout(timer);
      abortControllerRef.current?.abort();
    };
  }, [open, searchQuery, searchCounterparties]);

  // Re-search when counterparty type changes - ONLY when modal is open
  useEffect(() => {
    // Guard: don't search if modal is closed
    if (!open) {
      return;
    }

    if (searchQuery && searchQuery.trim().length >= 2) {
      // Cancel previous and start new search
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      void searchCounterparties(
        searchQuery,
        abortControllerRef.current?.signal
      );
    }
    // Also reset selection when type changes
    setSelectedCounterparty(null);
    setIsCreatingNew(false);
  }, [open, counterpartyType, searchQuery, searchCounterparties]);

  // Handle counterparty creation
  const handleCreateCounterparty =
    async (): Promise<ISelectedCounterparty | null> => {
      if (!newName.trim()) return null;

      try {
        const supabase = createClient();

        if (counterpartyType === 'individual') {
          // Create in individual_customers
          // Parse name into first/last
          const nameParts = newName.trim().split(' ');
          const firstName = nameParts[0] || newName.trim();
          const lastName = nameParts.slice(1).join(' ') || '';

          // Email is required for individual_customers
          const email =
            newEmail.trim() ||
            `${firstName.toLowerCase()}.${lastName.toLowerCase() || 'client'}@placeholder.com`;

          const { data, error } = await supabase
            .from('individual_customers')
            .insert({
              first_name: firstName,
              last_name: lastName || firstName,
              email: email,
              is_active: true,
            })
            .select('id, first_name, last_name')
            .single();

          if (error) throw error;

          return {
            id: data.id,
            name: `${data.first_name} ${data.last_name}`,
            type: 'individual',
            isOrganisation: false,
          };
        } else {
          // Create in organisations
          let orgType: 'customer' | 'supplier';
          let isServiceProvider: boolean;

          if (counterpartyType === 'customer_pro') {
            orgType = 'customer';
            isServiceProvider = false;
          } else if (counterpartyType === 'supplier') {
            orgType = 'supplier';
            isServiceProvider = false;
          } else {
            // partner
            orgType = 'supplier';
            isServiceProvider = true;
          }

          const { data, error } = await supabase
            .from('organisations')
            .insert({
              legal_name: newName.trim(),
              type: orgType,
              is_service_provider: isServiceProvider,
              is_active: true,
              source: 'transaction_linking' as const,
            })
            .select('id, legal_name, type, is_service_provider')
            .single();

          if (error) throw error;

          return {
            id: data.id,
            name: data.legal_name,
            type: counterpartyType,
            isOrganisation: true,
          };
        }
      } catch (err) {
        // Use warn to avoid Next.js dev overlay for network errors
        console.warn(
          '[OrganisationLinkingModal] Create failed:',
          err instanceof Error ? err.message : err
        );
        return null;
      }
    };

  // Handle final submission
  // AUTO-PATTERN: Si l'organisation a déjà une règle → ajoute le label aux patterns
  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      let counterpartyToUse: ISelectedCounterparty | null =
        selectedCounterparty;

      // Create new counterparty if needed
      if (isCreatingNew && !selectedCounterparty) {
        counterpartyToUse = await handleCreateCounterparty();
        if (!counterpartyToUse) {
          throw new Error('Erreur lors de la création');
        }
      }

      if (!counterpartyToUse) {
        throw new Error('Aucune contrepartie sélectionnée');
      }

      const supabase = createClient();
      const isIndividual = counterpartyToUse.type === 'individual';

      // Mise à jour directe des transactions correspondant au label
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({
          counterparty_organisation_id: isIndividual
            ? null
            : counterpartyToUse.id,
          updated_at: new Date().toISOString(),
        })
        .ilike('counterparty_name', `%${label}%`);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // AUTO-PATTERN: Chercher si cette organisation a déjà une règle
      const orgRuleFromOrg = !isIndividual
        ? rules.find(r => r.organisation_id === counterpartyToUse.id)
        : null;

      if (orgRuleFromOrg) {
        // L'organisation a déjà une règle → ajouter ce label aux patterns
        const currentPatterns = orgRuleFromOrg.match_patterns ?? [
          orgRuleFromOrg.match_value,
        ];
        const normalizedLabel = label.trim();

        // Vérifier si le pattern n'existe pas déjà (case-insensitive)
        const patternExists = currentPatterns.some(
          p => p.toLowerCase() === normalizedLabel.toLowerCase()
        );

        if (!patternExists) {
          const newPatterns = [...currentPatterns, normalizedLabel];
          await updateMatchingRule(orgRuleFromOrg.id, {
            match_patterns: newPatterns,
          } as any);

          // Auto-sync: appliquer la règle aux transactions
          await supabase.rpc('apply_rule_to_all_matching', {
            p_rule_id: orgRuleFromOrg.id,
          });
        }
      } else if (createRule) {
        // Pas de règle existante → créer une nouvelle règle si demandé
        const dbCounterpartyType = isIndividual ? 'individual' : 'organisation';
        const ruleRoleType =
          counterpartyToUse.type === 'customer_pro'
            ? 'customer'
            : counterpartyToUse.type === 'individual'
              ? 'customer'
              : counterpartyToUse.type;

        if (existingRule) {
          // UPDATE existing rule (même label)
          await updateMatchingRule(existingRule.id, {
            organisation_id: isIndividual ? null : counterpartyToUse.id,
            individual_customer_id: isIndividual ? counterpartyToUse.id : null,
            counterparty_type: dbCounterpartyType,
            default_role_type: ruleRoleType,
          } as any);
        } else {
          // CREATE new rule
          await createMatchingRule({
            match_type: 'label_contains',
            match_value: label,
            match_patterns: [label],
            organisation_id: isIndividual ? null : counterpartyToUse.id,
            individual_customer_id: isIndividual ? counterpartyToUse.id : null,
            counterparty_type: dbCounterpartyType,
            default_category: null,
            default_role_type: ruleRoleType,
            priority: 100,
          } as any);
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.warn(
        '[OrganisationLinkingModal] Submit failed:',
        err instanceof Error ? err.message : err
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(
    selectedCounterparty ??
      (isCreatingNew &&
        newName.trim() &&
        (counterpartyType !== 'individual' || newEmail.trim()))
  );

  // Get category label
  const categoryLabel = existingRule?.default_category
    ? (getPcgCategory(existingRule.default_category)?.label ??
      existingRule.default_category)
    : null;

  // Get icon and label for selected counterparty type
  const getTypeInfo = (type: CounterpartyType) => {
    switch (type) {
      case 'individual':
        return { icon: User, label: 'Client particulier', color: 'green' };
      case 'customer_pro':
        return {
          icon: Briefcase,
          label: 'Client professionnel',
          color: 'blue',
        };
      case 'supplier':
        return { icon: Package, label: 'Fournisseur', color: 'amber' };
      case 'partner':
        return { icon: Settings, label: 'Prestataire', color: 'blue' };
    }
  };

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
              {isCredit ? 'Associer à un client' : 'Associer à un fournisseur'}
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

          {/* SLICE 6: Banner bloquant si organisation gérée par règle */}
          {existingRule?.organisation_id ? (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-amber-600"
              />
              <div className="text-sm">
                <p className="font-medium text-amber-900">
                  Organisation verrouillée par règle
                </p>
                <p className="mt-0.5 text-amber-700">
                  Cette transaction est gérée automatiquement. Pour modifier
                  l&apos;organisation, modifiez la règle depuis la page Règles.
                </p>
              </div>
            </div>
          ) : existingRule ? (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">
                  Règle existante détectée
                </p>
                <p className="mt-0.5 text-blue-700">
                  {categoryLabel
                    ? `Catégorie: ${categoryLabel}`
                    : 'Sans catégorie'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Info size={18} className="mt-0.5 shrink-0 text-slate-500" />
              <div className="text-sm">
                <p className="font-medium text-slate-700">Liaison directe</p>
                <p className="mt-0.5 text-slate-500">
                  Les transactions existantes seront liées à l&apos;organisation
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-6 px-6 py-6">
          {/* 1. Type selection - MASQUÉ si organisation existante sélectionnée */}
          {/* Les boutons Type ne servent que pour la CRÉATION d'une nouvelle organisation */}
          {!selectedCounterparty && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {isCredit ? (
                  <>
                    {/* CREDIT: Client particulier (B2C) / Client professionnel (B2B) */}
                    <button
                      type="button"
                      onClick={() => setCounterpartyType('individual')}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                        counterpartyType === 'individual'
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          counterpartyType === 'individual'
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        <User size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">Client</div>
                        <div className="text-xs text-slate-500">
                          particulier (B2C)
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCounterpartyType('customer_pro')}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                        counterpartyType === 'customer_pro'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          counterpartyType === 'customer_pro'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        <Briefcase size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">Client</div>
                        <div className="text-xs text-slate-500">
                          professionnel (B2B)
                        </div>
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    {/* DEBIT: Fournisseur / Prestataire */}
                    <button
                      type="button"
                      onClick={() => setCounterpartyType('supplier')}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                        counterpartyType === 'supplier'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          counterpartyType === 'supplier'
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
                      onClick={() => setCounterpartyType('partner')}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
                        counterpartyType === 'partner'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          counterpartyType === 'partner'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        <Settings size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">Prestataire</div>
                        <div className="text-xs text-slate-500">
                          de services
                        </div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2. Search / Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Search size={16} className="text-slate-400" />
              {counterpartyType === 'individual'
                ? 'Client particulier'
                : counterpartyType === 'customer_pro'
                  ? 'Organisation cliente'
                  : 'Organisation'}
            </Label>

            {/* Selected counterparty display */}
            {selectedCounterparty && (
              <div className="flex items-center justify-between rounded-xl border-2 border-blue-500 bg-blue-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                    {selectedCounterparty.isOrganisation ? (
                      <Building2 size={20} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">
                      {selectedCounterparty.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {getTypeInfo(selectedCounterparty.type).label}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCounterparty(null)}
                  className="rounded-full p-1 hover:bg-blue-100"
                >
                  <X size={16} className="text-blue-600" />
                </button>
              </div>
            )}

            {/* Search input - hidden when selected */}
            {!selectedCounterparty && (
              <>
                <div className="relative">
                  <Input
                    placeholder={
                      counterpartyType === 'individual'
                        ? 'Rechercher un client particulier...'
                        : 'Rechercher une organisation...'
                    }
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-11 pl-4 pr-10"
                  />
                  {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {searchResults.map(result => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => {
                          setSelectedCounterparty(result);
                          setIsCreatingNew(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50"
                      >
                        {result.isOrganisation ? (
                          <Building2 size={16} className="text-slate-400" />
                        ) : (
                          <User size={16} className="text-slate-400" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {result.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {getTypeInfo(result.type).label}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results / Create new */}
                {!isLoading &&
                  searchQuery.length > 0 &&
                  searchResults.length === 0 && (
                    <div className="space-y-3">
                      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 py-4 text-center">
                        <p className="text-sm text-slate-500">
                          Aucun résultat trouvé
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNew(true);
                          setNewName(searchQuery);
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
                            {counterpartyType === 'individual'
                              ? 'Nouveau client particulier'
                              : 'Nouvelle organisation'}
                          </div>
                        </div>
                        {isCreatingNew && (
                          <Check size={16} className="text-green-600" />
                        )}
                      </button>
                    </div>
                  )}

                {/* New counterparty form */}
                {isCreatingNew && (
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <Input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder={
                        counterpartyType === 'individual'
                          ? 'Prénom Nom'
                          : "Nom de l'organisation"
                      }
                      className="h-11"
                      autoFocus
                    />
                    {counterpartyType === 'individual' && (
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="Email (obligatoire)"
                        className="h-11"
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 3. SLICE 2: Créer une règle (optionnel, décoché par défaut) */}
          <label
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all',
              createRule
                ? 'border-amber-500 bg-amber-50'
                : 'border-slate-200 hover:bg-slate-50'
            )}
          >
            <input
              type="checkbox"
              checked={createRule}
              onChange={e => setCreateRule(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-amber-500"
            />
            <div className="flex-1">
              <div className="text-sm font-medium flex items-center gap-2">
                <Settings size={14} className="text-amber-500" />
                Créer une règle automatique
              </div>
              <div className="text-xs text-slate-500">
                Les futures transactions avec ce libellé seront automatiquement
                liées
              </div>
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
            disabled={
              isSubmitting ||
              !canSubmit ||
              Boolean(existingRule?.organisation_id)
            }
            className="gap-2 bg-blue-500 hover:bg-blue-600"
            title={
              existingRule?.organisation_id
                ? 'Organisation verrouillée par règle'
                : undefined
            }
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
