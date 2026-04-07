'use client';

import Link from 'next/link';

import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';
import { Badge, Card, CardContent } from '@verone/ui';
import { IconButton } from '@verone/ui';
import { Progress } from '@verone/ui';
import { cn } from '@verone/utils';
import { Eye, Users, UserPlus, AlertTriangle } from 'lucide-react';

import { type LinkMeCatalogProduct } from '../hooks/use-linkme-catalog';
import { calculateSimpleCompleteness } from '../types';
import { ProductStatusBadge } from './ProductStatusBadge';
import { StockBadge } from './StockBadge';

interface ProductCardProps {
  product: LinkMeCatalogProduct;
  variant: 'general' | 'sourced' | 'affiliate';
}

const VARIANT_BORDER: Record<string, string> = {
  general: 'border-gray-200 hover:border-gray-300',
  sourced: 'border-amber-200 hover:border-amber-300',
  affiliate: 'border-violet-200 hover:border-violet-300',
};

export function ProductCard({ product, variant }: ProductCardProps) {
  const completeness = calculateSimpleCompleteness(product);

  const activeBorderClass = VARIANT_BORDER[variant];

  return (
    <Card
      className={cn(
        'border-2 transition-all duration-150',
        !product.is_enabled
          ? 'border-gray-200 bg-gray-50 opacity-75'
          : activeBorderClass
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: Thumbnail + Info */}
        <div className="flex items-start gap-3">
          <ProductThumbnail
            src={product.product_image_url}
            alt={product.product_name}
            size="md"
            className="flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs text-black truncate">
              {product.product_name}
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              {product.product_reference}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
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

            {/* Badge variant-specific */}
            {variant === 'sourced' && (
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className="text-xs border-amber-500 text-amber-700 bg-amber-50"
                >
                  <Users className="h-3 w-3 mr-1" />
                  {product.enseigne_name ?? product.assigned_client_name}
                </Badge>
              </div>
            )}
            {variant === 'affiliate' && (
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className="text-xs border-violet-500 text-violet-700 bg-violet-50"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Créé par affilié
                </Badge>
              </div>
            )}
            {variant === 'general' && product.is_sourced && (
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className="text-xs border-amber-500 text-amber-700 bg-amber-50"
                >
                  <Users className="h-3 w-3 mr-1" />
                  {product.enseigne_name ?? product.assigned_client_name}
                </Badge>
              </div>
            )}
            {product.selections_price_mismatch > 0 && (
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className="text-xs border-orange-400 text-orange-700 bg-orange-50"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Prix désynchronisé
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Complétude */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span
              className={cn(
                completeness === 100 ? 'text-green-600' : 'text-amber-600'
              )}
            >
              {completeness}% complet
            </span>
            {completeness < 100 && (
              <span className="text-gray-400">Non validé</span>
            )}
          </div>
          <Progress
            value={completeness}
            className={cn(
              'h-1.5',
              completeness === 100
                ? '[&>div]:bg-green-500'
                : '[&>div]:bg-amber-500'
            )}
          />
        </div>

        {/* Footer: Stats + Action */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-gray-500">
            <span>{product.views_count} vues</span>
            <span className="mx-1">•</span>
            <span>{product.selections_count} sél.</span>
          </div>
          <Link href={`/canaux-vente/linkme/catalogue/${product.id}`}>
            <IconButton
              variant="outline"
              size="sm"
              icon={Eye}
              label="Voir détails"
            />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
