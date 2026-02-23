'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';

import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';
import { Minus, Package, Plus, Ruler, Scale, Tag } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, Skeleton } from '@verone/ui';

import type {
  IBranding,
  ICartItem,
  ISelectionItem,
} from '@/app/(public)/s/[id]/selection-context';

// ============================================
// TYPES
// ============================================

interface ProductDetail {
  brand: string | null;
  style: string | null;
  dimensions: {
    width_cm?: number;
    height_cm?: number;
    length_cm?: number;
    diameter_cm?: number;
  } | null;
  weight: number | null;
  suitable_rooms: string[] | null;
  description: string | null;
  category_name: string | null;
  subcategory_name: string | null;
  selling_price_ht: number;
  selling_price_ttc: number;
  images: { public_url: string; is_primary: boolean; display_order: number }[];
}

interface ProductDetailModalProps {
  item: ISelectionItem | null;
  selectionId: string;
  isOpen: boolean;
  onClose: () => void;
  branding: IBranding;
  cart: ICartItem[];
  onAddToCart: (item: ISelectionItem) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
}

// ============================================
// CONSTANTS
// ============================================

const ROOM_LABELS: Record<string, string> = {
  salon: 'Salon',
  chambre: 'Chambre',
  bureau: 'Bureau',
  salle_a_manger: 'Salle à manger',
  cuisine: 'Cuisine',
  hall_entree: "Hall d'entrée",
  salle_de_bain: 'Salle de bain',
  terrasse: 'Terrasse',
  jardin: 'Jardin',
};

const supabase: SupabaseClient<Database> = createClient();

// ============================================
// HELPERS
// ============================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

function formatDimensions(
  dims: NonNullable<ProductDetail['dimensions']>
): string | null {
  const { width_cm, height_cm, length_cm, diameter_cm } = dims;

  if (diameter_cm) {
    const parts: string[] = [`Diam. ${diameter_cm} cm`];
    if (height_cm) parts.push(`H ${height_cm} cm`);
    return parts.join(' x ');
  }

  const parts: string[] = [];
  if (length_cm) parts.push(`L ${length_cm}`);
  if (width_cm) parts.push(`P ${width_cm}`);
  if (height_cm) parts.push(`H ${height_cm}`);

  if (parts.length === 0) return null;
  return parts.join(' x ') + ' cm';
}

// ============================================
// COMPONENT
// ============================================

export function ProductDetailModal({
  item,
  selectionId,
  isOpen,
  onClose,
  branding,
  cart,
  onAddToCart,
  onUpdateQuantity,
}: ProductDetailModalProps) {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fetchDetail = useCallback(
    async (productId: string) => {
      setIsLoading(true);
      setError(null);
      setDetail(null);
      setSelectedImageIndex(0);

      const { data, error: rpcError } = await supabase.rpc(
        'get_product_detail_public',
        {
          p_product_id: productId,
          p_selection_id: selectionId,
        }
      );

      if (rpcError) {
        console.error('[ProductDetailModal] RPC error:', rpcError);
        setError('Impossible de charger les détails du produit');
        setIsLoading(false);
        return;
      }

      const result = data as unknown as {
        success: boolean;
        error?: string;
        product?: ProductDetail;
      };

      if (!result.success || !result.product) {
        setError(result.error ?? 'Produit non trouvé');
        setIsLoading(false);
        return;
      }

      setDetail(result.product);
      setIsLoading(false);
    },
    [selectionId]
  );

  useEffect(() => {
    if (isOpen && item) {
      void fetchDetail(item.product_id).catch((err: unknown) => {
        console.error('[ProductDetailModal] Fetch failed:', err);
        setError('Erreur de chargement');
        setIsLoading(false);
      });
    }
  }, [isOpen, item, fetchDetail]);

  if (!item) return null;

  const inCart = cart.find(c => c.id === item.id);
  const images = detail?.images ?? [];
  const currentImage =
    images.length > 0
      ? images[selectedImageIndex]?.public_url
      : item.product_image;

  const dimensionsText = detail?.dimensions
    ? formatDimensions(detail.dimensions)
    : null;

  const rooms =
    detail?.suitable_rooms?.map(r => ROOM_LABELS[r] ?? r).filter(Boolean) ?? [];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        dialogSize="xl"
        className="max-h-[90vh] overflow-y-auto p-0"
      >
        {/* Accessible title */}
        <DialogTitle className="sr-only">{item.product_name}</DialogTitle>

        <div className="p-6">
          {/* Main layout: image left, info right */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image gallery */}
            <div className="w-full md:w-1/2 flex-shrink-0">
              {/* Main image */}
              <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
                {isLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : currentImage ? (
                  <Image
                    src={currentImage}
                    alt={item.product_name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-4"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={img.public_url}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                        idx === selectedImageIndex
                          ? 'border-current opacity-100'
                          : 'border-transparent opacity-60 hover:opacity-80'
                      }`}
                      style={
                        idx === selectedImageIndex
                          ? { borderColor: branding.primary_color }
                          : undefined
                      }
                    >
                      <Image
                        src={img.public_url}
                        alt={`${item.product_name} - photo ${idx + 1}`}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              {/* Name & SKU */}
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: branding.text_color }}
              >
                {item.product_name}
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                SKU : {item.product_sku}
              </p>

              {/* Brand & Style tags */}
              {isLoading ? (
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ) : (
                (detail?.brand ?? detail?.style) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {detail.brand && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                        <Tag className="h-3 w-3" />
                        {detail.brand}
                      </span>
                    )}
                    {detail.style && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                        {detail.style}
                      </span>
                    )}
                  </div>
                )
              )}

              {/* Price */}
              <div className="mb-6">
                <span
                  className="text-3xl font-bold"
                  style={{ color: branding.text_color }}
                >
                  {formatPrice(item.selling_price_ttc)}
                </span>
                <span className="text-sm text-gray-500 ml-2">TTC</span>
                {detail && (
                  <div className="text-sm text-gray-500 mt-1">
                    HT : {formatPrice(detail.selling_price_ht)}
                  </div>
                )}
              </div>

              {/* Category */}
              {isLoading ? (
                <Skeleton className="h-5 w-40 mb-4" />
              ) : (
                (detail?.category_name ?? item.category_name) && (
                  <p className="text-sm text-gray-500 mb-6">
                    {detail?.category_name ?? item.category_name}
                    {(detail?.subcategory_name ?? item.subcategory_name) && (
                      <span>
                        {' '}
                        &rsaquo;{' '}
                        {detail?.subcategory_name ?? item.subcategory_name}
                      </span>
                    )}
                  </p>
                )
              )}

              {/* Characteristics table */}
              {isLoading ? (
                <div className="space-y-3 mb-6">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                (dimensionsText ?? detail?.weight ?? rooms.length > 0) && (
                  <div className="mb-6">
                    <h3
                      className="text-sm font-semibold mb-3 uppercase tracking-wide"
                      style={{ color: branding.text_color }}
                    >
                      Caractéristiques
                    </h3>
                    <div className="border rounded-lg divide-y">
                      {dimensionsText && (
                        <div className="flex items-center gap-3 px-4 py-3 text-sm">
                          <Ruler className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-500 w-24 flex-shrink-0">
                            Dimensions
                          </span>
                          <span className="font-medium">{dimensionsText}</span>
                        </div>
                      )}
                      {detail?.weight != null && (
                        <div className="flex items-center gap-3 px-4 py-3 text-sm">
                          <Scale className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-500 w-24 flex-shrink-0">
                            Poids
                          </span>
                          <span className="font-medium">
                            {detail.weight} kg
                          </span>
                        </div>
                      )}
                      {rooms.length > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 text-sm">
                          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-500 w-24 flex-shrink-0">
                            Pièces
                          </span>
                          <span className="font-medium">
                            {rooms.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Description */}
              {detail?.description && (
                <div className="mb-6">
                  <h3
                    className="text-sm font-semibold mb-2 uppercase tracking-wide"
                    style={{ color: branding.text_color }}
                  >
                    Description
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {detail.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="mt-4 text-center text-sm text-red-500">{error}</div>
          )}
        </div>

        {/* Footer: Add to cart / quantity */}
        <div className="sticky bottom-0 border-t bg-white p-4 flex items-center justify-end gap-4">
          {inCart ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, -1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="w-8 text-center font-semibold text-lg">
                {inCart.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, 1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(item)}
              className="flex items-center gap-2 text-white py-2.5 px-6 rounded-lg font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: branding.primary_color }}
            >
              <Plus className="h-4 w-4" />
              Ajouter au panier
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
