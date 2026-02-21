'use client';

import { memo, useCallback, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import type { Product } from '@verone/categories/hooks';
import { Badge, ButtonUnified, IconButton } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Package,
  Archive,
  Trash2,
  ArchiveRestore,
  Eye,
  ImagePlus,
  AlertTriangle,
  Ruler,
  Weight,
  Camera,
} from 'lucide-react';

import { useProductImages } from '@verone/products/hooks';
import type { Database } from '@verone/utils/supabase/types';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

export type QuickEditField =
  | 'supplier'
  | 'subcategory'
  | 'price'
  | 'photo'
  | 'dimensions'
  | 'weight';

interface ProductCardProps {
  product: Product;
  className?: string;
  showActions?: boolean;
  priority?: boolean;
  index?: number; // Priority dynamique LCP (6 premiers produits)
  onClick?: (product: Product) => void;
  onArchive?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  archived?: boolean;
  preloadedImage?: ProductImage | null; // PERF FIX 2026-01-30: Skip useProductImages si fourni
  incompleteMode?: boolean; // Active les chips "à compléter"
  onQuickEdit?: (product: Product, field: QuickEditField) => void; // Callback clic chip
}

export const ProductCardV2 = memo(function ProductCardV2({
  product,
  className,
  showActions = true,
  priority = false,
  index,
  onClick,
  onArchive,
  onDelete,
  archived = false,
  preloadedImage,
  incompleteMode = false,
  onQuickEdit,
}: ProductCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // PERF FIX 2026-01-30: Skip useProductImages si preloadedImage fourni (batch loading)
  const { primaryImage: fetchedImage, loading: imageLoading } =
    useProductImages({
      productId: product.id,
      autoFetch: !preloadedImage, // Skip fetch si preloaded
    });

  const primaryImage = preloadedImage ?? fetchedImage;

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(product);
    } else {
      router.push(`/catalogue/${product.id}`);
    }
  }, [product, onClick, router]);

  const handleDetailsClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/catalogue/${product.id}`);
    },
    [product.id, router]
  );

  const handleArchiveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onArchive) {
        onArchive(product);
      }
    },
    [product, onArchive]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete(product);
      }
    },
    [product, onDelete]
  );

  return (
    <div
      className={cn(
        // Base card avec rounded corners 2025 - FOND BLANC PUR
        'relative overflow-hidden rounded-xl border border-gray-300 bg-white',
        'cursor-pointer transition-all duration-200 ease-out',
        // Shadow elevation progressive ⭐ KEY FEATURE
        !isHovered && 'shadow-sm',
        isHovered && 'shadow-xl -translate-y-1',
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image produit */}
      <div className="relative h-32 overflow-hidden bg-white">
        {primaryImage?.public_url && !imageLoading ? (
          <Image
            src={primaryImage.public_url}
            alt={primaryImage?.alt_text ?? product.name}
            fill
            priority={priority || (index !== undefined && index < 6)}
            loading={
              priority || (index !== undefined && index < 6)
                ? undefined
                : 'lazy'
            }
            className={cn(
              'object-contain transition-transform duration-300',
              isHovered && 'scale-110'
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {imageLoading ? (
              <div className="animate-pulse">
                <Package className="h-12 w-12 text-gray-300" />
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-50 transition-colors w-full h-full"
                onClick={e => {
                  e.stopPropagation();
                  if (incompleteMode && onQuickEdit) {
                    onQuickEdit(product, 'photo');
                  } else {
                    router.push(`/produits/catalogue/${product.id}`);
                  }
                }}
                title="Ajouter une photo"
              >
                <ImagePlus className="h-8 w-8 text-gray-300" />
                <span className="text-[9px] text-gray-400">Ajouter photo</span>
              </div>
            )}
          </div>
        )}

        {/* Badges - Optimisés 2025: text-[10px]→[9px], padding réduit */}
        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5">
          {/* Badge statut manuel (product_status) */}
          <Badge
            className={cn(
              'text-[9px] font-medium px-1 py-0.5',
              product.product_status === 'active' && 'bg-green-600 text-white',
              product.product_status === 'preorder' && 'bg-blue-600 text-white',
              product.product_status === 'discontinued' &&
                'bg-gray-600 text-white',
              product.product_status === 'draft' && 'bg-yellow-600 text-white'
            )}
          >
            {product.product_status === 'active' && '✓ Actif'}
            {product.product_status === 'preorder' && '📅 Précommande'}
            {product.product_status === 'discontinued' && '⚠ Arrêté'}
            {product.product_status === 'draft' && '📝 Brouillon'}
          </Badge>

          {product.condition !== 'new' && (
            <Badge
              variant="outline"
              className="bg-white/90 backdrop-blur-sm text-black text-[9px] px-1 py-0.5"
            >
              {product.condition === 'refurbished'
                ? 'Reconditionné'
                : 'Occasion'}
            </Badge>
          )}
        </div>

        {/* Badges top-left : fournisseur + type produit */}
        {(product.supplier != null || product.product_type === 'custom') && (
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {product.supplier && (
              <Badge className="bg-white/90 backdrop-blur-sm text-gray-700 border border-gray-300 text-[9px] font-medium px-1 py-0.5 max-w-[80px] truncate">
                {product.supplier.trade_name ?? product.supplier.legal_name}
              </Badge>
            )}
            {product.product_type === 'custom' && (
              <Badge className="bg-purple-600 text-white text-[9px] font-medium px-1 py-0.5">
                Sur mesure
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Informations produit - Layout compact */}
      <div className="p-2 space-y-1">
        {/* Nom */}
        <h3 className="font-semibold text-sm text-black line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* SKU + Stock sur la même ligne */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-500 font-mono">{product.sku}</p>
          {product.stock_real != null && (
            <span
              className={cn(
                'text-[10px] font-semibold',
                product.stock_real > 10 ? 'text-green-600' : 'text-orange-600'
              )}
            >
              Stock: {product.stock_real}
            </span>
          )}
        </div>

        {/* Prix compact */}
        {product.cost_price != null && (
          <div className="text-sm font-bold text-gray-900">
            {product.cost_price.toFixed(2)} €
            <span className="text-[10px] font-normal text-gray-500 ml-0.5">
              HT
            </span>
          </div>
        )}

        {/* Chips "à compléter" en mode incomplet */}
        {incompleteMode && onQuickEdit && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {!product.supplier_id && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onQuickEdit(product, 'supplier');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-medium text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <AlertTriangle className="h-3 w-3" />
                Fournisseur
              </button>
            )}
            {!product.subcategory_id && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onQuickEdit(product, 'subcategory');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-medium text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <AlertTriangle className="h-3 w-3" />
                Sous-catégorie
              </button>
            )}
            {product.cost_price == null && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onQuickEdit(product, 'price');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-medium text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <AlertTriangle className="h-3 w-3" />
                Prix d&apos;achat
              </button>
            )}
            {product.has_images === false && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onQuickEdit(product, 'photo');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-medium text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <Camera className="h-3 w-3" />
                Photo
              </button>
            )}
            {product.dimensions == null && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onQuickEdit(product, 'dimensions');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-medium text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <Ruler className="h-3 w-3" />
                Dimensions
              </button>
            )}
            {product.weight == null && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onQuickEdit(product, 'weight');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-medium text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <Weight className="h-3 w-3" />
                Poids
              </button>
            )}
          </div>
        )}

        {/* Actions - UNE SEULE LIGNE - BOUTONS OPTIMISÉS 2025: size="xs" au lieu de "sm" */}
        {showActions && (
          <div className="flex gap-1.5 pt-0.5">
            {/* Bouton principal : Voir détail (OUTLINE blanc/noir) - Optimisé: size="xs" */}
            <ButtonUnified
              variant="outline"
              size="xs"
              onClick={handleDetailsClick}
              className="flex-1 text-xs"
              icon={Eye}
              iconPosition="left"
            >
              Voir détail
            </ButtonUnified>

            {/* Bouton secondaire : Archive/Restaurer (success=vert ou outline) - Optimisé: size="sm" */}
            {onArchive && (
              <IconButton
                variant={archived ? 'success' : 'outline'}
                size="sm"
                onClick={handleArchiveClick}
                icon={archived ? ArchiveRestore : Archive}
                label={
                  archived ? 'Restaurer le produit' : 'Archiver le produit'
                }
              />
            )}

            {/* Bouton tertiaire : Supprimer (danger=rouge si archived) - Optimisé: size="sm" */}
            {archived && onDelete && (
              <IconButton
                variant="danger"
                size="sm"
                onClick={handleDeleteClick}
                icon={Trash2}
                label="Supprimer le produit"
              />
            )}
          </div>
        )}
      </div>

      {/* Hover overlay subtil */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none',
          'transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
});
