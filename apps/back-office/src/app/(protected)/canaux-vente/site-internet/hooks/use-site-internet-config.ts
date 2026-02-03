/**
 * Hook: useSiteInternetConfig
 * Récupère et met à jour configuration canal site internet
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import type { Json } from '@verone/types';

import type { SiteInternetConfig } from '../types';

const supabase = createClient();

/**
 * Fetch configuration canal site internet
 */
async function fetchSiteInternetConfig(): Promise<SiteInternetConfig | null> {
  const result = await supabase.rpc('get_site_internet_config');
  const { data, error } = result as {
    data: SiteInternetConfig | null;
    error: Error | null;
  };

  if (error) {
    console.error('Erreur fetch config site internet:', error);
    throw error;
  }

  return data;
}

/**
 * Hook principal: récupère configuration
 */
export function useSiteInternetConfig() {
  return useQuery({
    queryKey: ['site-internet-config'],
    queryFn: fetchSiteInternetConfig,
    staleTime: 300000, // 5 minutes (config change rarement)
    refetchOnWindowFocus: false,
  });
}

/**
 * Mettre à jour configuration canal
 */
export function useUpdateSiteInternetConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<SiteInternetConfig>) => {
      const { error } = await supabase
        .from('sales_channels')
        .update({
          ...config,
          updated_at: new Date().toISOString(),
        })
        .eq('code', 'site_internet');

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-config'],
      });
    },
  });
}

/**
 * Upload logo site (Supabase Storage)
 */
export function useUploadSiteLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // 1. Upload vers Supabase Storage
      const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public')
        .upload(`logos/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Récupérer URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from('public').getPublicUrl(uploadData.path);

      // 3. Mettre à jour sales_channels
      const { error: updateError } = await supabase
        .from('sales_channels')
        .update({
          site_logo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('code', 'site_internet');

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-config'],
      });
    },
  });
}

/**
 * Mettre à jour config JSONB (analytics, features, etc.)
 */
export function useUpdateSiteInternetConfigJSON() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configUpdates: Json) => {
      // Fetch config actuelle
      const { data: currentConfig } = await supabase
        .from('sales_channels')
        .select('config')
        .eq('code', 'site_internet')
        .single()
        .returns<{ config: Json | null }>();

      if (!currentConfig) throw new Error('Config non trouvée');

      // Merge avec updates
      const newConfig = {
        ...((currentConfig.config as Record<string, unknown>) ?? {}),
        ...(configUpdates as Record<string, unknown>),
      } as Json;

      // Update
      const { error } = await supabase
        .from('sales_channels')
        .update({
          config: newConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('code', 'site_internet');

      if (error) throw error;

      return newConfig;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-config'],
      });
    },
  });
}
