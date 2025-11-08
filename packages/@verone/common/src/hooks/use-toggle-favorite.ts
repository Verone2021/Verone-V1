/**
 * 🎯 Hook - Toggle Favorite Status
 *
 * Permet de marquer/démarquer une organisation comme favorite
 * directement depuis les vues listes/grilles
 */

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

interface UseToggleFavoriteOptions {
  organisationId: string;
  organisationType: 'customer' | 'supplier' | 'partner';
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseToggleFavoriteReturn {
  toggleFavorite: (currentValue: boolean) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useToggleFavorite({
  organisationId,
  organisationType,
  onSuccess,
  onError,
}: UseToggleFavoriteOptions): UseToggleFavoriteReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const toggleFavorite = async (currentValue: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const newValue = !currentValue;

      // Update preferred_supplier field
      const { error: updateError } = await supabase
        .from('organisations')
        .update({ preferred_supplier: newValue })
        .eq('id', organisationId);

      if (updateError) {
        throw new Error(
          `Erreur lors de la mise à jour: ${updateError.message}`
        );
      }

      // Success callback
      onSuccess?.();
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Erreur inconnue');
      setError(errorObj);
      onError?.(errorObj);
      console.error(
        `[useToggleFavorite] Error toggling favorite for ${organisationType}:`,
        err
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleFavorite,
    isLoading,
    error,
  };
}
