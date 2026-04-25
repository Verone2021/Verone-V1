'use client';

/**
 * Page Détail Produit Catalogue LinkMe (app affilié)
 *
 * Affiche un produit du catalogue Vérone avec :
 * - Header (image, nom, catégorie)
 * - Pricing affilié (prix vente HT + commission plateforme + prix client estimé)
 * - Caractéristiques publiques (description, points de vente)
 * - Bouton "Ajouter à ma sélection" (réutilise AddToSelectionModal existant)
 *
 * URL : /catalogue/[id] où [id] = channel_pricing.id (id du produit côté LinkMe)
 *
 * @module CatalogueProductDetailPage
 * @since 2026-04-25
 * @task LM-CAT-DETAIL-001
 */

import { useMemo, useState, use } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Package,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react';

import { AddToSelectionModal } from '@/components/catalogue/AddToSelectionModal';
import { useAuth, type LinkMeRole } from '@/contexts/AuthContext';
import {
  useCatalogProduct,
  type LinkMeCatalogProduct,
} from '@/lib/hooks/use-linkme-catalog';
import { cn } from '@/lib/utils';

const ROLES_CAN_ADD: ReadonlySet<LinkMeRole> = new Set<LinkMeRole>([
  'enseigne_admin',
  'organisation_admin',
  'enseigne_collaborateur',
]);

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CatalogueProductDetailPage({
  params,
}: PageProps): JSX.Element {
  const { id } = use(params);
  const { user, linkMeRole, loading: authLoading } = useAuth();
  const { data: product, isLoading, error } = useCatalogProduct(id);
  const [showAddModal, setShowAddModal] = useState(false);

  const canAddToSelection =
    !!user && !!linkMeRole && ROLES_CAN_ADD.has(linkMeRole.role);

  // Adapte le résultat de useCatalogProduct (object enrichi par hook) au shape
  // LinkMeCatalogProduct attendu par AddToSelectionModal.
  const productForModal: LinkMeCatalogProduct | null = useMemo(() => {
    if (!product) return null;
    return {
      id: product.id,
      product_id: product.product_id,
      name: product.name,
      reference: product.reference,
      description: product.description,
      custom_title: null,
      custom_description: product.description,
      custom_selling_points: product.selling_points ?? null,
      selling_price_ht: product.selling_price_ht,
      public_price_ht: product.public_price_ht,
      channel_commission_rate: null,
      image_url: product.image_url,
      is_featured: product.is_featured,
      subcategory_id: null,
      subcategory_name: null,
      category_name: null,
      family_name: null,
      supplier_name: null,
      stock_real: product.stock_real,
      enseigne_id: null,
      assigned_client_id: null,
      is_custom: false,
      is_sourced: false,
      created_by_affiliate: null,
      style: null,
      suitable_rooms: null,
    };
  }, [product]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-12 w-12 text-linkme-turquoise animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Chargement du produit…</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-linkme-marine">
            Produit introuvable
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Ce produit n&apos;existe pas ou n&apos;est plus disponible dans le
            catalogue LinkMe.
          </p>
          <Link
            href="/catalogue"
            className="mt-4 inline-flex items-center gap-2 text-sm text-linkme-turquoise hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const sellingPoints = product.selling_points ?? [];

  return (
    <div className="min-h-screen bg-gray-50/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Back link */}
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-linkme-turquoise mb-4 lg:mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Image gallery */}
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className="relative aspect-square">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Package className="h-16 w-16 text-gray-200" />
                </div>
              )}
              {product.is_featured && (
                <span className="absolute top-4 left-4 inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">
                  <Star className="h-3 w-3 fill-current" />
                  Vedette
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                Réf. {product.reference}
              </p>
              <h1 className="text-2xl lg:text-3xl font-semibold text-linkme-marine">
                {product.name}
              </h1>
            </div>

            {/* Pricing card */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-500">Prix LinkMe HT</span>
                <span className="text-3xl font-bold text-linkme-marine tabular-nums">
                  {formatPrice(product.selling_price_ht)}
                </span>
              </div>
              {product.public_price_ht != null &&
                product.public_price_ht > 0 && (
                  <div className="flex items-baseline justify-between text-sm text-gray-500">
                    <span>Prix public estimé HT</span>
                    <span className="tabular-nums">
                      {formatPrice(product.public_price_ht)}
                    </span>
                  </div>
                )}
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-50">
                <Sparkles className="inline h-3 w-3 mr-1" />
                La marge affilié sera configurée à l&apos;ajout dans une
                sélection.
              </p>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              disabled={!canAddToSelection}
              className={cn(
                'w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold transition-all duration-200 shadow-sm',
                canAddToSelection
                  ? 'bg-linkme-turquoise text-white hover:opacity-90 hover:shadow-md'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-5 w-5" />
              Ajouter à ma sélection
            </button>

            {/* Stock indicator */}
            {product.stock_real > 0 && (
              <p className="text-xs text-gray-500">
                Stock disponible :{' '}
                <span className="font-medium text-gray-700">
                  {product.stock_real} unité{product.stock_real > 1 ? 's' : ''}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <section className="mt-10 lg:mt-14 max-w-3xl">
            <h2 className="text-lg font-semibold text-linkme-marine mb-3">
              Description
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </section>
        )}

        {/* Selling points */}
        {Array.isArray(sellingPoints) && sellingPoints.length > 0 && (
          <section className="mt-8 max-w-3xl">
            <h2 className="text-lg font-semibold text-linkme-marine mb-3">
              Points forts
            </h2>
            <ul className="space-y-2">
              {sellingPoints.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <CheckCircle className="h-4 w-4 text-linkme-turquoise mt-0.5 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <AddToSelectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        product={productForModal}
      />
    </div>
  );
}
