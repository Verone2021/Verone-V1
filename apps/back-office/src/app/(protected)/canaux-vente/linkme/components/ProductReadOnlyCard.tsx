'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from '@verone/ui';
import {
  Package,
  Building2,
  FolderTree,
  Scale,
  Ruler,
  Home,
  Layers,
} from 'lucide-react';

import type { LinkMeProductDetail, ProductVariant } from '../types';

function InfoRow({
  icon: Icon,
  label,
  children,
  className = 'bg-muted/50',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${className}`}>
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );
}

function VariantsList({
  variants,
  isLoading,
}: {
  variants: ProductVariant[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 mt-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    );
  }
  if (variants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic mt-1">
        Aucune variante
      </p>
    );
  }
  return (
    <div className="space-y-2 mt-2">
      {variants.map(variant => (
        <div
          key={variant.id}
          className="flex items-center justify-between p-2 bg-background rounded border"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {variant.name ?? variant.sku ?? 'Variante'}
            </p>
            {variant.variant_attributes && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {Object.entries(variant.variant_attributes).map(
                  ([key, value]) => (
                    <span key={key} className="text-xs text-muted-foreground">
                      {key}: {value}
                    </span>
                  )
                )}
              </div>
            )}
          </div>
          <div className="text-right ml-4">
            <p className="text-xs text-muted-foreground">
              Stock: {variant.stock_real}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDimensions(
  dimensions: Record<string, number | string> | null
): string | null {
  if (!dimensions) return null;
  const parts: string[] = [];
  if (dimensions.length) parts.push(`L: ${dimensions.length} cm`);
  if (dimensions.width) parts.push(`l: ${dimensions.width} cm`);
  if (dimensions.height) parts.push(`H: ${dimensions.height} cm`);
  if (dimensions.depth) parts.push(`P: ${dimensions.depth} cm`);
  return parts.length > 0 ? parts.join(' × ') : null;
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

interface ProductReadOnlyCardProps {
  product: LinkMeProductDetail;
  variants?: ProductVariant[];
  variantsLoading?: boolean;
}

/**
 * Section lecture seule affichant les informations produit non modifiables
 * depuis le canal de vente LinkMe
 */
export function ProductReadOnlyCard({
  product,
  variants = [],
  variantsLoading = false,
}: ProductReadOnlyCardProps) {
  const dimensionsText = formatDimensions(product.dimensions_cm);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Informations produit
          <Badge variant="secondary" className="ml-2 text-xs font-normal">
            Lecture seule
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoRow icon={FolderTree} label="Sous-catégorie">
          <p className="text-sm">
            {product.product_category_name ?? (
              <span className="text-muted-foreground italic">Non définie</span>
            )}
          </p>
        </InfoRow>
        <InfoRow icon={Building2} label="Fournisseur">
          <p className="text-sm">
            {product.product_supplier_name ?? (
              <span className="text-muted-foreground italic">Non défini</span>
            )}
          </p>
        </InfoRow>
        <InfoRow
          icon={Package}
          label="Prix d'achat HT (confidentiel)"
          className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
        >
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {formatPrice(product.cost_price)}
          </p>
        </InfoRow>
        {product.weight_kg != null && (
          <InfoRow icon={Scale} label="Poids">
            <p className="text-sm">{product.weight_kg} kg</p>
          </InfoRow>
        )}
        {dimensionsText && (
          <InfoRow icon={Ruler} label="Dimensions">
            <p className="text-sm">{dimensionsText}</p>
          </InfoRow>
        )}
        {product.room_types && product.room_types.length > 0 && (
          <InfoRow icon={Home} label="Pièces d'habitation">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {product.room_types.map((room, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {room}
                </Badge>
              ))}
            </div>
          </InfoRow>
        )}
        <InfoRow icon={Layers} label="Variantes du produit">
          <VariantsList variants={variants} isLoading={variantsLoading} />
        </InfoRow>
      </CardContent>
    </Card>
  );
}
