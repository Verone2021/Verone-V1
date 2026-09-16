'use client';

import type { SourcingProduct } from '@verone/products';
import { canPassGate } from '@verone/products/utils';
import { ButtonV2 } from '@verone/ui';
import { FlaskConical, X } from 'lucide-react';

interface SourcingBulkActionsBarProps {
  /** Produits sélectionnés, dans l'ordre de la liste. */
  selected: SourcingProduct[];
  busy: boolean;
  onClear: () => void;
  onOrderSamples: (productIds: string[]) => void;
}

/**
 * Actions sur plusieurs produits en sourcing — [BO-SOURCING-SAMPLE-002]
 *
 * `request_sample_order` regroupe les produits d'un même fournisseur dans une
 * seule commande brouillon : sélectionner plusieurs produits et cliquer une
 * fois suffit. Les fiches incomplètes sont annoncées avant l'envoi plutôt que
 * refusées une par une.
 */
export function SourcingBulkActionsBar({
  selected,
  busy,
  onClear,
  onOrderSamples,
}: SourcingBulkActionsBarProps) {
  if (selected.length === 0) return null;

  const ready = selected.filter(product => canPassGate(product, 'sample'));
  const blocked = selected.length - ready.length;
  const suppliers = new Set(
    ready.map(product => product.supplier_id).filter(Boolean)
  );

  return (
    <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-black bg-white px-4 py-3 shadow-lg">
      <span className="text-sm font-medium text-black">
        {selected.length} produit{selected.length > 1 ? 's' : ''} sélectionné
        {selected.length > 1 ? 's' : ''}
      </span>

      <ButtonV2
        variant="primary"
        size="sm"
        icon={FlaskConical}
        disabled={busy || ready.length === 0}
        onClick={() => onOrderSamples(ready.map(product => product.id))}
        className="h-11 md:h-9"
      >
        Commander les échantillons
        {ready.length > 0 ? ` (${ready.length})` : ''}
      </ButtonV2>

      {ready.length > 0 && suppliers.size > 0 && (
        <span className="text-xs text-gray-500">
          {suppliers.size === 1
            ? 'Une seule commande fournisseur'
            : `${suppliers.size} commandes fournisseurs, une par fournisseur`}
        </span>
      )}
      {blocked > 0 && (
        <span className="text-xs text-amber-700">
          {blocked} sans fournisseur ou sans prix d’achat — non commandable
          {blocked > 1 ? 's' : ''}
        </span>
      )}

      <ButtonV2
        variant="ghost"
        size="sm"
        icon={X}
        onClick={onClear}
        disabled={busy}
        className="ml-auto h-11 md:h-9"
      >
        Annuler la sélection
      </ButtonV2>
    </div>
  );
}
