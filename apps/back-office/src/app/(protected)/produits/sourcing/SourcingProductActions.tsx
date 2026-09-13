'use client';

import type { SourcingProduct } from '@verone/products';
import {
  availableLifecycleActions,
  type SourcingListSegment,
} from '@verone/products/utils';
import {
  ButtonV2,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

const ICON_BUTTON = 'h-11 w-11 md:h-9 md:w-9';

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
  const canValidate =
    !isValidated &&
    allowed.includes('validate') &&
    Boolean(product.supplier_id) &&
    (product.cost_price ?? 0) > 0;
  const canWithdraw = !isValidated && allowed.includes('withdraw');
  const viewLabel = isValidated ? 'Voir au catalogue' : 'Voir la fiche';

  return (
    <div className="flex items-center justify-end gap-1">
      <ButtonV2
        variant="outline"
        size="sm"
        className={ICON_BUTTON}
        onClick={onView}
        aria-label={viewLabel}
        title={viewLabel}
      >
        <Eye className="h-4 w-4" />
      </ButtonV2>

      {canValidate && (
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={onValidate}
          aria-label="Valider au catalogue"
          title="Valider au catalogue"
          className={`${ICON_BUTTON} border-green-200 text-green-600 hover:bg-green-50`}
        >
          <CheckCircle className="h-4 w-4" />
        </ButtonV2>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonV2
            variant="outline"
            size="sm"
            className={ICON_BUTTON}
            aria-label="Plus d'actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </ButtonV2>
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
