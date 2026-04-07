'use client';

/**
 * Dashboard LinkMe - Version Épurée 2026
 *
 * Design minimaliste et centré :
 * - Layout max-w-3xl mx-auto (pas plein écran)
 * - Message de bienvenue simple
 * - 4 KPIs commissions (admin) OU 4 KPIs ventes (collaborateur)
 * - 4 actions rapides
 * - Cartes sélections avec liens publics (collaborateur)
 * - Top produits (5 max) — avec/sans commissions selon rôle
 * - Lien vers page analytics
 *
 * @module DashboardPage
 * @since 2025-12-10
 * @updated 2026-03-14 - KPIs collaborateur + top produits sans commissions + cartes sélections
 */

import { useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Loader2, Package, BarChart3, ArrowRight } from 'lucide-react';

import { OnboardingChecklist } from '../../../components/onboarding/OnboardingChecklist';
import { WelcomeTourTrigger } from '../../../components/onboarding/WelcomeTourTrigger';
import { useAuth } from '../../../contexts/AuthContext';
import { useAffiliateDashboard } from '../../../lib/hooks/use-affiliate-dashboard';
import { useUserSelections } from '../../../lib/hooks/use-user-selection';
import { usePermissions } from '../../../hooks/use-permissions';

import { DashboardKPISection } from './DashboardKPISection';
import { DashboardQuickActions } from './DashboardQuickActions';
import { DashboardSelectionShareCard } from './DashboardSelectionShareCard';
import { DashboardTopProducts } from './DashboardTopProducts';

export default function DashboardPage(): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, initializing } = useAuth();
  const { canViewCommissions, canManageSelections } = usePermissions();

  const {
    data,
    isLoading: dashboardLoading,
    affiliateLoading,
    affiliate,
  } = useAffiliateDashboard();

  const { data: selections } = useUserSelections();

  useEffect(() => {
    if (!initializing && !user) {
      router.push('/login');
    }
  }, [user, initializing, router]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) return null;

  if (affiliateLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-linkme-turquoise" />
        <p className="mt-4 text-sm text-gray-500">Chargement du profil...</p>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Compte affilié non trouvé
          </h1>
          <p className="text-gray-600">
            Votre compte n&apos;est pas configuré comme affilié LinkMe.
          </p>
          <p className="text-sm text-gray-400 mt-4">
            Contactez votre administrateur si le problème persiste.
          </p>
        </div>
      </div>
    );
  }

  const firstName: string =
    (user.user_metadata?.first_name as string | undefined) ??
    linkMeRole?.enseigne_name ??
    user.email?.split('@')[0] ??
    'vous';

  const isLoading = affiliateLoading || dashboardLoading;
  const publishedSelections = (selections ?? []).filter(
    s => s.published_at !== null
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <WelcomeTourTrigger />

        <section className="mb-8" data-tour="dashboard-welcome">
          <h1 className="text-2xl font-bold text-linkme-marine">
            Bonjour, {firstName}
          </h1>
          <p className="text-gray-500 mt-1">Votre tableau de bord</p>
        </section>

        <OnboardingChecklist />

        <DashboardKPISection
          canViewCommissions={canViewCommissions}
          commissionsByStatus={data?.commissionsByStatus}
          orderStats={data?.orderStats}
          isLoading={isLoading}
        />

        <section className="mb-8" data-tour="analytics-link">
          <Link
            href="/statistiques"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-linkme-turquoise text-white rounded-lg text-sm font-medium hover:bg-linkme-turquoise/90 transition-all shadow-sm"
          >
            <BarChart3 className="h-4 w-4" />
            Voir les statistiques détaillées
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <DashboardQuickActions canManageSelections={canManageSelections} />

        {!canManageSelections && publishedSelections.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Catalogues à partager
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedSelections.map(selection => (
                <DashboardSelectionShareCard
                  key={selection.id}
                  selection={selection}
                />
              ))}
            </div>
          </section>
        )}

        <DashboardTopProducts
          topProductsCatalogue={data?.topProductsCatalogue ?? []}
          topProductsRevendeur={data?.topProductsRevendeur ?? []}
          isLoading={isLoading}
          canViewCommissions={canViewCommissions}
        />

        {!linkMeRole && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <Package className="h-8 w-8 text-amber-400 mx-auto mb-3" />
            <p className="text-amber-800 text-sm">
              Votre compte n&apos;a pas encore de rôle LinkMe configuré.
              <br />
              Contactez votre administrateur pour obtenir l&apos;accès aux
              fonctionnalités.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
