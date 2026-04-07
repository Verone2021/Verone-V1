'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import { useMatchingRules } from '../../hooks/use-matching-rules';
import { createCounterparty, linkTransactionsAndRule } from './actions';
import type {
  CounterpartyType,
  IExistingRule,
  IOrganisationLinkingModalProps,
  ISelectedCounterparty,
} from './types';

export interface IUseOrganisationLinkingModalReturn {
  // State
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: ISelectedCounterparty[];
  selectedCounterparty: ISelectedCounterparty | null;
  setSelectedCounterparty: (c: ISelectedCounterparty | null) => void;
  isCreatingNew: boolean;
  setIsCreatingNew: (v: boolean) => void;
  newName: string;
  setNewName: (n: string) => void;
  newEmail: string;
  setNewEmail: (e: string) => void;
  counterpartyType: CounterpartyType;
  setCounterpartyType: (t: CounterpartyType) => void;
  isLoading: boolean;
  isSubmitting: boolean;
  createRule: boolean;
  setCreateRule: (v: boolean) => void;
  existingRule: IExistingRule | null;
  // Derived
  canSubmit: boolean;
  isCredit: boolean;
  // Handlers
  handleSubmit: () => Promise<void>;
  formatAmount: (amount: number) => string;
}

export function useOrganisationLinkingModal({
  open,
  label,
  transactionSide = 'debit',
  onSuccess,
  onOpenChange,
}: Pick<
  IOrganisationLinkingModalProps,
  'open' | 'label' | 'transactionSide' | 'onSuccess' | 'onOpenChange'
>): IUseOrganisationLinkingModalReturn {
  const isCredit = transactionSide === 'credit';

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
  const [createRule, setCreateRule] = useState<boolean>(false);
  const [existingRule, setExistingRule] = useState<IExistingRule | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    rules,
    create: createMatchingRule,
    update: updateMatchingRule,
  } = useMatchingRules();

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
        individual_customer_id: matchingRule.individual_customer_id,
        counterparty_type: matchingRule.counterparty_type,
      });
    } else {
      setExistingRule(null);
    }
  }, [open, label, rules]);

  // Search counterparties via Supabase
  const searchCounterparties = useCallback(
    async (query: string, signal?: AbortSignal): Promise<void> => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const supabase = createClient();
        const results: ISelectedCounterparty[] = [];

        if (counterpartyType === 'individual') {
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
            ...(data ?? []).map(
              (c: {
                id: string;
                first_name: string;
                last_name: string;
                email: string | null;
              }) => ({
                id: c.id,
                name: `${c.first_name} ${c.last_name}`,
                type: 'individual' as CounterpartyType,
                isOrganisation: false,
              })
            )
          );
        } else {
          const orgType: string =
            counterpartyType === 'customer_pro'
              ? 'customer'
              : 'supplier,partner';

          const { data, error } = await supabase
            .rpc('search_organisations_unaccent', {
              p_query: query,
              p_type: orgType,
            })
            .abortSignal(signal as AbortSignal);

          if (error) throw error;

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
        if (err instanceof Error && err.name === 'AbortError') return;
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[OrganisationLinkingModal] Search failed:',
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

  // Debounced search
  useEffect(() => {
    if (!open) return;

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

  // Re-search on type change
  useEffect(() => {
    if (!open) return;

    if (searchQuery && searchQuery.trim().length >= 2) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      void searchCounterparties(
        searchQuery,
        abortControllerRef.current?.signal
      );
    }
    setSelectedCounterparty(null);
    setIsCreatingNew(false);
  }, [open, counterpartyType, searchQuery, searchCounterparties]);

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      let counterpartyToUse: ISelectedCounterparty | null =
        selectedCounterparty;

      if (isCreatingNew && !selectedCounterparty) {
        counterpartyToUse = await createCounterparty({
          counterpartyType,
          newName,
          newEmail,
        });
        if (!counterpartyToUse) {
          throw new Error('Erreur lors de la création');
        }
      }

      if (!counterpartyToUse) {
        throw new Error('Aucune contrepartie sélectionnée');
      }

      await linkTransactionsAndRule({
        label,
        counterpartyToUse,
        createRule,
        existingRuleId: existingRule?.id,
        rules,
        updateMatchingRule,
        createMatchingRule,
      });

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

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedCounterparty,
    setSelectedCounterparty,
    isCreatingNew,
    setIsCreatingNew,
    newName,
    setNewName,
    newEmail,
    setNewEmail,
    counterpartyType,
    setCounterpartyType,
    isLoading,
    isSubmitting,
    createRule,
    setCreateRule,
    existingRule,
    canSubmit,
    isCredit,
    handleSubmit,
    formatAmount,
  };
}
