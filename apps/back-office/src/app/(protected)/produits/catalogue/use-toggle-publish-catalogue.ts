'use client';

/**
 * useTogglePublishCatalogue — toggle inline publication depuis le catalogue.
 *
 * Appelle /api/products/[id]/publish ou /unpublish.
 * Si l'API retourne 422 (garde-fou Sprint 3), affiche un toast d'erreur
 * avec la liste des champs manquants.
 */

import { useState, useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PublishErrorBody {
  success: false;
  error: string;
  missingFields?: string[];
}

export function useTogglePublishCatalogue() {
  const queryClient = useQueryClient();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const togglePublish = useCallback(
    async (productId: string, nextPublished: boolean): Promise<boolean> => {
      setPendingIds(prev => new Set(prev).add(productId));
      try {
        const endpoint = nextPublished
          ? `/api/products/${productId}/publish`
          : `/api/products/${productId}/unpublish`;

        const res = await fetch(endpoint, { method: 'POST' });
        const body: unknown = await res.json();

        if (!res.ok) {
          const errBody = body as PublishErrorBody;
          if (res.status === 422 && errBody.missingFields?.length) {
            toast.error('Publication bloquée', {
              description: `Champs manquants : ${errBody.missingFields.join(', ')}`,
            });
          } else {
            toast.error(errBody.error ?? 'Erreur publication');
          }
          return false;
        }

        toast.success(nextPublished ? 'Produit publié' : 'Produit dépublié');
        await queryClient.invalidateQueries({ queryKey: ['catalogue'] });
        await queryClient.invalidateQueries({ queryKey: ['products'] });
        await queryClient.invalidateQueries({
          queryKey: ['site-internet-products'],
        });
        return true;
      } catch (err) {
        console.error('[useTogglePublishCatalogue] failed:', err);
        toast.error('Erreur réseau');
        return false;
      } finally {
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    [queryClient]
  );

  return { togglePublish, pendingIds };
}
