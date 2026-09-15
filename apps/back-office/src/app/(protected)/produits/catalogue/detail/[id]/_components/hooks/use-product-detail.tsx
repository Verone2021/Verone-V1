'use client';

import { useState, useEffect, useCallback } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useProductImages } from '@verone/products';
import { checkSLOCompliance } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

import type { Product, ProductRow, ProductUpdate } from '../types';
import { fetchProduct } from './fetch-product';
import { useProductChannelPricing } from './use-product-channel-pricing';
import { useProductDetailDerived } from './use-product-detail-derived';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useProductDetail() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true); // Chargement initial uniquement
  const [isRefreshing, setIsRefreshing] = useState(false); // Refresh post-mutation (silencieux)
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false);
  const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false);

  const {
    images: productImages,
    primaryImage: _primaryImage,
    fetchImages: refreshHeaderImages,
  } = useProductImages({
    productId: productId ?? '',
    autoFetch: true,
  });

  // Channel pricing (état externe, non géré par useChannelPricing de common)
  const channelPricing = useProductChannelPricing(productId);

  // ---------------------------------------------------------------------------
  // Fetch principal
  // ---------------------------------------------------------------------------

  const loadProduct = useCallback(
    async (options?: { silent?: boolean }) => {
      const startTime = Date.now();
      const isSilent = options?.silent ?? false;
      try {
        if (isSilent) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        if (!productId || !UUID_RE.test(productId)) {
          router.push('/produits/catalogue');
          return;
        }

        const supabase = createClient();
        const data = await fetchProduct(supabase, productId);
        setProduct(data);
      } catch (err) {
        console.error('[useProductDetail] Erreur chargement produit:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Erreur lors du chargement du produit'
        );
      } finally {
        setLoading(false);
        setIsRefreshing(false);
        checkSLOCompliance(startTime, 'dashboard');
      }
    },
    [productId, router]
  );

  // ---------------------------------------------------------------------------
  // Mutation : mise à jour du produit
  // ---------------------------------------------------------------------------

  const handleProductUpdate = useCallback(
    async (updatedData: Partial<ProductRow>) => {
      // Optimistic update
      setProduct(prev => (prev ? { ...prev, ...updatedData } : null));

      try {
        const supabase = createClient();
        const updatePayload: ProductUpdate = updatedData;
        const { error: updateError } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', productId);

        if (updateError) {
          console.error(
            '[useProductDetail] Erreur sauvegarde produit:',
            updateError
          );
          toast.error('Erreur lors de la sauvegarde', {
            description: updateError.message,
          });
          // Rollback : recharger depuis la DB
          void loadProduct({ silent: true }).catch(fetchError => {
            console.error(
              '[useProductDetail] Rollback fetch failed:',
              fetchError
            );
          });
        } else {
          console.warn(
            '[useProductDetail] Produit sauvegardé en DB:',
            Object.keys(updatedData)
          );
          // Recharger si des relations ont changé
          if (
            'subcategory_id' in updatedData ||
            'supplier_id' in updatedData ||
            'enseigne_id' in updatedData ||
            'assigned_client_id' in updatedData
          ) {
            void loadProduct({ silent: true }).catch(fetchError => {
              console.error(
                '[useProductDetail] Fetch after update failed:',
                fetchError
              );
            });
          }
        }
      } catch (err) {
        console.error('[useProductDetail] Erreur sauvegarde produit:', err);
        toast.error('Erreur lors de la sauvegarde', {
          description: err instanceof Error ? err.message : 'Erreur inconnue',
        });
        void loadProduct({ silent: true }).catch(fetchError => {
          console.error(
            '[useProductDetail] Rollback fetch failed:',
            fetchError
          );
        });
      }
    },
    [productId, loadProduct]
  );

  const handleShare = useCallback(() => {
    if (product?.slug) {
      router.push(`/share/product/${product.slug}`);
    }
  }, [product?.slug, router]);

  // ---------------------------------------------------------------------------
  // Effect initial
  // ---------------------------------------------------------------------------

  useEffect(() => {
    void loadProduct().catch(err => {
      console.error('[useProductDetail] Initial fetch failed:', err);
    });
  }, [loadProduct]);

  // ---------------------------------------------------------------------------
  // Valeurs dérivées
  // ---------------------------------------------------------------------------

  const {
    breadcrumbParts,
    missingFields,
    completionPercentage,
    sourcing,
    primaryImageUrl,
    tabBadges,
    tabs,
  } = useProductDetailDerived({ product, productImages, _primaryImage });

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
    tabBadges,
    tabs,
    fetchProduct: loadProduct,
    refreshHeaderImages,
    handleProductUpdate,
    handleShare,
    router,
  };
}
