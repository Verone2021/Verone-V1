import Image from 'next/image';

import type {
  CategoryWithChildren,
  SubcategoryWithDetails,
} from '@verone/categories';
import { Badge } from '@verone/ui';
import { ButtonUnified, IconButton } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Edit3,
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown,
  Folder,
} from 'lucide-react';

import type { HierarchyCallbacks } from '../types';
import { SubcategoryRow } from './SubcategoryRow';

interface CategoryRowProps {
  category: CategoryWithChildren;
  isExpanded: boolean;
  isSelected: boolean;
  subcategories: SubcategoryWithDetails[];
  selectedItems: string[];
  callbacks: HierarchyCallbacks;
}

export function CategoryRow({
  category,
  isExpanded,
  isSelected,
  subcategories,
  selectedItems,
  callbacks,
}: CategoryRowProps) {
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
          onChange={() => callbacks.toggleItemSelection(category.id)}
          className="w-4 h-4 mr-3 rounded border-gray-300"
        />

        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => callbacks.toggleCategoryExpansion(category.id)}
          className="p-1 mr-2"
          icon={isExpanded ? ChevronDown : ChevronRight}
          label={isExpanded ? 'Réduire' : 'Développer'}
        />

        <div className="w-12 h-12 mr-3 flex-shrink-0 relative overflow-hidden rounded-md border border-gray-200">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={category.name}
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
              'w-full h-full bg-gray-50 rounded-md border border-gray-200 flex items-center justify-center',
              category.image_url && 'hidden'
            )}
          >
            <Folder className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <span
              className="font-medium text-gray-800 hover:text-black cursor-pointer transition-colors"
              onClick={() => callbacks.navigateToCategory(category.id)}
              title="Cliquer pour voir le détail de la catégorie"
            >
              {category.name}
            </span>
            <Badge variant={category.is_active ? 'secondary' : 'secondary'}>
              {category.is_active ? 'Actif' : 'Inactif'}
            </Badge>
            <span className="text-sm text-gray-500">
              {subcategories.length} sous-catégorie(s)
            </span>
          </div>
        </div>

        <div className="flex space-x-1">
          <ButtonUnified
            variant="outline"
            size="sm"
            onClick={() => callbacks.openCreateForm('subcategory', category.id)}
            title="Ajouter une sous-catégorie"
            icon={Plus}
            iconPosition="left"
            className="text-xs"
          >
            Sous-catégorie
          </ButtonUnified>
          <IconButton
            variant="outline"
            size="sm"
            onClick={() => callbacks.openEditForm('category', category)}
            label="Modifier"
            icon={Edit3}
          />
          <IconButton
            variant="danger"
            size="sm"
            onClick={() => {
              void callbacks
                .handleDelete('category', category.id)
                .catch(error => {
                  console.error('[CategoryRow] Delete failed:', error);
                });
            }}
            label="Supprimer"
            icon={Trash2}
          />
        </div>
      </div>

      {isExpanded &&
        subcategories.map(subcategory => (
          <SubcategoryRow
            key={subcategory.id}
            subcategory={subcategory}
            isSelected={selectedItems.includes(subcategory.id)}
            onToggleSelection={callbacks.toggleItemSelection}
            onEdit={sub => callbacks.openEditForm('subcategory', sub)}
            onDelete={id => {
              void callbacks.handleDelete('subcategory', id).catch(error => {
                console.error('[SubcategoryRow] Delete failed:', error);
              });
            }}
            onNavigate={callbacks.navigateToSubcategory}
          />
        ))}
    </div>
  );
}
