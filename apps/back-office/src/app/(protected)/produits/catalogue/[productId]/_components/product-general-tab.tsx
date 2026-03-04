'use client';

import type { ComponentProps } from 'react';

import Link from 'next/link';

import { ProductInfoSection } from '@verone/products';
import { SampleRequirementSection } from '@verone/products';
import { SupplierEditSection } from '@verone/products';
import { WeightEditSection } from '@verone/products';
import { IdentifiersCompleteEditSection } from '@verone/products';
import { ClientOrEnseigneSelector } from '@verone/products';
import { ProductVariantsGrid } from '@verone/products';
import { Badge, ButtonUnified } from '@verone/ui';
import { cn } from '@verone/utils';
import { Sparkles, Package, UserCircle2 } from 'lucide-react';

import type { Product, ProductRow, MissingFields, SourcingInfo } from './types';

interface ProductGeneralTabProps {
  product: Product;
  completionPercentage: number;
  missingFields: MissingFields;
  sourcing: SourcingInfo;
  breadcrumbParts: string[];
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
  onOpenCategorizeModal: () => void;
}

export function ProductGeneralTab({
  product,
  completionPercentage,
  missingFields,
  sourcing,
  breadcrumbParts,
  onProductUpdate,
  onOpenCategorizeModal,
}: ProductGeneralTabProps) {
  return (
    <div className="space-y-6">
      {/* Section: Informations Generales */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">
          Informations générales
        </h3>
        <ProductInfoSection
          product={{
            id: product.id,
            name: product.name,
            sku: product.sku,
            cost_price: product.cost_price,
            cost_net_avg: product.cost_net_avg,
            stock_status: product.stock_status,
            product_status: product.product_status,
            supplier_id: product.supplier_id,
            subcategory_id: product.subcategory_id,
            variant_group_id: product.variant_group_id,
          }}
          completionPercentage={completionPercentage}
          missingFields={missingFields}
          onUpdate={async updates => {
            await onProductUpdate(updates as Partial<ProductRow>);
          }}
        />
      </section>

      {/* Section: Attribution client (produit sur mesure) */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        {/* Banniere informative pour les produits affilies */}
        {product.created_by_affiliate && (
          <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-900">
                  Produit affilié
                </p>
                <p className="text-xs text-purple-700">
                  Canal de vente: LinkMe
                </p>
                <p className="text-xs text-purple-700">
                  Créé par:{' '}
                  {product.affiliate_creator?.display_name ??
                    sourcing.affiliateName ??
                    'Affilié inconnu'}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Ce produit ne peut pas être marqué comme &quot;sur
                  mesure&quot; car il appartient à l&apos;affilié.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Attribution client (produit sur mesure)
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              {product.created_by_affiliate
                ? 'Ce produit affilié ne peut pas être assigné à un autre client'
                : 'Assignez ce produit à une enseigne ou organisation pour le rendre exclusif'}
            </p>
          </div>
          <Badge
            variant={
              sourcing.type === 'affiliate'
                ? 'outline'
                : sourcing.type === 'client'
                  ? 'customer'
                  : 'secondary'
            }
            className={cn(
              'flex items-center gap-1',
              sourcing.type === 'affiliate' &&
                'bg-purple-50 border-purple-300 text-purple-700'
            )}
          >
            {sourcing.type === 'affiliate' ? (
              <>
                <UserCircle2 className="h-3 w-3" />
                Produit affilié
              </>
            ) : sourcing.type === 'client' ? (
              <>
                <Sparkles className="h-3 w-3" />
                Sur mesure
              </>
            ) : (
              <>
                <Package className="h-3 w-3" />
                Catalogue général
              </>
            )}
          </Badge>
        </div>

        <ClientOrEnseigneSelector
          enseigneId={product.enseigne_id}
          organisationId={product.assigned_client_id}
          onEnseigneChange={(enseigneId, _enseigneName, _parentOrgId) => {
            void onProductUpdate({
              enseigne_id: enseigneId,
              assigned_client_id: null,
            }).catch(error => {
              console.error('[ProductDetail] Enseigne update failed:', error);
            });
          }}
          onOrganisationChange={(organisationId, _organisationName) => {
            void onProductUpdate({
              assigned_client_id: organisationId,
              enseigne_id: null,
            }).catch(error => {
              console.error(
                '[ProductDetail] Organisation update failed:',
                error
              );
            });
          }}
          disabled={!!product.created_by_affiliate}
          label=""
          className="max-w-md"
        />
      </section>

      {/* Section: Categorisation */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">
          Catégorisation
        </h3>

        {product.variant_group_id && product.variant_group && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            ℹ️ La catégorisation est héritée du groupe de variantes &quot;
            {product.variant_group.name}&quot;.{' '}
            <Link
              href={`/produits/catalogue/variantes/${product.variant_group.id}`}
              className="underline font-medium hover:text-blue-900"
            >
              Modifier depuis la page du groupe
            </Link>
          </div>
        )}

        {breadcrumbParts.length > 1 && (
          <div className="bg-neutral-50 rounded-md p-3 text-sm">
            <p className="text-neutral-600 mb-1">Classification actuelle:</p>
            <p className="font-medium text-neutral-900">
              {breadcrumbParts.slice(0, -1).join(' › ')}
            </p>
          </div>
        )}

        <ButtonUnified
          variant="outline"
          size="sm"
          onClick={onOpenCategorizeModal}
          disabled={!!product.variant_group_id}
          className="mt-3"
        >
          Modifier la catégorisation
        </ButtonUnified>
      </section>

      {/* Section: Fournisseur & References */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">
          Fournisseur & Références
        </h3>
        <SupplierEditSection
          product={
            product as ComponentProps<typeof SupplierEditSection>['product']
          }
          variantGroup={
            (product.variant_group ?? undefined) as ComponentProps<
              typeof SupplierEditSection
            >['variantGroup']
          }
          onUpdate={updates => {
            void onProductUpdate(updates).catch(console.error);
          }}
        />
        <WeightEditSection
          product={
            product as ComponentProps<typeof WeightEditSection>['product']
          }
          variantGroup={
            (product.variant_group ?? undefined) as ComponentProps<
              typeof WeightEditSection
            >['variantGroup']
          }
          onUpdate={updates => {
            void onProductUpdate(updates).catch(console.error);
          }}
          className="mt-4"
        />
      </section>

      {/* Section: Variantes (conditionnel) */}
      {product.variant_group_id && (
        <section className="bg-white rounded-lg border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">
            Variantes Produit
          </h3>
          <ProductVariantsGrid
            productId={product.id}
            currentProductId={product.id}
          />
        </section>
      )}

      {/* Section: Identifiants */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">
          Identifiants
        </h3>
        <IdentifiersCompleteEditSection
          product={{
            id: product.id,
            sku: product.sku ?? '',
            brand: product.brand ?? undefined,
            gtin: product.gtin ?? undefined,
            condition: product.condition ?? undefined,
          }}
          onUpdate={updates => {
            void onProductUpdate(updates).catch(console.error);
          }}
        />
      </section>

      {/* Section: Echantillons */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">
          Gestion Échantillons
        </h3>
        <SampleRequirementSection
          productId={product.id}
          requiresSample={product.requires_sample ?? false}
          isProduct
          productName={product.name}
          supplierName={
            product.supplier?.legal_name ??
            product.supplier?.trade_name ??
            undefined
          }
          costPrice={product.cost_price ?? undefined}
          disabled={(product.stock_quantity ?? 0) >= 1}
          onRequirementChange={requiresSample => {
            void onProductUpdate({
              requires_sample: requiresSample,
            }).catch(error => {
              console.error(
                '[ProductDetail] Sample requirement update failed:',
                error
              );
            });
          }}
        />
      </section>

      {/* Section: Metadonnees */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">
          Métadonnées & Audit
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-600">ID:</span>
            <span className="font-mono text-neutral-900">
              {product.id.slice(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-600">Créé le:</span>
            <span className="text-neutral-900">
              {product.created_at
                ? new Date(product.created_at).toLocaleString('fr-FR')
                : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-neutral-600">Modifié le:</span>
            <span className="text-neutral-900">
              {product.updated_at
                ? new Date(product.updated_at).toLocaleString('fr-FR')
                : 'N/A'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
