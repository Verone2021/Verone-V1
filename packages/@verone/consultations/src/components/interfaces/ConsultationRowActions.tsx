'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import { Edit, Trash2, Check, X, MoreHorizontal } from 'lucide-react';

import type { ConsultationItem } from '@verone/consultations/hooks';

interface ConsultationRowActionsProps {
  item: ConsultationItem;
  isEditing: boolean;
  onStartEdit: (item: ConsultationItem) => void;
  onSaveEdit: (itemId: string) => void;
  onCancelEdit: () => void;
  onRemove: (itemId: string, productName: string) => void;
}

/** Cellule « Actions » avec boutons Save/Cancel en mode édition ou menu déroulant. */
export function ConsultationRowActions({
  item,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
}: ConsultationRowActionsProps) {
  return (
    <td className="pr-4 pl-3 py-0 h-10 text-right">
      {isEditing ? (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onSaveEdit(item.id)}
            className="h-6 w-6 flex items-center justify-center rounded bg-emerald-600 hover:bg-emerald-700 text-white"
            aria-label="Sauvegarder"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="h-6 w-6 flex items-center justify-center rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-600"
            aria-label="Annuler"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded text-zinc-300 hover:text-zinc-700 hover:bg-zinc-100"
              aria-label="Plus d'actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onStartEdit(item)}>
              <Edit className="h-3.5 w-3.5 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() =>
                onRemove(item.id, item.product?.name ?? 'ce produit')
              }
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </td>
  );
}
