'use client';

/**
 * [BO-FIN-RECON-AUTO-001]
 * InvoiceReconciliationSuggestionsPanel
 *
 * Panneau proactif affiché en haut de l'onglet Factures.
 * Si aucune suggestion → return null (pas de bandeau vide).
 * Si N suggestions → encart ambre avec une ligne par suggestion.
 *
 * Chaque ligne : « Valider » (appel RPC link_transaction_to_document)
 * ou « Ignorer » (retire localement sans DB).
 */

import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { Sparkles, CheckCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import type { ReconciliationSuggestion } from '../../hooks/use-invoice-reconciliation-suggestions';
import { useInvoiceReconciliationSuggestions } from '../../hooks/use-invoice-reconciliation-suggestions';
import { SuggestionRow } from './SuggestionRow';

export function InvoiceReconciliationSuggestionsPanel() {
  const { suggestions, isLoading, error, refetch } =
    useInvoiceReconciliationSuggestions();

  // IDs de factures ignorées localement (pas de persistance DB)
  const [ignoredInvoiceIds, setIgnoredInvoiceIds] = useState<Set<string>>(
    new Set()
  );
  const [validatingInvoiceId, setValidatingInvoiceId] = useState<string | null>(
    null
  );
  const [isValidatingAll, setIsValidatingAll] = useState(false);

  const queryClient = useQueryClient();
  const supabase = createClient();

  // Suggestions visibles (non ignorées)
  const visible = suggestions.filter(s => !ignoredInvoiceIds.has(s.invoice.id));

  // Uniquement les "excellent" pour le bouton "Tout valider"
  const excellentSuggestions = visible.filter(s => s.priority === 'excellent');

  // Aucune suggestion visible → pas de panneau
  if (!isLoading && visible.length === 0 && !error) return null;

  const handleValidate = async (
    suggestion: ReconciliationSuggestion
  ): Promise<void> => {
    setValidatingInvoiceId(suggestion.invoice.id);
    try {
      const allocatedAmount = Math.abs(suggestion.transaction.amount);

      const { error: rpcError } = await supabase.rpc(
        'link_transaction_to_document',
        {
          p_transaction_id: suggestion.transaction.id,
          p_document_id: suggestion.invoice.id,
          p_allocated_amount: allocatedAmount,
        }
      );

      if (rpcError) throw rpcError;

      // Retirer de la liste visible
      setIgnoredInvoiceIds(prev => new Set([...prev, suggestion.invoice.id]));

      // Invalider les caches concernés
      await queryClient.invalidateQueries({ queryKey: ['invoices', 'list'] });

      toast.success(
        `Rapprochement validé — ${suggestion.invoice.document_number} · ${formatCurrency(allocatedAmount)}`
      );
    } catch (err: unknown) {
      console.error(
        '[InvoiceReconciliationSuggestionsPanel] Validate error:',
        err
      );
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors du rapprochement'
      );
    } finally {
      setValidatingInvoiceId(null);
    }
  };

  const handleIgnore = (invoiceId: string): void => {
    setIgnoredInvoiceIds(prev => new Set([...prev, invoiceId]));
  };

  const handleValidateAll = (): void => {
    if (excellentSuggestions.length === 0) return;
    setIsValidatingAll(true);
    void (async () => {
      let successCount = 0;
      for (const suggestion of excellentSuggestions) {
        try {
          const allocatedAmount = Math.abs(suggestion.transaction.amount);
          const { error: rpcError } = await supabase.rpc(
            'link_transaction_to_document',
            {
              p_transaction_id: suggestion.transaction.id,
              p_document_id: suggestion.invoice.id,
              p_allocated_amount: allocatedAmount,
            }
          );
          if (rpcError) throw rpcError;
          setIgnoredInvoiceIds(
            prev => new Set([...prev, suggestion.invoice.id])
          );
          successCount++;
        } catch (err: unknown) {
          console.error(
            '[InvoiceReconciliationSuggestionsPanel] ValidateAll error:',
            err
          );
          toast.error(
            `Erreur sur ${suggestion.invoice.document_number}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
          );
        }
      }
      if (successCount > 0) {
        await queryClient.invalidateQueries({ queryKey: ['invoices', 'list'] });
        toast.success(
          `${successCount.toString()} rapprochement${successCount > 1 ? 's' : ''} validé${successCount > 1 ? 's' : ''}`
        );
      }
      setIsValidatingAll(false);
    })();
  };

  const isAnyValidating = validatingInvoiceId !== null || isValidatingAll;

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      {/* En-tête */}
      <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm font-semibold text-amber-900">
            {isLoading
              ? 'Analyse des virements en cours…'
              : `Rapprochements suggérés (${visible.length.toString()})`}
          </span>
          {isLoading && (
            <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin" />
          )}
        </div>

        {/* Bouton "Tout valider" — uniquement pour les matches "excellent" */}
        {!isLoading && excellentSuggestions.length > 1 && !isAnyValidating && (
          <button
            type="button"
            onClick={handleValidateAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors self-start sm:self-auto h-9"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Tout valider ({excellentSuggestions.length.toString()} matchs forts)
          </button>
        )}

        {/* Bouton rafraîchir discret */}
        {!isLoading && !error && (
          <button
            type="button"
            onClick={refetch}
            className="text-xs text-amber-600 hover:text-amber-800 underline-offset-2 hover:underline hidden sm:block"
          >
            Rafraîchir
          </button>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-sm text-red-600 mb-2">
          Impossible de charger les suggestions ({error}).{' '}
          <button
            type="button"
            onClick={refetch}
            className="underline hover:no-underline"
          >
            Réessayer
          </button>
        </p>
      )}

      {/* Liste des suggestions */}
      {!isLoading && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map(suggestion => (
            <SuggestionRow
              key={suggestion.invoice.id}
              suggestion={suggestion}
              isValidating={
                validatingInvoiceId === suggestion.invoice.id || isValidatingAll
              }
              onValidate={s => {
                void handleValidate(s).catch((err: unknown) => {
                  console.error(
                    '[InvoiceReconciliationSuggestionsPanel] handleValidate error:',
                    err
                  );
                });
              }}
              onIgnore={handleIgnore}
            />
          ))}
        </div>
      )}

      {/* Skeleton pendant le chargement */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div
              key={i}
              className="h-16 bg-amber-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}
    </div>
  );
}
