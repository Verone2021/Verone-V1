'use client';

import { ProductThumbnail } from '@verone/products';
import { Badge, Switch, Label } from '@verone/ui';
import { Package, Eye, Star } from 'lucide-react';

import type { LinkMeProductDetail } from '../types';

interface ProductDetailHeaderProps {
  product: LinkMeProductDetail;
  onToggleActive: (value: boolean) => void;
  onToggleFeatured: (value: boolean) => void;
  isUpdating?: boolean;
}

export function ProductDetailHeader({
  product,
  onToggleActive,
  onToggleFeatured,
  isUpdating = false,
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
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground font-mono">{product.sku}</p>

          <div className="flex gap-2 flex-wrap">
            {/* Badge stock */}
            <Badge variant={product.stock_real > 0 ? 'default' : 'destructive'}>
              <Package className="h-3 w-3 mr-1" />
              {product.stock_real > 0
                ? `${product.stock_real} en stock`
                : 'Rupture'}
            </Badge>

            {/* Badge catégorie */}
            {product.product_category_name && (
              <Badge variant="outline">{product.product_category_name}</Badge>
            )}

            {/* Badge fournisseur */}
            {product.product_supplier_name && (
              <Badge variant="secondary">{product.product_supplier_name}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Toggles de configuration - Simplifiés */}
      <div className="flex gap-6 p-4 bg-muted/50 rounded-lg">
        {/* Toggle Actif (visible sur catalogue LinkMe) */}
        <div className="flex items-center gap-3">
          <Switch
            id="toggle-active"
            checked={product.is_active}
            onCheckedChange={onToggleActive}
            disabled={isUpdating}
          />
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="toggle-active" className="text-sm cursor-pointer">
              Actif
            </Label>
          </div>
        </div>

        {/* Toggle Produit vedette */}
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
      </div>
    </div>
  );
}
