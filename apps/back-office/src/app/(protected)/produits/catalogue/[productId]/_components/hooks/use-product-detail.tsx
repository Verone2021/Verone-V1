'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Globe,
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Fetcher extraite du hook — stable, pas de closure sur des refs
async function fetchProductById(
  productId: string,
  supabase: ReturnType<typeof createClient>
): Promise<Product> {
  const startTime = Date.now();
  const { data, error: fetchError } = await supabase
    .from('products')
    .select(
      `
      id, name, sku, slug, description, description_long, description_short,
      technical_description, internal_notes, meta_title, meta_description,
      selling_points, variant_attributes, dimensions,
      cost_price, cost_net_avg, margin_percentage, eco_tax_default,
      stock_real, stock_forecasted_out, stock_quantity, min_stock, stock_status,
      weight, condition, manufacturer, gtin, brand_ids,
      product_status, product_type, article_type, availability_type,
      is_published_online, has_images,
      subcategory_id, supplier_id, variant_group_id, enseigne_id, assigned_client_id,
      created_by_affiliate, consultation_id,
      supplier_moq, supplier_reference, supplier_page_url,
      style, suitable_rooms, video_url, tags,
      created_at, updated_at, archived_at,
      affiliate_approval_status, affiliate_approved_at, affiliate_approved_by,
      affiliate_commission_rate, affiliate_payout_ht, affiliate_rejection_reason,
      rejection_reason, publication_date, unpublication_date,
      show_on_linkme_globe, store_at_verone, requires_sample,
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

  checkSLOCompliance(startTime, 'dashboard');

  if (fetchError) throw new Error(fetchError.message);
  if (!data) throw new Error('Produit non trouvé');

  return data as Product;
}

export function useProductDetail() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  // Client Supabase stable pour tout le hook
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  // --- État UI (inchangé) ---
  const [activeTab, setActiveTab] = useState('general');
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false);
  const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false);
  const [channelPricing, setChannelPricing] = useState<ChannelPricingRow[]>([]);

  // Validation UUID avant fetch
  const isValidId = Boolean(productId && UUID_REGEX.test(productId));

  // --- useQuery pour le produit ---
  const {
    data: product = null,
    isLoading: loading,
    isRefetching: isRefreshing,
    error: queryError,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId, supabase),
    enabled: isValidId,
    staleTime: 30_000,
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Erreur lors du chargement du produit'
    : null;

  // Redirect si ID invalide
  useEffect(() => {
    if (productId && !isValidId) {
      router.push('/produits/catalogue');
    }
  }, [productId, isValidId, router]);

  // --- useMutation pour les updates produit ---
  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<ProductRow>) => {
      const updatePayload: ProductUpdate = updatedData;
      const { error: updateError } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', productId);
      if (updateError) throw new Error(updateError.message);
      return updatedData;
    },
    onMutate: async (updatedData: Partial<ProductRow>) => {
      // Optimistic update : modifier le cache immédiatement (0 clignotement)
      await queryClient.cancelQueries({ queryKey: ['product', productId] });
      const previousProduct = queryClient.getQueryData<Product>([
        'product',
        productId,
      ]);
      queryClient.setQueryData<Product>(['product', productId], old =>
        old ? ({ ...old, ...updatedData } as Product) : old
      );
      return { previousProduct };
    },
    onError: (_err, _vars, context) => {
      // Rollback optimistic update en cas d'erreur
      if (context?.previousProduct) {
        queryClient.setQueryData(
          ['product', productId],
          context.previousProduct
        );
      }
      console.error(
        '[ProductDetail] Update failed, rolled back optimistic update'
      );
    },
    onSuccess: async (_data, updatedData) => {
      console.warn(
        '[ProductDetail] Produit sauvegardé en DB:',
        Object.keys(updatedData)
      );
      // Pour les champs relationnels (FK), refetch silencieux pour récupérer les objets joints
      if (
        'subcategory_id' in updatedData ||
        'supplier_id' in updatedData ||
        'enseigne_id' in updatedData ||
        'assigned_client_id' in updatedData
      ) {
        await queryClient.invalidateQueries({
          queryKey: ['product', productId],
        });
      }
    },
  });

  const handleProductUpdate = useCallback(
    async (updatedData: Partial<ProductRow>) => {
      await updateMutation.mutateAsync(updatedData);
    },
    [updateMutation]
  );

  // Compat : fetchProduct exposé pour les consumers qui l'appellent directement
  const fetchProduct = useCallback(
    async (_options?: { silent?: boolean }) => {
      await queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    [queryClient, productId]
  );

  const {
    images: productImages,
    primaryImage: _primaryImage,
    fetchImages: refreshHeaderImages,
  } = useProductImages({
    productId: productId ?? '',
    autoFetch: true,
  });

  // --- Channel pricing (useEffect stable — pas de fonction instable dans les deps) ---
  useEffect(() => {
    if (!isValidId) return;

    const fetchChannelPricing = async () => {
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
  }, [productId, isValidId, supabase]);

  const handleShare = useCallback(() => {
    if (product?.slug) {
      router.push(`/share/product/${product.slug}`);
    }
  }, [product?.slug, router]);

  // --- Computed values (identiques à avant) ---
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
      {
        id: 'publication',
        label: 'Publication',
        icon: <Globe className="h-4 w-4" />,
      },
    ],
    [tabBadges, productImages.length]
  );

  return {
    productId,
    product,
    loading,
    isRefreshing,
    error,
    activeTab,
    setActiveTab,
    showPhotosModal,
    setShowPhotosModal,
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
    refreshHeaderImages,
    handleProductUpdate,
    handleShare,
    router,
  };
}
