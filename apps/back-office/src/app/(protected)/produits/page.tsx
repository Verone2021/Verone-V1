'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  FolderKanban,
  Grid3x3,
  Loader2,
  Package,
  PackageX,
  Plus,
  Store,
  Tags,
} from 'lucide-react';

import {
  getProductCompleteness,
  type ProductCompleteness,
} from './actions/get-product-completeness';

export default function ProduitsPage() {
  const router = useRouter();
  const [data, setData] = useState<ProductCompleteness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getProductCompleteness()
      .then(setData)
      .catch((err: unknown) => console.error('[Produits] Load failed:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  if (!data) return null;

  const totalAlerts =
    data.missingPhotos +
    data.missingDescription +
    data.missingCategory +
    data.missingMetaDescription +
    data.activeNoStock +
    data.draft +
    data.stockAlerts;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header + Navigation rapide */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Produits</h1>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <Link
                href="/produits/catalogue"
                className="text-gray-500 hover:text-gray-900"
              >
                Catalogue
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/produits/sourcing"
                className="text-gray-500 hover:text-gray-900"
              >
                Sourcing
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/produits/catalogue/variantes"
                className="text-gray-500 hover:text-gray-900"
              >
                Variantes
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/produits/catalogue/collections"
                className="text-gray-500 hover:text-gray-900"
              >
                Collections
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/produits/catalogue/categories"
                className="text-gray-500 hover:text-gray-900"
              >
                Categories
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/produits/affilies"
                className="text-gray-500 hover:text-gray-900"
              >
                Produits affilies
              </Link>
            </div>
          </div>
          <button
            onClick={() => router.push('/produits/catalogue/create')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau Produit
          </button>
        </div>

        {/* Alertes - A traiter */}
        {totalAlerts > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-900">
                A traiter ({totalAlerts})
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {data.missingPhotos > 0 && (
                <Link
                  href="/produits/catalogue?tab=incomplete&missing=photo"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{data.missingPhotos}</strong> produit(s) sans
                      photo
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
              {data.missingDescription > 0 && (
                <Link
                  href="/produits/catalogue?tab=incomplete"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{data.missingDescription}</strong> produit(s) sans
                      description
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
              {data.activeNoStock > 0 && (
                <Link
                  href="/produits/catalogue?statuses=active&tab=all"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{data.activeNoStock}</strong> produit(s) actif(s)
                      sans stock
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
              {data.draft > 0 && (
                <Link
                  href="/produits/catalogue?statuses=draft&tab=all"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{data.draft}</strong> produit(s) en brouillon
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
              {data.missingCategory > 0 && (
                <Link
                  href="/produits/catalogue?tab=incomplete"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{data.missingCategory}</strong> produit(s) sans
                      categorie
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
              {data.missingMetaDescription > 0 && (
                <Link
                  href="/produits/catalogue?tab=incomplete"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{data.missingMetaDescription}</strong> produit(s)
                      sans meta description SEO
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
              {data.stockAlerts > 0 && (
                <Link
                  href="/stocks"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{data.stockAlerts}</strong> alerte(s) stock
                      critique(s)
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* KPIs compacts */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Total produits
            </p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              {data.total}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Actifs
            </p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              {data.active}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Sans prix de vente
            </p>
            <p className="text-lg font-bold text-orange-600 mt-0.5">
              {data.missingSellPrice}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Sans photo
            </p>
            <p className="text-lg font-bold text-orange-600 mt-0.5">
              {data.missingPhotos}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Completude moy.
            </p>
            <p
              className={`text-lg font-bold mt-0.5 ${data.avgCompletion >= 80 ? 'text-green-600' : data.avgCompletion >= 50 ? 'text-orange-600' : 'text-red-600'}`}
            >
              {data.avgCompletion}%
            </p>
          </div>
        </div>

        {/* Sections grille 2x2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Catalogue */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Catalogue
                </h2>
              </div>
              <Link
                href="/produits/catalogue"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir tout →
              </Link>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/produits/catalogue"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">
                  {data.active} produits actifs
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/produits/catalogue?statuses=draft&tab=all"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">
                  {data.draft} en brouillon
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/produits/catalogue?tab=incomplete&missing=photo"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">
                  {data.missingPhotos} sans photo
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Sourcing */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Sourcing
                </h2>
              </div>
              <Link
                href="/produits/sourcing"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir tout →
              </Link>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/produits/sourcing"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">
                  {data.draft} produit(s) a sourcer
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/produits/catalogue?tab=incomplete&missing=price"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">
                  {data.missingCostPrice} sans prix d&apos;achat
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Collections & Variantes */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Collections & Variantes
                </h2>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/produits/catalogue/collections"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Collections thematiques
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/produits/catalogue/variantes"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Boxes className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Groupes de variantes
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/produits/catalogue/categories"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Tags className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Categories & taxonomie
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Produits Affilies */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-purple-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Produits Affilies
                </h2>
              </div>
              <Link
                href="/produits/affilies"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Gerer →
              </Link>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/produits/affilies"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">
                  Approbations produits affilies
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/canaux-vente/linkme/catalogue"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">Catalogue LinkMe</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Stock */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageX className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">Stock</h2>
              </div>
              <Link
                href="/stocks"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir tout →
              </Link>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/stocks"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">
                  {data.activeNoStock} actif(s) sans stock
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/stocks"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">
                  {data.stockAlerts} alerte(s) stock
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
