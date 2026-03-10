'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { CategoryHierarchySelector } from '@verone/categories';
import { ProductStatusCompact } from '@verone/products';
import { SampleHistoryCompact } from '@verone/products';
import { ProductCharacteristicsModal } from '@verone/products';
import { ProductDescriptionsModal } from '@verone/products';
import { ProductPhotosModal } from '@verone/products';
import { useProductImages } from '@verone/products';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { ButtonUnified, TabsNavigation, TabContent } from '@verone/ui';
import { checkSLOCompliance } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Info,
  FileText,
  DollarSign,
  Boxes,
  Settings,
  ImageIcon,
  Tag,
} from 'lucide-react';

import { ProductDetailHeader } from './_components/product-detail-header';
import { ProductGeneralTab } from './_components/product-general-tab';
import { ProductDescriptionsTab } from './_components/product-descriptions-tab';
import { ProductPricingTab } from './_components/product-pricing-tab';
import { ProductStockTab } from './_components/product-stock-tab';
import { ProductCharacteristicsTab } from './_components/product-characteristics-tab';
import { ProductImagesTab } from './_components/product-images-tab';
import type {
  Product,
  ProductRow,
  ProductUpdate,
  ChannelPricingRow,
} from './_components/types';
import {
  calculateAllMissingFields,
  calculateCompletionPercentage,
} from './_components/types';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showCharacteristicsModal, setShowCharacteristicsModal] =
    useState(false);
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false);
  const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false);
  const [channelPricing, setChannelPricing] = useState<ChannelPricingRow[]>([]);

  // Hook pour recuperer les images du produit (table product_images)
  const { images: productImages, primaryImage: _primaryImage } =
    useProductImages({
      productId: productId ?? '',
      autoFetch: true,
    });

  // Charger le produit
  const fetchProduct = useCallback(async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      setError(null);

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!productId || !uuidRegex.test(productId)) {
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
          supplier:organisations!supplier_id(
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

      setProduct(data as Product);
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

  // Handler pour mettre a jour le produit (optimistic update + DB)
  const handleProductUpdate = useCallback(
    async (updatedData: Partial<ProductRow>) => {
      setProduct(prev => (prev ? { ...prev, ...updatedData } : null));

      try {
        const supabase = createClient();
        const updatePayload: ProductUpdate = updatedData;
        const { error } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', productId);

        if (error) {
          console.error('❌ Erreur sauvegarde produit:', error);
          void fetchProduct().catch(fetchError => {
            console.error('[ProductDetail] Rollback fetch failed:', fetchError);
          });
        } else {
          console.log(
            '[ProductDetail] Produit sauvegardé en DB:',
            Object.keys(updatedData)
          );
          if (
            'subcategory_id' in updatedData ||
            'supplier_id' in updatedData ||
            'enseigne_id' in updatedData ||
            'assigned_client_id' in updatedData
          ) {
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
        });
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
  }, [fetchProduct]);

  // Fetch channel pricing
  useEffect(() => {
    if (!productId) return;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) return;

    const fetchChannelPricing = async () => {
      const supabase = createClient();
      const { data: channels } = await supabase
        .from('sales_channels')
        .select('id, name, code')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!channels) return;

      const { data: pricing } = await supabase
        .from('channel_pricing')
        .select(
          'channel_id, public_price_ht, custom_price_ht, discount_rate, is_active'
        )
        .eq('product_id', productId);

      const pricingMap = new Map((pricing ?? []).map(p => [p.channel_id, p]));

      const merged = channels.map(ch => {
        const p = pricingMap.get(ch.id);
        return {
          channel_id: ch.id,
          channel_name: ch.name,
          channel_code: ch.code,
          public_price_ht: p?.public_price_ht ?? null,
          custom_price_ht: p?.custom_price_ht ?? null,
          discount_rate: p?.discount_rate ?? null,
          is_active: p?.is_active ?? false,
        };
      });

      setChannelPricing(merged);
    };

    void fetchChannelPricing().catch(error => {
      console.error('[ProductDetail] Channel pricing fetch failed:', error);
    });
  }, [productId]);

  // Breadcrumb
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
  }, [product]);

  // Calcul completude
  const missingFields = useMemo(
    () => calculateAllMissingFields(product),
    [product]
  );

  const completionPercentage = useMemo(
    () => calculateCompletionPercentage(missingFields),
    [missingFields]
  );

  // Calcul sourcing
  const sourcing = useMemo(() => {
    if (product?.created_by_affiliate) {
      return {
        type: 'affiliate' as const,
        affiliateName:
          product.affiliate_creator?.enseigne?.name ??
          product.affiliate_creator?.organisation?.trade_name ??
          product.affiliate_creator?.organisation?.legal_name ??
          'Affilié inconnu',
        affiliateDisplayName:
          product.affiliate_creator?.display_name ?? undefined,
      };
    }
    if (product?.enseigne) {
      return {
        type: 'client' as const,
        clientType: 'enseigne' as const,
        clientName: product.enseigne.name,
        clientId: product.enseigne.id,
      };
    }
    if (product?.assigned_client) {
      return {
        type: 'client' as const,
        clientType: 'organisation' as const,
        clientName:
          product.assigned_client.trade_name ??
          product.assigned_client.legal_name,
        clientId: product.assigned_client.id,
      };
    }
    return { type: 'interne' as const };
  }, [
    product?.created_by_affiliate,
    product?.affiliate_creator,
    product?.enseigne,
    product?.assigned_client,
  ]);

  // Primary image URL
  const primaryImageUrl = useMemo(() => {
    if (_primaryImage?.public_url) return _primaryImage.public_url;
    if (productImages.length > 0 && productImages[0].public_url)
      return productImages[0].public_url;
    return null;
  }, [_primaryImage, productImages]);

  // Missing fields per tab (for badges)
  const tabBadges = useMemo(() => {
    const generalMissing =
      missingFields.infosGenerales +
      missingFields.categorisation +
      missingFields.fournisseur +
      missingFields.identifiants;
    return {
      general: generalMissing > 0 ? generalMissing : undefined,
      descriptions:
        missingFields.descriptions > 0 ? missingFields.descriptions : undefined,
      pricing:
        missingFields.tarification > 0 ? missingFields.tarification : undefined,
      stock: missingFields.stock > 0 ? missingFields.stock : undefined,
      characteristics:
        missingFields.caracteristiques > 0
          ? missingFields.caracteristiques
          : undefined,
    };
  }, [missingFields]);

  // Tab definitions
  const tabs = useMemo(
    () => [
      {
        id: 'general',
        label: 'Général',
        icon: <Info className="h-4 w-4" />,
        badge: tabBadges.general,
      },
      {
        id: 'descriptions',
        label: 'Descriptions',
        icon: <FileText className="h-4 w-4" />,
        badge: tabBadges.descriptions,
      },
      {
        id: 'pricing',
        label: 'Tarification',
        icon: <DollarSign className="h-4 w-4" />,
        badge: tabBadges.pricing,
      },
      {
        id: 'stock',
        label: 'Stock',
        icon: <Boxes className="h-4 w-4" />,
        badge: tabBadges.stock,
      },
      {
        id: 'characteristics',
        label: 'Caractéristiques',
        icon: <Settings className="h-4 w-4" />,
        badge: tabBadges.characteristics,
      },
      {
        id: 'images',
        label: 'Images',
        icon: <ImageIcon className="h-4 w-4" />,
        badge: productImages.length > 0 ? productImages.length : undefined,
      },
    ],
    [tabBadges, productImages.length]
  );

  // Etat de chargement
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

  // Etat d'erreur
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
      {/* Header sticky */}
      <ProductDetailHeader
        product={product}
        breadcrumbParts={breadcrumbParts}
        completionPercentage={completionPercentage}
        primaryImageUrl={primaryImageUrl}
        sourcing={sourcing}
        onBack={() => router.push('/produits/catalogue')}
        onShare={handleShare}
        onImageClick={() => setShowPhotosModal(true)}
      />

      {/* Tabs Navigation */}
      <div className="max-w-[1800px] mx-auto px-4">
        <TabsNavigation
          tabs={tabs}
          defaultTab="general"
          onTabChange={setActiveTab}
          className="bg-white"
        />

        {/* Tab Contents */}
        <TabContent activeTab={activeTab} tabId="general">
          <ProductGeneralTab
            product={product}
            completionPercentage={completionPercentage}
            missingFields={missingFields}
            sourcing={sourcing}
            breadcrumbParts={breadcrumbParts}
            onProductUpdate={handleProductUpdate}
            onOpenCategorizeModal={() => setIsCategorizeModalOpen(true)}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="descriptions">
          <ProductDescriptionsTab
            product={product}
            onProductUpdate={handleProductUpdate}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="pricing">
          <ProductPricingTab
            product={product}
            channelPricing={channelPricing}
            onProductUpdate={handleProductUpdate}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="stock">
          <ProductStockTab
            product={product}
            onProductUpdate={handleProductUpdate}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="characteristics">
          <ProductCharacteristicsTab
            product={product}
            onOpenCharacteristicsModal={() => setShowCharacteristicsModal(true)}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="images">
          <ProductImagesTab
            productId={product.id}
            productName={product.name}
            imageCount={productImages.length}
            onOpenPhotosModal={() => setShowPhotosModal(true)}
          />
        </TabContent>
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

      {/* Modal de gestion des caracteristiques */}
      <ProductCharacteristicsModal
        isOpen={showCharacteristicsModal}
        onClose={() => setShowCharacteristicsModal(false)}
        productId={product.id}
        productName={product.name}
        initialData={{
          variant_attributes:
            (product.variant_attributes as Record<string, unknown>) ??
            undefined,
          dimensions:
            (product.dimensions as Record<string, unknown>) ?? undefined,
          weight: product.weight ?? undefined,
        }}
        onUpdate={data => {
          void handleProductUpdate(data as Partial<ProductRow>).catch(error => {
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
          void handleProductUpdate(data as Partial<ProductRow>).catch(error => {
            console.error('[ProductDetail] Descriptions update failed:', error);
          });
        }}
      />

      {/* Modal de modification de la categorisation */}
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
