'use client';

import { useMemo } from 'react';

/**
 * Hook pour calculer automatiquement le statut de complétude d'un produit
 *
 * Logique métier :
 * - completion_percentage === 100 → 'completed' (Complété - vert)
 * - completion_percentage < 100 → 'incomplete' (À compléter - rouge)
 *
 * Le pourcentage est calculé par un trigger PostgreSQL (calculate_product_completion)
 * Ce hook affiche seulement le statut côté frontend (LECTURE SEULE)
 */

export type CompletionStatus = 'completed' | 'incomplete';

export interface CompletionStatusData {
  completion_percentage: number;
}

export interface CompletionStatusResult {
  status: CompletionStatus;
  percentage: number;
  label: string;
  description: string;
  variant: 'success' | 'destructive';
  icon: string;
}

export function useCompletionStatus(
  product: CompletionStatusData
): CompletionStatusResult {
  return useMemo(() => {
    const { completion_percentage } = product;
    const isCompleted = completion_percentage === 100;

    if (isCompleted) {
      return {
        status: 'completed',
        percentage: completion_percentage,
        label: 'Complété',
        description: 'Fiche produit complète à 100%',
        variant: 'success',
        icon: '✅',
      };
    }

    return {
      status: 'incomplete',
      percentage: completion_percentage,
      label: 'À compléter',
      description: `Fiche produit complète à ${completion_percentage}%`,
      variant: 'destructive',
      icon: '⚠️',
    };
  }, [product.completion_percentage]);
}
