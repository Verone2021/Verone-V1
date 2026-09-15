'use client';

import { useCallback, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

type ProductStatus = 'active' | 'preorder' | 'discontinued' | 'draft';

interface UseBulkActionsParams {
  onAfterMutation: () => void | Promise<void>;
  onClearSelection: () => void;
}

export function useBulkActions({
  onAfterMutation,
  onClearSelection,
}: UseBulkActionsParams) {
  const [busy, setBusy] = useState(false);

  const runAfter = useCallback(async () => {
    try {
      await onAfterMutation();
    } catch (err) {
      console.error('[BulkActions] post-mutation refresh failed:', err);
    }
    onClearSelection();
  }, [onAfterMutation, onClearSelection]);

  const setPublished = useCallback(
    async (ids: string[], published: boolean) => {
      if (ids.length === 0) return;
      setBusy(true);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('products')
          .update({ is_published_online: published })
          .in('id', ids);
        if (error) throw error;
        toast.success(
          published
            ? `${ids.length} produit${ids.length > 1 ? 's' : ''} publié${ids.length > 1 ? 's' : ''} en ligne.`
            : `${ids.length} produit${ids.length > 1 ? 's' : ''} dépublié${ids.length > 1 ? 's' : ''}.`
        );
        await runAfter();
      } catch (error) {
        console.error('[BulkActions] setPublished failed:', error);
        toast.error('Action en masse échouée. Réessayez.');
      } finally {
        setBusy(false);
      }
    },
    [runAfter]
  );

  const setStatus = useCallback(
    async (ids: string[], status: ProductStatus) => {
      if (ids.length === 0) return;
      setBusy(true);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('products')
          .update({ product_status: status })
          .in('id', ids);
        if (error) throw error;
        toast.success(
          `${ids.length} produit${ids.length > 1 ? 's' : ''} mis à jour (statut: ${status}).`
        );
        await runAfter();
      } catch (error) {
        console.error('[BulkActions] setStatus failed:', error);
        toast.error('Action en masse échouée. Réessayez.');
      } finally {
        setBusy(false);
      }
    },
    [runAfter]
  );

  const setPriceFlat = useCallback(
    async (ids: string[], price: number) => {
      if (ids.length === 0 || !Number.isFinite(price) || price < 0) return;
      setBusy(true);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('products')
          .update({ cost_price: price })
          .in('id', ids);
        if (error) throw error;
        toast.success(
          `Prix d'achat HT mis à jour sur ${ids.length} produit${ids.length > 1 ? 's' : ''}.`
        );
        await runAfter();
      } catch (error) {
        console.error('[BulkActions] setPriceFlat failed:', error);
        toast.error('Mise à jour du prix échouée.');
      } finally {
        setBusy(false);
      }
    },
    [runAfter]
  );

  const adjustPriceByPercent = useCallback(
    async (ids: string[], percent: number) => {
      if (ids.length === 0 || !Number.isFinite(percent)) return;
      setBusy(true);
      try {
        const supabase = createClient();
        const { data: rows, error: readErr } = await supabase
          .from('products')
          .select('id, cost_price')
          .in('id', ids);
        if (readErr) throw readErr;
        const factor = 1 + percent / 100;
        const updates = (rows ?? [])
          .filter(r => typeof r.cost_price === 'number')
          .map(r => ({
            id: r.id,
            next: Math.max(
              0,
              Number(((r.cost_price ?? 0) * factor).toFixed(2))
            ),
          }));
        for (const u of updates) {
          const { error } = await supabase
            .from('products')
            .update({ cost_price: u.next })
            .eq('id', u.id);
          if (error) throw error;
        }
        toast.success(
          `${updates.length} prix ajusté${updates.length > 1 ? 's' : ''} (${percent > 0 ? '+' : ''}${percent}%).`
        );
        await runAfter();
      } catch (error) {
        console.error('[BulkActions] adjustPriceByPercent failed:', error);
        toast.error('Ajustement du prix échoué.');
      } finally {
        setBusy(false);
      }
    },
    [runAfter]
  );

  // Retrait groupé avec un motif commun (BO-PRODUCTS-P8-001) : un appel de la
  // fonction du cycle de vie par produit (journal écrit, statut inchangé).
  const archive = useCallback(
    async (ids: string[], reason: string) => {
      if (ids.length === 0 || !reason.trim()) return false;
      setBusy(true);
      try {
        const supabase = createClient();
        let withdrawn = 0;
        let failed = 0;
        for (const id of ids) {
          const { error } = await supabase.rpc(
            'apply_product_lifecycle_action',
            { p_product_id: id, p_action: 'withdraw', p_reason: reason }
          );
          if (error) {
            console.error('[BulkActions] withdraw failed:', id, error);
            failed += 1;
          } else {
            withdrawn += 1;
          }
        }
        if (withdrawn > 0) {
          toast.success(
            `${withdrawn} produit${withdrawn > 1 ? 's' : ''} retiré${withdrawn > 1 ? 's' : ''}.`
          );
        }
        if (failed > 0) {
          toast.error(
            `${failed} produit${failed > 1 ? 's' : ''} non retiré${failed > 1 ? 's' : ''} (déjà retiré${failed > 1 ? 's' : ''} ou erreur).`
          );
        }
        await runAfter();
        return withdrawn > 0;
      } catch (error) {
        console.error('[BulkActions] withdraw failed:', error);
        toast.error('Retrait groupé échoué.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [runAfter]
  );

  return {
    busy,
    setPublished,
    setStatus,
    setPriceFlat,
    adjustPriceByPercent,
    archive,
  };
}
