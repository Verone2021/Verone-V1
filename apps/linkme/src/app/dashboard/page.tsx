'use client';

/**
 * Dashboard LinkMe - Version Minimaliste
 *
 * Design épuré avec :
 * - 1 KPI principal (commissions en attente)
 * - 3 actions rapides (Ma sélection, Mes commandes, Mon profil)
 * - Résumé compact du mois
 *
 * Principes UX appliqués :
 * - Max 5-6 éléments visibles
 * - Single screen (pas de scroll)
 * - "Less is more"
 *
 * @module DashboardPage
 * @since 2025-12-10
 */

import { useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Star,
  ShoppingCart,
  User,
  Wallet,
  ArrowRight,
  Loader2,
  TrendingUp,
  BarChart3,
  Package,
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useAffiliateAnalytics } from '../../lib/hooks/use-affiliate-analytics';
import { useUserSelections } from '../../lib/hooks/use-user-selection';

export default function DashboardPage(): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, loading } = useAuth();
  const { data: analytics, isLoading: analyticsLoading } =
    useAffiliateAnalytics('month');
  const { data: selections } = useUserSelections();

  // Rediriger si non connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Afficher loader pendant chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Si pas d'utilisateur (en cours de redirection)
  if (!user) {
    return null;
  }

  // Obtenir le prénom
  const firstName: string =
    (user.user_metadata?.first_name as string | undefined) ??
    linkMeRole?.enseigne_name ??
    user.email?.split('@')[0] ??
    'vous';

  // Données analytics
  const pendingCommissions = analytics?.pendingCommissionsTTC ?? 0;
  const totalRevenue = analytics?.totalRevenueHT ?? 0;
  const totalCommissions = analytics?.totalCommissionsTTC ?? 0;
  const totalOrders = analytics?.totalOrders ?? 0;
  const selectionsCount = selections?.filter(s => s.is_public).length ?? 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header avec salutation */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Bonjour, {firstName}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Bienvenue sur votre espace LinkMe
          </p>
        </div>

        {/* Carte principale - Commissions en attente */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-5 sm:p-6 mb-6 border border-emerald-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 mb-2">
                <Wallet className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Commissions en attente
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {analyticsLoading ? (
                  <span className="text-gray-300">--</span>
                ) : (
                  `${pendingCommissions.toFixed(2)} €`
                )}
              </div>
              <p className="text-sm text-gray-500">À verser prochainement</p>
            </div>
            <Link
              href="/commissions"
              className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Voir détails
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Actions rapides - 3 cartes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Ma sélection */}
          <Link
            href="/ma-selection"
            className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors border border-gray-100 hover:border-gray-200"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Star className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                  Ma sélection
                </h3>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <p className="text-sm text-gray-500">
              {selectionsCount > 0
                ? `${selectionsCount} sélection${selectionsCount > 1 ? 's' : ''} active${selectionsCount > 1 ? 's' : ''}`
                : 'Créer ma première sélection'}
            </p>
          </Link>

          {/* Mes commandes */}
          <Link
            href="/ventes"
            className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors border border-gray-100 hover:border-gray-200"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  Mes commandes
                </h3>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <p className="text-sm text-gray-500">
              {totalOrders > 0
                ? `${totalOrders} commande${totalOrders > 1 ? 's' : ''} ce mois`
                : 'Aucune commande ce mois'}
            </p>
          </Link>

          {/* Mon profil */}
          <Link
            href="/profil"
            className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors border border-gray-100 hover:border-gray-200"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-gray-600">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                  Mon profil
                </h3>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <p className="text-sm text-gray-500">Gérer mon compte</p>
          </Link>
        </div>

        {/* Séparateur avec résumé du mois */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">Résumé du mois</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* CA */}
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {analyticsLoading ? '--' : `${totalRevenue.toFixed(2)} €`}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Chiffre d'affaires HT
              </p>
            </div>

            {/* Commissions */}
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {analyticsLoading ? '--' : `${totalCommissions.toFixed(2)} €`}
              </div>
              <p className="text-xs text-gray-500 mt-1">Commissions TTC</p>
            </div>

            {/* Commandes */}
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {analyticsLoading ? '--' : totalOrders}
              </div>
              <p className="text-xs text-gray-500 mt-1">Commandes</p>
            </div>
          </div>
        </div>

        {/* Lien vers statistiques détaillées (discret) */}
        <div className="mt-8 text-center">
          <Link
            href="/statistiques"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            Voir les statistiques détaillées
          </Link>
        </div>

        {/* Message si pas de rôle LinkMe */}
        {!linkMeRole && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <Package className="h-6 w-6 text-amber-400 mx-auto mb-2" />
            <p className="text-amber-800 text-sm">
              Votre compte n'a pas encore de rôle LinkMe configuré.
              <br />
              Contactez votre administrateur pour obtenir l'accès aux
              fonctionnalités.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
