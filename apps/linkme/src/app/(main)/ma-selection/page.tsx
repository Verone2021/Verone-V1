'use client';

/**
 * Page Liste des Sélections LinkMe
 * Vue d'ensemble avec KPIs globaux et cartes cliquables
 *
 * Fonctionnalités :
 * - KPIs globaux (toutes sélections confondues)
 * - Top 5 produits vendus
 * - Cartes sélections cliquables → navigation vers détail
 * - Bouton création nouvelle sélection
 *
 * Accessible uniquement aux rôles: enseigne_admin, org_independante
 *
 * @module MaSelectionPage
 * @since 2025-12-10
 */

import { useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Star,
  Plus,
  Loader2,
  Package,
  Globe,
  Lock,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Eye,
  ChevronRight,
  BarChart3,
  Sparkles,
} from 'lucide-react';

import { useAuth, type LinkMeRole } from '../../../contexts/AuthContext';
import { useAffiliateAnalytics } from '../../../lib/hooks/use-affiliate-analytics';
import {
  useUserAffiliate,
  useUserSelections,
  type UserSelection,
} from '../../../lib/hooks/use-user-selection';
import { formatCurrency } from '../../../types/analytics';

// Rôles autorisés
const AUTHORIZED_ROLES: LinkMeRole[] = ['enseigne_admin', 'org_independante'];

export default function MaSelectionPage() {
  const router = useRouter();
  const { user, linkMeRole, loading: authLoading } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();
  const { data: analytics, isLoading: analyticsLoading } =
    useAffiliateAnalytics('month');

  // Vérifier les droits d'accès
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (!linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, linkMeRole, authLoading, router]);

  // Chargement
  if (authLoading || affiliateLoading || selectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">Chargement de vos sélections...</p>
        </div>
      </div>
    );
  }

  // Vérification accès
  if (!user || !linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
    return null;
  }

  // Pas encore d'affilié
  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Compte affilié non configuré
          </h1>
          <p className="text-gray-600 mb-6">
            Votre compte n'est pas encore configuré comme affilié LinkMe.
            Contactez votre administrateur pour activer cette fonctionnalité.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculs KPIs globaux
  const totalSelections = selections?.length || 0;
  const totalProducts =
    selections?.reduce((sum, s) => sum + s.products_count, 0) || 0;
  const totalRevenue =
    selections?.reduce((sum, s) => sum + s.total_revenue, 0) || 0;
  const totalOrders =
    selections?.reduce((sum, s) => sum + s.orders_count, 0) || 0;
  const totalViews =
    selections?.reduce((sum, s) => sum + s.views_count, 0) || 0;
  const publishedCount = selections?.filter(s => s.is_public).length || 0;

  // Top 5 produits (depuis analytics)
  const topProducts = analytics?.topProducts?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Mes sélections
              </h1>
              <p className="text-gray-600 text-sm">
                Gérez vos sélections de produits personnalisées
              </p>
            </div>
          </div>

          <Link
            href="/ma-selection/nouvelle"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle sélection
          </Link>
        </div>

        {/* KPIs Vue d'ensemble */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <BarChart3 className="h-4 w-4" />
            <h2 className="font-semibold text-sm">Vue d'ensemble</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {totalSelections}
              </div>
              <div className="text-xs text-gray-500">Sélections</div>
              <div className="text-[10px] text-green-600 mt-0.5">
                {publishedCount} publiées
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {totalProducts}
              </div>
              <div className="text-xs text-gray-500">Produits</div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(totalRevenue)}
              </div>
              <div className="text-xs text-gray-500">CA total HT</div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {totalOrders}
              </div>
              <div className="text-xs text-gray-500">Commandes</div>
            </div>
          </div>
        </div>

        {/* Top 5 Produits */}
        {topProducts.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-2 text-gray-700 mb-3">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold text-sm">Top 5 produits vendus</h2>
            </div>

            <div className="space-y-2">
              {topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full font-bold text-xs">
                    {index + 1}
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    {product.productImageUrl ? (
                      <img
                        src={product.productImageUrl}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-xs">
                      {product.productName}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {product.quantitySold} vendu
                      {product.quantitySold > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-xs">
                      {formatCurrency(product.revenueHT)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grille des sélections */}
        <div className="mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Vos sélections ({totalSelections})
          </h2>
        </div>

        {selections && selections.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {selections.map(selection => (
              <SelectionCard
                key={selection.id}
                selection={selection}
                affiliate={affiliate}
              />
            ))}

            {/* Carte "Créer" */}
            <Link
              href="/ma-selection/nouvelle"
              className="group flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-colors min-h-[140px]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors mb-2">
                <Plus className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <span className="text-gray-500 group-hover:text-blue-600 font-medium transition-colors text-sm">
                Nouvelle sélection
              </span>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Créez votre première sélection
            </h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto text-sm">
              Une sélection vous permet de regrouper des produits et de les
              partager avec vos clients.
            </p>
            <Link
              href="/ma-selection/nouvelle"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Créer ma première sélection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Composant SelectionCard
// ============================================================================

interface SelectionCardProps {
  selection: UserSelection;
  affiliate: any;
}

function SelectionCard({ selection, affiliate }: SelectionCardProps) {
  return (
    <Link
      href={`/ma-selection/${selection.id}`}
      className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all"
    >
      {/* Image header */}
      <div className="relative h-20 bg-gradient-to-br from-amber-100 to-orange-100">
        {selection.image_url ? (
          <img
            src={selection.image_url}
            alt={selection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Star className="h-6 w-6 text-amber-300" />
          </div>
        )}

        {/* Badge statut */}
        <div className="absolute top-1.5 right-1.5">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
              selection.is_public
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {selection.is_public ? (
              <>
                <Globe className="h-2.5 w-2.5" />
                Publiée
              </>
            ) : (
              <>
                <Lock className="h-2.5 w-2.5" />
                Brouillon
              </>
            )}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-2.5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate flex-1 text-sm">
            {selection.name}
          </h3>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-0.5 text-gray-500">
            <Package className="h-3 w-3" />
            <span>{selection.products_count}</span>
          </div>
          <div className="flex items-center gap-0.5 text-gray-500">
            <Eye className="h-3 w-3" />
            <span>{selection.views_count}</span>
          </div>
          <div className="flex items-center gap-0.5 text-emerald-600 font-medium ml-auto">
            <span>{formatCurrency(selection.total_revenue)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
