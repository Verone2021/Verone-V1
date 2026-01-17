'use client';

import { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  DollarSign,
  Percent,
  Package,
  Tag,
  Info,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface CategoryCommission {
  id: string;
  name: string;
  linkMeCommissionRate: number;
  maxAffiliateMarginRate: number | null;
  productCount: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const CATEGORY_COMMISSIONS: CategoryCommission[] = [
  {
    id: '1',
    name: 'Mobilier',
    linkMeCommissionRate: 5,
    maxAffiliateMarginRate: 15,
    productCount: 124,
  },
  {
    id: '2',
    name: 'Luminaires',
    linkMeCommissionRate: 8,
    maxAffiliateMarginRate: 20,
    productCount: 87,
  },
  {
    id: '3',
    name: 'Décoration',
    linkMeCommissionRate: 10,
    maxAffiliateMarginRate: 25,
    productCount: 203,
  },
  {
    id: '4',
    name: 'Textiles',
    linkMeCommissionRate: 12,
    maxAffiliateMarginRate: 30,
    productCount: 56,
  },
  {
    id: '5',
    name: 'Art & Objets',
    linkMeCommissionRate: 6,
    maxAffiliateMarginRate: null,
    productCount: 34,
  },
];

// ============================================================================
// Category Row
// ============================================================================

interface CategoryRowProps {
  category: CategoryCommission;
}

function CategoryRow({ category }: CategoryRowProps) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group">
      <div className="p-2 rounded-lg bg-gray-100">
        <Tag className="h-4 w-4 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
          <span className="text-xs text-gray-400">
            {category.productCount} produits
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6 shrink-0">
        <div className="text-right">
          <p className="text-xs text-gray-500">Commission LinkMe</p>
          <p className="text-sm font-semibold text-emerald-600">
            {category.linkMeCommissionRate}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Marge max affilié</p>
          <p className="text-sm font-semibold text-blue-600">
            {category.maxAffiliateMarginRate !== null
              ? `${category.maxAffiliateMarginRate}%`
              : 'Non définie'}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function CommissionsConfigPage() {
  const [categories] = useState<CategoryCommission[]>(CATEGORY_COMMISSIONS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Configuration des commissions
        </h1>
        <p className="text-sm text-gray-500">
          Gérez les taux de commission LinkMe par catégorie de produits
        </p>
      </div>

      {/* Info Banner - Important */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">
            Comment fonctionnent les commissions LinkMe
          </p>
          <p className="text-blue-700 mt-1">
            Les commissions LinkMe sont calculées sur le{' '}
            <strong>prix de vente du catalogue général</strong>, pas sur la
            marge ou la différence de prix. Chaque produit peut avoir un taux
            spécifique défini dans sa fiche produit.
          </p>
        </div>
      </div>

      {/* Commission by Category */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Taux par catégorie</CardTitle>
              <CardDescription>
                Taux par défaut appliqués aux produits de chaque catégorie
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune catégorie configurée</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {categories.map(category => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Calcul des commissions</CardTitle>
              <CardDescription>
                Comprendre le calcul des commissions affiliés
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Commission LinkMe
              </h4>
              <p className="text-xs text-gray-600">
                Pourcentage prélevé par LinkMe sur chaque vente. Calculé sur le
                prix de vente catalogue général du produit.
              </p>
              <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                <code className="text-xs text-gray-700">
                  Commission = Prix catalogue × Taux LinkMe
                </code>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Marge affilié
              </h4>
              <p className="text-xs text-gray-600">
                L&apos;affilié peut appliquer une marge sur le prix de vente,
                limitée par le plafond défini (si existant). Cette marge
                constitue sa rémunération.
              </p>
              <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                <code className="text-xs text-gray-700">
                  Gain affilié = Prix vente - Prix catalogue - Commission
                </code>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <h4 className="text-sm font-semibold text-emerald-900 mb-2">
              Exemple concret
            </h4>
            <div className="text-xs text-emerald-800 space-y-1">
              <p>
                Prix catalogue : <strong>1 000 €</strong>
              </p>
              <p>
                Commission LinkMe (5%) : <strong>50 €</strong>
              </p>
              <p>
                Prix de vente affilié : <strong>1 150 €</strong> (+15%)
              </p>
              <p>
                Gain affilié : 1 150 € - 1 000 € - 50 € = <strong>100 €</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Configuration avancée à venir</p>
          <p className="text-amber-700 mt-1">
            La modification des taux par catégorie et la création de grilles
            tarifaires personnalisées seront disponibles dans une prochaine
            version. Pour l&apos;instant, les taux sont définis individuellement
            sur chaque fiche produit.
          </p>
        </div>
      </div>
    </div>
  );
}
