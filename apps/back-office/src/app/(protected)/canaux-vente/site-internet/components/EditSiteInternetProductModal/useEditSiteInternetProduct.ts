'use client';

// =============================================================================
// Hook métier — EditSiteInternetProductModal
// =============================================================================

import { useState, useMemo } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@verone/common/hooks';
import { useProductImages } from '@verone/products';
import { createClient } from '@verone/utils/supabase/client';
import type { z } from 'zod';

import { productSchema } from './schema';
import type { ProductFormData } from './schema';
import type { SiteInternetProduct } from './types';

interface UseEditSiteInternetProductReturn {
  formData: Partial<ProductFormData>;
  setFormData: (data: Partial<ProductFormData>) => void;
  errors: z.ZodIssue[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showPhotosModal: boolean;
  setShowPhotosModal: (v: boolean) => void;
  showImageViewer: boolean;
  setShowImageViewer: (v: boolean) => void;
  selectedImageIndex: number;
  catalogueImages: ReturnType<typeof useProductImages>['images'];
  imagesLoading: boolean;
  fetchImages: () => Promise<void>;
  setPrimaryImage: (id: string) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  productImages: {
    id: string;
    public_url: string;
    alt_text: string;
    is_primary: boolean;
  }[];
  updateProduct: ReturnType<
    typeof useMutation<void, Error, Partial<ProductFormData>>
  >;
  handleSubmit: (e: React.FormEvent) => void;
  getError: (field: string) => z.ZodIssue | undefined;
}

export function useEditSiteInternetProduct(
  product: SiteInternetProduct,
  onClose: () => void,
  onSuccess?: () => void
): UseEditSiteInternetProductReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState<z.ZodIssue[]>([]);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex] = useState(0);
  const supabase = createClient();

  // Récupérer les images du catalogue produit via hook
  const {
    images: catalogueImages,
    loading: imagesLoading,
    fetchImages,
    setPrimaryImage,
    deleteImage,
    uploadImage: _uploadImage,
  } = useProductImages({
    productId: product.product_id,
    autoFetch: true,
  });

  // Transformer les images catalogue en ProductImage[] pour le viewer
  const productImages = useMemo(() => {
    if (!catalogueImages || catalogueImages.length === 0) return [];

    return catalogueImages.map(img => ({
      id: img.id,
      public_url: img.public_url ?? '',
      alt_text: img.alt_text ?? `${product.name}`,
      is_primary: img.is_primary ?? false,
    }));
  }, [catalogueImages, product.name]);

  // SI-DESC-001 : formData réduit aux champs qui vivent vraiment côté canal
  // (slug / publication / prix / SEO meta). La description / brand / selling
  // points sont la source de vérité du produit mère — édition dans la fiche
  // produit, pas ici.
  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    slug: product.slug ?? '',
    is_published_online: product.is_published,
    meta_title: '',
    meta_description: '',
    custom_price_ht: product.price_ht ?? undefined,
    discount_rate: undefined,
    min_quantity: 1,
    notes: '',
    is_active: true,
  });

  // Helper get channel ID
  const getChannelId = async () => {
    const { data, error } = await supabase
      .from('sales_channels')
      .select('id')
      .eq('code', 'site_internet')
      .single();

    if (error || !data?.id) {
      console.error('❌ Canal Site Internet introuvable:', error);
      throw new Error('Canal Site Internet introuvable');
    }

    return data.id;
  };

  // Mutation update
  const updateProduct = useMutation({
    mutationFn: async (data: Partial<ProductFormData>) => {
      const channelId = await getChannelId();

      // 1. Update products table (slug, meta_title, meta_description, publication)
      const publicationDate = data.publication_date
        ? new Date(data.publication_date).toISOString()
        : data.is_published_online
          ? new Date().toISOString()
          : null;

      const { error: productsError } = await supabase
        .from('products')
        .update({
          slug: data.slug ?? null,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          is_published_online: data.is_published_online,
          publication_date: publicationDate,
          unpublication_date: data.unpublication_date
            ? new Date(data.unpublication_date).toISOString()
            : null,
        })
        .eq('id', product.product_id)
        .select('id')
        .single();

      if (productsError) {
        throw productsError;
      }

      // 2. Upsert channel_pricing (si prix OU réduction modifiés)
      if (data.custom_price_ht != null || data.discount_rate != null) {
        const { error: pricingError } = await supabase
          .from('channel_pricing')
          .upsert(
            {
              product_id: product.product_id,
              channel_id: channelId,
              custom_price_ht: data.custom_price_ht,
              discount_rate: data.discount_rate ?? null,
              markup_rate: null,
              min_quantity: data.min_quantity ?? 1,
              notes: data.notes ?? null,
              is_active: data.is_active ?? true,
            },
            { onConflict: 'product_id,channel_id,min_quantity' }
          )
          .select('id');

        if (pricingError) {
          throw pricingError;
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-products'],
      });
      toast({
        title: 'Produit mis à jour',
        description: 'Les modifications ont été enregistrées avec succès',
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      console.error('❌ Mutation ERROR:', error);
      toast({
        title: 'Erreur lors de la sauvegarde',
        description:
          error.message ||
          'Une erreur est survenue lors de la sauvegarde du produit',
        variant: 'destructive',
      });
    },
  });

  // Handler submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation Zod
    const result = productSchema.safeParse(formData);
    if (!result.success) {
      setErrors(result.error.issues);
      toast({
        title: 'Erreurs de validation',
        description: 'Veuillez corriger les champs en erreur',
        variant: 'destructive',
      });
      return;
    }

    setErrors([]);
    updateProduct.mutate(formData);
  };

  // Helper get error
  const getError = (field: string) => {
    return errors.find(e => e.path[0] === field);
  };

  return {
    formData,
    setFormData,
    errors,
    activeTab,
    setActiveTab,
    showPhotosModal,
    setShowPhotosModal,
    showImageViewer,
    setShowImageViewer,
    selectedImageIndex,
    catalogueImages,
    imagesLoading,
    fetchImages,
    setPrimaryImage,
    deleteImage,
    productImages,
    updateProduct,
    handleSubmit,
    getError,
  };
}
