'use client';

import { ProductThumbnail } from '@verone/products';
import { Badge, Switch, Label, Button } from '@verone/ui';
import {
  Package,
  Eye,
  Star,
  Scale,
  Ruler,
  Home,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

import type { LinkMeProductDetail } from '../types';

function ProductBadges({ product }: { product: LinkMeProductDetail }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Badge variant={product.stock_real > 0 ? 'default' : 'destructive'}>
        <Package className="h-3 w-3 mr-1" />
        {product.stock_real > 0 ? `${product.stock_real} en stock` : 'Rupture'}
      </Badge>
      {product.product_category_name && (
        <Badge variant="outline">{product.product_category_name}</Badge>
      )}
      {product.product_supplier_name && (
        <Badge variant="secondary">{product.product_supplier_name}</Badge>
      )}
      {product.weight_kg && (
        <Badge variant="outline">
          <Scale className="h-3 w-3 mr-1" />
          {product.weight_kg} kg
        </Badge>
      )}
      {product.dimensions_cm &&
        (product.dimensions_cm.length ||
          product.dimensions_cm.width ||
          product.dimensions_cm.height) && (
          <Badge variant="outline">
            <Ruler className="h-3 w-3 mr-1" />
            {[
              product.dimensions_cm.length &&
                `L: ${product.dimensions_cm.length}`,
              product.dimensions_cm.width &&
                `l: ${product.dimensions_cm.width}`,
              product.dimensions_cm.height &&
                `H: ${product.dimensions_cm.height}`,
            ]
              .filter(Boolean)
              .join(' × ')}{' '}
            cm
          </Badge>
        )}
      {product.room_types && product.room_types.length > 0 && (
        <Badge variant="outline">
          <Home className="h-3 w-3 mr-1" />
          {product.room_types.join(', ')}
        </Badge>
      )}
    </div>
  );
}

function ConfigToggles({
  product,
  onToggleActive,
  onToggleFeatured,
  onDelete,
  isUpdating,
  isDeleting,
}: {
  product: LinkMeProductDetail;
  onToggleActive: (v: boolean) => void;
  onToggleFeatured: (v: boolean) => void;
  onDelete?: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Switch
          id="toggle-enabled"
          checked={product.is_enabled}
          onCheckedChange={onToggleActive}
          disabled={isUpdating}
        />
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="toggle-enabled" className="text-sm cursor-pointer">
            Activé
          </Label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          id="toggle-featured"
          checked={product.is_featured}
          onCheckedChange={onToggleFeatured}
          disabled={isUpdating}
        />
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <Label htmlFor="toggle-featured" className="text-sm cursor-pointer">
            Produit vedette
          </Label>
        </div>
      </div>
      <div className="flex-1" />
      {!product.is_enabled && onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Retirer du catalogue
        </Button>
      )}
    </div>
  );
}

interface ProductDetailHeaderProps {
  product: LinkMeProductDetail;
  onToggleActive: (value: boolean) => void;
  onToggleFeatured: (value: boolean) => void;
  onDelete?: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function ProductDetailHeader({
  product,
  onToggleActive,
  onToggleFeatured,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: ProductDetailHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Image et infos de base */}
      <div className="flex gap-6">
        <ProductThumbnail
          src={product.primary_image_url}
          alt={product.name}
          size="xl"
          className="rounded-lg"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground font-mono">{product.sku}</p>
            </div>
            <Link
              href={`/produits/catalogue/${product.product_id}`}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors shrink-0"
            >
              Voir fiche produit
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <ProductBadges product={product} />
        </div>
      </div>

      <ConfigToggles
        product={product}
        onToggleActive={onToggleActive}
        onToggleFeatured={onToggleFeatured}
        onDelete={onDelete}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  );
}
