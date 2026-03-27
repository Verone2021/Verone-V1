/**
 * Hook: useLinkMePageConfigurations
 * Récupère et gère les configurations des pages LinkMe
 *
 * @module use-linkme-page-config
 * @since 2026-01-06
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import type { Json } from '@verone/types';

/**
 * Interface pour une configuration de page LinkMe
 */
export type LinkMePageConfiguration = {
  id: string;
  page_id: string;
  page_name: string;
  page_description: string | null;
  page_icon: string | null;
  globe_enabled: boolean;
  globe_rotation_speed: number;
  config: Json;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

/**
 * Type pour la mise à jour d'une configuration
 */
export type PageConfigUpdate = {
  globe_enabled?: boolean;
  globe_rotation_speed?: number;
  config?: Json;
};

/**
 * Clé de query pour React Query
 */
const QUERY_KEY = 'linkme-page-configurations';

/**
 * Récupère toutes les configurations de pages
 */
async function fetchPageConfigurations(): Promise<LinkMePageConfiguration[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('linkme_page_configurations')
    .select(
      'id, page_id, page_name, page_description, page_icon, globe_enabled, globe_rotation_speed, config, created_at, updated_at, updated_by'
    )
    .order('page_id');

  if (error) {
    // Si la table n'existe pas encore, retourner les valeurs par défaut
    // PGRST205 = table not found in schema cache (PostgREST)
    // 42P01 = undefined_table (PostgreSQL)
    // PGRST116 = relation does not exist
    const errorCode = error.code;
    if (
      errorCode === '42P01' ||
      errorCode === 'PGRST116' ||
      errorCode === 'PGRST205'
    ) {
      console.warn(
        'Table linkme_page_configurations not found, using defaults'
      );
      return getDefaultConfigurations();
    }
    console.error('Erreur fetch page configurations:', error);
    throw error;
  }

  // Transform Supabase data to match our interface
  return (data ?? []).map(row => ({
    id: row.id,
    page_id: row.page_id,
    page_name: row.page_name,
    page_description: row.page_description,
    page_icon: row.page_icon,
    globe_enabled: row.globe_enabled,
    globe_rotation_speed: Number(row.globe_rotation_speed),
    config: row.config ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
  }));
}

/**
 * Configurations par défaut si la table n'existe pas
 */
function getDefaultConfigurations(): LinkMePageConfiguration[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'default-login',
      page_id: 'login',
      page_name: 'Page de connexion',
      page_description: 'Page de connexion avec globe 3D interactif',
      page_icon: 'log-in',
      globe_enabled: true,
      globe_rotation_speed: 0.003,
      config: {},
      created_at: now,
      updated_at: now,
      updated_by: null,
    },
    {
      id: 'default-dashboard',
      page_id: 'dashboard',
      page_name: "Page d'accueil",
      page_description: 'Dashboard affilié avec section héros et globe',
      page_icon: 'home',
      globe_enabled: true,
      globe_rotation_speed: 0.002,
      config: {},
      created_at: now,
      updated_at: now,
      updated_by: null,
    },
  ];
}

/**
 * Met à jour une configuration de page
 */
async function updatePageConfiguration(
  pageId: string,
  updates: PageConfigUpdate
): Promise<LinkMePageConfiguration> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('linkme_page_configurations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('page_id', pageId)
    .select(
      'id, page_id, page_name, page_description, page_icon, globe_enabled, globe_rotation_speed, config, created_at, updated_at, updated_by'
    )
    .single();

  if (error) {
    console.error('Erreur update page configuration:', error);
    throw error;
  }

  // Transform Supabase row to match our interface
  return {
    id: data.id,
    page_id: data.page_id,
    page_name: data.page_name,
    page_description: data.page_description,
    page_icon: data.page_icon,
    globe_enabled: data.globe_enabled,
    globe_rotation_speed: Number(data.globe_rotation_speed),
    config: data.config ?? {},
    created_at: data.created_at,
    updated_at: data.updated_at,
    updated_by: data.updated_by,
  };
}

/**
 * Hook pour récupérer toutes les configurations de pages
 */
export function useLinkMePageConfigurations() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchPageConfigurations,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour récupérer une configuration de page spécifique
 */
export function useLinkMePageConfig(pageId: string) {
  const { data: configurations, ...rest } = useLinkMePageConfigurations();

  const pageConfig = configurations?.find(c => c.page_id === pageId) ?? null;

  return {
    data: pageConfig,
    configurations,
    ...rest,
  };
}

/**
 * Hook pour mettre à jour une configuration de page
 */
export function useUpdateLinkMePageConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pageId,
      updates,
    }: {
      pageId: string;
      updates: PageConfigUpdate;
    }) => updatePageConfiguration(pageId, updates),
    onSuccess: async () => {
      // Invalider le cache pour recharger les données
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: error => {
      console.error('Erreur mutation page config:', error);
    },
  });
}

/**
 * Hook pour obtenir les stats du globe (nombre de produits/orgs affichés)
 */
export function useGlobeStats() {
  return useQuery({
    queryKey: ['linkme-globe-stats'],
    queryFn: async () => {
      const supabase = createClient();

      // Compter les produits avec show_on_linkme_globe = true
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('show_on_linkme_globe', true);

      // Compter les organisations independantes avec show_on_linkme_globe = true
      const { count: orgsCount } = await supabase
        .from('organisations')
        .select('*', { count: 'exact', head: true })
        .eq('show_on_linkme_globe', true)
        .is('enseigne_id', null);

      // Compter les enseignes avec show_on_linkme_globe = true
      const { count: enseignesCount } = await supabase
        .from('enseignes')
        .select('*', { count: 'exact', head: true })
        .eq('show_on_linkme_globe', true);

      const orgTotal = (orgsCount ?? 0) + (enseignesCount ?? 0);
      return {
        products: productsCount ?? 0,
        organisations: orgTotal,
        total: (productsCount ?? 0) + orgTotal,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================
// GLOBE ITEMS HOOKS
// ============================================

export interface GlobeItem {
  item_type: string;
  id: string;
  name: string;
  image_url: string;
}

/**
 * Hook pour recuperer les items actuellement affiches sur le globe
 */
export function useGlobeItems() {
  return useQuery({
    queryKey: ['linkme-globe-items'],
    queryFn: async (): Promise<GlobeItem[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('linkme_globe_items')
        .select('item_type, id, name, image_url');

      if (error) {
        console.error('Erreur fetch globe items:', error);
        throw error;
      }
      return (data ?? []) as GlobeItem[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook pour ajouter/retirer un item du globe
 */
export function useToggleGlobeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemType,
      itemId,
      enabled,
    }: {
      itemType: 'product' | 'organisation' | 'enseigne';
      itemId: string;
      enabled: boolean;
    }) => {
      const supabase = createClient();
      const table =
        itemType === 'product'
          ? 'products'
          : itemType === 'enseigne'
            ? 'enseignes'
            : 'organisations';
      const { error } = await supabase
        .from(table)
        .update({ show_on_linkme_globe: enabled })
        .eq('id', itemId);

      if (error) {
        console.error(`Erreur toggle globe ${itemType}:`, error);
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-globe-items'] });
      await queryClient.invalidateQueries({ queryKey: ['linkme-globe-stats'] });
    },
  });
}

/**
 * Hook pour ajouter plusieurs produits au globe en batch (une seule requete)
 */
export function useBatchAddGlobeProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      if (productIds.length === 0) return;
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({ show_on_linkme_globe: true })
        .in('id', productIds);

      if (error) {
        console.error('Erreur batch add globe products:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-globe-items'] });
      await queryClient.invalidateQueries({ queryKey: ['linkme-globe-stats'] });
    },
  });
}
