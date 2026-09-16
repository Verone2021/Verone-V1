'use client';

import { useCallback, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@verone/common/hooks';
import { invalidateMenuCounts } from '@verone/utils/query';
import { createClient } from '@verone/utils/supabase/client';

import {
  missingRequirementsFromRpcError,
  type SourcingRpcError,
} from './sourcing-rpc-error';
import { SAMPLE_CANDIDATES_QUERY_KEY } from './use-sample-draft-order';
import { SAMPLE_DRAFT_ORDER_QUERY_KEY } from './use-sample-draft-order';
import { SAMPLE_STATE_QUERY_KEY } from './use-sample-state';

export type BulkSampleFailure = 'already_ordered' | 'incomplete' | 'other';

export interface BulkSampleOutcome {
  productId: string;
  ok: boolean;
  poNumber?: string;
  failure?: BulkSampleFailure;
  /** Champs manquants, quand l'échec vient d'une fiche incomplète. */
  missingLabels?: string[];
}

export interface BulkSampleResult {
  outcomes: BulkSampleOutcome[];
  ordered: number;
  poNumbers: string[];
}

function payloadPoNumber(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const poNumber = (value as { po_number?: unknown }).po_number;
  return typeof poNumber === 'string' ? poNumber : undefined;
}

/**
 * Commande d'échantillon pour plusieurs produits — [BO-SOURCING-SAMPLE-002]
 *
 * `request_sample_order` regroupe déjà les produits d'un même fournisseur dans
 * sa commande brouillon : il suffit de l'appeler produit par produit. Les
 * appels sont **séquentiels** à dessein — en parallèle, deux appels pourraient
 * créer deux commandes pour le même fournisseur.
 *
 * Le compte rendu distingue les trois issues possibles pour que l'utilisateur
 * sache quoi corriger : commandé, déjà commandé, fiche incomplète.
 */
export function useBulkSampleOrder(onChanged?: () => Promise<unknown>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);

  const orderSamples = useCallback(
    async (productIds: string[]): Promise<BulkSampleResult> => {
      const supabase = createClient();
      const outcomes: BulkSampleOutcome[] = [];
      setRunning(true);

      try {
        for (const productId of productIds) {
          const { data, error } = await supabase.rpc('request_sample_order', {
            p_product_id: productId,
          });

          if (error) {
            const rpcError = error as SourcingRpcError;
            const missing = missingRequirementsFromRpcError(rpcError);
            outcomes.push({
              productId,
              ok: false,
              failure:
                rpcError.code === 'VS001'
                  ? 'already_ordered'
                  : rpcError.code === 'VS002'
                    ? 'incomplete'
                    : 'other',
              missingLabels:
                missing.length > 0
                  ? missing.map(r => r.label.toLowerCase())
                  : undefined,
            });
            continue;
          }

          outcomes.push({
            productId,
            ok: true,
            poNumber: payloadPoNumber(data),
          });
        }
      } finally {
        setRunning(false);
      }

      const ordered = outcomes.filter(o => o.ok);
      const poNumbers = [
        ...new Set(
          ordered.map(o => o.poNumber).filter((n): n is string => Boolean(n))
        ),
      ];

      // Toutes les vues qui dépendent de l'état échantillon sont rafraîchies,
      // y compris celles des produits qui ont échoué (leur état n'a pas bougé
      // mais le cache peut être périmé).
      await Promise.all(
        productIds.map(productId =>
          queryClient.invalidateQueries({
            queryKey: [SAMPLE_STATE_QUERY_KEY, productId],
          })
        )
      );
      await queryClient.invalidateQueries({
        queryKey: [SAMPLE_DRAFT_ORDER_QUERY_KEY],
      });
      await queryClient.invalidateQueries({
        queryKey: [SAMPLE_CANDIDATES_QUERY_KEY],
      });
      await invalidateMenuCounts(queryClient, 'sourcing');
      if (onChanged) await onChanged();

      const parts: string[] = [];
      if (poNumbers.length === 1) {
        parts.push(
          `${ordered.length} échantillon${ordered.length > 1 ? 's' : ''} ajouté${
            ordered.length > 1 ? 's' : ''
          } à la commande ${poNumbers[0]}`
        );
      } else if (ordered.length > 0) {
        parts.push(
          `${ordered.length} échantillons répartis sur ${poNumbers.length} commandes`
        );
      }
      const already = outcomes.filter(
        o => o.failure === 'already_ordered'
      ).length;
      if (already > 0) parts.push(`${already} déjà commandé(s)`);
      const incomplete = outcomes.filter(o => o.failure === 'incomplete');
      if (incomplete.length > 0) {
        const labels = [
          ...new Set(incomplete.flatMap(o => o.missingLabels ?? [])),
        ];
        parts.push(
          labels.length > 0
            ? `${incomplete.length} fiche(s) incomplète(s) : ${labels.join(', ')}`
            : `${incomplete.length} fiche(s) incomplète(s)`
        );
      }
      const other = outcomes.filter(o => o.failure === 'other').length;
      if (other > 0) parts.push(`${other} en erreur`);

      toast({
        title:
          ordered.length > 0
            ? 'Échantillons commandés'
            : 'Aucun échantillon commandé',
        description: parts.join(' · '),
        variant: ordered.length > 0 ? undefined : 'destructive',
      });

      return { outcomes, ordered: ordered.length, poNumbers };
    },
    [onChanged, queryClient, toast]
  );

  return { orderSamples, running };
}
