'use client';

/**
 * Dashboard LinkMe - Version Minimaliste
 *
 * Design épuré avec :
 * - Section héros avec Globe 3D interactif
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
 * @updated 2026-01-06 - Ajout section héros avec Globe 3D
 */

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  useMonthlyKPIs,
  formatVariation,
  getVariationColor,
} from '@verone/orders/hooks/use-monthly-kpis';
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

import { ImageSphere, type GlobeImage } from '@/components/ui/ImageSphere';

import { useAuth } from '../../../contexts/AuthContext';
import { useAffiliateAnalytics } from '../../../lib/hooks/use-affiliate-analytics';
import {
  useUserAffiliate,
  useUserSelections,
} from '../../../lib/hooks/use-user-selection';

// Images de démo pour le globe (fallback)
const DEMO_GLOBE_IMAGES: GlobeImage[] = [
  { id: '1', url: '/logo-linkme.png', alt: 'LinkMe', type: 'organisation' },
  { id: '2', url: '/logo-linkme.png', alt: 'LinkMe', type: 'organisation' },
  { id: '3', url: '/logo-linkme.png', alt: 'LinkMe', type: 'organisation' },
  { id: '4', url: '/logo-linkme.png', alt: 'LinkMe', type: 'organisation' },
];

// Type pour la réponse API
type GlobeApiItem = {
  id: string;
  name: string;
  image_url: string;
  item_type: 'product' | 'organisation';
};

export default function DashboardPage(): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, loading } = useAuth();

  // État pour les images du globe
  const [globeImages, setGlobeImages] =
    useState<GlobeImage[]>(DEMO_GLOBE_IMAGES);

  // Configuration de la page (globe, etc.)
  const [pageConfig, setPageConfig] = useState<{
    globe_enabled: boolean;
    globe_rotation_speed: number;
  }>({ globe_enabled: true, globe_rotation_speed: 0.002 });

  // Affiliate ID pour les requêtes
  const { data: affiliate } = useUserAffiliate();

  // KPIs mensuels avec variations (hook partagé - source de vérité)
  const { data: monthlyKPIs, isLoading: kpisLoading } = useMonthlyKPIs({
    affiliateId: affiliate?.id,
    enabled: !!affiliate?.id,
  });

  // Analytics pour les commissions en attente uniquement (basé sur statut)
  const { data: analytics, isLoading: analyticsLoading } =
    useAffiliateAnalytics('year');

  const { data: selections } = useUserSelections();

  // Charger la configuration de la page
  useEffect(() => {
    async function loadPageConfig(): Promise<void> {
      try {
        const response = await fetch('/api/page-config/dashboard');
        if (response.ok) {
          const data = (await response.json()) as {
            globe_enabled: boolean;
            globe_rotation_speed: number;
          };
          setPageConfig({
            globe_enabled: data.globe_enabled ?? true,
            globe_rotation_speed: data.globe_rotation_speed ?? 0.002,
          });
        }
      } catch {
        // Garder la config par défaut si l'API échoue
      }
    }
    void loadPageConfig();
  }, []);

  // Charger les images du globe depuis l'API
  useEffect(() => {
    async function loadGlobeImages(): Promise<void> {
      try {
        const response = await fetch('/api/globe-items');
        if (response.ok) {
          const data = (await response.json()) as { items: GlobeApiItem[] };
          if (data.items && data.items.length > 0) {
            setGlobeImages(
              data.items.map((item: GlobeApiItem) => ({
                id: item.id,
                url: item.image_url,
                alt: item.name,
                type: item.item_type,
              }))
            );
          }
        }
      } catch {
        // Garder les images de démo si l'API échoue
      }
    }
    void loadGlobeImages();
  }, []);

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

  // Données analytics - commissions en attente (basé sur statut)
  const pendingCommissions = analytics?.pendingCommissionsTTC ?? 0;

  // Données mensuelles (depuis le hook partagé - vraies dates)
  const monthlyOrders = monthlyKPIs?.currentMonth.ordersCount ?? 0;
  const monthlyRevenue = monthlyKPIs?.currentMonth.caHT ?? 0;
  const monthlyCommissions = monthlyKPIs?.currentMonth.commissionsTTC ?? 0;
  const ordersVariation = monthlyKPIs?.variations.ordersCount ?? 0;

  // Sélections (published_at !== null = publiée)
  const selectionsCount = selections?.filter(s => !!s.published_at).length ?? 0;

  // Loading state combiné
  const isLoading = analyticsLoading || kpisLoading;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Section Héros avec Globe 3D */}
        <section className="relative h-48 sm:h-56 bg-gradient-to-r from-linkme-marine via-linkme-royal to-linkme-marine rounded-2xl overflow-hidden mb-6">
          {/* Fond avec motif subtil */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Globe 3D (côté droit, desktop only) - Conditionné par config */}
          {pageConfig.globe_enabled && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 hidden sm:block">
              <ImageSphere
                images={globeImages}
                size={200}
                autoRotate
                rotationSpeed={pageConfig.globe_rotation_speed}
                className="opacity-80"
              />
            </div>
          )}

          {/* Contenu texte */}
          <div className="relative z-10 h-full flex items-center p-6 sm:p-8">
            <div className="max-w-xs sm:max-w-sm">
              <h1 className="text-white text-xl sm:text-2xl font-bold mb-1">
                Bonjour, {firstName}
              </h1>
              <p className="text-white/70 text-sm sm:text-base">
                Bienvenue sur votre espace LinkMe
              </p>
            </div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-linkme-marine/50 via-transparent to-transparent z-0" />
        </section>

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
                {isLoading ? (
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
            href="/commandes"
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
              {monthlyOrders > 0
                ? `${monthlyOrders} commande${monthlyOrders > 1 ? 's' : ''} ce mois`
                : 'Aucune commande ce mois'}
              {monthlyOrders > 0 && ordersVariation !== 0 && (
                <span className={`ml-1 ${getVariationColor(ordersVariation)}`}>
                  ({formatVariation(ordersVariation)})
                </span>
              )}
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
                {isLoading
                  ? '--'
                  : `${monthlyRevenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Chiffre d'affaires HT
              </p>
            </div>

            {/* Commissions */}
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {isLoading
                  ? '--'
                  : `${monthlyCommissions.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`}
              </div>
              <p className="text-xs text-gray-500 mt-1">Commissions TTC</p>
            </div>

            {/* Commandes */}
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {isLoading ? '--' : monthlyOrders}
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
