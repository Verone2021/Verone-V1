import Image from 'next/image';

import type { SubcategoryWithDetails } from '@verone/categories';
import { Badge } from '@verone/ui';
import { IconButton } from '@verone/ui';
import { cn } from '@verone/utils';
import { Edit3, Trash2, Minus } from 'lucide-react';

interface SubcategoryRowProps {
  subcategory: SubcategoryWithDetails;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onEdit: (subcategory: SubcategoryWithDetails) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
}

export function SubcategoryRow({
  subcategory,
  isSelected,
  onToggleSelection,
  onEdit,
  onDelete,
  onNavigate,
}: SubcategoryRowProps) {
  return (
    <div className="ml-8">
      <div
        className={cn(
          'flex items-center py-2 px-4 hover:bg-gray-50 transition-colors',
          isSelected && 'bg-gray-50'
        )}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(subcategory.id)}
          className="w-4 h-4 mr-3 rounded border-gray-300"
        />

        <div className="w-10 h-10 mr-3 flex-shrink-0 relative overflow-hidden rounded-md border border-gray-200">
          {subcategory.image_url ? (
            <Image
              src={subcategory.image_url}
              alt={subcategory.name}
              fill
              className="object-cover"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={cn(
              'w-full h-full bg-gray-50 rounded border border-gray-200 flex items-center justify-center',
              subcategory.image_url && 'hidden'
            )}
          >
            <Minus className="h-3 w-3 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <span
              className="font-medium text-gray-700 hover:text-black cursor-pointer transition-colors"
              onClick={() => onNavigate(subcategory.id)}
              title="Cliquer pour voir le détail de la sous-catégorie"
            >
              {subcategory.name}
            </span>
            <Badge variant={subcategory.is_active ? 'secondary' : 'secondary'}>
              {subcategory.is_active ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </div>

        <div className="flex space-x-1">
          <IconButton
            variant="outline"
            size="sm"
            onClick={() => onEdit(subcategory)}
            label="Modifier"
            icon={Edit3}
          />
          <IconButton
            variant="danger"
            size="sm"
            onClick={() => onDelete(subcategory.id)}
            label="Supprimer"
            icon={Trash2}
          />
        </div>
      </div>
    </div>
  );
}
