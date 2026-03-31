'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useProductImages } from '@verone/products';
import { checkSLOCompliance } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Info,
  FileText,
  DollarSign,
  Boxes,
  Settings,
  ImageIcon,
} from 'lucide-react';

import {
  calculateAllMissingFields,
  calculateCompletionPercentage,
} from '../types';
import type {
  Product,
  ProductRow,
  ProductUpdate,
  ChannelPricingRow,
} from '../types';

export function useProductDetail() {
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

  const { images: productImages, primaryImage: _primaryImage } =
    useProductImages({
      productId: productId ?? '',
      autoFetch: true,
    });

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

      const { data, error: fetchError } = await supabase
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
            website,
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

      if (fetchError) {
        throw new Error(fetchError.message);
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

  const handleProductUpdate = useCallback(
    async (updatedData: Partial<ProductRow>) => {
      setProduct(prev => (prev ? { ...prev, ...updatedData } : null));

      try {
        const supabase = createClient();
        const updatePayload: ProductUpdate = updatedData;
        const { error: updateError } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', productId);

        if (updateError) {
          console.error('Erreur sauvegarde produit:', updateError);
          void fetchProduct().catch(fetchError => {
            console.error('[ProductDetail] Rollback fetch failed:', fetchError);
          });
        } else {
          console.warn(
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
        console.error('Erreur sauvegarde produit:', err);
        void fetchProduct().catch(fetchError => {
          console.error('[ProductDetail] Rollback fetch failed:', fetchError);
        });
      }
    },
    [productId, fetchProduct]
  );

  const handleShare = useCallback(() => {
    if (product?.slug) {
      router.push(`/share/product/${product.slug}`);
    }
  }, [product?.slug, router]);

  useEffect(() => {
    void fetchProduct().catch(err => {
      console.error('[ProductDetail] Initial fetch failed:', err);
    });
  }, [fetchProduct]);

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

    void fetchChannelPricing().catch(err => {
      console.error('[ProductDetail] Channel pricing fetch failed:', err);
    });
  }, [productId]);

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

  const missingFields = useMemo(
    () => calculateAllMissingFields(product),
    [product]
  );

  const completionPercentage = useMemo(
    () => calculateCompletionPercentage(missingFields),
    [missingFields]
  );

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

  const primaryImageUrl = useMemo(() => {
    if (_primaryImage?.public_url) return _primaryImage.public_url;
    if (productImages.length > 0 && productImages[0].public_url)
      return productImages[0].public_url;
    return null;
  }, [_primaryImage, productImages]);

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

  return {
    productId,
    product,
    loading,
    error,
    activeTab,
    setActiveTab,
    showPhotosModal,
    setShowPhotosModal,
    showCharacteristicsModal,
    setShowCharacteristicsModal,
    showDescriptionsModal,
    setShowDescriptionsModal,
    isCategorizeModalOpen,
    setIsCategorizeModalOpen,
    channelPricing,
    productImages,
    _primaryImage,
    breadcrumbParts,
    missingFields,
    completionPercentage,
    sourcing,
    primaryImageUrl,
    tabs,
    fetchProduct,
    handleProductUpdate,
    handleShare,
    router,
  };
}
