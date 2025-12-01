'use client';

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

/**
 * Représente une enseigne (groupe de franchises/organisations)
 * Une enseigne n'a PAS de personnalité juridique et ne peut pas passer commande.
 * Si une holding veut commander, créer une organisation liée avec is_enseigne_parent = true
 */
export interface Enseigne {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * Enseigne avec statistiques enrichies (organisations liées, société mère, etc.)
 */
export interface EnseigneWithStats extends Enseigne {
  organisations?: EnseigneOrganisation[];
  parent_company?: EnseigneOrganisation | null;
}

/**
 * Organisation membre d'une enseigne
 */
export interface EnseigneOrganisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  is_enseigne_parent: boolean;
  is_active: boolean | null;
  city: string | null;
  country: string | null;
  logo_url?: string | null;
}

export interface EnseigneFilters {
  is_active?: boolean;
  search?: string;
}

export interface CreateEnseigneData {
  name: string;
  description?: string;
  logo_url?: string;
  is_active?: boolean;
}

export interface UpdateEnseigneData extends Partial<CreateEnseigneData> {
  id: string;
}

/**
 * Hook pour gérer les enseignes (groupes de franchises)
 */
export function useEnseignes(filters?: EnseigneFilters) {
  const [enseignes, setEnseignes] = useState<Enseigne[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchEnseignes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = (supabase as any)
        .from('enseignes')
        .select('*')
        .order('name', { ascending: true });

      // Filtres
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setEnseignes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [filters?.is_active, filters?.search]);

  useEffect(() => {
    fetchEnseignes();
  }, [fetchEnseignes]);

  /**
   * Récupère une enseigne par ID avec ses organisations membres
   */
  const getEnseigneById = async (
    id: string
  ): Promise<EnseigneWithStats | null> => {
    if (!id || id.trim() === '') return null;

    try {
      // Récupérer l'enseigne
      const { data: enseigne, error: enseigneError } = await (supabase as any)
        .from('enseignes')
        .select('*')
        .eq('id', id)
        .single();

      if (enseigneError) {
        if (enseigneError.code === 'PGRST116') return null;
        throw enseigneError;
      }

      // Récupérer les organisations liées
      const { data: organisations, error: orgsError } = await (supabase as any)
        .from('organisations')
        .select(
          'id, legal_name, trade_name, is_enseigne_parent, is_active, city, country, logo_url'
        )
        .eq('enseigne_id', id)
        .order('is_enseigne_parent', { ascending: false })
        .order('legal_name', { ascending: true });

      if (orgsError) {
        console.error('Erreur récupération organisations enseigne:', orgsError);
      }

      // Identifier la société mère (is_enseigne_parent = true)
      const parent_company =
        organisations?.find(org => org.is_enseigne_parent) || null;

      return {
        ...enseigne,
        organisations: organisations || [],
        parent_company,
      };
    } catch (err) {
      console.error("Erreur lors de la récupération de l'enseigne:", err);
      return null;
    }
  };

  /**
   * Crée une nouvelle enseigne
   */
  const createEnseigne = async (
    data: CreateEnseigneData
  ): Promise<Enseigne | null> => {
    try {
      const { data: newEnseigne, error: createError } = await (supabase as any)
        .from('enseignes')
        .insert([
          {
            name: data.name,
            description: data.description || null,
            logo_url: data.logo_url || null,
            is_active: data.is_active ?? true,
          },
        ])
        .select()
        .single();

      if (createError) {
        setError(createError.message);
        return null;
      }

      await fetchEnseignes();
      return newEnseigne;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la création'
      );
      return null;
    }
  };

  /**
   * Met à jour une enseigne existante
   */
  const updateEnseigne = async (
    data: UpdateEnseigneData
  ): Promise<Enseigne | null> => {
    try {
      const updateData: Partial<CreateEnseigneData> = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.logo_url !== undefined) updateData.logo_url = data.logo_url;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      const { data: updatedEnseigne, error: updateError } = await (
        supabase as any
      )
        .from('enseignes')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return null;
      }

      await fetchEnseignes();
      return updatedEnseigne;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      );
      return null;
    }
  };

  /**
   * Supprime une enseigne (les organisations liées sont dissociées via ON DELETE SET NULL)
   */
  const deleteEnseigne = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await (supabase as any)
        .from('enseignes')
        .delete()
        .eq('id', id);

      if (deleteError) {
        setError(deleteError.message);
        return false;
      }

      await fetchEnseignes();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la suppression'
      );
      return false;
    }
  };

  /**
   * Active/désactive une enseigne
   */
  const toggleEnseigneStatus = async (id: string): Promise<boolean> => {
    try {
      const enseigne = enseignes.find(e => e.id === id);
      if (!enseigne) return false;

      const { error: toggleError } = await (supabase as any)
        .from('enseignes')
        .update({ is_active: !enseigne.is_active })
        .eq('id', id);

      if (toggleError) {
        setError(toggleError.message);
        return false;
      }

      await fetchEnseignes();
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du changement de statut'
      );
      return false;
    }
  };

  /**
   * Associe une organisation à une enseigne
   */
  const linkOrganisationToEnseigne = async (
    organisationId: string,
    enseigneId: string,
    isParent: boolean = false
  ): Promise<boolean> => {
    try {
      const { error: linkError } = await (supabase as any)
        .from('organisations')
        .update({
          enseigne_id: enseigneId,
          is_enseigne_parent: isParent,
        })
        .eq('id', organisationId);

      if (linkError) {
        setError(linkError.message);
        return false;
      }

      await fetchEnseignes();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'association"
      );
      return false;
    }
  };

  /**
   * Dissocie une organisation d'une enseigne
   */
  const unlinkOrganisationFromEnseigne = async (
    organisationId: string
  ): Promise<boolean> => {
    try {
      const { error: unlinkError } = await (supabase as any)
        .from('organisations')
        .update({
          enseigne_id: null,
          is_enseigne_parent: false,
        })
        .eq('id', organisationId);

      if (unlinkError) {
        setError(unlinkError.message);
        return false;
      }

      await fetchEnseignes();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la dissociation'
      );
      return false;
    }
  };

  return {
    enseignes,
    loading,
    error,
    refetch: fetchEnseignes,
    getEnseigneById,
    createEnseigne,
    updateEnseigne,
    deleteEnseigne,
    toggleEnseigneStatus,
    linkOrganisationToEnseigne,
    unlinkOrganisationFromEnseigne,
  };
}

/**
 * Hook pour récupérer une enseigne unique par ID
 */
export function useEnseigne(id: string) {
  const [enseigne, setEnseigne] = useState<EnseigneWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchEnseigne = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Récupérer l'enseigne
      const { data: enseigneData, error: enseigneError } = await (
        supabase as any
      )
        .from('enseignes')
        .select('*')
        .eq('id', id)
        .single();

      if (enseigneError) {
        if (enseigneError.code === 'PGRST116') {
          setEnseigne(null);
          return;
        }
        throw enseigneError;
      }

      // Récupérer les organisations liées
      const { data: organisations, error: orgsError } = await (supabase as any)
        .from('organisations')
        .select(
          'id, legal_name, trade_name, is_enseigne_parent, is_active, city, country, logo_url'
        )
        .eq('enseigne_id', id)
        .order('is_enseigne_parent', { ascending: false })
        .order('legal_name', { ascending: true });

      if (orgsError) {
        console.error('Erreur récupération organisations enseigne:', orgsError);
      }

      // Identifier la société mère
      const parent_company =
        organisations?.find(org => org.is_enseigne_parent) || null;

      setEnseigne({
        ...enseigneData,
        organisations: organisations || [],
        parent_company,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEnseigne();
  }, [fetchEnseigne]);

  return { enseigne, loading, error, refetch: fetchEnseigne };
}

/**
 * Hook pour récupérer les enseignes actives (pour les selects/dropdowns)
 */
export function useActiveEnseignes() {
  return useEnseignes({ is_active: true });
}
