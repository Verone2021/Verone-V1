'use client';

import { ButtonUnified } from '@verone/ui';
import { Archive, CircleSlash, Eye, EyeOff, Tag, X } from 'lucide-react';

interface CatalogueBulkActionsBarProps {
  count: number;
  busy: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onChangeStatus: () => void;
  onChangePrice: () => void;
  onArchive: () => void;
  onClear: () => void;
}

/**
 * Barre d'actions en masse au-dessus de la liste catalogue.
 * Apparaît dès qu'au moins un produit est sélectionné.
 */
export function CatalogueBulkActionsBar({
  count,
  busy,
  onPublish,
  onUnpublish,
  onChangeStatus,
  onChangePrice,
  onArchive,
  onClear,
}: CatalogueBulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 shadow-sm">
      <span className="text-sm font-medium text-blue-900">
        {count} produit{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <ButtonUnified
          variant="outline"
          size="sm"
          onClick={onPublish}
          disabled={busy}
          aria-label="Publier sur le site"
        >
          <Eye className="mr-1.5 h-4 w-4" />
          Publier
        </ButtonUnified>
        <ButtonUnified
          variant="outline"
          size="sm"
          onClick={onUnpublish}
          disabled={busy}
          aria-label="Dépublier du site"
        >
          <EyeOff className="mr-1.5 h-4 w-4" />
          Dépublier
        </ButtonUnified>
        <ButtonUnified
          variant="outline"
          size="sm"
          onClick={onChangeStatus}
          disabled={busy}
        >
          <CircleSlash className="mr-1.5 h-4 w-4" />
          Statut
        </ButtonUnified>
        <ButtonUnified
          variant="outline"
          size="sm"
          onClick={onChangePrice}
          disabled={busy}
        >
          <Tag className="mr-1.5 h-4 w-4" />
          Prix
        </ButtonUnified>
        <ButtonUnified
          variant="outline"
          size="sm"
          onClick={onArchive}
          disabled={busy}
          className="text-red-700 hover:bg-red-50"
        >
          <Archive className="mr-1.5 h-4 w-4" />
          Archiver
        </ButtonUnified>
        <ButtonUnified
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={busy}
          aria-label="Effacer la sélection"
        >
          <X className="h-4 w-4" />
        </ButtonUnified>
      </div>
    </div>
  );
}
