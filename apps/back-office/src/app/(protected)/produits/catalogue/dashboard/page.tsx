/**
 * 🎯 VÉRONE - Dashboard Produits Principal
 *
 * Dashboard optimisé selon Best Practices UX 2025
 * - Workflows groupés logiquement
 * - Progressive disclosure
 * - Speed to insight <5 secondes
 */

'use client';

import { useState, useEffect, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { useProducts } from '@verone/products';
import { Badge } from '@verone/ui';
import { KPICardUnified } from '@verone/ui';
import {
  Target,
  CheckCircle,
  Grid3x3,
  Boxes,
  FolderKanban,
  Tags,
  Truck,
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
} from 'lucide-react';

// Champs obligatoires pour calculer le taux de complétion
const REQUIRED_PRODUCT_FIELDS = [
  'name',
  'sku',
  'supplier_id',
  'subcategory_id',
  'cost_price',
  'description',
] as const;

// Fonction pour calculer la complétion d'un produit
function calculateProductCompletion(product: any): number {
  const filledFields = REQUIRED_PRODUCT_FIELDS.filter(field => {
    const value = product[field];
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined && value !== 0;
  });

  return Math.round(
    (filledFields.length / REQUIRED_PRODUCT_FIELDS.length) * 100
  );
}

export default function DashboardProduitsPage() {
  const router = useRouter();
  const { products, loading: productsLoading } = useProducts();

  // 📊 Calcul des métriques KPIs
  const metrics = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        catalogueCount: 0,
        sourcingCount: 0,
        completionRate: 0,
        weekGrowth: 0,
      };
    }

    // Produits Catalogue : actifs disponibles à la vente
    const catalogueCount = products.filter(p =>
      ['in_stock', 'preorder', 'coming_soon', 'pret_a_commander'].includes(
        p.status
      )
    ).length;

    // En Sourcing : produits en phase de sourcing
    const sourcingCount = products.filter(p =>
      ['sourcing', 'echantillon_a_commander'].includes(p.status)
    ).length;

    // Taux Complétion : moyenne de complétion de tous les produits
    const completionRates = products.map(p => calculateProductCompletion(p));
    const completionRate = Math.round(
      completionRates.reduce((sum, rate) => sum + rate, 0) /
        completionRates.length
    );

    // Croissance Semaine : produits ajoutés dans les 7 derniers jours
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekGrowth = products.filter(
      p => new Date(p.created_at) >= weekAgo
    ).length;

    return { catalogueCount, sourcingCount, completionRate, weekGrowth };
  }, [products]);

  // 🎯 Configuration des workflow cards avec compteurs dynamiques
  const workflowSections = useMemo(
    () => [
      {
        title: 'Recherche Produit',
        description: 'Sourcing et validation des nouveaux produits',
        cards: [
          {
            id: 'sourcing',
            title: 'Sourcing',
            description: 'Nouveaux produits à sourcer',
            icon: Target,
            path: '/produits/sourcing',
            gradient: 'from-blue-500 to-blue-600',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            badge: metrics.sourcingCount,
          },
          {
            id: 'validation',
            title: 'Validation',
            description: 'Valider produits sourcés',
            icon: CheckCircle,
            path: '/produits/sourcing',
            gradient: 'from-green-500 to-green-600',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            badge: Math.floor(metrics.sourcingCount * 0.4), // Estimation 40% prêts à valider
          },
        ],
      },
      {
        title: 'Catalogue & Taxonomie',
        description: 'Organisation et gestion du catalogue produits',
        cards: [
          {
            id: 'catalogue',
            title: 'Catalogue',
            description: 'Vue complète des produits',
            icon: Grid3x3,
            path: '/produits/catalogue',
            gradient: 'from-purple-500 to-purple-600',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            badge: undefined,
          },
          {
            id: 'variantes',
            title: 'Variantes',
            description: 'Groupes de variantes',
            icon: Boxes,
            path: '/produits/catalogue/variantes',
            gradient: 'from-orange-500 to-orange-600',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            badge: undefined,
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
            badge: undefined,
          },
          {
            id: 'categories',
            title: 'Catégories',
            description: 'Taxonomie produits',
            icon: Tags,
            path: '/produits/catalogue/categories',
            gradient: 'from-teal-500 to-teal-600',
            iconBg: 'bg-teal-100',
            iconColor: 'text-teal-600',
            badge: undefined,
          },
        ],
      },
      {
        title: 'Partenaires',
        description: 'Gestion des fournisseurs produits',
        cards: [
          {
            id: 'fournisseurs',
            title: 'Fournisseurs',
            description: 'Gérer les fournisseurs',
            icon: Truck,
            path: '/contacts-organisations/suppliers',
            gradient: 'from-indigo-500 to-indigo-600',
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
            badge: undefined,
          },
        ],
      },
    ],
    [metrics]
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-1">
                Dashboard Produits
              </h1>
              <p className="text-sm text-neutral-600">
                Vue d'ensemble et workflows - Gestion complète des produits
                Vérone
              </p>
            </div>
            <button
              onClick={() => router.push('/produits/catalogue/create')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
              title="Créer un nouveau produit"
            >
              <Plus className="w-4 h-4" />
              Nouveau Produit
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="w-full px-6 py-6 space-y-8">
        {/* Section KPIs */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Métriques Clés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICardUnified
              variant="elegant"
              title="Produits Catalogue"
              value={productsLoading ? '...' : metrics.catalogueCount}
              icon={Package}
              description="Disponibles à la vente"
              onClick={() => router.push('/produits/catalogue')}
            />

            <KPICardUnified
              variant="elegant"
              title="En Sourcing"
              value={productsLoading ? '...' : metrics.sourcingCount}
              icon={Target}
              description="Sourcing + Validation"
              onClick={() => router.push('/produits/sourcing')}
            />

            <KPICardUnified
              variant="elegant"
              title="Taux Complétion"
              value={productsLoading ? '...' : `${metrics.completionRate}%`}
              icon={TrendingUp}
              description="Données produits complètes"
              onClick={() => router.push('/produits/catalogue')}
            />

            <KPICardUnified
              variant="elegant"
              title="Croissance Semaine"
              value={productsLoading ? '...' : `+${metrics.weekGrowth}`}
              icon={TrendingUp}
              trend={
                metrics.weekGrowth > 0
                  ? {
                      value: metrics.weekGrowth,
                      isPositive: true,
                    }
                  : undefined
              }
              description="Nouveaux produits 7j"
              onClick={() => router.push('/produits/catalogue')}
            />
          </div>
        </div>

        {/* Sections Workflows */}
        {workflowSections.map(section => (
          <div key={section.title}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {section.title}
              </h2>
              <p className="text-sm text-neutral-600 mt-0.5">
                {section.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.cards.map(card => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    onClick={() => router.push(card.path)}
                    className="group relative overflow-hidden rounded-xl bg-white border border-neutral-200 p-3 text-left transition-all duration-200 hover:shadow-lg hover:border-neutral-300 hover:-translate-y-1"
                    title={`Accéder à ${card.title}`}
                  >
                    {/* Gradient Background (hover) */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-200`}
                      aria-hidden="true"
                    />

                    {/* Content */}
                    <div className="relative z-10 flex items-start gap-2">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
                      >
                        <Icon
                          className={`w-4 h-4 ${card.iconColor}`}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                            {card.title}
                          </h3>
                          {card.badge !== undefined && card.badge > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-0.5"
                            >
                              {card.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 leading-snug">
                          {card.description}
                        </p>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute top-3 right-3 text-neutral-400 group-hover:text-blue-600 transition-all duration-200 group-hover:translate-x-1">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
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
        ))}
      </div>
    </div>
  );
}
