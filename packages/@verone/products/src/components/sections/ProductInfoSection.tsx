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

/** Missing fields count per section for completion detail display */
interface MissingFieldsBySection {
  infosGenerales: number;
  descriptions: number;
  categorisation: number;
  fournisseur: number;
  stock: number;
  tarification: number;
  caracteristiques: number;
  identifiants: number;
}

const SECTION_LABELS: Record<string, string> = {
  infosGenerales: 'Infos generales',
  descriptions: 'Descriptions',
  categorisation: 'Categorisation',
  fournisseur: 'Fournisseur',
  stock: 'Stock',
  tarification: 'Tarification',
  caracteristiques: 'Caracteristiques',
  identifiants: 'Identifiants',
};

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

    // Ajouts pour calcul complétude étendu (6 champs supplémentaires)
    variant_attributes?: Record<string, unknown> | null;
    style?: string | null;
    dimensions?: Record<string, unknown> | null;
    weight?: number | null;
    variant_group?: {
      style?: string | null;
      dimensions_length?: number | null;
      dimensions_width?: number | null;
      dimensions_height?: number | null;
      common_weight?: number | null;
    } | null;
  };
  onUpdate?: (
    updates: Partial<ProductInfoSectionProps['product']>
  ) => Promise<void>;
  className?: string;
  completionPercentage?: number;
  /** Detailed missing fields per section (from page.tsx calculateAllMissingFields) */
  missingFields?: MissingFieldsBySection;
}

// Helper: Calculer pourcentage complétude produit (6 champs de base + 6 caractéristiques = 12 champs)
function calculateCompletion(
  product: ProductInfoSectionProps['product']
): number {
  // === CHAMPS DE BASE (6) ===
  const basicFields = [
    product.name, // Nom produit
    product.sku, // SKU
    product.cost_price != null && product.cost_price > 0, // Prix d'achat HT
    product.product_status, // Statut commercial (NOT NULL donc toujours présent)
    product.supplier_id, // Fournisseur obligatoire
    product.subcategory_id, // Catégorisation obligatoire
  ];

  // === CARACTÉRISTIQUES (6) ===
  const characteristicsFields = [
    // 1. Couleur (variant_attributes.color)
    product.variant_attributes?.color != null,

    // 2. Matériau (variant_attributes.material)
    product.variant_attributes?.material != null,

    // 3. Style (hérité du variant_group si existe, sinon colonne style)
    product.variant_group_id
      ? product.variant_group?.style != null
      : product.style != null,

    // 4. Finition (variant_attributes.finish)
    product.variant_attributes?.finish != null,

    // 5. Dimensions (héritées du variant_group si existe, sinon colonne dimensions)
    product.variant_group_id
      ? product.variant_group?.dimensions_length != null ||
        product.variant_group?.dimensions_width != null ||
        product.variant_group?.dimensions_height != null
      : product.dimensions != null &&
        Object.keys(product.dimensions).length > 0,

    // 6. Poids (hérité du variant_group si existe, sinon colonne weight)
    product.variant_group_id
      ? product.variant_group?.common_weight != null
      : product.weight != null,
  ];

  const allFields = [...basicFields, ...characteristicsFields];
  const completed = allFields.filter(Boolean).length;
  return Math.round((completed / allFields.length) * 100);
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
    completionPercentage,
    missingFields,
  }: ProductInfoSectionProps) {
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [editedName, setEditedName] = React.useState(product.name);
    const [isSaving, setIsSaving] = React.useState(false);

    const completion = completionPercentage ?? calculateCompletion(product);
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
          {missingFields && completion < 100 && (
            <p className="text-xs text-neutral-500 mt-1.5">
              Champs manquants :{' '}
              {Object.entries(missingFields)
                .filter(([, count]) => count > 0)
                .map(
                  ([key, count]) => `${SECTION_LABELS[key] ?? key} (${count})`
                )
                .join(' · ')}
            </p>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Comparaison shallow pour éviter re-render si props identiques
    // Inclut maintenant les caractéristiques pour calcul complétude correct
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.name === nextProps.product.name &&
      prevProps.product.sku === nextProps.product.sku &&
      prevProps.product.cost_price === nextProps.product.cost_price &&
      prevProps.product.stock_status === nextProps.product.stock_status &&
      prevProps.product.product_status === nextProps.product.product_status &&
      prevProps.product.supplier_id === nextProps.product.supplier_id &&
      prevProps.product.subcategory_id === nextProps.product.subcategory_id &&
      // Nouveaux champs pour calcul complétude
      prevProps.product.variant_attributes ===
        nextProps.product.variant_attributes &&
      prevProps.product.style === nextProps.product.style &&
      prevProps.product.dimensions === nextProps.product.dimensions &&
      prevProps.product.weight === nextProps.product.weight &&
      prevProps.product.variant_group === nextProps.product.variant_group &&
      prevProps.completionPercentage === nextProps.completionPercentage &&
      prevProps.missingFields === nextProps.missingFields
    );
  }
);
