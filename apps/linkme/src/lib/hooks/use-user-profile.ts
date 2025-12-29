'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import { useAuth } from '@/contexts/AuthContext';
import type { ProfileFormData } from '@/lib/schemas/profile.schema';

export interface UserProfile {
  first_name: string;
  last_name: string;
  phone: string | null;
  title: string | null;
  email: string;
  enseigne_id: string | null;
  organisation_id: string | null;
  owner_type: string | null;
}

/**
 * Hook pour récupérer le profil utilisateur depuis la table contacts
 */
export function useUserProfile() {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ['user-profile', user?.email],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.email) return null;

      // Utiliser la RPC pour bypass les problèmes RLS
      const { data, error } = await supabase.rpc('get_user_contact', {
        p_email: user.email,
      });

      if (error) {
        console.error('Erreur RPC get_user_contact:', error);
        // Fallback sur user_metadata
        return {
          first_name: (user.user_metadata?.first_name as string) || '',
          last_name: (user.user_metadata?.last_name as string) || '',
          phone: null,
          title: null,
          email: user.email,
          enseigne_id: null,
          organisation_id: null,
          owner_type: null,
        };
      }

      // Si pas de contact trouvé, retourner les infos de base
      if (!data) {
        return {
          first_name: (user.user_metadata?.first_name as string) || '',
          last_name: (user.user_metadata?.last_name as string) || '',
          phone: null,
          title: null,
          email: user.email,
          enseigne_id: null,
          organisation_id: null,
          owner_type: null,
        };
      }

      return data as unknown as UserProfile;
    },
    enabled: !!user?.email,
  });
}

/**
 * Hook pour mettre à jour le profil utilisateur
 * Synchronise : contacts + user_profiles + auth.user_metadata
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user?.email || !user?.id) {
        throw new Error('Utilisateur non connecté');
      }

      // 1. Update contacts via RPC (bypass RLS issues)
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'update_user_contact',
        {
          p_email: user.email,
          p_first_name: data.first_name,
          p_last_name: data.last_name,
          p_phone: data.phone || undefined,
          p_title: data.title || undefined,
        }
      );

      if (rpcError) {
        console.error('Erreur RPC update_user_contact:', rpcError);
        throw rpcError;
      }

      // Vérifier le résultat de la RPC
      const result = rpcResult as { success: boolean; error?: string };
      if (!result?.success) {
        console.error('RPC échouée:', result?.error);
        throw new Error(result?.error || 'Erreur lors de la mise à jour');
      }

      // 2. Update user_profiles (sync)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || null,
          job_title: data.title || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Erreur update user_profiles:', profileError);
        // Non-bloquant - le contact est déjà mis à jour
      }

      // 3. Update auth.user_metadata (sync)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
        },
      });

      if (authError) {
        console.error('Erreur update auth.user_metadata:', authError);
        // Non-bloquant - le contact est déjà mis à jour
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalider le cache pour recharger les données
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}
