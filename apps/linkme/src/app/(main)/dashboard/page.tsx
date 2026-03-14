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

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Wallet,
  Loader2,
  Package,
  ShoppingBag,
  ShoppingCart,
  Star,
  Award,
  ArrowRight,
  CheckCircle,
  Clock,
  Banknote,
  BarChart3,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

import { CommissionKPICard } from '../../../components/dashboard';
import { OnboardingChecklist } from '../../../components/onboarding/OnboardingChecklist';
import { WelcomeTourTrigger } from '../../../components/onboarding/WelcomeTourTrigger';
import { useAuth } from '../../../contexts/AuthContext';
import { useAffiliateDashboard } from '../../../lib/hooks/use-affiliate-dashboard';
import { useUserSelections } from '../../../lib/hooks/use-user-selection';
import { usePermissions } from '../../../hooks/use-permissions';
import { formatCurrency } from '../../../types/analytics';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export default function DashboardPage(): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, initializing } = useAuth();
  const { canViewCommissions, canManageSelections } = usePermissions();

  // Dashboard data (RPC optimisé - 1 requête au lieu de 6+)
  const {
    data,
    isLoading: dashboardLoading,
    affiliateLoading,
    affiliate,
  } = useAffiliateDashboard();

  // Sélections pour cartes publiques (collaborateur)
  const { data: selections } = useUserSelections();

  // Rediriger si non connecté
  useEffect(() => {
    if (!initializing && !user) {
      router.push('/login');
    }
  }, [user, initializing, router]);

  // Afficher loader pendant chargement initial ou action en cours
  if (initializing) {
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
        <Loader2 className="h-8 w-8 animate-spin text-linkme-turquoise" />
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

  // Order stats pour KPIs collaborateur
  const orderStats = data?.orderStats;

  // Top produits séparés par la RPC (catalogue vs revendeur)
  const topProductsCatalogue = data?.topProductsCatalogue ?? [];
  const topProductsRevendeur = data?.topProductsRevendeur ?? [];

  // Sélections publiées pour cartes (collaborateur uniquement)
  const publishedSelections = (selections ?? []).filter(
    s => s.published_at !== null
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Container centré */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tour de bienvenue (auto-start au premier login) */}
        <WelcomeTourTrigger />

        {/* Section Bienvenue */}
        <section className="mb-8" data-tour="dashboard-welcome">
          <h1 className="text-2xl font-bold text-linkme-marine">
            Bonjour, {firstName}
          </h1>
          <p className="text-gray-500 mt-1">Votre tableau de bord</p>
        </section>

        {/* Checklist Onboarding */}
        <OnboardingChecklist />

        {/* 4 KPIs Commissions — admin/org uniquement */}
        {canViewCommissions && (
          <section
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6"
            data-tour="kpi-cards"
          >
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
        )}

        {/* 4 KPIs Ventes — collaborateur uniquement */}
        {!canViewCommissions && (
          <section
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6"
            data-tour="kpi-cards"
          >
            <CollaborateurKPICard
              label="Commandes"
              value={formatNumber(orderStats?.ordersCount ?? 0)}
              subtitle="commandes passées"
              icon={ShoppingCart}
              variant="turquoise"
              isLoading={isLoading}
            />
            <CollaborateurKPICard
              label="CA HT"
              value={formatCurrency(orderStats?.totalHT ?? 0)}
              subtitle="chiffre d'affaires"
              icon={Wallet}
              variant="green"
              isLoading={isLoading}
            />
            <CollaborateurKPICard
              label="Produits"
              value={formatNumber(orderStats?.productsOrdered ?? 0)}
              subtitle="produits commandés"
              icon={Package}
              variant="blue"
              isLoading={isLoading}
            />
            <CollaborateurKPICard
              label="Catalogue"
              value={formatNumber(orderStats?.catalogProductsCount ?? 0)}
              subtitle="produits en catalogue"
              icon={Star}
              variant="orange"
              isLoading={isLoading}
            />
          </section>
        )}

        {/* Lien vers Analytics */}
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

        {/* Actions rapides */}
        <section className="mb-8" data-tour="quick-actions">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Mes sélections — masqué pour enseigne_collaborateur */}
            {canManageSelections && (
              <Link
                href="/ma-selection"
                className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-lg hover:bg-amber-50 hover:border-amber-200 transition-colors group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">
                  Mes sélections
                </span>
              </Link>
            )}

            {/* Catalogue */}
            <Link
              href="/catalogue"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-lg hover:bg-violet-50 hover:border-violet-200 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 group-hover:bg-violet-200 transition-colors">
                <Package className="h-5 w-5 text-violet-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">
                Catalogue
              </span>
            </Link>

            {/* Nouvelle commande */}
            <Link
              href="/commandes"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">
                Nouvelle commande
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
          </div>
        </section>

        {/* Cartes sélections avec liens publics — collaborateur uniquement */}
        {!canManageSelections && publishedSelections.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Catalogues à partager
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedSelections.map(selection => (
                <SelectionShareCard key={selection.id} selection={selection} />
              ))}
            </div>
          </section>
        )}

        {/* Top produits : Catalogue + Revendeur côte à côte */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Catalogue */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linkme-mauve/10">
                    <Award className="h-4 w-4 text-linkme-mauve" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-linkme-marine text-sm">
                      Top Produits Catalogue
                    </h2>
                    <p className="text-[10px] text-gray-500">
                      {canViewCommissions
                        ? 'Marge gagnée'
                        : 'Quantités vendues'}
                    </p>
                  </div>
                </div>
                <Link
                  href="/statistiques"
                  className="text-xs text-gray-500 hover:text-linkme-turquoise transition-colors"
                >
                  Tout voir
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {isLoading ? (
                <div className="p-6 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : topProductsCatalogue.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">
                    Aucune vente catalogue
                  </p>
                  <Link
                    href="/catalogue"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-linkme-turquoise hover:underline"
                  >
                    Explorer le catalogue
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                topProductsCatalogue.map((product, index) => {
                  const pricePerUnit =
                    product.quantitySold > 0
                      ? product.revenueHT / product.quantitySold
                      : 0;
                  const commissionPerUnit =
                    product.quantitySold > 0
                      ? product.commissionHT / product.quantitySold
                      : 0;

                  return (
                    <div
                      key={product.productId}
                      className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gray-500">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 overflow-hidden">
                        {product.productImageUrl ? (
                          <Image
                            src={product.productImageUrl}
                            alt={product.productName}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-3 w-3 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-linkme-marine text-xs truncate">
                          {product.productName}
                        </p>
                        {canViewCommissions ? (
                          <p className="text-[10px] text-gray-500">
                            {product.quantitySold} ×{' '}
                            {commissionPerUnit.toFixed(0)}€{' '}
                            <span className="text-linkme-turquoise font-semibold">
                              → {product.commissionHT.toFixed(0)}€
                            </span>
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-500">
                            {product.quantitySold} × {pricePerUnit.toFixed(0)}€
                            HT{' '}
                            <span className="text-linkme-turquoise font-semibold">
                              → {product.revenueHT.toFixed(0)}€ HT
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Revendeur */}
          <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-green-100 bg-green-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                    <Package className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-linkme-marine text-sm">
                      Mes Produits Revendeur
                    </h2>
                    <p className="text-[10px] text-green-600">
                      {canViewCommissions
                        ? 'Encaissement net'
                        : "Chiffre d'affaires HT"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/mes-produits"
                  className="text-xs text-gray-500 hover:text-green-600 transition-colors"
                >
                  Gérer
                </Link>
              </div>
            </div>

            <div className="divide-y divide-green-50">
              {isLoading ? (
                <div className="p-6 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : topProductsRevendeur.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">
                    Aucun produit revendeur vendu
                  </p>
                  <Link
                    href="/mes-produits"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 hover:underline"
                  >
                    Gérer mes produits
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                topProductsRevendeur.map((product, index) => {
                  const encaissementNet =
                    product.revenueHT - product.commissionHT;
                  const netPerUnit =
                    product.quantitySold > 0
                      ? encaissementNet / product.quantitySold
                      : 0;
                  const pricePerUnit =
                    product.quantitySold > 0
                      ? product.revenueHT / product.quantitySold
                      : 0;

                  return (
                    <div
                      key={product.productId}
                      className="flex items-center gap-2 px-3 py-2.5 hover:bg-green-50/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-green-600">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 overflow-hidden">
                        {product.productImageUrl ? (
                          <Image
                            src={product.productImageUrl}
                            alt={product.productName}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-3 w-3 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-linkme-marine text-xs truncate">
                          {product.productName}
                        </p>
                        {canViewCommissions ? (
                          <p className="text-[10px] text-gray-500">
                            {product.quantitySold} × {netPerUnit.toFixed(0)}€
                            net{' '}
                            <span className="text-green-600 font-semibold">
                              → {encaissementNet.toFixed(0)}€ encaissés
                            </span>{' '}
                            <span className="text-gray-400">
                              (comm. LinkMe: {product.commissionHT.toFixed(0)}€)
                            </span>
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-500">
                            {product.quantitySold} × {pricePerUnit.toFixed(0)}€
                            HT{' '}
                            <span className="text-green-600 font-semibold">
                              → {product.revenueHT.toFixed(0)}€ HT
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

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

// ============================================
// Sub-components
// ============================================

/**
 * KPI Card for collaborateur — generic value (not currency-only)
 */
function CollaborateurKPICard({
  label,
  value,
  subtitle,
  icon: Icon,
  variant,
  isLoading = false,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: typeof ShoppingCart;
  variant: 'turquoise' | 'green' | 'blue' | 'orange';
  isLoading?: boolean;
}): JSX.Element {
  const VARIANT_STYLES = {
    turquoise: {
      border: 'border-l-[#5DBEBB]',
      iconBg: 'bg-[#5DBEBB]/10',
      iconColor: 'text-[#5DBEBB]',
      valueColor: 'text-[#5DBEBB]',
    },
    green: {
      border: 'border-l-emerald-500',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-600',
    },
    blue: {
      border: 'border-l-[#3976BB]',
      iconBg: 'bg-[#3976BB]/10',
      iconColor: 'text-[#3976BB]',
      valueColor: 'text-[#3976BB]',
    },
    orange: {
      border: 'border-l-amber-500',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-600',
    },
  } as const;

  const styles = VARIANT_STYLES[variant];

  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-100 border-l-4 ${styles.border} p-4 shadow-sm`}
      >
        <div className="flex items-center justify-center h-[72px]">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-100 border-l-4 ${styles.border} p-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.iconBg}`}
        >
          <Icon className={`h-4 w-4 ${styles.iconColor}`} />
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${styles.valueColor}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

/**
 * Selection share card for collaborateur dashboard
 */
function SelectionShareCard({
  selection,
}: {
  selection: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    products_count: number;
  };
}): JSX.Element {
  const [copied, setCopied] = useState(false);

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${selection.slug}`;

  const handleCopyLink = (): void => {
    void navigator.clipboard
      .writeText(publicUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((error: unknown) => {
        console.error('[SelectionShareCard] Copy failed:', error);
      });
  };

  const handleOpen = (): void => {
    window.open(`/s/${selection.slug}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="h-32 bg-gray-100 relative">
        {selection.image_url ? (
          <Image
            src={selection.image_url}
            alt={selection.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Star className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-linkme-marine text-sm truncate">
          {selection.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {selection.products_count} produit
          {selection.products_count > 1 ? 's' : ''}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleOpen}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-linkme-turquoise text-white rounded-lg text-xs font-medium hover:bg-linkme-turquoise/90 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ouvrir
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-xs font-medium transition-colors ${
              copied
                ? 'border-green-300 bg-green-50 text-green-600'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
