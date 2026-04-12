/**
 * CategoriesSection - Arborescence categories du site internet
 *
 * Affiche automatiquement Famille -> Categorie -> Sous-categorie
 * filtrees par produits publies. Source de verite = catalogue back-office.
 * Pas de gestion manuelle — si un produit est publie, sa categorie apparait.
 */

'use client';

import { useState } from 'react';

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  FolderTree,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Tag,
  Package,
  Loader2,
} from 'lucide-react';

import { useSiteInternetCategories } from '../hooks/use-site-internet-categories';

import type {
  SiteFamily,
  SiteCategory,
  SiteSubcategory,
} from '../hooks/use-site-internet-categories';

export function CategoriesSection() {
  const { data, isLoading } = useSiteInternetCategories();
  const tree = data?.tree ?? [];
  const stats = data?.stats;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Familles" value={stats?.families ?? 0} />
        <StatCard label="Categories" value={stats?.categories ?? 0} />
        <StatCard label="Sous-categories" value={stats?.subcategories ?? 0} />
        <StatCard label="Produits publies" value={stats?.totalPublished ?? 0} />
      </div>

      {/* Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Arborescence du site
          </CardTitle>
          <CardDescription>
            Affichage automatique base sur les produits publies. Modifiez les
            categories depuis le catalogue back-office.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tree.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              Aucune categorie avec des produits publies.
            </p>
          ) : (
            <div className="space-y-1">
              {tree.map(family => (
                <FamilyRow key={family.id} family={family} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FolderTree className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Source de verite unique
              </p>
              <p className="text-sm text-blue-800">
                Cette arborescence se met a jour automatiquement quand vous
                publiez ou depubliez des produits. Pour modifier les categories,
                utilisez le module <strong>Catalogue &gt; Categories</strong> du
                back-office.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function FamilyRow({ family }: { family: SiteFamily }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
        <Folder className="h-4 w-4 text-amber-500" />
        <span className="font-semibold text-gray-900">{family.name}</span>
        <Badge variant="outline" className="ml-auto text-xs">
          {family.publishedCount} produits
        </Badge>
      </button>
      {expanded && (
        <div className="ml-6 space-y-0.5">
          {family.categories.map(cat => (
            <CategoryRow key={cat.id} category={cat} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryRow({ category }: { category: SiteCategory }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        )}
        <FolderOpen className="h-4 w-4 text-blue-500" />
        <span className="font-medium text-gray-800">{category.name}</span>
        {category.slug && (
          <span className="text-xs text-gray-400">/{category.slug}</span>
        )}
        <Badge variant="outline" className="ml-auto text-xs">
          {category.publishedCount}
        </Badge>
      </button>
      {expanded && (
        <div className="ml-6 space-y-0.5">
          {category.subcategories.map(sub => (
            <SubcategoryRow key={sub.id} subcategory={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubcategoryRow({ subcategory }: { subcategory: SiteSubcategory }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50">
      <Tag className="h-3.5 w-3.5 text-gray-400" />
      <span className="text-sm text-gray-700">{subcategory.name}</span>
      {subcategory.slug && (
        <span className="text-xs text-gray-400">/{subcategory.slug}</span>
      )}
      <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
        <Package className="h-3 w-3" />
        {subcategory.publishedCount}
      </div>
    </div>
  );
}
