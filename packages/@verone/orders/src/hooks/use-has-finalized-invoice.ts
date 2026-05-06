'use client';

/**
 * Hook: useHasFinalizedInvoice
 *
 * Détecte si une commande a au moins une facture client avec un statut
 * figé (envoyée, payée, partiellement payée). Quand c'est le cas, les frais
 * annexes (livraison, manutention, assurance, TVA frais) doivent être
 * verrouillés en UI et refusés côté hook — règle R6 de finance.md.
 *
 * [BO-FIN-046] Étape 5 — Verrouillage frais post-facturation
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

/**
 * Statuts qui figent les frais (R6 finance.md).
 * Note: l'enum DB document_status n'a pas de valeur "finalized" — on utilise
 * 'sent', 'paid', 'partially_paid' comme équivalents "facture finalisée".
 */
const FINALIZED_STATUSES = ['sent', 'paid', 'partially_paid'] as const;

export function useHasFinalizedInvoice(salesOrderId: string | null): {
  hasFinalizedInvoice: boolean;
  isLoading: boolean;
} {
  const { data = false, isLoading } = useQuery({
    queryKey: ['has-finalized-invoice', salesOrderId],
    queryFn: async (): Promise<boolean> => {
      if (!salesOrderId) return false;
      const supabase = createClient();
      const { count, error } = await supabase
        .from('financial_documents')
        .select('id', { count: 'exact', head: true })
        .eq('sales_order_id', salesOrderId)
        .eq('document_type', 'customer_invoice')
        .in('status', FINALIZED_STATUSES)
        .is('deleted_at', null);

      if (error) {
        console.error('[useHasFinalizedInvoice] Query error:', error);
        return false; // fail-safe: ne pas bloquer l'UI sur erreur réseau
      }

      return (count ?? 0) > 0;
    },
    staleTime: 30_000,
    enabled: !!salesOrderId,
  });

  return { hasFinalizedInvoice: data, isLoading };
}
