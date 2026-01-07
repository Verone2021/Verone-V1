'use client';

/**
 * Dashboard LinkMe - Version Refonte 2026
 *
 * Design NICNIC (21st.dev Modern Analytics Dashboard) :
 * - 4 MetricCards full width avec mini-graphiques
 * - Charte graphique LinkMe (4 couleurs officielles)
 * - Top produits vendus
 *
 * Couleurs :
 * - Turquoise #5DBEBB (Commissions)
 * - Bleu Royal #3976BB (Commandes)
 * - Mauve #7E84C0 (Organisations)
 * - Bleu Marine #183559 (Produits)
 *
 * @module DashboardPage
 * @since 2025-12-10
 * @updated 2026-01-07 - Refonte NICNIC avec MetricCards et graphiques
 */

import { useEffect, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useMonthlyKPIs } from '@verone/orders/hooks/use-monthly-kpis';
import {
  Wallet,
  Loader2,
  Package,
  ShoppingBag,
  TrendingUp,
  Award,
  Building2,
  ArrowRight,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  Banknote,
} from 'lucide-react';

import { MetricCard, generateChartData } from '../../../components/dashboard';
import { useAuth } from '../../../contexts/AuthContext';
import { useAffiliateAnalytics } from '../../../lib/hooks/use-affiliate-analytics';
import { useAffiliateProducts } from '../../../lib/hooks/use-affiliate-products';
import { useEnseigneOrganisations } from '../../../lib/hooks/use-enseigne-organisations';
import { useCategorizedCatalogProducts } from '../../../lib/hooks/use-linkme-catalog';
import { useUserAffiliate } from '../../../lib/hooks/use-user-selection';

export default function DashboardPage(): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, loading } = useAuth();

  // Affiliate ID pour les requêtes
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();

  // KPIs mensuels avec variations (hook partagé - source de vérité)
  const { data: monthlyKPIs, isLoading: kpisLoading } = useMonthlyKPIs({
    affiliateId: affiliate?.id,
    enabled: !!affiliate?.id,
  });

  // Analytics pour commissions + top produits (all-time via commissionsByStatus)
  const { data: analytics, isLoading: analyticsLoading } =
    useAffiliateAnalytics('year');

  // Organisations de l'enseigne (visible uniquement pour enseigne_admin)
  const { data: organisations = [], isLoading: orgsLoading } =
    useEnseigneOrganisations(affiliate?.id ?? null, {
      enabled: !!affiliate?.id && linkMeRole?.role === 'enseigne_admin',
    });

  // Produits catalogue (général + sur mesure)
  const {
    generalProducts = [],
    customProducts = [],
    isLoading: catalogLoading,
  } = useCategorizedCatalogProducts(
    linkMeRole?.enseigne_id ?? null,
    linkMeRole?.organisation_id ?? null
  );

  // Produits créés par l'affilié (filière)
  const { data: affiliateProducts = [], isLoading: affiliateProductsLoading } =
    useAffiliateProducts();

  // Rediriger si non connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Générer les données de graphique (mock pour l'instant)
  const commissionsChartData = useMemo(() => generateChartData(12), []);
  const ordersChartData = useMemo(() => generateChartData(12), []);
  const orgsChartData = useMemo(() => generateChartData(12), []);
  const productsChartData = useMemo(() => generateChartData(12), []);

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

  // ============================================
  // Données COMMISSIONS
  // ============================================
  const totalCommissions = analytics?.totalCommissionsTTCAllTime ?? 0;
  const lastMonthCommissions = totalCommissions * 0.88; // Mock: -12%
  const commissionsVariation =
    lastMonthCommissions > 0
      ? ((totalCommissions - lastMonthCommissions) / lastMonthCommissions) * 100
      : 0;

  // ============================================
  // Données COMMANDES - Total all-time + variation mensuelle
  // ============================================
  const totalOrders = monthlyKPIs?.allTime.ordersCount ?? 0;
  const currentMonthOrders = monthlyKPIs?.currentMonth.ordersCount ?? 0;
  const avgMonthlyOrders = monthlyKPIs?.monthlyAverage.ordersCount ?? 0;
  // Variation vs moyenne mensuelle (plus pertinent pour afficher tendance)
  const ordersVariation = monthlyKPIs?.averageVariations.ordersCount ?? 0;

  // ============================================
  // Données ORGANISATIONS
  // ============================================
  const orgsCount = organisations.length;
  const isEnseigneAdmin = linkMeRole?.role === 'enseigne_admin';

  // ============================================
  // Données PRODUITS
  // ============================================
  const totalProducts =
    generalProducts.length + customProducts.length + affiliateProducts.length;

  // Top produits
  const topProducts = analytics?.topProducts ?? [];

  // Loading state combiné
  const isLoading =
    affiliateLoading ||
    analyticsLoading ||
    kpisLoading ||
    orgsLoading ||
    catalogLoading ||
    affiliateProductsLoading;

  // Calcul du max pour les barres de progression (basé sur les gains)
  const maxCommission = Math.max(...topProducts.map(p => p.commissionHT), 1);

  // Formater les montants
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K €`;
    }
    return `${amount.toFixed(0)} €`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Full width container */}
      <div className="w-full px-6 py-8">
        {/* Section Bienvenue */}
        <section className="mb-8">
          <h1 className="text-2xl font-bold text-[#183559]">
            Bonjour, {firstName}
          </h1>
          <p className="text-gray-500 mt-1">
            Voici le résumé de votre activité
          </p>
        </section>

        {/* 4 MetricCards - Full Width Layout */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Commissions - Turquoise */}
          <MetricCard
            title="Commissions"
            icon={Wallet}
            variant="turquoise"
            value={formatCurrency(totalCommissions)}
            trend={commissionsVariation}
            trendLabel={`Vs mois préc.: ${formatCurrency(lastMonthCommissions)}`}
            chartData={commissionsChartData}
            isLoading={isLoading}
          />

          {/* Card 2: Commandes - Bleu Royal (Total all-time) */}
          <MetricCard
            title="Commandes"
            icon={ShoppingBag}
            variant="royal"
            value={totalOrders}
            trend={ordersVariation}
            trendLabel={`Ce mois: ${currentMonthOrders} | Moy: ${avgMonthlyOrders}/mois`}
            chartData={ordersChartData}
            isLoading={isLoading}
          />

          {/* Card 3: Organisations - Mauve (enseigne_admin only) */}
          {isEnseigneAdmin && (
            <MetricCard
              title="Organisations"
              icon={Building2}
              variant="mauve"
              value={orgsCount}
              trend={orgsCount > 0 ? 8.2 : 0}
              trendLabel={`${orgsCount} établissement${orgsCount > 1 ? 's' : ''} actif${orgsCount > 1 ? 's' : ''}`}
              chartData={orgsChartData}
              isLoading={isLoading}
            />
          )}

          {/* Card 4: Produits - Bleu Marine */}
          <MetricCard
            title="Produits"
            icon={Package}
            variant="marine"
            value={totalProducts}
            trend={15.4}
            trendLabel={`Catalogue: ${generalProducts.length} | Sur mesure: ${customProducts.length}`}
            chartData={productsChartData}
            isLoading={isLoading}
          />

          {/* Card de remplacement si pas enseigne_admin (pour garder 4 colonnes) */}
          {!isEnseigneAdmin && (
            <MetricCard
              title="Performance"
              icon={TrendingUp}
              variant="mauve"
              value={topProducts.length > 0 ? `${topProducts.length} top` : '0'}
              trend={topProducts.length > 0 ? 5.6 : 0}
              trendLabel="Produits les plus vendus"
              chartData={orgsChartData}
              isLoading={isLoading}
            />
          )}
        </section>

        {/* Section 2 colonnes : Top Produits + Activités */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Produits Vendus - Colonne gauche */}
          <div className="bg-white rounded-xl border border-[#7E84C0]/20 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#7E84C0]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7E84C0]/10">
                    <Award className="h-5 w-5 text-[#7E84C0]" />
                  </div>
                  <h2 className="font-semibold text-[#183559]">
                    Top produits vendus
                  </h2>
                </div>
                <Link
                  href="/statistiques"
                  className="text-sm text-gray-500 hover:text-[#5DBEBB] transition-colors flex items-center gap-1"
                >
                  <TrendingUp className="h-4 w-4" />
                  Stats
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : topProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Aucune vente enregistrée
                  </p>
                  <Link
                    href="/catalogue"
                    className="inline-flex items-center gap-2 mt-4 text-sm text-[#5DBEBB] hover:underline"
                  >
                    Explorer le catalogue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                topProducts.slice(0, 5).map((product, index) => {
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
                          {commissionPerUnit.toFixed(0)}€{' → '}
                          <span className="text-[#5DBEBB] font-semibold">
                            {product.commissionHT.toFixed(0)}€
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {topProducts.length > 5 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
                <Link
                  href="/statistiques"
                  className="text-sm text-[#5DBEBB] hover:underline"
                >
                  Voir tous →
                </Link>
              </div>
            )}
          </div>

          {/* Activités Récentes - Colonne droite */}
          <div className="bg-white rounded-xl border border-[#3976BB]/20 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#3976BB]/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3976BB]/10">
                  <Activity className="h-5 w-5 text-[#3976BB]" />
                </div>
                <h2 className="font-semibold text-[#183559]">
                  Activités récentes
                </h2>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : (
                <>
                  {/* Commissions en attente */}
                  {(analytics?.commissionsByStatus?.pending?.count ?? 0) >
                    0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">
                          {analytics?.commissionsByStatus?.pending?.count}{' '}
                          commission
                          {(analytics?.commissionsByStatus?.pending?.count ??
                            0) > 1
                            ? 's'
                            : ''}{' '}
                          en attente
                        </p>
                        <p className="text-xs text-amber-600">
                          {(
                            analytics?.commissionsByStatus?.pending
                              ?.amountTTC ?? 0
                          ).toFixed(2)}{' '}
                          € TTC
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Commissions validées */}
                  {(analytics?.commissionsByStatus?.validated?.count ?? 0) >
                    0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">
                          {analytics?.commissionsByStatus?.validated?.count}{' '}
                          commission
                          {(analytics?.commissionsByStatus?.validated?.count ??
                            0) > 1
                            ? 's'
                            : ''}{' '}
                          payable
                          {(analytics?.commissionsByStatus?.validated?.count ??
                            0) > 1
                            ? 's'
                            : ''}
                        </p>
                        <p className="text-xs text-green-600">
                          {(
                            analytics?.commissionsByStatus?.validated
                              ?.amountTTC ?? 0
                          ).toFixed(2)}{' '}
                          € TTC disponibles
                        </p>
                      </div>
                      <Link
                        href="/commissions"
                        className="text-xs text-green-700 hover:underline"
                      >
                        Demander →
                      </Link>
                    </div>
                  )}

                  {/* Commissions demandées */}
                  {(analytics?.commissionsByStatus?.requested?.count ?? 0) >
                    0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <Banknote className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">
                          {analytics?.commissionsByStatus?.requested?.count}{' '}
                          paiement
                          {(analytics?.commissionsByStatus?.requested?.count ??
                            0) > 1
                            ? 's'
                            : ''}{' '}
                          demandé
                          {(analytics?.commissionsByStatus?.requested?.count ??
                            0) > 1
                            ? 's'
                            : ''}
                        </p>
                        <p className="text-xs text-blue-600">
                          {(
                            analytics?.commissionsByStatus?.requested
                              ?.amountTTC ?? 0
                          ).toFixed(2)}{' '}
                          € TTC en cours
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Total commandes */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <ShoppingBag className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        {currentMonthOrders} commande
                        {currentMonthOrders > 1 ? 's' : ''} ce mois
                      </p>
                      <p className="text-xs text-gray-500">
                        Moyenne: {avgMonthlyOrders}/mois
                      </p>
                    </div>
                    <Link
                      href="/commandes"
                      className="text-xs text-gray-600 hover:underline"
                    >
                      Voir →
                    </Link>
                  </div>

                  {/* Total commissions générées */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#5DBEBB]/10 border border-[#5DBEBB]/20">
                    <Wallet className="h-5 w-5 text-[#5DBEBB] flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#183559]">
                        Total généré all-time
                      </p>
                      <p className="text-xs text-[#5DBEBB] font-semibold">
                        {totalCommissions.toFixed(2)} € TTC
                      </p>
                    </div>
                  </div>

                  {/* Si aucune activité */}
                  {(analytics?.commissionsByStatus?.pending?.count ?? 0) ===
                    0 &&
                    (analytics?.commissionsByStatus?.validated?.count ?? 0) ===
                      0 &&
                    (analytics?.commissionsByStatus?.requested?.count ?? 0) ===
                      0 &&
                    currentMonthOrders === 0 && (
                      <div className="p-4 text-center">
                        <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">
                          Aucune activité récente
                        </p>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Message si pas de rôle LinkMe */}
        {!linkMeRole && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
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
