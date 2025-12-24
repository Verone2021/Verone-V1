/**
 * Hook pour la gestion des counterparties (identités uniques)
 *
 * Récupère et crée des counterparties avec leurs comptes bancaires.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

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
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounterparties = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: fetchError } = await (
        supabase as { from: CallableFunction }
      )
        .from('counterparties')
        .select('*')
        .order('display_name', { ascending: true })
        .limit(500);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setCounterparties((data || []) as Counterparty[]);
    } catch (err) {
      console.error('[useCounterparties] Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const search = useCallback(async (query: string): Promise<Counterparty[]> => {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const supabase = createClient();

      const { data, error: searchError } = await (
        supabase as { from: CallableFunction }
      )
        .from('counterparties')
        .select('*')
        .or(`display_name.ilike.%${query}%,name_normalized.ilike.%${query}%`)
        .order('display_name', { ascending: true })
        .limit(20);

      if (searchError) {
        throw new Error(searchError.message);
      }

      return (data || []) as Counterparty[];
    } catch (err) {
      console.error('[useCounterparties] Search error:', err);
      return [];
    }
  }, []);

  const create = useCallback(
    async (data: CreateCounterpartyData): Promise<Counterparty | null> => {
      try {
        const supabase = createClient();

        // Créer la counterparty
        const { data: newCounterparty, error: createError } = await (
          supabase as { from: CallableFunction }
        )
          .from('counterparties')
          .insert({
            display_name: data.display_name,
            name_normalized: data.display_name.toLowerCase().trim(),
            vat_number: data.vat_number || null,
            siren: data.siren || null,
          })
          .select()
          .single();

        if (createError) {
          throw new Error(createError.message);
        }

        const counterparty = newCounterparty as Counterparty;

        // Si un IBAN est fourni, créer le compte bancaire
        if (data.iban) {
          const { error: bankError } = await (
            supabase as { from: CallableFunction }
          )
            .from('counterparty_bank_accounts')
            .insert({
              counterparty_id: counterparty.id,
              iban: data.iban.replace(/\s/g, '').toUpperCase(),
              bic: data.bic || null,
              label: 'Compte principal',
            });

          if (bankError) {
            console.error(
              '[useCounterparties] Error creating bank account:',
              bankError
            );
            // On ne fait pas échouer la création de counterparty
          }
        }

        // Rafraîchir la liste
        await fetchCounterparties();

        return counterparty;
      } catch (err) {
        console.error('[useCounterparties] Create error:', err);
        throw err;
      }
    },
    [fetchCounterparties]
  );

  const getWithBankAccounts = useCallback(
    async (id: string): Promise<CounterpartyWithBankAccounts | null> => {
      try {
        const supabase = createClient();

        // Récupérer la counterparty
        const { data: counterparty, error: counterpartyError } = await (
          supabase as { from: CallableFunction }
        )
          .from('counterparties')
          .select('*')
          .eq('id', id)
          .single();

        if (counterpartyError) {
          throw new Error(counterpartyError.message);
        }

        // Récupérer les comptes bancaires
        const { data: bankAccounts, error: bankError } = await (
          supabase as { from: CallableFunction }
        )
          .from('counterparty_bank_accounts')
          .select('*')
          .eq('counterparty_id', id);

        if (bankError) {
          console.error(
            '[useCounterparties] Error fetching bank accounts:',
            bankError
          );
        }

        return {
          ...(counterparty as Counterparty),
          bank_accounts: (bankAccounts || []) as CounterpartyBankAccount[],
        };
      } catch (err) {
        console.error('[useCounterparties] GetWithBankAccounts error:', err);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    fetchCounterparties();
  }, [fetchCounterparties]);

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
