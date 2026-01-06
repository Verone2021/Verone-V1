'use client';

/**
 * ProductCard E-commerce
 * Design moderne et minimaliste style boutique raffinée
 * Avec tooltip hover affichant style + description
 */

import Image from 'next/image';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';
import { Package, Plus, Sparkles, Star } from 'lucide-react';

import type { LinkMeCatalogProduct } from '@/lib/hooks/use-linkme-catalog';
import { cn } from '@/lib/utils';

// Labels pour les styles décoratifs
const STYLE_LABELS: Record<string, string> = {
  minimaliste: 'Minimaliste',
  contemporain: 'Contemporain',
  moderne: 'Moderne',
  scandinave: 'Scandinave',
  industriel: 'Industriel',
  classique: 'Classique',
  boheme: 'Bohème',
  art_deco: 'Art Déco',
};

interface ProductCardProps {
  product: LinkMeCatalogProduct;
  canAddToSelection: boolean;
  onAddToSelection: () => void;
  showCustomBadge?: boolean;
}

/**
 * Calcule le prix client LinkMe avec commission
 * Formule: prix_vente × (1 + commission_rate / 100)
 */
function calculateCustomerPrice(
  sellingPriceHT: number,
  commissionRate: number | null
): number {
  const commission = commissionRate ?? 0;
  return sellingPriceHT * (1 + commission / 100);
}

/**
 * Formate le prix en euros
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(price);
}

export function ProductCard({
  product,
  canAddToSelection,
  onAddToSelection,
  showCustomBadge = false,
}: ProductCardProps): JSX.Element {
  const displayTitle = product.custom_title || product.name;

  // Prix client calculé = prix vente × (1 + commission%)
  const customerPriceHT = calculateCustomerPrice(
    product.selling_price_ht,
    product.channel_commission_rate
  );

  // Texte pour le tooltip (style + description)
  const styleLabel = product.style ? STYLE_LABELS[product.style] : null;
  const hasTooltipContent = styleLabel || product.custom_description;

  return (
    <div className="relative p-[2px] rounded-xl bg-gradient-to-br from-[#7E84C0] to-[#5DBEBB] transition-all duration-300 hover:shadow-lg group">
      <div className="bg-white rounded-[10px] overflow-hidden h-full">
        {/* Image avec ratio carré style Amazon + Tooltip hover */}
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="aspect-square relative bg-white p-3 overflow-hidden cursor-pointer">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={displayTitle}
                    fill
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                    <Package className="h-12 w-12 text-gray-300" />
                  </div>
                )}

                {/* Badges superposés */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.is_featured && (
                    <span className="inline-flex items-center gap-1 bg-linkme-mauve text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm">
                      <Star className="h-3 w-3 fill-current" />
                      Vedette
                    </span>
                  )}
                </div>

                {showCustomBadge && (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-linkme-royal text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm">
                    <Sparkles className="h-3 w-3" />
                    Sur mesure
                  </span>
                )}

                {/* Overlay hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
            </TooltipTrigger>
            {hasTooltipContent && (
              <TooltipContent
                side="top"
                className="max-w-xs bg-white border border-gray-200 shadow-lg"
              >
                {styleLabel && (
                  <p className="font-semibold text-linkme-marine text-sm mb-1">
                    {styleLabel}
                  </p>
                )}
                {product.custom_description && (
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {product.custom_description}
                  </p>
                )}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Contenu */}
        <div className="p-4">
          {/* Catégorie */}
          {product.category_name && (
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
              {product.category_name}
            </p>
          )}

          {/* Nom */}
          <h3 className="font-medium text-linkme-marine line-clamp-2 text-sm mb-2 leading-snug group-hover:text-linkme-turquoise transition-colors">
            {displayTitle}
          </h3>

          {/* Référence */}
          <p className="text-[10px] text-gray-400 font-mono mb-3">
            Réf: {product.reference}
          </p>

          {/* Prix et bouton */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-linkme-marine">
                {formatPrice(customerPriceHT)}
              </span>
              <span className="text-xs text-gray-400 ml-1">HT</span>
            </div>

            <button
              onClick={onAddToSelection}
              disabled={!canAddToSelection}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                canAddToSelection
                  ? 'bg-linkme-turquoise text-white hover:bg-linkme-turquoise/90 hover:shadow-md active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ProductListItem - Vue liste
 * Design compact pour affichage en liste
 */
interface ProductListItemProps {
  product: LinkMeCatalogProduct;
  canAddToSelection: boolean;
  onAddToSelection: () => void;
  showCustomBadge?: boolean;
}

export function ProductListItem({
  product,
  canAddToSelection,
  onAddToSelection,
  showCustomBadge = false,
}: ProductListItemProps): JSX.Element {
  const displayTitle = product.custom_title || product.name;

  // Prix client calculé = prix vente × (1 + commission%)
  const customerPriceHT = calculateCustomerPrice(
    product.selling_price_ht,
    product.channel_commission_rate
  );

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors group">
      {/* Image */}
      <div className="w-16 h-16 bg-white border border-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={displayTitle}
            fill
            className="object-contain p-1"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Package className="h-6 w-6 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-linkme-marine truncate text-sm group-hover:text-linkme-turquoise transition-colors">
            {displayTitle}
          </h3>
          {showCustomBadge && (
            <span className="inline-flex items-center gap-0.5 bg-linkme-royal/10 text-linkme-royal text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
              <Sparkles className="h-2.5 w-2.5" />
              Sur mesure
            </span>
          )}
          {product.is_featured && (
            <span className="inline-flex items-center gap-0.5 bg-linkme-mauve/10 text-linkme-mauve text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
              <Star className="h-2.5 w-2.5 fill-current" />
              Vedette
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {product.category_name && (
            <span className="text-gray-400">{product.category_name} • </span>
          )}
          <span className="font-mono text-gray-400">{product.reference}</span>
        </p>
      </div>

      {/* Prix */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-linkme-marine">
          {formatPrice(customerPriceHT)}
        </p>
        <p className="text-[10px] text-gray-400">HT</p>
      </div>

      {/* Action */}
      <button
        onClick={onAddToSelection}
        disabled={!canAddToSelection}
        className={cn(
          'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex-shrink-0',
          canAddToSelection
            ? 'bg-linkme-turquoise text-white hover:bg-linkme-turquoise/90 hover:shadow-md'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Ajouter</span>
      </button>
    </div>
  );
}
