'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/prefer-nullish-coalescing, react-hooks/exhaustive-deps */

import { useState, useEffect, useCallback, useMemo } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { CategoryHierarchySelector } from '@verone/categories';
import { SupplierVsPricingEditSection } from '@verone/common';
import { CompletionStatusCompact } from '@verone/products';
import { ProductStatusCompact } from '@verone/products';
import { SampleHistoryCompact } from '@verone/products';
import { ProductVariantsGrid } from '@verone/products';
import { ProductFixedCharacteristics } from '@verone/products';
import { ProductImageGallery } from '@verone/products';
import { ProductCharacteristicsModal } from '@verone/products';
import { ProductDescriptionsModal } from '@verone/products';
import { ProductPhotosModal } from '@verone/products';
import { IdentifiersCompleteEditSection } from '@verone/products';
import { ProductDescriptionsEditSection } from '@verone/products';
import { ProductDetailAccordion } from '@verone/products';
import { ProductInfoSection } from '@verone/products';
import { SampleRequirementSection } from '@verone/products';
import { SupplierEditSection } from '@verone/products';
import { WeightEditSection } from '@verone/products';
import { ClientOrEnseigneSelector, useProductImages } from '@verone/products';
import { StockEditSection } from '@verone/stock';
import { StockStatusCompact } from '@verone/stock';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Badge, ButtonUnified, Switch, Label } from '@verone/ui';
import { cn, checkSLOCompliance } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  Share2,
  ImageIcon,
  Package,
  Tag,
  Truck,
  Boxes,
  DollarSign,
  Settings,
  Hash,
  Beaker,
  Clock,
  Info,
  Building2,
  Sparkles,
  Globe,
  AlertCircle,
  UserCircle2,
} from 'lucide-react';

// Champs obligatoires pour un produit complet
const _REQUIRED_PRODUCT_FIELDS = [
  'name',
  'sku',
  'supplier_id',
  'subcategory_id',
  'cost_price',
  'description',
] as const;

// Mapping des champs avec leurs libellés
const _PRODUCT_FIELD_LABELS: Record<string, string> = {
  name: 'Nom du produit',
  sku: 'Référence SKU',
  supplier_id: 'Fournisseur',
  subcategory_id: 'Sous-catégorie',
  cost_price: "Prix d'achat HT",
  description: 'Description',
};

/**
 * Calcule champs obligatoires manquants par section
 * Basé sur REQUIRED_PRODUCT_FIELDS
 */
function calculateMissingFields(product: any | null) {
  if (!product)
    return {
      infosGenerales: 0,
      descriptions: 0,
      categorisation: 0,
      fournisseur: 0,
      identifiants: 0,
    };

  return {
    // Informations Générales : name, cost_price (stock_status et product_status sont NOT NULL)
    infosGenerales: [
      !product.name || product.name.trim() === '',
      !product.cost_price || product.cost_price <= 0,
    ].filter(Boolean).length,

    // Descriptions : description (obligatoire seulement)
    descriptions:
      !product.description || product.description.trim() === '' ? 1 : 0,

    // Catégorisation : subcategory_id (hiérarchie complète)
    categorisation: !product.subcategory_id ? 1 : 0,

    // Fournisseur : supplier_id
    fournisseur: !product.supplier_id ? 1 : 0,

    // Identifiants : sku
    identifiants: !product.sku || product.sku.trim() === '' ? 1 : 0,
  };
}

// Interface pour un produit
interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  technical_description: string | null;
  selling_points: string | null;
  price_ht: number | null;
  cost_price: number | null;
  tax_rate: number | null;
  selling_price: number | null;
  margin_percentage: number | null;
  brand: string | null;
  stock_status: 'in_stock' | 'out_of_stock' | 'coming_soon';
  product_status: 'active' | 'preorder' | 'discontinued' | 'draft';
  condition: 'new' | 'used' | 'refurbished';
  stock_quantity: number | null;
  stock_real: number | null;
  stock_forecasted_in: number | null;
  completion_percentage: number | null;
  min_stock: number | null;
  supplier_id: string | null;
  supplier_reference: string | null;
  subcategory_id: string | null;
  family_id: string | null;
  dimensions: string | null;
  weight: number | null;
  variant_attributes: Record<string, any> | null;
  variant_group_id: string | null;
  gtin: string | null;
  slug: string | null;
  images: any[];
  requires_sample: boolean | null;
  created_at: string;
  updated_at: string;
  organisation_id: string;
  enseigne_id: string | null;
  assigned_client_id: string | null;
  show_on_linkme_globe: boolean | null;
  enseigne?: {
    id: string;
    name: string;
  } | null;
  assigned_client?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  } | null;
  // Colonnes affiliés
  created_by_affiliate: string | null;
  affiliate_approval_status: string | null;
  affiliate_commission_rate: number | null;
  affiliate_payout_ht: number | null;
  affiliate_creator?: {
    id: string;
    display_name: string;
    enseigne?: { id: string; name: string } | null;
    organisation?: {
      id: string;
      legal_name: string;
      trade_name: string | null;
    } | null;
  } | null;
  supplier?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    type: string | null;
  } | null;
  subcategory?: {
    id: string;
    name: string;
    slug: string;
    category?: {
      id: string;
      name: string;
      slug: string;
      family?: {
        id: string;
        name: string;
        slug: string;
      };
    };
  } | null;
  variant_group?: {
    id: string;
    name: string;
    dimensions_length: number | null;
    dimensions_width: number | null;
    dimensions_height: number | null;
    dimensions_unit: string | null;
    common_weight: number | null;
    has_common_weight: boolean | null;
    common_cost_price: number | null;
    has_common_cost_price: boolean | null;
    style: string | null;
    suitable_rooms: string[] | null;
    has_common_supplier: boolean | null;
    supplier_id: string | null;
  } | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showCharacteristicsModal, setShowCharacteristicsModal] =
    useState(false);
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false);
  const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false);

  // Hook pour récupérer les images du produit (table product_images)
  const { images: productImages, primaryImage: _primaryImage } =
    useProductImages({
      productId: productId ?? '',
      autoFetch: true,
    });

  const startTime = Date.now();

  // Charger le produit (✅ Optimisé avec useCallback)
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIX: Valider format UUID avant requête
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!productId || !uuidRegex.test(productId)) {
        // Si ce n'est pas un UUID valide (ex: "create"), rediriger vers catalogue
        router.push('/produits/catalogue');
        return;
      }

      const supabase = createClient();

      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          enseigne:enseignes!products_enseigne_id_fkey(
            id,
            name
          ),
          assigned_client:organisations!products_assigned_client_id_fkey(
            id,
            legal_name,
            trade_name
          ),
          supplier:organisations!products_supplier_id_fkey(
            id,
            legal_name,
            trade_name,
            email,
            phone,
            is_active,
            type
          ),
          subcategory:subcategories(
            id,
            name,
            slug,
            category:categories(
              id,
              name,
              slug,
              family:families(
                id,
                name,
                slug
              )
            )
          ),
          variant_group:variant_groups(
            id,
            name,
            dimensions_length,
            dimensions_width,
            dimensions_height,
            dimensions_unit,
            common_weight,
            has_common_weight,
            common_cost_price,
            has_common_cost_price,
            style,
            suitable_rooms,
            has_common_supplier,
            supplier_id
          ),
          affiliate_creator:linkme_affiliates!products_created_by_affiliate_fkey(
            id,
            display_name,
            enseigne:enseignes(id, name),
            organisation:organisations!linkme_affiliates_organisation_id_fkey(id, legal_name, trade_name)
          )
        `
        )
        .eq('id', productId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Produit non trouvé');
      }

      setProduct(data as any);
    } catch (err) {
      console.error('Erreur lors du chargement du produit:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement du produit'
      );
    } finally {
      setLoading(false);
      checkSLOCompliance(startTime, 'dashboard');
    }
  }, [productId, router]);

  // Handler pour mettre à jour le produit (✅ Optimisé avec optimistic update + DB)
  const handleProductUpdate = useCallback(
    async (updatedData: Partial<Product>) => {
      // 1. Optimistic UI update (instantané)
      setProduct(prev => (prev ? ({ ...prev, ...updatedData } as any) : null));

      // 2. Sauvegarde réelle en DB
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('products')
          .update(updatedData as any) // Cast nécessaire car Product interface ≠ Supabase types
          .eq('id', productId);

        if (error) {
          console.error('❌ Erreur sauvegarde produit:', error);
          void fetchProduct().catch(fetchError => {
            console.error('[ProductDetail] Rollback fetch failed:', fetchError);
          }); // Rollback UI si erreur
        } else {
          console.warn('✅ Produit sauvegardé en DB:', updatedData);
          // 3. Recharger les données complètes si champs relationnels modifiés
          // (pour mettre à jour le breadcrumb et autres données jointes)
          if ('subcategory_id' in updatedData || 'supplier_id' in updatedData) {
            void fetchProduct().catch(fetchError => {
              console.error(
                '[ProductDetail] Fetch after update failed:',
                fetchError
              );
            });
          }
        }
      } catch (err) {
        console.error('❌ Erreur sauvegarde produit:', err);
        void fetchProduct().catch(fetchError => {
          console.error('[ProductDetail] Rollback fetch failed:', fetchError);
        }); // Rollback UI
      }
    },
    [productId, fetchProduct]
  );

  // Handler pour naviguer vers la page de partage
  const handleShare = () => {
    if (product?.slug) {
      const shareUrl = `/share/product/${product.slug}`;
      router.push(shareUrl);
    }
  };

  useEffect(() => {
    void fetchProduct().catch(error => {
      console.error('[ProductDetail] Initial fetch failed:', error);
    });
  }, [productId]);

  // ✅ HOOKS DÉPLACÉS AVANT RETURNS CONDITIONNELS (React Rules of Hooks)
  // Breadcrumb (✅ Optimisé avec useMemo)
  const breadcrumbParts = useMemo(() => {
    if (!product) return [];
    const parts: string[] = [];
    if (product.subcategory?.category?.family) {
      parts.push(product.subcategory.category.family.name);
    }
    if (product.subcategory?.category) {
      parts.push(product.subcategory.category.name);
    }
    if (product.subcategory) {
      parts.push(product.subcategory.name);
    }
    parts.push(product.name);
    return parts;
  }, [
    product?.subcategory?.category?.family?.name,
    product?.subcategory?.category?.name,
    product?.subcategory?.name,
    product?.name,
  ]);

  // Calcul complétude accordéons (✅ Optimisé avec useMemo)
  const missingFields = useMemo(
    () => calculateMissingFields(product),
    [
      product?.name,
      product?.sku,
      product?.cost_price,
      product?.supplier_id,
      product?.subcategory_id,
      product?.description,
      product?.product_status,
      product?.stock_status,
    ]
  );

  // Calcul sourcing (interne vs client/sur mesure vs affilié)
  // PRIORITÉ: 1. Affilié (created_by_affiliate) → 2. Sur mesure (enseigne/client) → 3. Interne
  const sourcing = useMemo((): {
    type: 'interne' | 'client' | 'affiliate';
    clientType?: 'enseigne' | 'organisation';
    clientName?: string;
    clientId?: string;
    affiliateName?: string;
    affiliateDisplayName?: string;
  } => {
    // PRIORITÉ 1: Produit affilié (NE PEUT PAS être sur mesure)
    if (product?.created_by_affiliate) {
      return {
        type: 'affiliate',
        affiliateName:
          product.affiliate_creator?.enseigne?.name ||
          product.affiliate_creator?.organisation?.trade_name ||
          product.affiliate_creator?.organisation?.legal_name ||
          'Affilié inconnu',
        affiliateDisplayName:
          product.affiliate_creator?.display_name ?? undefined,
      };
    }
    // PRIORITÉ 2: Sur mesure enseigne
    if (product?.enseigne) {
      return {
        type: 'client',
        clientType: 'enseigne',
        clientName: product.enseigne.name,
        clientId: product.enseigne.id,
      };
    }
    // PRIORITÉ 3: Sur mesure organisation
    if (product?.assigned_client) {
      return {
        type: 'client',
        clientType: 'organisation',
        clientName:
          product.assigned_client.trade_name ||
          product.assigned_client.legal_name,
        clientId: product.assigned_client.id,
      };
    }
    // DÉFAUT: Catalogue interne
    return { type: 'interne' };
  }, [
    product?.created_by_affiliate,
    product?.affiliate_creator,
    product?.enseigne,
    product?.assigned_client,
  ]);

  // État de chargement
  if (loading) {
    return (
      <div className="w-full py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4" />
            <p>Chargement du produit...</p>
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error || !product) {
    return (
      <div className="w-full py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium">
            {error ?? 'Produit non trouvé'}
          </p>
          <ButtonUnified
            onClick={() => router.push('/produits/catalogue')}
            variant="outline"
            className="mt-4"
          >
            Retour au catalogue
          </ButtonUnified>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header fixe avec navigation */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ButtonUnified
                variant="outline"
                size="sm"
                onClick={() => router.push('/produits/catalogue')}
                icon={ArrowLeft}
                iconPosition="left"
              >
                Retour
              </ButtonUnified>
              <div className="h-6 w-px bg-neutral-200" />
              <nav className="text-sm text-neutral-600">
                {breadcrumbParts.join(' › ')}
              </nav>
              {/* Badge Sourcing */}
              {sourcing.type === 'affiliate' ? (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 bg-purple-50 border-purple-300 text-purple-700"
                >
                  <UserCircle2 className="h-3 w-3" />
                  Produit affilié ({sourcing.affiliateName})
                </Badge>
              ) : sourcing.type === 'client' && sourcing.clientId ? (
                <Link
                  href={
                    sourcing.clientType === 'enseigne'
                      ? `/contacts-organisations/enseignes/${sourcing.clientId}`
                      : `/contacts-organisations/customers/${sourcing.clientId}`
                  }
                >
                  <Badge
                    variant="customer"
                    className="flex items-center gap-1 cursor-pointer hover:bg-purple-200 transition-colors"
                  >
                    <Building2 className="h-3 w-3" />
                    Client: {sourcing.clientName}
                  </Badge>
                </Link>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Sourcing interne
                </Badge>
              )}
            </div>
            <ButtonUnified
              variant="outline"
              size="sm"
              onClick={handleShare}
              icon={Share2}
              iconPosition="left"
            >
              Partager
            </ButtonUnified>
          </div>
        </div>
      </div>

      {/* Layout Grid 2 colonnes */}
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 p-4">
        {/* SIDEBAR FIXE - Galerie Images */}
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] space-y-3">
          {/* Galerie principale */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <ProductImageGallery
              productId={product.id}
              productName={product.name}
              productStatus={product.product_status as any}
              compact={false}
              onManagePhotos={() => setShowPhotosModal(true)}
            />
          </div>

          {/* Actions sous galerie */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-3 space-y-2">
            <ButtonUnified
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowPhotosModal(true)}
              icon={ImageIcon}
              iconPosition="left"
            >
              Gérer photos ({product.images?.length || 0})
            </ButtonUnified>
            <ButtonUnified
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleShare}
              icon={Share2}
              iconPosition="left"
            >
              Partager
            </ButtonUnified>
          </div>

          {/* Sections statuts compactes */}
          <div className="space-y-2">
            <StockStatusCompact
              product={{
                id: product.id,
                stock_real: product.stock_real ?? 0,
                stock_forecasted_in: product.stock_forecasted_in ?? 0,
              }}
            />

            <ProductStatusCompact
              product={{
                id: product.id,
                product_status: product.product_status,
              }}
              onUpdate={handleProductUpdate as any}
            />

            <CompletionStatusCompact
              product={{
                id: product.id,
                completion_percentage: product.completion_percentage ?? 0,
              }}
              missingFields={missingFields}
            />

            {/* Historique échantillons commandés */}
            <SampleHistoryCompact productId={product.id} />
          </div>
        </aside>

        {/* CONTENT AREA - Accordions scrollables */}
        <main className="space-y-3 max-w-6xl">
          {/* Accordion 1: Informations Générales */}
          <ProductDetailAccordion
            title="Informations Générales"
            icon={Info}
            defaultOpen
            badge={
              missingFields.infosGenerales > 0
                ? missingFields.infosGenerales
                : undefined
            }
          >
            <ProductInfoSection
              product={{
                id: product.id,
                name: product.name,
                sku: product.sku,
                cost_price: product.cost_price,
                stock_status: product.stock_status,
                product_status: product.product_status,
                supplier_id: product.supplier_id,
                subcategory_id: product.subcategory_id,
                variant_group_id: product.variant_group_id,
              }}
              onUpdate={handleProductUpdate as any}
            />

            {/* Section: Attribution client (produit sur mesure) */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              {/* Bannière informative pour les produits affiliés */}
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
                        {product.affiliate_creator?.display_name ||
                          sourcing.affiliateName ||
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
                  void handleProductUpdate({
                    enseigne_id: enseigneId,
                    assigned_client_id: null, // Reset l'autre si on sélectionne une enseigne
                  }).catch(error => {
                    console.error(
                      '[ProductDetail] Enseigne update failed:',
                      error
                    );
                  });
                }}
                onOrganisationChange={(organisationId, _organisationName) => {
                  void handleProductUpdate({
                    assigned_client_id: organisationId,
                    enseigne_id: null, // Reset l'autre si on sélectionne une organisation
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
            </div>
          </ProductDetailAccordion>

          {/* Accordion 2: Descriptions */}
          <ProductDetailAccordion
            title="Descriptions"
            icon={Beaker}
            defaultOpen={false}
            badge={
              missingFields.descriptions > 0
                ? missingFields.descriptions
                : undefined
            }
          >
            <ProductDescriptionsEditSection
              product={{
                id: product.id,
                description: product.description,
                technical_description: product.technical_description,
                selling_points: product.selling_points as any,
              }}
              onUpdate={handleProductUpdate as any}
            />
          </ProductDetailAccordion>

          {/* Accordion 3: Catégorisation */}
          <ProductDetailAccordion
            title="Catégorisation"
            icon={Tag}
            defaultOpen={false}
            badge={
              missingFields.categorisation > 0
                ? missingFields.categorisation
                : undefined
            }
          >
            <div className="space-y-3">
              {/* Message informatif si catégorisation gérée par le groupe */}
              {product.variant_group_id && product.variant_group && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  ℹ️ La catégorisation est héritée du groupe de variantes "
                  {product.variant_group.name}".{' '}
                  <a
                    href={`/produits/catalogue/variantes/${product.variant_group.id}`}
                    className="underline font-medium hover:text-blue-900"
                  >
                    Modifier depuis la page du groupe
                  </a>
                </div>
              )}

              {/* Hiérarchie actuelle */}
              {breadcrumbParts.length > 1 && (
                <div className="bg-neutral-50 rounded-md p-3 text-sm">
                  <p className="text-neutral-600 mb-1">
                    Classification actuelle:
                  </p>
                  <p className="font-medium text-neutral-900">
                    {breadcrumbParts.slice(0, -1).join(' › ')}
                  </p>
                </div>
              )}

              <ButtonUnified
                variant="outline"
                size="sm"
                onClick={() => setIsCategorizeModalOpen(true)}
                disabled={!!product.variant_group_id}
              >
                Modifier la catégorisation
              </ButtonUnified>
            </div>
          </ProductDetailAccordion>

          {/* Accordion 3: Fournisseur & Références */}
          <ProductDetailAccordion
            title="Fournisseur & Références"
            icon={Truck}
            defaultOpen={false}
            badge={
              missingFields.fournisseur > 0
                ? missingFields.fournisseur
                : undefined
            }
          >
            <SupplierEditSection
              product={product as any}
              variantGroup={(product.variant_group ?? undefined) as any}
              onUpdate={handleProductUpdate as any}
            />
            <WeightEditSection
              product={product as any}
              variantGroup={(product.variant_group ?? undefined) as any}
              onUpdate={handleProductUpdate as any}
              className="mt-4"
            />
          </ProductDetailAccordion>

          {/* Accordion 4: Variantes Produit (conditionnel) */}
          {product.variant_group_id && (
            <ProductDetailAccordion
              title="Variantes Produit"
              icon={Package}
              defaultOpen
            >
              <ProductVariantsGrid
                productId={product.id}
                currentProductId={product.id}
              />
            </ProductDetailAccordion>
          )}

          {/* Accordion 5: Stock */}
          <ProductDetailAccordion
            title="Stock"
            icon={Boxes}
            defaultOpen={false}
          >
            <StockEditSection
              product={
                {
                  id: product.id,
                  condition: (product as any).condition,
                  min_stock: product.min_stock ?? undefined,
                } as any
              } // TypeScript types incomplete, condition exists in DB
              onUpdate={handleProductUpdate as any}
            />
          </ProductDetailAccordion>

          {/* Accordion 6: Tarification */}
          <ProductDetailAccordion
            title="Tarification"
            icon={DollarSign}
            defaultOpen={false}
          >
            <SupplierVsPricingEditSection
              product={{
                id: product.id,
                cost_price: product.cost_price ?? undefined,
                margin_percentage: product.margin_percentage ?? undefined,
                selling_price: product.selling_price ?? undefined,
                variant_group_id: product.variant_group_id ?? undefined,
              }}
              variantGroup={product.variant_group ?? null}
              onUpdate={handleProductUpdate as any}
            />
          </ProductDetailAccordion>

          {/* Accordion 7: Caractéristiques */}
          <ProductDetailAccordion
            title="Caractéristiques"
            icon={Settings}
            defaultOpen={false}
          >
            {product.variant_group_id && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                ℹ️ Les caractéristiques sont gérées au niveau du groupe de
                variantes.{' '}
                <a
                  href={`/produits/catalogue/variantes/${product.variant_group_id}`}
                  className="underline font-medium hover:text-blue-900"
                >
                  Voir le groupe
                </a>
              </div>
            )}
            <ProductFixedCharacteristics product={product as any} />

            <div className="mt-4">
              <ButtonUnified
                variant="outline"
                size="sm"
                onClick={() => setShowCharacteristicsModal(true)}
              >
                Éditer caractéristiques
              </ButtonUnified>
            </div>
          </ProductDetailAccordion>

          {/* Accordion 8: Identifiants */}
          <ProductDetailAccordion
            title="Identifiants"
            icon={Hash}
            defaultOpen={false}
            badge={
              missingFields.identifiants > 0
                ? missingFields.identifiants
                : undefined
            }
          >
            <IdentifiersCompleteEditSection
              product={{
                id: product.id,
                sku: product.sku ?? '',
                brand: product.brand ?? undefined,
                gtin: product.gtin ?? undefined,
                condition: product.condition,
              }}
              onUpdate={handleProductUpdate as any}
            />
          </ProductDetailAccordion>

          {/* Accordion 9: Échantillons */}
          <ProductDetailAccordion
            title="Gestion Échantillons"
            icon={Beaker}
            defaultOpen={false}
          >
            <SampleRequirementSection
              productId={product.id}
              requiresSample={product.requires_sample ?? false}
              isProduct
              productName={product.name}
              supplierName={
                (product.supplier?.legal_name ||
                  product.supplier?.trade_name) ??
                undefined
              }
              costPrice={product.cost_price ?? undefined}
              disabled={(product.stock_quantity ?? 0) >= 1}
              onRequirementChange={requiresSample => {
                void handleProductUpdate({
                  requires_sample: requiresSample,
                }).catch(error => {
                  console.error(
                    '[ProductDetail] Sample requirement update failed:',
                    error
                  );
                });
              }}
            />
          </ProductDetailAccordion>

          {/* Accordion 10: Visibilité LinkMe */}
          <ProductDetailAccordion
            title="Visibilité LinkMe"
            icon={Globe}
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#2ECCC1]" />
                    Afficher sur le Globe LinkMe
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Ce produit apparaîtra sur le globe 3D de la page
                    d&apos;accueil et de connexion LinkMe
                  </p>
                </div>
                <Switch
                  checked={product.show_on_linkme_globe ?? false}
                  onCheckedChange={(checked: boolean) => {
                    void handleProductUpdate({
                      show_on_linkme_globe: checked,
                    }).catch(error => {
                      console.error(
                        '[ProductDetail] Globe visibility update failed:',
                        error
                      );
                    });
                  }}
                  disabled={productImages.length === 0}
                />
              </div>
              {productImages.length === 0 && (
                <p className="text-sm text-amber-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Une image produit est requise pour l&apos;affichage sur le
                  globe
                </p>
              )}
            </div>
          </ProductDetailAccordion>

          {/* Accordion 11: Métadonnées & Audit */}
          <ProductDetailAccordion
            title="Métadonnées & Audit"
            icon={Clock}
            defaultOpen={false}
          >
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
                  {new Date(product.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Modifié le:</span>
                <span className="text-neutral-900">
                  {new Date(product.updated_at).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-neutral-600">Organisation ID:</span>
                <span className="font-mono text-neutral-900">
                  {product.organisation_id
                    ? product.organisation_id.slice(0, 8) + '...'
                    : 'N/A'}
                </span>
              </div>
            </div>
          </ProductDetailAccordion>
        </main>
      </div>

      {/* Modal de gestion des photos */}
      <ProductPhotosModal
        isOpen={showPhotosModal}
        onClose={() => setShowPhotosModal(false)}
        productId={product.id}
        productName={product.name}
        productType="product"
        maxImages={20}
        onImagesUpdated={() => {
          void fetchProduct().catch(error => {
            console.error(
              '[ProductDetail] Fetch after images updated failed:',
              error
            );
          });
        }}
      />

      {/* Modal de gestion des caractéristiques */}
      <ProductCharacteristicsModal
        isOpen={showCharacteristicsModal}
        onClose={() => setShowCharacteristicsModal(false)}
        productId={product.id}
        productName={product.name}
        initialData={{
          variant_attributes: product.variant_attributes ?? undefined,
          dimensions: (product.dimensions ?? undefined) as
            | Record<string, any>
            | undefined,
          weight: product.weight ?? undefined,
        }}
        onUpdate={data => {
          void handleProductUpdate(data).catch(error => {
            console.error(
              '[ProductDetail] Characteristics update failed:',
              error
            );
          });
        }}
      />

      {/* Modal de gestion des descriptions */}
      <ProductDescriptionsModal
        isOpen={showDescriptionsModal}
        onClose={() => setShowDescriptionsModal(false)}
        productId={product.id}
        productName={product.name}
        initialData={{
          description: product.description ?? undefined,
          technical_description: product.technical_description ?? undefined,
          selling_points: (product.selling_points ?? undefined) as
            | string[]
            | undefined,
        }}
        onUpdate={data => {
          void handleProductUpdate(data).catch(error => {
            console.error('[ProductDetail] Descriptions update failed:', error);
          });
        }}
      />

      {/* Modal de modification de la catégorisation */}
      <Dialog
        open={isCategorizeModalOpen}
        onOpenChange={setIsCategorizeModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Modifier la catégorisation
            </DialogTitle>
            <DialogDescription>
              Sélectionnez une nouvelle sous-catégorie pour ce produit. La
              famille et la catégorie seront automatiquement mises à jour.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <CategoryHierarchySelector
              value={product.subcategory_id ?? ''}
              onChange={(subcategoryId, hierarchyInfo) => {
                if (subcategoryId && hierarchyInfo) {
                  void handleProductUpdate({
                    subcategory_id: subcategoryId,
                  }).catch(error => {
                    console.error(
                      '[ProductDetail] Subcategory update failed:',
                      error
                    );
                  });
                  setIsCategorizeModalOpen(false);
                }
              }}
              placeholder="Sélectionner une sous-catégorie"
              className="w-full"
            />
          </div>

          <DialogFooter>
            <ButtonUnified
              variant="outline"
              onClick={() => setIsCategorizeModalOpen(false)}
            >
              Annuler
            </ButtonUnified>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/prefer-nullish-coalescing, react-hooks/exhaustive-deps */
