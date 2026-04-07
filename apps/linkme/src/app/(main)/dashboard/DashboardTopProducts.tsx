'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Award, Package, Loader2, ArrowRight } from 'lucide-react';

type TopProduct = {
  productId: string;
  productName: string;
  productImageUrl: string | null;
  quantitySold: number;
  revenueHT: number;
  commissionHT: number;
};

type DashboardTopProductsProps = {
  topProductsCatalogue: TopProduct[];
  topProductsRevendeur: TopProduct[];
  isLoading: boolean;
  canViewCommissions: boolean;
};

/**
 * Section "Top Produits" — 2 panneaux côte à côte : Catalogue + Revendeur
 */
export function DashboardTopProducts({
  topProductsCatalogue,
  topProductsRevendeur,
  isLoading,
  canViewCommissions,
}: DashboardTopProductsProps): JSX.Element {
  return (
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
                  {canViewCommissions ? 'Marge gagnée' : 'Quantités vendues'}
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
              <p className="text-gray-500 text-xs">Aucune vente catalogue</p>
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
                        {product.quantitySold} × {commissionPerUnit.toFixed(0)}€{' '}
                        <span className="text-linkme-turquoise font-semibold">
                          → {product.commissionHT.toFixed(0)}€
                        </span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-500">
                        {product.quantitySold} × {pricePerUnit.toFixed(0)}€ HT{' '}
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
              const encaissementNet = product.revenueHT - product.commissionHT;
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
                        {product.quantitySold} × {netPerUnit.toFixed(0)}€ net{' '}
                        <span className="text-green-600 font-semibold">
                          → {encaissementNet.toFixed(0)}€ encaissés
                        </span>{' '}
                        <span className="text-gray-400">
                          (comm. LinkMe: {product.commissionHT.toFixed(0)}€)
                        </span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-500">
                        {product.quantitySold} × {pricePerUnit.toFixed(0)}€ HT{' '}
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
  );
}
