'use client';

import type { SourcingProduct } from '@verone/products';
import {
  availableLifecycleActions,
  canPassGate,
  type SourcingListSegment,
} from '@verone/products/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@verone/ui';
import {
  Archive,
  Building,
  CheckCircle,
  Edit,
  Eye,
  Info,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from 'lucide-react';

import { PRODUCT_USED_MESSAGE } from '@/hooks/product-history';

export interface SourcingProductActionHandlers {
  onView: () => void;
  onViewSupplier: (() => void) | undefined;
  onEdit: () => void;
  onValidate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

interface SourcingProductActionsProps extends SourcingProductActionHandlers {
  product: SourcingProduct;
  segment: SourcingListSegment;
  /** false si le produit a servi (consultation, commande, stock) ou tant que ce n'est pas vérifié */
  canDelete: boolean;
}

// Bouton natif : ButtonV2 impose hauteur, largeur et marges en style en ligne,
// ce qui masque l'icône dans un carré et empêche la cible tactile de 44 px.
const ICON_BUTTON =
  'inline-flex h-11 w-11 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 md:h-9 md:w-9';

/**
 * Actions d'une ligne de la liste sourcing : seules celles que la base
 * acceptera (availableLifecycleActions) sont proposées.
 */
export function SourcingProductActions({
  product,
  segment,
  canDelete,
  onView,
  onViewSupplier,
  onEdit,
  onValidate,
  onArchive,
  onRestore,
  onDelete,
}: SourcingProductActionsProps) {
  const isWithdrawn = Boolean(product.archived_at);
  const isValidated = segment === 'validated';
  const allowed = availableLifecycleActions(
    product.sourcing_status,
    isWithdrawn
  );
  // Même règle que la fiche et que la base (sourcing_missing_fields) :
  // le bouton n'apparaît que si la validation passera vraiment.
  const canValidate =
    !isValidated &&
    allowed.includes('validate') &&
    canPassGate(product, 'catalogue');
  const canWithdraw = !isValidated && allowed.includes('withdraw');
  const viewLabel = isValidated ? 'Voir au catalogue' : 'Voir la fiche';

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        className={ICON_BUTTON}
        onClick={onView}
        aria-label={viewLabel}
        title={viewLabel}
      >
        <Eye className="h-4 w-4" />
      </button>

      {canValidate && (
        <button
          type="button"
          onClick={onValidate}
          aria-label="Valider au catalogue"
          title="Valider au catalogue"
          className={cn(
            ICON_BUTTON,
            'border-green-200 text-green-600 hover:bg-green-50'
          )}
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={ICON_BUTTON}
            aria-label="Plus d'actions"
            title="Plus d'actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isValidated && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
          )}
          {onViewSupplier && (
            <DropdownMenuItem onClick={onViewSupplier}>
              <Building className="mr-2 h-4 w-4" />
              Voir le fournisseur
            </DropdownMenuItem>
          )}
          {(canWithdraw || isWithdrawn) && <DropdownMenuSeparator />}
          {canWithdraw && (
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Retirer
            </DropdownMenuItem>
          )}
          {isWithdrawn && (
            <>
              <DropdownMenuItem onClick={onRestore}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurer
              </DropdownMenuItem>
              {canDelete ? (
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled
                  className="max-w-[240px] whitespace-normal text-gray-600"
                >
                  <Info className="mr-2 h-4 w-4 flex-shrink-0" />
                  {PRODUCT_USED_MESSAGE}
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
