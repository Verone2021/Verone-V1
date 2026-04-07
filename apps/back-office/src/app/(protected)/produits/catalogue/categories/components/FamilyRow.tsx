import Image from 'next/image';

import type { FamilyWithStats, CategoryWithChildren } from '@verone/categories';
import { Badge } from '@verone/ui';
import { ButtonUnified, IconButton } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Edit3,
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
} from 'lucide-react';

import type { HierarchyCallbacks } from '../types';
import { CategoryRow } from './CategoryRow';

interface FamilyRowProps {
  family: FamilyWithStats;
  isExpanded: boolean;
  isSelected: boolean;
  familyCategories: CategoryWithChildren[];
  expandedCategories: string[];
  selectedItems: string[];
  callbacks: HierarchyCallbacks;
}

export function FamilyRow({
  family,
  isExpanded,
  isSelected,
  familyCategories,
  expandedCategories,
  selectedItems,
  callbacks,
}: FamilyRowProps) {
  return (
    <div className="border-b border-gray-100">
      <div
        className={cn(
          'flex items-center py-3 px-4 hover:bg-gray-50 transition-colors',
          isSelected && 'bg-gray-50'
        )}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => callbacks.toggleItemSelection(family.id)}
          className="w-4 h-4 mr-3 rounded border-gray-300"
        />

        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => callbacks.toggleFamilyExpansion(family.id)}
          className="p-1 mr-2"
          icon={isExpanded ? ChevronDown : ChevronRight}
          label={isExpanded ? 'Réduire' : 'Développer'}
        />

        <div className="w-16 h-16 mr-3 flex-shrink-0 relative overflow-hidden rounded-md border border-gray-200">
          {family.image_url ? (
            <Image
              src={family.image_url}
              alt={family.name}
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
              'w-full h-full bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center',
              family.image_url && 'hidden'
            )}
          >
            <ImageIcon className="h-6 w-6 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <span
              className="font-medium text-gray-900 hover:text-black cursor-pointer transition-colors"
              onClick={() => callbacks.navigateToFamily(family.id)}
              title="Cliquer pour voir le détail de la famille"
            >
              {family.name}
            </span>
            <Badge variant={family.is_active ? 'secondary' : 'secondary'}>
              {family.is_active ? 'Actif' : 'Inactif'}
            </Badge>
            <span className="text-sm text-gray-500">
              {family.categories_count} catégorie(s)
            </span>
          </div>
        </div>

        <div className="flex space-x-1">
          <ButtonUnified
            variant="outline"
            size="sm"
            onClick={() => callbacks.openCreateForm('category', family.id)}
            title="Ajouter une catégorie"
            icon={Plus}
            iconPosition="left"
            className="text-xs"
          >
            Catégorie
          </ButtonUnified>
          <IconButton
            variant="outline"
            size="sm"
            onClick={() => callbacks.openEditForm('family', family)}
            label="Modifier"
            icon={Edit3}
          />
          <IconButton
            variant="danger"
            size="sm"
            onClick={() => {
              void callbacks.handleDelete('family', family.id).catch(error => {
                console.error('[FamilyRow] Delete failed:', error);
              });
            }}
            label="Supprimer"
            icon={Trash2}
          />
        </div>
      </div>

      {isExpanded &&
        familyCategories.map(category => (
          <CategoryRow
            key={category.id}
            category={category}
            isExpanded={expandedCategories.includes(category.id)}
            isSelected={selectedItems.includes(category.id)}
            subcategories={callbacks.getSubcategoriesForCategory(category.id)}
            selectedItems={selectedItems}
            callbacks={callbacks}
          />
        ))}
    </div>
  );
}
