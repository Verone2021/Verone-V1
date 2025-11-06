'use client';

import { memo, useCallback, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Package, Archive, Trash2, ArchiveRestore, Eye } from 'lucide-react';
import { useProductImages } from '@/hooks/use-product-images';
import type { Product } from '@/hooks/use-catalogue';

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
}

// Configuration statuts avec couleurs Design System V2
const statusConfig = {
  in_stock: {
    label: 'En stock',
    className: 'bg-green-600 text-white',
  },
  out_of_stock: {
    label: 'Rupture',
    className: 'bg-red-600 text-white',
  },
  preorder: {
    label: 'Précommande',
    className: 'bg-blue-600 text-white',
  },
  coming_soon: {
    label: 'Bientôt',
    className: 'bg-blue-600 text-white', // ✅ Bleu au lieu de noir
  },
  discontinued: {
    label: 'Arrêté',
    className: 'bg-gray-600 text-white',
  },
};

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
}: ProductCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const status = statusConfig[product.stock_status] || {
    label: product.stock_status || 'Statut inconnu',
    className: 'bg-gray-600 text-white',
  };

  const { primaryImage, loading: imageLoading } = useProductImages({
    productId: product.id,
    autoFetch: true,
  });

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
      {/* Image produit - FOND BLANC - Optimisé 2025: h-32 → h-24 (réduction 25%) */}
      <div className="relative h-24 overflow-hidden bg-white">
        {primaryImage?.public_url && !imageLoading ? (
          <Image
            src={primaryImage.public_url}
            alt={primaryImage.alt_text || product.name}
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
              <Package className="h-12 w-12 text-gray-400" />
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

        {/* Badge "nouveau" - Optimisé 2025 */}
        {(() => {
          const createdAt = new Date(product.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdAt > thirtyDaysAgo;
        })() && (
          <div className="absolute top-1.5 left-1.5">
            <Badge className="bg-green-500 text-white text-[9px] font-medium px-1 py-0.5">
              🆕 Nouveau
            </Badge>
          </div>
        )}
      </div>

      {/* Informations produit - HIÉRARCHIE CLAIRE - Optimisé 2025: p-3→p-2.5, space-y-2→1.5 */}
      <div className="p-2.5 space-y-1.5">
        {/* Header - NOM + SKU */}
        <div className="space-y-0.5">
          <h3 className="font-semibold text-sm text-black line-clamp-2 min-h-[2.5rem] leading-tight">
            {product.name}
          </h3>
          <p className="text-[10px] text-gray-600 font-mono">
            SKU: {product.sku}
          </p>
        </div>

        {/* Stock + Prix Achat - COMPACT */}
        <div className="space-y-1">
          {product.stock_quantity !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600">Stock:</span>
              <span
                className={cn(
                  'text-xs font-semibold',
                  product.stock_quantity > 10
                    ? 'text-green-600'
                    : 'text-orange-600'
                )}
              >
                {product.stock_quantity}
              </span>
            </div>
          )}

          {product.cost_price && (
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-600">
                Prix d'achat indicatif
              </span>
              <div className="text-lg font-bold text-gray-900">
                {product.cost_price.toFixed(2)} €
                <span className="text-xs font-normal text-gray-500 ml-1">
                  HT
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions - UNE SEULE LIGNE - BOUTONS OPTIMISÉS 2025: size="xs" au lieu de "sm" */}
        {showActions && (
          <div className="flex gap-1.5 pt-0.5">
            {/* Bouton principal : Voir détail (OUTLINE blanc/noir) - Optimisé: size="xs" */}
            <ButtonV2
              variant="outline"
              size="xs"
              onClick={handleDetailsClick}
              className="flex-1 text-xs"
              icon={Eye}
            >
              Voir détail
            </ButtonV2>

            {/* Bouton secondaire : Archive/Restaurer (OUTLINE orange) - Optimisé: size="xs" */}
            {onArchive && (
              <ButtonV2
                variant="outline"
                size="xs"
                onClick={handleArchiveClick}
                className="w-7 h-7 p-0 flex items-center justify-center border-orange-500 text-orange-600 hover:border-orange-600 hover:bg-orange-50"
                style={{ padding: 0 }}
                aria-label={
                  archived ? 'Restaurer le produit' : 'Archiver le produit'
                }
              >
                {archived ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </ButtonV2>
            )}

            {/* Bouton tertiaire : Supprimer (OUTLINE rouge si archived) - Optimisé: size="xs" */}
            {archived && onDelete && (
              <ButtonV2
                variant="outline"
                size="xs"
                onClick={handleDeleteClick}
                className="w-7 h-7 p-0 flex items-center justify-center border-red-600 text-red-600 hover:border-red-700 hover:bg-red-50"
                style={{ padding: 0 }}
                aria-label="Supprimer le produit"
              >
                <Trash2 className="h-4 w-4" />
              </ButtonV2>
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
