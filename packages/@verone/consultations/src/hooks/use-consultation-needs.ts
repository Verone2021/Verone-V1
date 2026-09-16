'use client';

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

// ── Types ────────────────────────────────────────────────────────────

/** Besoin exprimé par le client : « 4 suspensions au-dessus du bar ». */
export interface ConsultationNeed {
  id: string;
  consultation_id: string;
  label: string;
  quantity: number;
  target_unit_price_ht: number | null;
  notes: string | null;
  sort_order: number;
}

export interface CreateConsultationNeedData {
  label: string;
  quantity: number;
  target_unit_price_ht?: number | null;
  notes?: string | null;
}

export interface UpdateConsultationNeedData {
  label?: string;
  quantity?: number;
  target_unit_price_ht?: number | null;
  notes?: string | null;
  sort_order?: number;
}

const supabase = createClient();

/**
 * Besoins d'une consultation. Une ligne de produit peut être rattachée à un
 * besoin (`consultation_products.need_id`) : plusieurs produits rattachés au
 * même besoin sont des options comparées entre elles.
 *
 * La table existait depuis BO-CONSULT-P9-001 sans aucun accès applicatif :
 * ce hook est son premier consommateur (BO-CONSULT-MULTI-001).
 */
export function useConsultationNeeds(consultationId?: string) {
  const [needs, setNeeds] = useState<ConsultationNeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNeeds = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('consultation_needs')
        .select(
          'id, consultation_id, label, quantity, target_unit_price_ht, notes, sort_order'
        )
        .eq('consultation_id', id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (queryError) throw queryError;

      setNeeds(
        (data ?? []).map(row => ({
          id: row.id,
          consultation_id: row.consultation_id,
          label: row.label,
          quantity: row.quantity ?? 1,
          target_unit_price_ht:
            row.target_unit_price_ht != null
              ? Number(row.target_unit_price_ht)
              : null,
          notes: row.notes ?? null,
          sort_order: row.sort_order ?? 0,
        }))
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des besoins';
      setError(message);
      console.error('[useConsultationNeeds] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addNeed = async (
    data: CreateConsultationNeedData
  ): Promise<boolean> => {
    if (!consultationId) return false;
    try {
      setError(null);
      const { error: insertError } = await supabase
        .from('consultation_needs')
        .insert({
          consultation_id: consultationId,
          label: data.label,
          quantity: data.quantity,
          target_unit_price_ht: data.target_unit_price_ht ?? null,
          notes: data.notes ?? null,
          sort_order: needs.length,
        });
      if (insertError) throw insertError;

      await fetchNeeds(consultationId);
      toast({
        title: 'Besoin ajouté',
        description: 'Le besoin du client a été enregistré',
      });
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de l'ajout du besoin";
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  const updateNeed = async (
    needId: string,
    updates: UpdateConsultationNeedData
  ): Promise<boolean> => {
    if (!consultationId) return false;
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('consultation_needs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', needId);
      if (updateError) throw updateError;

      await fetchNeeds(consultationId);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  /**
   * Supprime un besoin. Les lignes rattachées ne sont pas supprimées : la
   * base remet leur `need_id` à NULL (ON DELETE SET NULL).
   */
  const removeNeed = async (needId: string): Promise<boolean> => {
    if (!consultationId) return false;
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('consultation_needs')
        .delete()
        .eq('id', needId);
      if (deleteError) throw deleteError;

      await fetchNeeds(consultationId);
      toast({
        title: 'Besoin supprimé',
        description: 'Les produits rattachés restent dans la consultation',
      });
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    if (consultationId) {
      void fetchNeeds(consultationId);
    }
  }, [consultationId, fetchNeeds]);

  return {
    needs,
    loading,
    error,
    fetchNeeds,
    addNeed,
    updateNeed,
    removeNeed,
  };
}
