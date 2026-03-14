'use client';

/**
 * Hook: useProductTour
 *
 * Gère les product tours Driver.js pour LinkMe.
 * Persistence via la table linkme_onboarding_progress (réutilisation).
 *
 * Fonctionnalités:
 * - Démarrage automatique au premier visit (si tour pas encore vu)
 * - Replay manuel via startTour()
 * - Persistence "tour vu" dans Supabase
 * - Import dynamique de driver.js (pas de SSR)
 *
 * @module use-product-tour
 * @since 2026-02-26
 */

import { useCallback, useEffect, useRef } from 'react';

import { type SupabaseClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/use-permissions';
import { type TourId, getTourSteps } from '../tour-steps';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OnboardingDB {
  public: {
    Tables: {
      linkme_onboarding_progress: {
        Row: {
          id: string;
          user_id: string;
          step_id: string;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          step_id: string;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          step_id?: string;
          completed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

function getOnboardingClient(): SupabaseClient<OnboardingDB> {
  return createClient() as unknown as SupabaseClient<OnboardingDB>;
}

// ─── Query Keys ─────────────────────────────────────────────────────────────

const tourKeys = {
  all: ['product-tours'] as const,
  seen: (userId: string | undefined) =>
    [...tourKeys.all, 'seen', userId] as const,
};

// ─── Hook ───────────────────────────────────────────────────────────────────

interface UseProductTourOptions {
  /** Tour à gérer */
  tourId: TourId;
  /** Démarrer automatiquement si pas encore vu (défaut: false) */
  autoStart?: boolean;
  /** Délai avant auto-start en ms (défaut: 1000) */
  autoStartDelay?: number;
}

interface UseProductTourReturn {
  /** Démarrer le tour manuellement */
  startTour: () => void;
  /** Le tour a-t-il déjà été vu ? */
  isSeen: boolean;
  /** Chargement en cours */
  isLoading: boolean;
}

export function useProductTour({
  tourId,
  autoStart = false,
  autoStartDelay = 1000,
}: UseProductTourOptions): UseProductTourReturn {
  const { user } = useAuth();
  const { canViewCommissions } = usePermissions();
  const queryClient = useQueryClient();
  const driverRef = useRef<ReturnType<
    typeof import('driver.js').driver
  > | null>(null);
  const autoStartedRef = useRef(false);
  const userId = user?.id;

  // 1. Récupérer les tours déjà vus
  const { data: seenTours, isLoading } = useQuery({
    queryKey: tourKeys.seen(userId),
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];
      const raw = getOnboardingClient();
      const { data, error } = await raw
        .from('linkme_onboarding_progress')
        .select('step_id')
        .eq('user_id', userId)
        .like('step_id', 'tour_%');

      if (error) {
        console.error('[useProductTour] fetch error:', error);
        return [];
      }
      return (data ?? []).map(row => row.step_id);
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const isSeen = (seenTours ?? []).includes(tourId);

  // 2. Mutation pour marquer un tour comme vu
  const markSeenMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!userId) return;
      const raw = getOnboardingClient();
      const { error } = await raw
        .from('linkme_onboarding_progress')
        .upsert(
          { user_id: userId, step_id: id },
          { onConflict: 'user_id,step_id' }
        );
      if (error) {
        console.error('[useProductTour] mark seen error:', error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tourKeys.seen(userId),
      });
    },
  });

  // 3. Démarrer un tour
  const startTour = useCallback(() => {
    const steps = getTourSteps(tourId, canViewCommissions);
    if (!steps || steps.length === 0) return;

    // Import dynamique pour éviter SSR
    void import('driver.js')
      .then(({ driver: createDriver }) => {
        // CSS is imported in app/layout.tsx

        // Filtrer les steps dont l'élément existe dans le DOM
        const availableSteps = steps.filter(step => {
          if (!step.element) return true; // Step sans élément = toujours visible
          return document.querySelector(step.element as string) !== null;
        });

        if (availableSteps.length === 0) return;

        const driverObj = createDriver({
          showProgress: true,
          animate: true,
          overlayOpacity: 0.6,
          stagePadding: 8,
          stageRadius: 12,
          popoverOffset: 12,
          showButtons: ['next', 'previous', 'close'],
          nextBtnText: 'Suivant',
          prevBtnText: 'Précédent',
          doneBtnText: 'Terminer',
          progressText: 'Étape {{current}}/{{total}}',
          steps: availableSteps,
          onDestroyed: () => {
            // Marquer le tour comme vu quand terminé ou fermé
            markSeenMutation.mutate(tourId);
          },
        });

        driverRef.current = driverObj;
        driverObj.drive();
      })
      .catch((err: unknown) => {
        console.error('[useProductTour] Failed to load driver.js:', err);
      });
  }, [tourId, canViewCommissions, markSeenMutation]);

  // 4. Auto-start si configuré et pas encore vu
  // Note: autoStartedRef is set INSIDE the timeout to handle React 18 Strict Mode
  // (effects double-fire in dev: first timer is cleaned up, ref must stay false for retry)
  useEffect(() => {
    if (!autoStart || isLoading || isSeen || autoStartedRef.current) return;

    const timer = setTimeout(() => {
      autoStartedRef.current = true;
      startTour();
    }, autoStartDelay);

    return () => {
      clearTimeout(timer);
    };
  }, [autoStart, isLoading, isSeen, autoStartDelay, startTour]);

  // 5. Cleanup driver à l'unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, []);

  return {
    startTour,
    isSeen,
    isLoading,
  };
}
