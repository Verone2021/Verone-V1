/**
 * Hook: useSiteInternetConfig
 * Récupère et met à jour configuration canal site internet
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type { SiteInternetConfig } from '../types';

const supabase = createClient();

/**
 * Fetch configuration canal site internet
 */
async function fetchSiteInternetConfig(): Promise<SiteInternetConfig | null> {
  // Type assertion needed for RPC not yet in generated types
  const rpcCall = supabase.rpc as (
    name: string
  ) => Promise<{ data: SiteInternetConfig | null; error: Error | null }>;

  const { data, error } = await rpcCall('get_site_internet_config');

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
    mutationFn: async (configUpdates: Record<string, unknown>) => {
      // Fetch config actuelle
      const { data: currentConfig } = await supabase
        .from('sales_channels')
        .select('config')
        .eq('code', 'site_internet')
        .single()
        .returns<{ config: Record<string, unknown> | null }>();

      if (!currentConfig) throw new Error('Config non trouvée');

      // Merge avec updates
      const newConfig = {
        ...(currentConfig.config ?? {}),
        ...configUpdates,
      };

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
