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
  config: Record<string, unknown>;
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
  config?: Record<string, unknown>;
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

  // Note: table sera typée après régénération des types Supabase
  const { data, error } = await (supabase as any)
    .from('linkme_page_configurations')
    .select('*')
    .order('page_id');

  if (error) {
    // Si la table n'existe pas encore, retourner les valeurs par défaut
    if (error.code === '42P01') {
      return getDefaultConfigurations();
    }
    console.error('Erreur fetch page configurations:', error);
    throw error;
  }

  return (data as LinkMePageConfiguration[]) ?? getDefaultConfigurations();
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

  // Note: table sera typée après régénération des types Supabase
  const { data, error } = await (supabase as any)
    .from('linkme_page_configurations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('page_id', pageId)
    .select()
    .single();

  if (error) {
    console.error('Erreur update page configuration:', error);
    throw error;
  }

  return data as LinkMePageConfiguration;
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
    onSuccess: () => {
      // Invalider le cache pour recharger les données
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
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

      // Compter les organisations avec show_on_linkme_globe = true
      const { count: orgsCount } = await supabase
        .from('organisations')
        .select('*', { count: 'exact', head: true })
        .eq('show_on_linkme_globe', true);

      return {
        products: productsCount ?? 0,
        organisations: orgsCount ?? 0,
        total: (productsCount ?? 0) + (orgsCount ?? 0),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
