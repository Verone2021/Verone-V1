'use client';

/**
 * Hook: useOnboardingProgress
 *
 * Gère la progression de l'onboarding affilié LinkMe.
 * Combine auto-détection (données existantes) et persistence (table Supabase).
 *
 * 7 étapes:
 * 1. complete_profile - Profil complété (display_name + email ou phone)
 * 2. customize_site - Mini-site personnalisé (logo ou bio)
 * 3. create_selection - Première sélection créée
 * 4. add_products - Produits ajoutés à une sélection
 * 5. configure_margins - Marges configurées (items présents)
 * 6. share_selection - Sélection publiée (published_at non null)
 * 7. first_order - Première commande passée
 *
 * + 'dismissed' pour masquer la checklist
 *
 * Note: La table `linkme_onboarding_progress` n'est pas dans les types générés.
 * On utilise un client Supabase non-typé pour les requêtes onboarding.
 *
 * @module use-onboarding-progress
 * @since 2026-02-26
 */

import { useCallback, useEffect, useRef } from 'react';

import { type SupabaseClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import { useAuth } from '../../contexts/AuthContext';
import { useUserAffiliate } from './use-user-selection';

// ─── Type minimal pour la table onboarding (pas dans les types générés) ─────
// La table existe en DB mais n'est pas encore dans packages/@verone/types/supabase.ts.
// On caste le client typé existant (qui a la session auth) vers ce schéma minimal.

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

/**
 * Retourne le client Supabase authentifié, casté vers le schéma onboarding.
 * Cela permet d'accéder à la table linkme_onboarding_progress
 * tout en conservant la session auth du client principal.
 */
function getOnboardingClient(): SupabaseClient<OnboardingDB> {
  return createClient() as unknown as SupabaseClient<OnboardingDB>;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  completed: boolean;
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  percentage: number;
  isDismissed: boolean;
  isFullyCompleted: boolean;
  isLoading: boolean;
}

const ONBOARDING_STEPS_META = [
  {
    id: 'complete_profile',
    label: 'Compléter votre profil',
    description: 'Renseignez vos informations de contact et votre adresse.',
    href: '/profil',
  },
  {
    id: 'customize_site',
    label: 'Personnaliser votre mini-site',
    description: 'Ajoutez votre logo et une description pour votre vitrine.',
    href: '/parametres',
  },
  {
    id: 'create_selection',
    label: 'Créer votre première sélection',
    description: 'Créez une sélection de produits pour vos clients.',
    href: '/ma-selection',
  },
  {
    id: 'add_products',
    label: 'Ajouter des produits du catalogue',
    description:
      'Parcourez le catalogue et ajoutez des produits à votre sélection.',
    href: '/catalogue',
  },
  {
    id: 'configure_margins',
    label: 'Configurer vos marges',
    description:
      'Définissez votre marge sur chaque produit de votre sélection.',
    href: '/ma-selection',
  },
  {
    id: 'share_selection',
    label: 'Partager votre sélection',
    description:
      'Publiez votre sélection et partagez le lien avec vos clients.',
    href: '/ma-selection',
  },
  {
    id: 'first_order',
    label: 'Passer votre première commande',
    description: "Créez une commande pour l'un de vos clients.",
    href: '/commandes/nouvelle',
  },
] as const;

const TOTAL_STEPS = ONBOARDING_STEPS_META.length;

// ─── Query Keys ─────────────────────────────────────────────────────────────

const onboardingKeys = {
  all: ['onboarding'] as const,
  progress: (userId: string | undefined) =>
    [...onboardingKeys.all, 'progress', userId] as const,
  autoDetect: (affiliateId: string | undefined) =>
    [...onboardingKeys.all, 'auto-detect', affiliateId] as const,
};

// ─── Auto-détection depuis données existantes ───────────────────────────────

interface AutoDetectedSteps {
  complete_profile: boolean;
  customize_site: boolean;
  create_selection: boolean;
  add_products: boolean;
  configure_margins: boolean;
  share_selection: boolean;
  first_order: boolean;
}

async function detectCompletedSteps(
  affiliateId: string
): Promise<AutoDetectedSteps> {
  const supabase = createClient();

  // Requêtes parallèles pour performance
  const [affiliateRes, selectionsRes, ordersRes] = await Promise.all([
    // 1. Profil + personnalisation
    supabase
      .from('linkme_affiliates')
      .select('display_name, logo_url, bio, phone, email')
      .eq('id', affiliateId)
      .single(),

    // 2. Sélections: existence + publication (published_at)
    supabase
      .from('linkme_selections')
      .select('id, published_at')
      .eq('affiliate_id', affiliateId)
      .limit(10),

    // 3. Commandes: première commande
    supabase
      .from('sales_orders')
      .select('id')
      .eq('affiliate_id', affiliateId)
      .limit(1),
  ]);

  const affiliate = affiliateRes.data;
  const selections = selectionsRes.data ?? [];
  const orders = ordersRes.data ?? [];

  // Récupérer les items des sélections de l'affilié (séquentiel car dépend des sélections)
  let hasProducts = false;

  if (selections.length > 0) {
    const selectionIds = selections.map(s => s.id);
    const { data: items } = await supabase
      .from('linkme_selection_items')
      .select('id')
      .in('selection_id', selectionIds)
      .limit(1);

    hasProducts = (items ?? []).length > 0;
  }

  return {
    complete_profile: !!(
      affiliate?.display_name &&
      affiliate.display_name.trim().length > 0 &&
      (affiliate.phone || affiliate.email)
    ),
    customize_site: !!(affiliate?.logo_url || affiliate?.bio),
    create_selection: selections.length > 0,
    add_products: hasProducts,
    configure_margins: hasProducts, // Marge définie à l'ajout du produit
    share_selection: selections.some(s => s.published_at !== null),
    first_order: orders.length > 0,
  };
}

// ─── Hook Principal ─────────────────────────────────────────────────────────

interface OnboardingRow {
  step_id: string;
}

export function useOnboardingProgress(): OnboardingProgress & {
  completeStep: (stepId: string) => void;
  dismissChecklist: () => void;
} {
  const { user } = useAuth();
  const { data: affiliate } = useUserAffiliate();
  const queryClient = useQueryClient();
  const syncedRef = useRef(false);

  const userId = user?.id;
  const affiliateId = affiliate?.id;

  // 1. Récupérer la progression persistée (table non-typée)
  const { data: persistedSteps, isLoading: persistedLoading } = useQuery({
    queryKey: onboardingKeys.progress(userId),
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];
      const raw = getOnboardingClient();
      const { data, error } = await raw
        .from('linkme_onboarding_progress')
        .select('step_id')
        .eq('user_id', userId);

      if (error) {
        console.error('[useOnboardingProgress] fetch error:', error);
        return [];
      }
      return ((data ?? []) as OnboardingRow[]).map(row => row.step_id);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // 2. Auto-détecter depuis données existantes
  const { data: autoDetected, isLoading: autoDetectLoading } = useQuery({
    queryKey: onboardingKeys.autoDetect(affiliateId),
    queryFn: async (): Promise<AutoDetectedSteps | null> => {
      if (!affiliateId) return null;
      return detectCompletedSteps(affiliateId);
    },
    enabled: !!affiliateId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // 3. Mutation pour marquer une étape
  const completeMutation = useMutation({
    mutationFn: async (stepId: string): Promise<void> => {
      if (!userId) return;
      const raw = getOnboardingClient();
      const { error } = await raw
        .from('linkme_onboarding_progress')
        .upsert(
          { user_id: userId, step_id: stepId },
          { onConflict: 'user_id,step_id' }
        );
      if (error) {
        console.error('[useOnboardingProgress] upsert error:', error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: onboardingKeys.progress(userId),
      });
    },
  });

  // 4. Synchro auto-détection → persistence (une seule fois par session)
  useEffect(() => {
    if (syncedRef.current || !autoDetected || !persistedSteps || !userId) {
      return;
    }

    const stepsToSync: string[] = [];
    for (const [stepId, isCompleted] of Object.entries(autoDetected)) {
      if (isCompleted && !persistedSteps.includes(stepId)) {
        stepsToSync.push(stepId);
      }
    }

    if (stepsToSync.length > 0) {
      syncedRef.current = true;
      const raw = getOnboardingClient();
      const rows = stepsToSync.map(stepId => ({
        user_id: userId,
        step_id: stepId,
      }));

      void raw
        .from('linkme_onboarding_progress')
        .upsert(rows, { onConflict: 'user_id,step_id' })
        .then(({ error }) => {
          if (error) {
            console.error('[useOnboardingProgress] sync error:', error);
          } else {
            void queryClient.invalidateQueries({
              queryKey: onboardingKeys.progress(userId),
            });
          }
        });
    } else {
      syncedRef.current = true;
    }
  }, [autoDetected, persistedSteps, userId, queryClient]);

  // 5. Combiner les deux sources
  const completedStepIds = new Set<string>(persistedSteps ?? []);
  if (autoDetected) {
    for (const [stepId, isCompleted] of Object.entries(autoDetected)) {
      if (isCompleted) completedStepIds.add(stepId);
    }
  }

  const isDismissed = completedStepIds.has('dismissed');

  const steps: OnboardingStep[] = ONBOARDING_STEPS_META.map(meta => ({
    ...meta,
    completed: completedStepIds.has(meta.id),
  }));

  const completedCount = steps.filter(s => s.completed).length;
  const percentage = Math.round((completedCount / TOTAL_STEPS) * 100);
  const isFullyCompleted = completedCount === TOTAL_STEPS;
  const isLoading = persistedLoading || autoDetectLoading;

  const completeStep = useCallback(
    (stepId: string) => {
      completeMutation.mutate(stepId);
    },
    [completeMutation]
  );

  const dismissChecklist = useCallback(() => {
    completeMutation.mutate('dismissed');
  }, [completeMutation]);

  return {
    steps,
    completedCount,
    totalCount: TOTAL_STEPS,
    percentage,
    isDismissed,
    isFullyCompleted,
    isLoading,
    completeStep,
    dismissChecklist,
  };
}
