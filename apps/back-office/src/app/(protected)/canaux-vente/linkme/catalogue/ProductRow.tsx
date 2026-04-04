'use client';

import Link from 'next/link';

import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';
import { Badge } from '@verone/ui';
import { IconButton } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import { Eye, Users, UserPlus, AlertTriangle } from 'lucide-react';

import { type LinkMeCatalogProduct } from '../hooks/use-linkme-catalog';
import { ProductStatusBadge } from './ProductStatusBadge';
import { StockBadge } from './StockBadge';

interface ProductRowProps {
  product: LinkMeCatalogProduct;
  variant: 'general' | 'sourced' | 'affiliate';
}

const VARIANT_HOVER: Record<string, string> = {
  general: 'hover:bg-gray-50',
  sourced: 'hover:bg-amber-50/30',
  affiliate: 'hover:bg-violet-50/30',
};

export function ProductRow({ product, variant }: ProductRowProps) {
  const hoverClass = VARIANT_HOVER[variant];

  // Prix client LinkMe calculé (utilisé pour general et sourced)
  const clientPrice =
    product.product_selling_price_ht && product.linkme_commission_rate !== null
      ? product.product_selling_price_ht *
        (1 + product.linkme_commission_rate / 100)
      : null;

  // Pour l'onglet affiliate, cette variable est intentionnellement préfixée _
  const _clientPrice =
    variant === 'affiliate'
      ? product.product_selling_price_ht &&
        product.linkme_commission_rate !== null
        ? product.product_selling_price_ht *
          (1 + product.linkme_commission_rate / 100)
        : null
      : null;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 transition-colors',
        !product.is_enabled ? 'bg-gray-50 opacity-75' : hoverClass
      )}
    >
      {/* Thumbnail */}
      <ProductThumbnail
        src={product.product_image_url}
        alt={product.product_name}
        size="sm"
        className="flex-shrink-0"
      />

      {/* Info produit */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-xs text-black truncate">
            {product.product_name}
          </h3>
          {product.is_featured && (
            <Badge
              variant="outline"
              className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50"
            >
              Vedette
            </Badge>
          )}
          <ProductStatusBadge status={product.product_status} />
          <StockBadge stock={product.product_stock_real} />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500 font-mono">
            {product.product_reference}
          </p>

          {/* Badges variant-specific */}
          {variant === 'general' && product.is_sourced && (
            <Badge
              variant="outline"
              className="text-xs border-amber-500 text-amber-700 bg-amber-50"
            >
              <Users className="h-3 w-3 mr-1" />
              {product.enseigne_name ?? product.assigned_client_name}
            </Badge>
          )}
          {variant === 'sourced' && (
            <Badge
              variant="outline"
              className="text-xs border-amber-500 text-amber-700 bg-amber-50"
            >
              <Users className="h-3 w-3 mr-1" />
              {product.enseigne_name ?? product.assigned_client_name}
            </Badge>
          )}
          {variant === 'affiliate' && (
            <Badge
              variant="outline"
              className="text-xs border-violet-500 text-violet-700 bg-violet-50"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Créé par affilié
            </Badge>
          )}

          {/* Badge prix désynchronisé (general et sourced seulement) */}
          {variant !== 'affiliate' && product.selections_price_mismatch > 0 && (
            <Badge
              variant="outline"
              className="text-xs border-orange-400 text-orange-700 bg-orange-50"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Prix désynchronisé
            </Badge>
          )}
        </div>
      </div>

      {/* Colonnes prix - partagées par general et sourced */}
      {variant !== 'affiliate' && (
        <>
          <div className="hidden md:block text-right min-w-[70px]">
            <p className="text-[10px] text-gray-400">Achat HT</p>
            <p className="text-xs text-gray-600">
              {formatPrice(product.product_price_ht)}
            </p>
          </div>

          <div className="hidden md:block text-right min-w-[70px]">
            <p className="text-[10px] text-gray-400">Vente HT</p>
            {product.product_selling_price_ht ? (
              <p className="text-xs font-medium text-blue-600">
                {formatPrice(product.product_selling_price_ht)}
              </p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>

          <div className="hidden lg:block text-right min-w-[50px]">
            <p className="text-[10px] text-gray-400">Comm.</p>
            {product.linkme_commission_rate !== null ? (
              <p className="text-xs text-purple-600">
                {product.linkme_commission_rate}%
              </p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>

          <div className="hidden lg:block text-right min-w-[80px]">
            <p className="text-[10px] text-gray-400">Prix Client</p>
            {clientPrice ? (
              <p className="text-xs font-medium text-green-600">
                {formatPrice(clientPrice)}
              </p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>

          <div className="hidden xl:block text-right min-w-[55px]">
            <p className="text-[10px] text-gray-400">Marge sécu</p>
            {product.buffer_rate !== null ? (
              <p className="text-xs text-amber-600">
                {(product.buffer_rate * 100).toFixed(0)}%
              </p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>

          <div className="hidden xl:block text-right min-w-[55px]">
            <p className="text-[10px] text-gray-400">Marge sugg.</p>
            {product.suggested_margin_rate !== null ? (
              <p className="text-xs font-medium text-emerald-600">
                {product.suggested_margin_rate}%
              </p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>
        </>
      )}

      {/* Colonnes spécifiques affilié */}
      {variant === 'affiliate' && (
        <>
          <div className="hidden md:block text-right min-w-[70px]">
            <p className="text-[10px] text-gray-400">Achat HT</p>
            <p className="text-xs text-gray-600">
              {formatPrice(product.product_price_ht)}
            </p>
          </div>

          <div className="hidden md:block text-right min-w-[70px]">
            <p className="text-[10px] text-gray-400">Vente HT</p>
            {product.product_selling_price_ht ? (
              <p className="text-xs font-medium text-blue-600">
                {formatPrice(product.product_selling_price_ht)}
              </p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>

          <div className="hidden lg:block text-right min-w-[70px]">
            <p className="text-[10px] text-gray-400">Comm. Vérone</p>
            {product.affiliate_commission_rate !== null ? (
              <p className="text-xs text-purple-600">
                {product.affiliate_commission_rate}%
              </p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>

          <div className="hidden lg:block text-right min-w-[80px]">
            <p className="text-[10px] text-gray-400">Payout HT</p>
            {product.affiliate_payout_ht !== null ? (
              <p className="text-xs font-semibold text-green-600">
                {formatPrice(product.affiliate_payout_ht)}
              </p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>
        </>
      )}

      {/* Lien détail */}
      <Link href={`/canaux-vente/linkme/catalogue/${product.id}`}>
        <IconButton
          variant="outline"
          size="sm"
          icon={Eye}
          label="Voir détails"
        />
      </Link>
    </div>
  );
}
