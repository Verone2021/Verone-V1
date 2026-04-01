/**
 * Hook: useOrganisationFamilies
 * Gestion des familles produits liees a une organisation (pivot N:N)
 * Table: organisation_families (organisation_id + family_id)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface OrganisationFamily {
  id: string;
  family_id: string;
  family_name: string;
  created_at: string;
}

interface UseOrganisationFamiliesResult {
  families: OrganisationFamily[];
  loading: boolean;
  error: string | null;
  addFamily: (familyId: string) => Promise<void>;
  removeFamily: (familyId: string) => Promise<void>;
  setFamilies: (familyIds: string[]) => Promise<void>;
  refresh: () => void;
}

export function useOrganisationFamilies(
  organisationId: string | null
): UseOrganisationFamiliesResult {
  const [families, setFamiliesState] = useState<OrganisationFamily[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchFamilies = useCallback(async () => {
    if (!organisationId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('organisation_families')
        .select('id, family_id, created_at, families!inner(name)')
        .eq('organisation_id', organisationId);

      if (fetchError) throw fetchError;

      const mapped: OrganisationFamily[] = (data ?? []).map(
        (row: Record<string, unknown>) => ({
          id: row.id as string,
          family_id: row.family_id as string,
          family_name:
            ((row.families as Record<string, unknown>)?.name as string) ?? '',
          created_at: row.created_at as string,
        })
      );
      setFamiliesState(mapped);
    } catch (err) {
      console.error('[useOrganisationFamilies] fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [organisationId, supabase]);

  useEffect(() => {
    if (organisationId) {
      void fetchFamilies();
    }
  }, [organisationId, fetchFamilies]);

  const addFamily = async (familyId: string) => {
    if (!organisationId) return;
    try {
      const { error: insertError } = await supabase
        .from('organisation_families')
        .insert({ organisation_id: organisationId, family_id: familyId });
      if (insertError) throw insertError;
      await fetchFamilies();
    } catch (err) {
      console.error('[useOrganisationFamilies] add failed:', err);
      throw err;
    }
  };

  const removeFamily = async (familyId: string) => {
    if (!organisationId) return;
    try {
      const { error: deleteError } = await supabase
        .from('organisation_families')
        .delete()
        .eq('organisation_id', organisationId)
        .eq('family_id', familyId);
      if (deleteError) throw deleteError;
      await fetchFamilies();
    } catch (err) {
      console.error('[useOrganisationFamilies] remove failed:', err);
      throw err;
    }
  };

  const setFamiliesAction = async (familyIds: string[]) => {
    if (!organisationId) return;
    try {
      // Delete all then re-insert selected
      await supabase
        .from('organisation_families')
        .delete()
        .eq('organisation_id', organisationId);

      if (familyIds.length > 0) {
        const rows = familyIds.map(fid => ({
          organisation_id: organisationId,
          family_id: fid,
        }));
        const { error: insertError } = await supabase
          .from('organisation_families')
          .insert(rows);
        if (insertError) throw insertError;
      }
      await fetchFamilies();
    } catch (err) {
      console.error('[useOrganisationFamilies] setFamilies failed:', err);
      throw err;
    }
  };

  return {
    families,
    loading,
    error,
    addFamily,
    removeFamily,
    setFamilies: setFamiliesAction,
    refresh: () => {
      void fetchFamilies();
    },
  };
}
