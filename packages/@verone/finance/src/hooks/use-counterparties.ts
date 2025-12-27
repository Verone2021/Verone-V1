/**
 * Hook pour la gestion des counterparties (identités uniques)
 *
 * NOTE: La table counterparties est DEPRECATED.
 * Ce hook retourne maintenant des données vides pour éviter les erreurs.
 * Utiliser OrganisationLinkingModal à la place pour lier des organisations.
 */

'use client';

import { useCallback, useState } from 'react';

// Table counterparties deprecated - ce hook est désactivé
const COUNTERPARTIES_DEPRECATED = true;

export interface Counterparty {
  id: string;
  display_name: string;
  name_normalized: string;
  vat_number: string | null;
  siren: string | null;
  created_at: string;
  updated_at: string;
}

export interface CounterpartyBankAccount {
  id: string;
  counterparty_id: string;
  iban: string;
  bic: string | null;
  label: string | null;
  created_at: string;
}

export interface CounterpartyWithBankAccounts extends Counterparty {
  bank_accounts: CounterpartyBankAccount[];
}

export interface CreateCounterpartyData {
  display_name: string;
  vat_number?: string;
  siren?: string;
  iban?: string;
  bic?: string;
}

export interface UseCounterpartiesReturn {
  counterparties: Counterparty[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<Counterparty[]>;
  create: (data: CreateCounterpartyData) => Promise<Counterparty | null>;
  getWithBankAccounts: (
    id: string
  ) => Promise<CounterpartyWithBankAccounts | null>;
  refetch: () => Promise<void>;
}

export function useCounterparties(): UseCounterpartiesReturn {
  const [counterparties] = useState<Counterparty[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  // Table deprecated - retourne toujours vide
  const fetchCounterparties = useCallback(async () => {
    if (COUNTERPARTIES_DEPRECATED) {
      console.warn(
        '[useCounterparties] Table deprecated - use OrganisationLinkingModal instead'
      );
      return;
    }
  }, []);

  const search = useCallback(
    async (_query: string): Promise<Counterparty[]> => {
      if (COUNTERPARTIES_DEPRECATED) {
        return [];
      }
      return [];
    },
    []
  );

  const create = useCallback(
    async (_data: CreateCounterpartyData): Promise<Counterparty | null> => {
      if (COUNTERPARTIES_DEPRECATED) {
        console.warn(
          '[useCounterparties] Table deprecated - use OrganisationLinkingModal instead'
        );
        return null;
      }
      return null;
    },
    []
  );

  const getWithBankAccounts = useCallback(
    async (_id: string): Promise<CounterpartyWithBankAccounts | null> => {
      if (COUNTERPARTIES_DEPRECATED) {
        return null;
      }
      return null;
    },
    []
  );

  return {
    counterparties,
    isLoading,
    error,
    search,
    create,
    getWithBankAccounts,
    refetch: fetchCounterparties,
  };
}
