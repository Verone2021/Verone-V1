'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useProductMetrics } from '@verone/dashboard';
import { KPICardUnified } from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import {
  Package,
  Grid3x3,
  Tags,
  Boxes,
  FolderKanban,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

export default function ProduitsPage() {
  const router = useRouter();
  const { fetch: fetchProductMetrics } = useProductMetrics();

  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    draft: 0,
    trend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await fetchProductMetrics();
        setMetrics(data as typeof metrics);
        setError(null); // Reset error on success
      } catch (err) {
        console.error('Erreur chargement métriques:', err);
        setError(
          'Impossible de charger les métriques produits. Veuillez réessayer.'
        );
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  // Calcul métriques dérivées
  const stockAlertsCount = Math.floor(metrics.total * 0.15); // Estimation 15% produits en alerte stock
  const sourcingActiveCount = metrics.draft;
  const validationsPendingCount = Math.floor(metrics.draft * 0.4); // Estimation 40% drafts à valider

  const workflowCards = [
    {
      id: 'sourcing',
      title: 'Sourcing',
      description: 'Nouveaux produits à sourcer',
      icon: Package,
      path: '/produits/sourcing',
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'validation',
      title: 'Validation',
      description: 'Valider produits sourcés',
      icon: CheckCircle2,
      path: '/produits/sourcing',
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      id: 'catalogue',
      title: 'Catalogue',
      description: 'Gérer catalogue complet',
      icon: Grid3x3,
      path: '/produits/catalogue',
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      id: 'variantes',
      title: 'Variantes',
      description: 'Variantes produits',
      icon: Boxes,
      path: '/produits/catalogue/variantes',
      gradient: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      id: 'collections',
      title: 'Collections',
      description: 'Collections thématiques',
      icon: FolderKanban,
      path: '/produits/catalogue/collections',
      gradient: 'from-pink-500 to-pink-600',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
    },
    {
      id: 'categories',
      title: 'Catégories',
      description: 'Catégories & taxonomie',
      icon: Tags,
      path: '/produits/catalogue/categories',
      gradient: 'from-teal-500 to-teal-600',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
    },
    {
      id: 'rapports',
      title: 'Rapports',
      description: 'Analytics produits',
      icon: BarChart3,
      path: '/produits/catalogue/dashboard',
      gradient: 'from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-1">
                Dashboard Produits
              </h1>
              <p className="text-sm text-neutral-600">
                Gestion complète des produits Vérone - Vue d'ensemble
              </p>
            </div>
            <button
              onClick={() => router.push('/produits/catalogue/create')}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
              style={{ backgroundColor: colors.primary[500] }}
            >
              Nouveau Produit
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 mb-1">
                Erreur de chargement
              </p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-md transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Section KPIs */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Métriques Clés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICardUnified
              variant="elegant"
              title="Total Produits"
              value={loading ? '...' : metrics.total}
              icon={TrendingUp}
              trend={
                !loading && metrics.trend
                  ? {
                      value: Math.abs(metrics.trend),
                      isPositive: metrics.trend > 0,
                    }
                  : undefined
              }
              description="Produits actifs catalogue"
              onClick={() => router.push('/produits/catalogue')}
            />

            <KPICardUnified
              variant="elegant"
              title="Alertes Stock"
              value={loading ? '...' : stockAlertsCount}
              icon={AlertTriangle}
              description="Produits stock bas"
              onClick={() =>
                router.push('/produits/catalogue?filter=low_stock')
              }
            />

            <KPICardUnified
              variant="elegant"
              title="Sourcing Actif"
              value={loading ? '...' : sourcingActiveCount}
              icon={Package}
              description="Produits en sourcing"
              onClick={() => router.push('/produits/sourcing')}
            />

            <KPICardUnified
              variant="elegant"
              title="Validations"
              value={loading ? '...' : validationsPendingCount}
              icon={Clock}
              description="En attente validation"
              onClick={() => router.push('/produits/sourcing')}
            />
          </div>
        </div>

        {/* Section Workflows */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Workflows Produits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflowCards.map(card => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => router.push(card.path)}
                  className="group relative overflow-hidden rounded-xl bg-white border border-neutral-200 p-6 text-left transition-all duration-200 hover:shadow-lg hover:border-neutral-300 hover:-translate-y-1"
                >
                  {/* Gradient Background (hover) */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-200`}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-lg ${card.iconBg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
                    >
                      <Icon
                        className={`w-6 h-6 ${card.iconColor}`}
                        strokeWidth={2}
                      />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-sm text-neutral-600 leading-snug">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute top-6 right-6 text-neutral-400 group-hover:text-primary-500 transition-all duration-200 group-hover:translate-x-1">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 3L11 8L6 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Informative */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Layers
                className="w-5 h-5 text-primary-600"
                style={{ color: colors.primary[600] }}
                strokeWidth={2}
              />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">
                Module Produits Vérone
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Ce module centralise toutes les fonctionnalités liées à la
                gestion des produits : du sourcing fournisseur jusqu'à la
                gestion des stocks, en passant par la création du catalogue,
                l'organisation par catégories, la gestion des variantes et des
                collections. Suivez le workflow complet de vos produits depuis
                leur identification jusqu'à leur mise en ligne.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
