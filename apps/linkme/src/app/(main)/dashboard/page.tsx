'use client';

/**
 * Dashboard LinkMe - Version Épurée 2026
 *
 * Design minimaliste et centré :
 * - Layout max-w-3xl mx-auto (pas plein écran)
 * - Message de bienvenue simple
 * - 4 KPIs de commission (Total, Payables, En cours, En attente)
 * - 3 actions rapides
 * - Top produits (5 max)
 * - Lien vers page analytics
 *
 * @module DashboardPage
 * @since 2025-12-10
 * @updated 2026-01-07 - Refonte épurée
 */

import { useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Wallet,
  Loader2,
  Package,
  ShoppingBag,
  Star,
  User,
  Award,
  ArrowRight,
  CheckCircle,
  Clock,
  Banknote,
  BarChart3,
} from 'lucide-react';

import { CommissionKPICard } from '../../../components/dashboard';
import { useAuth } from '../../../contexts/AuthContext';
import { useAffiliateDashboard } from '../../../lib/hooks/use-affiliate-dashboard';

export default function DashboardPage(): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, loading, initializing } = useAuth();

  // Dashboard data (RPC optimisé - 1 requête au lieu de 6+)
  const {
    data,
    isLoading: dashboardLoading,
    affiliateLoading,
    affiliate,
  } = useAffiliateDashboard();

  // Rediriger si non connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Afficher loader pendant chargement initial ou action en cours
  if (loading || initializing) {
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

  // FIX: Afficher loader pendant chargement affiliate
  if (affiliateLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-[#5DBEBB]" />
        <p className="mt-4 text-sm text-gray-500">Chargement du profil...</p>
      </div>
    );
  }

  // FIX: Gestion explicite du cas affiliate null (bug critique)
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

  // Obtenir le prénom
  const firstName: string =
    (user.user_metadata?.first_name as string | undefined) ??
    linkMeRole?.enseigne_name ??
    user.email?.split('@')[0] ??
    'vous';

  // Loading state combiné
  const isLoading = affiliateLoading || dashboardLoading;

  // Données des commissions par statut
  const commissionsByStatus = data?.commissionsByStatus;

  // Séparer les top produits: Catalogue (marge gagnée) vs Revendeur (encaissement)
  const allTopProducts = data?.topProducts ?? [];
  const topProductsCatalogue = allTopProducts
    .filter(p => !p.isRevendeur)
    .slice(0, 5);
  const topProductsRevendeur = allTopProducts
    .filter(p => p.isRevendeur)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Container centré */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Section Bienvenue */}
        <section className="mb-8">
          <h1 className="text-2xl font-bold text-[#183559]">
            Bonjour, {firstName}
          </h1>
          <p className="text-gray-500 mt-1">Votre tableau de bord</p>
        </section>

        {/* 4 KPIs Commissions */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Total TTC - Turquoise */}
          <CommissionKPICard
            label="Total"
            amount={commissionsByStatus?.total?.amountTTC ?? 0}
            count={commissionsByStatus?.total?.count ?? 0}
            variant="turquoise"
            icon={Wallet}
            isLoading={isLoading}
          />

          {/* Payables - Vert */}
          <CommissionKPICard
            label="Payables"
            amount={commissionsByStatus?.validated?.amountTTC ?? 0}
            count={commissionsByStatus?.validated?.count ?? 0}
            variant="green"
            icon={CheckCircle}
            isLoading={isLoading}
          />

          {/* En cours de règlement - Bleu */}
          <CommissionKPICard
            label="En cours"
            amount={commissionsByStatus?.requested?.amountTTC ?? 0}
            count={commissionsByStatus?.requested?.count ?? 0}
            variant="blue"
            icon={Banknote}
            isLoading={isLoading}
          />

          {/* En attente - Orange */}
          <CommissionKPICard
            label="En attente"
            amount={commissionsByStatus?.pending?.amountTTC ?? 0}
            count={commissionsByStatus?.pending?.count ?? 0}
            variant="orange"
            icon={Clock}
            isLoading={isLoading}
          />
        </section>

        {/* Lien vers Analytics */}
        <section className="mb-8">
          <Link
            href="/analytics"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-[#5DBEBB] hover:text-[#5DBEBB] transition-all"
          >
            <BarChart3 className="h-4 w-4" />
            Voir les statistiques détaillées
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Actions rapides */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {/* Ma sélection */}
            <Link
              href="/ma-selection"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-lg hover:bg-amber-50 hover:border-amber-200 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">
                Ma sélection
              </span>
            </Link>

            {/* Mes commandes */}
            <Link
              href="/commandes"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">
                Mes commandes
              </span>
            </Link>

            {/* Mon profil */}
            <Link
              href="/profil"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-lg hover:bg-gray-100 hover:border-gray-200 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">
                Mon profil
              </span>
            </Link>
          </div>
        </section>

        {/* Top produits Catalogue (marge gagnée) */}
        <section className="mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7E84C0]/10">
                    <Award className="h-5 w-5 text-[#7E84C0]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#183559]">
                      Top Produits Catalogue
                    </h2>
                    <p className="text-xs text-gray-500">Marge gagnée</p>
                  </div>
                </div>
                <Link
                  href="/analytics"
                  className="text-sm text-gray-500 hover:text-[#5DBEBB] transition-colors"
                >
                  Tout voir
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : topProductsCatalogue.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    Aucune vente de produits catalogue
                  </p>
                  <Link
                    href="/catalogue"
                    className="inline-flex items-center gap-2 mt-3 text-sm text-[#5DBEBB] hover:underline"
                  >
                    Explorer le catalogue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                topProductsCatalogue.map((product, index) => {
                  const commissionPerUnit =
                    product.quantitySold > 0
                      ? product.commissionHT / product.quantitySold
                      : 0;

                  return (
                    <div
                      key={product.productId}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                        {product.productImageUrl ? (
                          <Image
                            src={product.productImageUrl}
                            alt={product.productName}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#183559] text-sm truncate">
                          {product.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.quantitySold} ×{' '}
                          {commissionPerUnit.toFixed(0)}€ marge{' '}
                          <span className="text-[#5DBEBB] font-semibold">
                            → {product.commissionHT.toFixed(0)}€
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Top produits Revendeur (encaissement) */}
        {topProductsRevendeur.length > 0 && (
          <section className="mb-8">
            <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-green-100 bg-green-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-[#183559]">
                        Mes Produits Revendeur
                      </h2>
                      <p className="text-xs text-green-600">Encaissement net</p>
                    </div>
                  </div>
                  <Link
                    href="/mes-produits"
                    className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                  >
                    Gérer
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-green-50">
                {topProductsRevendeur.map((product, index) => {
                  // Pour les produits revendeur, commissionHT = ce que l'affilié encaisse
                  const encaissementPerUnit =
                    product.quantitySold > 0
                      ? product.commissionHT / product.quantitySold
                      : 0;

                  return (
                    <div
                      key={product.productId}
                      className="flex items-center gap-3 p-4 hover:bg-green-50/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                        {product.productImageUrl ? (
                          <Image
                            src={product.productImageUrl}
                            alt={product.productName}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#183559] text-sm truncate">
                          {product.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.quantitySold} ×{' '}
                          {encaissementPerUnit.toFixed(0)}€{' '}
                          <span className="text-green-600 font-semibold">
                            → {product.commissionHT.toFixed(0)}€ encaissés
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Message si pas de rôle LinkMe */}
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
