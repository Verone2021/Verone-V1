/**
 * Modal Édition Produit Site Internet
 * 5 onglets : Général / SEO / Tarification / Images / Variantes
 * 32 champs éditables sur 4 tables
 */

'use client';

import { useState, useMemo } from 'react';

import Image from 'next/image';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@verone/common/hooks';
import {
  ProductThumbnail,
  ProductPhotosModal,
  ProductImageViewerModal,
  useProductImages,
  ProductVariantsGrid,
} from '@verone/products';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Switch } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Info,
  Search,
  Euro,
  Image as ImageIcon,
  Package,
  AlertCircle,
  Loader2,
  Upload,
  Trash2,
  Star,
  RefreshCw,
} from 'lucide-react';
import { z } from 'zod';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Formate les dimensions d'un produit de manière lisible
 * @param dimensions - Object JSONB avec length, width, height, unit
 * @returns String formatée "L120 × l80 × H75 cm" ou "Non défini"
 */
function formatDimensions(dimensions: Record<string, any> | null): string {
  if (!dimensions) return 'Non défini';

  const { length, width, height, unit = 'cm' } = dimensions;

  const parts: string[] = [];
  if (length) parts.push(`L${length}`);
  if (width) parts.push(`l${width}`);
  if (height) parts.push(`H${height}`);

  return parts.length > 0 ? `${parts.join(' × ')} ${unit}` : 'Non défini';
}

/**
 * Labels français pour les types de produits
 */
const PRODUCT_TYPE_LABELS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' }
> = {
  standard: { label: 'Catalogue', variant: 'default' },
  custom: { label: 'Sur-mesure', variant: 'secondary' },
};

// =============================================================================
// Types & Schema
// =============================================================================

interface SiteInternetProduct {
  product_id: string;
  sku: string;
  name: string;
  slug: string | null;
  status: string;
  seo_title: string;
  seo_meta_description: string;
  metadata: Record<string, any>;
  price_ht: number;
  price_ttc: number;
  price_source: string;
  primary_image_url: string | null;
  image_urls: string[];
  is_published: boolean;
  publication_date: string | null;
  has_variants: boolean;
  variants_count: number;
  is_eligible: boolean;
  ineligibility_reasons: string[];

  // Nouveaux champs (12) - Ajoutés 2025-11-17
  description: string | null;
  technical_description: string | null;
  brand: string | null;
  selling_points: string[];
  dimensions: Record<string, any> | null;
  weight: number | null;
  suitable_rooms: string[];
  subcategory_id: string | null;
  subcategory_name: string | null;
  product_type: string | null;
  video_url: string | null;
  supplier_moq: number | null; // Quantité minimale de commande fournisseur
}

interface EditSiteInternetProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: SiteInternetProduct;
  onSuccess?: () => void;
}

// Schema Zod validation
const productSchema = z.object({
  // Général
  slug: z
    .union([z.string().max(200, 'Maximum 200 caractères'), z.literal('')])
    .optional()
    .nullable(),
  is_published_online: z.boolean(),

  // SEO
  custom_title: z.string().max(60, 'Maximum 60 caractères').optional(),
  custom_description: z.string().max(160, 'Maximum 160 caractères').optional(),
  meta_title: z.string().max(60, 'Maximum 60 caractères').optional(),
  meta_description: z.string().max(160, 'Maximum 160 caractères').optional(),

  // Tarification
  custom_price_ht: z.number().positive('Prix doit être > 0').optional(),
  discount_rate: z.number().min(0).max(100, 'Maximum 100%').optional(),
  min_quantity: z.number().int().positive().default(1),
  notes: z.string().max(500).optional(),
  is_active: z.boolean().default(true),

  // Informations produit (nouveaux champs éditables avec waterfall)
  custom_description_long: z
    .string()
    .max(5000, 'Maximum 5000 caractères')
    .optional(),
  custom_technical_description: z
    .string()
    .max(2000, 'Maximum 2000 caractères')
    .optional(),
  custom_brand: z.string().max(100, 'Maximum 100 caractères').optional(),
  custom_selling_points: z.array(z.string()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// =============================================================================
// Composant Principal
// =============================================================================

export function EditSiteInternetProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: EditSiteInternetProductModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState<z.ZodIssue[]>([]);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, _setSelectedImageIndex] = useState(0);
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
      alt_text: img.alt_text || `${product.name}`,
      is_primary: img.is_primary ?? false,
    }));
  }, [catalogueImages, product.name]);

  // État formulaire
  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    slug: product.slug ?? '',
    is_published_online: product.is_published,
    custom_title: '',
    custom_description: '',
    meta_title: '',
    meta_description: '',
    custom_price_ht: product.price_ht ?? undefined,
    discount_rate: undefined,
    min_quantity: 1,
    notes: '',
    is_active: true,
    // Nouveaux champs informations produit
    custom_description_long: product.description ?? '',
    custom_technical_description: product.technical_description ?? '',
    custom_brand: product.brand ?? '',
    custom_selling_points: product.selling_points || [],
  });

  // Mutation update
  const updateProduct = useMutation({
    mutationFn: async (data: Partial<ProductFormData>) => {
      console.warn('🔍 Mutation START', {
        productId: product.product_id,
        data: {
          slug: data.slug,
          is_published_online: data.is_published_online,
          custom_title: data.custom_title,
          custom_price_ht: data.custom_price_ht,
        },
      });

      const channelId = await getChannelId();
      console.warn('✅ Channel ID récupéré:', channelId);

      // 1. Update products table (slug, meta_title, meta_description, is_published_online)
      const { error: productsError } = await supabase
        .from('products')
        .update({
          slug: data.slug ?? null, // Convertir chaîne vide en null
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          is_published_online: data.is_published_online,
          publication_date: data.is_published_online
            ? new Date().toISOString()
            : null,
        })
        .eq('id', product.product_id)
        .select()
        .single();

      if (productsError) {
        console.error('❌ Erreur products update:', productsError);
        throw productsError;
      }
      console.warn('✅ Products table updated');

      // 2. Upsert channel_product_metadata (incluant nouveaux champs)
      if (
        data.custom_title ||
        data.custom_description ||
        data.custom_description_long ||
        data.custom_technical_description ||
        data.custom_brand ||
        data.custom_selling_points
      ) {
        const { error: metadataError } = await supabase
          .from('channel_product_metadata')
          .upsert(
            {
              product_id: product.product_id,
              channel_id: channelId,
              custom_title: data.custom_title,
              custom_description: data.custom_description,
              // Nouveaux champs informations produit
              custom_description_long: data.custom_description_long,
              custom_technical_description: data.custom_technical_description,
              custom_brand: data.custom_brand,
              custom_selling_points: data.custom_selling_points || [],
            },
            { onConflict: 'product_id,channel_id' }
          )
          .select();

        if (metadataError) {
          console.error('❌ Erreur metadata upsert:', metadataError);
          throw metadataError;
        }
        console.warn('✅ Metadata upserted');
      }

      // 3. Upsert channel_pricing (si prix OU réduction modifiés)
      if (data.custom_price_ht != null || data.discount_rate != null) {
        const { error: pricingError } = await supabase
          .from('channel_pricing')
          .upsert(
            {
              product_id: product.product_id,
              channel_id: channelId,
              custom_price_ht: data.custom_price_ht,
              discount_rate: data.discount_rate ?? null,
              markup_rate: null, // Toujours null (mode custom_price uniquement)
              min_quantity: data.min_quantity || 1,
              notes: data.notes ?? null,
              is_active: data.is_active ?? true,
            },
            { onConflict: 'product_id,channel_id,min_quantity' }
          )
          .select();

        if (pricingError) {
          console.error('❌ Erreur pricing upsert:', pricingError);
          throw pricingError;
        }
        console.warn('✅ Pricing upserted');
      }

      console.warn('🎉 Mutation COMPLETE');
    },
    onSuccess: async () => {
      console.warn('🎉 onSuccess callback');
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <ProductThumbnail
                src={product.primary_image_url}
                alt={product.name}
                size="sm"
              />
              <div>
                <div className="font-semibold">{product.name}</div>
                <div className="text-sm text-gray-500 font-normal">
                  SKU: {product.sku}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger
                  value="general"
                  className="flex items-center gap-2"
                >
                  <Info className="h-4 w-4" />
                  Général
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  SEO
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="flex items-center gap-2"
                >
                  <Euro className="h-4 w-4" />
                  Tarification
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images
                </TabsTrigger>
                <TabsTrigger
                  value="variants"
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Variantes
                  {product.has_variants && (
                    <Badge variant="outline" className="ml-1">
                      {product.variants_count}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="informations"
                  className="flex items-center gap-2"
                >
                  <Info className="h-4 w-4" />
                  Informations
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto py-6">
                {/* TAB 1: GÉNÉRAL */}
                <TabsContent value="general" className="space-y-6">
                  {/* Publication */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Publié sur le site internet</Label>
                        <p className="text-sm text-gray-500">
                          Rendre ce produit visible sur le site
                        </p>
                      </div>
                      <Switch
                        checked={formData.is_published_online}
                        onCheckedChange={checked =>
                          setFormData({
                            ...formData,
                            is_published_online: checked,
                          })
                        }
                      />
                    </div>

                    {/* Éligibilité */}
                    {!product.is_eligible && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium text-amber-900">
                              Produit non éligible
                            </div>
                            <ul className="text-sm text-amber-700 mt-2 space-y-1">
                              {product.ineligibility_reasons.map(
                                (reason, i) => (
                                  <li key={i}>• {reason}</li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slug */}
                  <div>
                    <Label>Slug URL</Label>
                    <Input
                      value={formData.slug ?? ''}
                      onChange={e =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      placeholder="mon-produit-slug"
                      className="font-mono text-sm"
                    />
                    {getError('slug') && (
                      <p className="text-sm text-red-600 mt-1">
                        {getError('slug')?.message}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      URL: https://verone.fr/produit/{formData.slug || 'slug'}
                    </p>
                  </div>
                </TabsContent>

                {/* TAB 2: SEO */}
                <TabsContent value="seo" className="space-y-6">
                  {/* Custom Title */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Titre SEO custom (priorité 1)</Label>
                      <span
                        className={`text-sm ${
                          (formData.custom_title?.length ?? 0) < 30
                            ? 'text-red-600'
                            : (formData.custom_title?.length ?? 0) <= 60
                              ? 'text-green-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {formData.custom_title?.length ?? 0} / 60
                      </span>
                    </div>
                    <Input
                      value={formData.custom_title ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          custom_title: e.target.value,
                        })
                      }
                      placeholder="Titre optimisé pour le site internet"
                      maxLength={60}
                    />
                    {getError('custom_title') && (
                      <p className="text-sm text-red-600 mt-1">
                        {getError('custom_title')?.message}
                      </p>
                    )}
                  </div>

                  {/* Custom Description */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Description SEO custom (priorité 1)</Label>
                      <span
                        className={`text-sm ${
                          (formData.custom_description?.length ?? 0) < 80
                            ? 'text-red-600'
                            : (formData.custom_description?.length ?? 0) <= 160
                              ? 'text-green-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {formData.custom_description?.length ?? 0} / 160
                      </span>
                    </div>
                    <Textarea
                      value={formData.custom_description ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          custom_description: e.target.value,
                        })
                      }
                      placeholder="Description optimisée pour le site internet"
                      maxLength={160}
                      rows={3}
                    />
                    {getError('custom_description') && (
                      <p className="text-sm text-red-600 mt-1">
                        {getError('custom_description')?.message}
                      </p>
                    )}
                  </div>

                  {/* Waterfall Preview */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="font-medium text-blue-900 mb-2">
                      Aperçu final (waterfall)
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">
                          Titre:
                        </span>{' '}
                        {formData.custom_title || product.seo_title}
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">
                          Description:
                        </span>{' '}
                        {formData.custom_description ||
                          product.seo_meta_description}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 3: TARIFICATION */}
                <TabsContent value="pricing" className="space-y-6">
                  {/* Prix et Promotion */}
                  <div className="bg-white border rounded-lg p-4 space-y-4">
                    {/* Badge Promo */}
                    {(formData.discount_rate ?? 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="bg-red-500">
                          🏷️ PROMO -
                          {Math.round((formData.discount_rate ?? 0) * 100)}%
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Affiché sur le site internet
                        </span>
                      </div>
                    )}

                    {/* Prix HT custom */}
                    <div>
                      <Label>Prix HT custom canal</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.custom_price_ht ?? ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            custom_price_ht: parseFloat(e.target.value),
                          })
                        }
                        placeholder="0.00"
                      />
                      {getError('custom_price_ht') && (
                        <p className="text-sm text-red-600 mt-1">
                          {getError('custom_price_ht')?.message}
                        </p>
                      )}
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span>Source actuelle:</span>
                        <Badge
                          variant={
                            product.price_source === 'channel_pricing'
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {product.price_source === 'channel_pricing'
                            ? 'Prix canal'
                            : 'Prix base'}
                        </Badge>
                      </div>
                    </div>

                    {/* Taux de réduction */}
                    <div>
                      <Label>Taux de réduction (%)</Label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={
                          formData.discount_rate != null
                            ? formData.discount_rate * 100
                            : ''
                        }
                        onChange={e => {
                          const val =
                            e.target.value === ''
                              ? undefined
                              : parseFloat(e.target.value) / 100;
                          if (val === undefined || !isNaN(val)) {
                            setFormData({
                              ...formData,
                              discount_rate: val,
                            });
                          }
                        }}
                        placeholder="0"
                      />
                      {getError('discount_rate') && (
                        <p className="text-sm text-red-600 mt-1">
                          {getError('discount_rate')?.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Taux de réduction applicable (0-100%)
                      </p>
                    </div>

                    {/* Aperçu Prix Final */}
                    <div className="bg-gray-50 border rounded p-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        Aperçu prix site internet
                      </div>
                      {(() => {
                        const basePriceHT =
                          formData.custom_price_ht ?? product.price_ht ?? 0;
                        const hasDiscount = (formData.discount_rate ?? 0) > 0;
                        const discountedPriceHT =
                          basePriceHT * (1 - (formData.discount_rate ?? 0));
                        const finalPriceTTC = discountedPriceHT * 1.2;

                        if (basePriceHT === 0) {
                          return (
                            <div className="text-sm text-gray-500 italic">
                              Aucun prix défini pour ce produit
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            {hasDiscount ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">
                                    Prix original HT:
                                  </span>
                                  <span className="text-sm text-gray-500 line-through">
                                    {basePriceHT.toFixed(2)} €
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    Prix réduit HT:
                                  </span>
                                  <span className="text-xl font-bold text-red-600">
                                    {discountedPriceHT.toFixed(2)} €
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    Prix TTC final:
                                  </span>
                                  <span className="text-lg font-semibold text-red-600">
                                    {finalPriceTTC.toFixed(2)} €
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    Prix HT:
                                  </span>
                                  <span className="text-xl font-bold">
                                    {basePriceHT.toFixed(2)} €
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    Prix TTC:
                                  </span>
                                  <span className="text-lg font-semibold">
                                    {finalPriceTTC.toFixed(2)} €
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Active */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Tarification active</Label>
                      <p className="text-sm text-gray-500">
                        Appliquer ce prix sur le site
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={checked =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                  </div>
                </TabsContent>

                {/* TAB 4: IMAGES */}
                <TabsContent value="images" className="space-y-6">
                  {/* STATISTIQUES EN HAUT */}
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-6">
                      {/* Total photos */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black">
                          {catalogueImages.length}
                        </div>
                        <div className="text-xs text-gray-600">
                          Photo{catalogueImages.length > 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Photo principale */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {catalogueImages.find(img => img.is_primary)
                            ? '1'
                            : '0'}
                        </div>
                        <div className="text-xs text-gray-600">Principale</div>
                      </div>

                      {/* Photos restantes */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {20 - catalogueImages.length}
                        </div>
                        <div className="text-xs text-gray-600">Restantes</div>
                      </div>
                    </div>

                    {/* Bouton actualiser */}
                    <ButtonV2
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void fetchImages().catch(error => {
                          console.error(
                            '[EditSiteInternetProductModal] fetchImages failed:',
                            error
                          );
                        });
                      }}
                      disabled={imagesLoading}
                    >
                      {imagesLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Actualiser
                    </ButtonV2>
                  </div>

                  {/* GALERIE PHOTOS */}
                  {catalogueImages.length > 0 ? (
                    <div className="space-y-4">
                      {/* Header galerie */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-black">
                          Photos du produit
                        </h3>
                        <p className="text-sm text-gray-500">
                          Cliquez sur l'⭐ pour définir comme image principale
                        </p>
                      </div>

                      {/* Grille 4 colonnes */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {catalogueImages.map((image, index) => (
                          <div
                            key={image.id}
                            className={cn(
                              'relative group border-2 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg',
                              image.is_primary
                                ? 'border-blue-500 shadow-lg ring-4 ring-blue-100'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            {/* Image - Prend toute la carte en responsive */}
                            <div className="aspect-square relative bg-gray-100">
                              <Image
                                src={image.public_url ?? ''}
                                alt={image.alt_text || `Photo ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              />
                            </div>

                            {/* Badge image principale */}
                            {image.is_primary && (
                              <div className="absolute top-3 left-3 z-10">
                                <Badge className="bg-blue-500 text-white text-xs font-medium flex items-center gap-1 px-2 py-1">
                                  <Star className="h-3 w-3 fill-white" />
                                  Principale
                                </Badge>
                              </div>
                            )}

                            {/* Overlay avec contrôles */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-center p-3 z-20">
                              <div className="flex space-x-2 z-30">
                                {/* Bouton définir comme principale */}
                                {!image.is_primary && (
                                  <ButtonV2
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      void (async () => {
                                        try {
                                          await setPrimaryImage(image.id);
                                          toast({
                                            title: 'Image principale définie',
                                            description:
                                              "L'image a été définie comme principale avec succès",
                                          });
                                        } catch (_error) {
                                          toast({
                                            title: 'Erreur',
                                            description:
                                              "Impossible de définir l'image comme principale",
                                            variant: 'destructive',
                                          });
                                        }
                                      })().catch(error => {
                                        console.error(
                                          '[EditSiteInternetProductModal] setPrimaryImage failed:',
                                          error
                                        );
                                      });
                                    }}
                                    className="h-9 px-3 bg-white/90 hover:bg-white text-black border-0 relative z-40"
                                  >
                                    <Star className="h-4 w-4 mr-1" />
                                    Principal
                                  </ButtonV2>
                                )}

                                {/* Bouton suppression */}
                                <ButtonV2
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    void (async () => {
                                      if (image.is_primary) {
                                        toast({
                                          title: 'Image principale',
                                          description:
                                            'Définissez une autre image comme principale avant de supprimer',
                                          variant: 'destructive',
                                        });
                                        return;
                                      }
                                      try {
                                        await deleteImage(image.id);
                                        toast({
                                          title: 'Image supprimée',
                                          description:
                                            "L'image a été supprimée avec succès",
                                        });
                                      } catch (_error) {
                                        toast({
                                          title: 'Erreur',
                                          description:
                                            "Impossible de supprimer l'image",
                                          variant: 'destructive',
                                        });
                                      }
                                    })().catch(error => {
                                      console.error(
                                        '[EditSiteInternetProductModal] deleteImage failed:',
                                        error
                                      );
                                    });
                                  }}
                                  className="h-9 px-3 bg-red-500/90 hover:bg-red-600 text-white border-0 relative z-40"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </ButtonV2>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* ÉTAT VIDE */
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Aucune image</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Le produit doit avoir au moins 1 image pour être
                        éligible
                      </p>
                    </div>
                  )}

                  {/* BOUTON AJOUTER */}
                  <ButtonV2
                    className="w-full"
                    onClick={() => setShowPhotosModal(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter des images
                  </ButtonV2>
                </TabsContent>

                {/* TAB 5: VARIANTES */}
                <TabsContent value="variants" className="space-y-6">
                  {/* Header avec badge count */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-gray-600" />
                      <div className="font-medium">Variantes du produit</div>
                      {product.has_variants && product.variants_count > 0 && (
                        <Badge variant="outline">
                          {product.variants_count}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Grille variantes (composant réutilisable) */}
                  <ProductVariantsGrid
                    productId={product.product_id}
                    currentProductId={product.product_id}
                  />
                </TabsContent>

                {/* TAB 6: INFORMATIONS PRODUIT */}
                <TabsContent value="informations" className="space-y-6">
                  {/* Section 1: Champs éditables avec waterfall */}
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="font-medium text-blue-900 mb-2">
                        📝 Champs éditables (priorité canal)
                      </div>
                      <p className="text-sm text-blue-700">
                        Ces champs peuvent être personnalisés pour le site
                        internet. Si non remplis, les valeurs du catalogue
                        produit seront utilisées.
                      </p>
                    </div>

                    {/* Description complète */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>Description complète</Label>
                        <span className="text-sm text-gray-500">
                          {formData.custom_description_long?.length ?? 0} / 5000
                        </span>
                      </div>
                      <Textarea
                        value={formData.custom_description_long ?? ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            custom_description_long: e.target.value,
                          })
                        }
                        placeholder="Description complète du produit pour le site internet..."
                        maxLength={5000}
                        rows={6}
                        className="font-sans"
                      />
                      {getError('custom_description_long') && (
                        <p className="text-sm text-red-600 mt-1">
                          {getError('custom_description_long')?.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Waterfall: Custom canal →{' '}
                        {product.description ? 'Description catalogue' : 'Vide'}
                      </p>
                    </div>

                    {/* Description technique */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>Description technique</Label>
                        <span className="text-sm text-gray-500">
                          {formData.custom_technical_description?.length ?? 0} /
                          2000
                        </span>
                      </div>
                      <Textarea
                        value={formData.custom_technical_description ?? ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            custom_technical_description: e.target.value,
                          })
                        }
                        placeholder="Caractéristiques techniques du produit..."
                        maxLength={2000}
                        rows={4}
                        className="font-sans"
                      />
                      {getError('custom_technical_description') && (
                        <p className="text-sm text-red-600 mt-1">
                          {getError('custom_technical_description')?.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Waterfall: Custom canal →{' '}
                        {product.technical_description
                          ? 'Description technique catalogue'
                          : 'Vide'}
                      </p>
                    </div>

                    {/* Marque */}
                    <div>
                      <Label>Marque</Label>
                      <Input
                        value={formData.custom_brand ?? ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            custom_brand: e.target.value,
                          })
                        }
                        placeholder="Nom de la marque"
                        maxLength={100}
                      />
                      {getError('custom_brand') && (
                        <p className="text-sm text-red-600 mt-1">
                          {getError('custom_brand')?.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Waterfall: Custom canal → {product.brand || 'Vide'}
                      </p>
                    </div>

                    {/* Selling Points */}
                    <div>
                      <Label>Points de vente (Selling Points)</Label>
                      <div className="space-y-2 mt-2">
                        {(formData.custom_selling_points || []).map(
                          (point, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={point}
                                onChange={e => {
                                  const newPoints = [
                                    ...(formData.custom_selling_points || []),
                                  ];
                                  newPoints[index] = e.target.value;
                                  setFormData({
                                    ...formData,
                                    custom_selling_points: newPoints,
                                  });
                                }}
                                placeholder={`Point ${index + 1}`}
                              />
                              <ButtonV2
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newPoints = (
                                    formData.custom_selling_points || []
                                  ).filter((_, i) => i !== index);
                                  setFormData({
                                    ...formData,
                                    custom_selling_points: newPoints,
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </ButtonV2>
                            </div>
                          )
                        )}
                        <ButtonV2
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              custom_selling_points: [
                                ...(formData.custom_selling_points || []),
                                '',
                              ],
                            });
                          }}
                        >
                          + Ajouter un point
                        </ButtonV2>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Waterfall: Custom canal →{' '}
                        {product.selling_points?.length > 0
                          ? `${product.selling_points.length} points catalogue`
                          : 'Vide'}
                      </p>
                    </div>
                  </div>

                  {/* Section 2: Champs READ-ONLY */}
                  <div className="border-t pt-6 space-y-6">
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <div className="font-medium text-gray-900 mb-2">
                        👁️ Informations catalogue (lecture seule)
                      </div>
                      <p className="text-sm text-gray-600">
                        Ces informations proviennent du catalogue produit et ne
                        peuvent pas être modifiées depuis ce canal.
                      </p>
                    </div>

                    {/* Grille 2 colonnes pour READ-ONLY */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Dimensions */}
                      <div className="bg-white border rounded-lg p-4">
                        <Label className="text-gray-700">Dimensions</Label>
                        <div className="text-sm text-gray-900 mt-2">
                          {formatDimensions(product.dimensions)}
                        </div>
                      </div>

                      {/* Poids */}
                      <div className="bg-white border rounded-lg p-4">
                        <Label className="text-gray-700">Poids</Label>
                        <div className="text-sm text-gray-900 mt-2">
                          {product.weight ? (
                            <span>{product.weight} kg</span>
                          ) : (
                            <span className="text-gray-400 italic">
                              Non défini
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantité minimale fournisseur */}
                      <div className="bg-white border rounded-lg p-4">
                        <Label className="text-gray-700">
                          Quantité minimale fournisseur
                        </Label>
                        <div className="text-sm text-gray-900 mt-2">
                          {product.supplier_moq ? (
                            <Badge variant="secondary">
                              {product.supplier_moq}{' '}
                              {product.supplier_moq > 1 ? 'unités' : 'unité'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">1 unité (défaut)</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Quantité minimum de commande imposée par le
                          fournisseur
                        </p>
                      </div>

                      {/* Pièces compatibles */}
                      <div className="bg-white border rounded-lg p-4">
                        <Label className="text-gray-700">
                          Pièces compatibles
                        </Label>
                        <div className="text-sm text-gray-900 mt-2">
                          {product.suitable_rooms?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.suitable_rooms.map((room, i) => (
                                <Badge key={i} variant="outline">
                                  {room}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Aucune</span>
                          )}
                        </div>
                      </div>

                      {/* Sous-catégorie */}
                      <div className="bg-white border rounded-lg p-4">
                        <Label className="text-gray-700">Sous-catégorie</Label>
                        <div className="text-sm text-gray-900 mt-2">
                          {product.subcategory_name ? (
                            <Badge variant="secondary">
                              {product.subcategory_name}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 italic">
                              Non définie
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Type produit */}
                      <div className="bg-white border rounded-lg p-4">
                        <Label className="text-gray-700">Type de produit</Label>
                        <div className="text-sm text-gray-900 mt-2">
                          {product.product_type &&
                          PRODUCT_TYPE_LABELS[product.product_type] ? (
                            <Badge
                              variant={
                                PRODUCT_TYPE_LABELS[product.product_type]
                                  .variant
                              }
                            >
                              {PRODUCT_TYPE_LABELS[product.product_type].label}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 italic">
                              Non défini
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Vidéo URL */}
                      <div className="bg-white border rounded-lg p-4">
                        <Label className="text-gray-700">Vidéo URL</Label>
                        <div className="text-sm text-gray-900 mt-2">
                          {product.video_url ? (
                            <a
                              href={product.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Voir la vidéo
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">
                              Aucune vidéo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer */}
            <div className="border-t pt-4 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {errors.length > 0 && (
                    <span className="text-red-600">
                      {errors.length} erreur{errors.length > 1 ? 's' : ''} de
                      validation
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <ButtonV2 variant="outline" onClick={onClose} type="button">
                    Annuler
                  </ButtonV2>
                  <ButtonV2 type="submit" disabled={updateProduct.isPending}>
                    {updateProduct.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Sauvegarder'
                    )}
                  </ButtonV2>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Photos (réutilisation composant existant) - HORS Dialog parent */}
      {showPhotosModal && (
        <ProductPhotosModal
          isOpen={showPhotosModal}
          onClose={() => setShowPhotosModal(false)}
          productId={product.product_id}
          productName={product.name}
          productType="product"
          onImagesUpdated={() => {
            // Invalider cache pour recharger les images
            void queryClient
              .invalidateQueries({
                queryKey: ['site-internet-products'],
              })
              .catch(error => {
                console.error(
                  '[EditSiteInternetProductModal] invalidateQueries failed:',
                  error
                );
              });
          }}
        />
      )}

      {/* Modal Visualiseur Images - HORS Dialog parent */}
      {showImageViewer && productImages.length > 0 && (
        <ProductImageViewerModal
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          images={productImages}
          initialImageIndex={selectedImageIndex}
          productName={product.name}
        />
      )}
    </>
  );
}
