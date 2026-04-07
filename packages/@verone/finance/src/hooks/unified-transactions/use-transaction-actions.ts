/* eslint-disable @typescript-eslint/no-unsafe-call */
// =====================================================================
// Hook: useTransactionActions
// 6 mutations: classify, linkOrganisation, ignore, unignore,
//              toggleIgnore (RPC), markCCA
// =====================================================================

import { useCallback, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { TransactionActions } from './types';

export function useTransactionActions(): TransactionActions {
  const supabase = useMemo(() => createClient(), []);

  const classify = useCallback(
    async (transactionId: string, categoryPcg: string) => {
      try {
        const { error } = await supabase
          .from('bank_transactions')
          .update({
            category_pcg: categoryPcg,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [supabase]
  );

  const linkOrganisation = useCallback(
    async (transactionId: string, organisationId: string) => {
      try {
        const { error } = await supabase
          .from('bank_transactions')
          .update({
            counterparty_organisation_id: organisationId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [supabase]
  );

  const ignore = useCallback(
    async (transactionId: string, reason?: string) => {
      try {
        const { error } = await supabase
          .from('bank_transactions')
          .update({
            matching_status: 'ignored',
            match_reason: reason ?? 'Ignore manuellement',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [supabase]
  );

  const unignore = useCallback(
    async (transactionId: string) => {
      try {
        const { error } = await supabase
          .from('bank_transactions')
          .update({
            matching_status: 'unmatched',
            match_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [supabase]
  );

  // Toggle ignore using RPC (with fiscal year lock check)
  // Uses RPC to ensure fiscal lock is enforced server-side
  const toggleIgnore = useCallback(
    async (transactionId: string, shouldIgnore: boolean, reason?: string) => {
      try {
        // Use standard Supabase RPC call pattern with type assertion
        const { data, error } = (await (supabase.rpc as CallableFunction)(
          'toggle_ignore_transaction',
          {
            p_tx_id: transactionId,
            p_ignore: shouldIgnore,
            p_reason: reason ?? null,
          }
        )) as { data: unknown; error: { message: string } | null };

        if (error) {
          // Check for fiscal year lock error
          const errorMsg = error.message ?? String(error);
          if (errorMsg.includes('clôturée')) {
            return {
              success: false,
              error: errorMsg,
              isLocked: true,
            };
          }
          throw new Error(errorMsg);
        }

        const result = data as { success?: boolean } | null;
        return { success: result?.success ?? true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        // Check for fiscal year lock error
        if (errorMessage.includes('clôturée')) {
          return {
            success: false,
            error: errorMessage,
            isLocked: true,
          };
        }
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [supabase]
  );

  const markCCA = useCallback(
    async (transactionId: string) => {
      try {
        const { error } = await supabase
          .from('bank_transactions')
          .update({
            category_pcg: '455',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [supabase]
  );

  return {
    classify,
    linkOrganisation,
    ignore,
    unignore,
    toggleIgnore,
    markCCA,
  };
}
