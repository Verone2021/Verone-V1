'use client';

import * as React from 'react';

import { Edit2, Check, X } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  formatStatusForDisplay,
  type ProductStatus,
} from '@verone/products/utils';
import { cn } from '@verone/utils';

interface ProductInfoSectionProps {
  product: {
    id: string;
    name: string;
    sku?: string | null;
    cost_price?: number | null;
    stock_status?: 'in_stock' | 'out_of_stock' | 'coming_soon';
    product_status?: 'active' | 'preorder' | 'discontinued' | 'draft';
    supplier_id?: string | null;
    subcategory_id?: string | null;
    variant_group_id?: string | null;
  };
  onUpdate?: (
    updates: Partial<ProductInfoSectionProps['product']>
  ) => Promise<void>;
  className?: string;
}

// Helper: Calculer pourcentage complétude produit
function calculateCompletion(
  product: ProductInfoSectionProps['product']
): number {
  const fields = [
    product.name,
    product.sku,
    product.cost_price != null && product.cost_price > 0, // Prix d'achat HT
    product.product_status, // Statut commercial (NOT NULL donc toujours présent)
    product.supplier_id, // Fournisseur obligatoire
    product.subcategory_id, // Catégorisation obligatoire
  ];
  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}

// Helper: Formater prix
function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return 'Non défini';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(price);
}

export const ProductInfoSection = React.memo(
  function ProductInfoSection({
    product,
    onUpdate,
    className,
  }: ProductInfoSectionProps) {
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [editedName, setEditedName] = React.useState(product.name);
    const [isSaving, setIsSaving] = React.useState(false);

    const completion = calculateCompletion(product);
    const price = product?.cost_price; // Prix d'achat HT
    const isNameEditable = !product.variant_group_id; // Nom non éditable si dans groupe variantes

    const handleSaveName = async () => {
      if (!onUpdate || editedName === product.name) {
        setIsEditingName(false);
        return;
      }

      setIsSaving(true);
      try {
        await onUpdate({ name: editedName });
        setIsEditingName(false);
      } catch (error) {
        console.error('Erreur sauvegarde nom:', error);
        setEditedName(product.name); // Rollback
      } finally {
        setIsSaving(false);
      }
    };

    const handleCancelEdit = () => {
      setEditedName(product.name);
      setIsEditingName(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSaveName();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    };

    return (
      <div className={cn('space-y-3', className)}>
        {/* Row 1: Nom + SKU */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-neutral-600 mb-1">
              Nom du produit
            </Label>
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveName}
                  autoFocus
                  className={cn(
                    'flex-1 px-2 py-1.5 text-sm border border-primary-500 rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'transition-all duration-150'
                  )}
                  disabled={isSaving}
                />
                <ButtonV2
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={handleSaveName}
                  disabled={isSaving}
                >
                  <Check className="h-3 w-3 text-green-600" />
                </ButtonV2>
                <ButtonV2
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  <X className="h-3 w-3 text-red-600" />
                </ButtonV2>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-neutral-900 flex-1 truncate">
                  {product.name || 'Sans nom'}
                </p>
                {isNameEditable && onUpdate && (
                  <ButtonV2
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </ButtonV2>
                )}
              </div>
            )}
            {product.variant_group_id && (
              <p className="text-xs text-blue-600 mt-0.5">
                ℹ️ Nom géré par le groupe de variantes
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs text-neutral-600 mb-1">SKU</Label>
            <p className="text-sm font-mono text-neutral-700 truncate">
              {product.sku || 'Non défini'}
            </p>
          </div>
        </div>

        {/* Row 2: Prix + Statut */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-neutral-600 mb-1">
              Prix d'achat HT
            </Label>
            <p
              className={cn(
                'text-lg font-semibold',
                price ? 'text-primary-600' : 'text-neutral-400'
              )}
            >
              {formatPrice(price)}
            </p>
          </div>

          <div>
            <Label className="text-xs text-neutral-600 mb-1">Statut</Label>
            <div className="flex items-center">
              {(() => {
                if (!product.product_status)
                  return <Badge variant="secondary">Non défini</Badge>;
                const { label, variant } = formatStatusForDisplay(
                  product.product_status as ProductStatus
                );
                return <Badge variant={variant}>{label}</Badge>;
              })()}
            </div>
          </div>
        </div>

        {/* Row 3: Barre de complétude */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-neutral-600">Complétude</Label>
            <span className="text-xs font-medium text-neutral-700">
              {completion}%
            </span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300 rounded-full',
                completion >= 80 && 'bg-green-500',
                completion >= 50 && completion < 80 && 'bg-orange-500',
                completion < 50 && 'bg-red-500'
              )}
              style={{ width: `${completion}%` }}
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Comparaison shallow pour éviter re-render si props identiques
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.name === nextProps.product.name &&
      prevProps.product.sku === nextProps.product.sku &&
      prevProps.product.cost_price === nextProps.product.cost_price &&
      prevProps.product.stock_status === nextProps.product.stock_status &&
      prevProps.product.product_status === nextProps.product.product_status
    );
  }
);
