'use client';

import { useCallback, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import type { NewSourcingJournalEntry } from './use-sourcing-notebook';

/**
 * Prix cible et adoption d'un prix négocié — [BO-SOURCING-OFFRES-004]
 *
 * Deux manques de l'étape Négociation :
 * - `products.target_price` n'était modifiable que depuis le catalogue et
 *   l'extension Chrome, jamais depuis la fiche sourcing où il sert de repère ;
 * - l'historique des prix était décoratif : aucun bouton ne reprenait un prix
 *   négocié comme prix d'achat du produit.
 */
export function useSourcingPricing(
  productId: string,
  addCommunication: (entry: NewSourcingJournalEntry) => Promise<void>,
  onChanged?: () => Promise<unknown>
) {
  const { toast } = useToast();
  const [savingTargetPrice, setSavingTargetPrice] = useState(false);
  const [adoptingPriceId, setAdoptingPriceId] = useState<string | null>(null);

  const updateTargetPrice = useCallback(
    async (targetPrice: number | null): Promise<boolean> => {
      setSavingTargetPrice(true);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('products')
          .update({ target_price: targetPrice })
          .eq('id', productId);

        if (error) {
          console.error('[useSourcingPricing] prix cible:', error);
          toast({
            title: 'Enregistrement impossible',
            description: "Le prix cible n'a pas pu être enregistré.",
            variant: 'destructive',
          });
          return false;
        }
        if (onChanged) await onChanged();
        return true;
      } finally {
        setSavingTargetPrice(false);
      }
    },
    [productId, onChanged, toast]
  );

  /**
   * Reprend un prix négocié comme prix d'achat du produit, et laisse une trace
   * au journal — sinon le prix d'achat changerait sans qu'on sache pourquoi.
   */
  const adoptCostPrice = useCallback(
    async (entry: {
      id: string;
      price: number;
      currency: string;
    }): Promise<boolean> => {
      setAdoptingPriceId(entry.id);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('products')
          .update({ cost_price: entry.price })
          .eq('id', productId);

        if (error) {
          console.error('[useSourcingPricing] adoption du prix:', error);
          toast({
            title: 'Prix non repris',
            description: "Le prix d'achat n'a pas pu être mis à jour.",
            variant: 'destructive',
          });
          return false;
        }

        // Le prix est écrit : le journal ne doit plus pouvoir faire échouer
        // l'opération. `addCommunication` lève sur toute erreur Supabase — sans
        // ce filet, l'utilisateur ne verrait rien alors que le prix a changé.
        try {
          await addCommunication({
            entry_type: 'note',
            summary: `Prix d'achat repris de la négociation : ${entry.price} ${entry.currency}`,
          });
        } catch (journalError) {
          console.error('[useSourcingPricing] journal:', journalError);
          toast({
            title: 'Prix d’achat mis à jour',
            description:
              'La trace au journal n’a pas pu être enregistrée. Le prix, lui, est bien à jour.',
          });
          if (onChanged) await onChanged();
          return true;
        }

        toast({
          title: 'Prix d’achat mis à jour',
          description: `${entry.price} ${entry.currency} est désormais le prix d’achat du produit.`,
        });
        if (onChanged) await onChanged();
        return true;
      } finally {
        setAdoptingPriceId(null);
      }
    },
    [productId, addCommunication, onChanged, toast]
  );

  return {
    updateTargetPrice,
    savingTargetPrice,
    adoptCostPrice,
    adoptingPriceId,
  };
}
