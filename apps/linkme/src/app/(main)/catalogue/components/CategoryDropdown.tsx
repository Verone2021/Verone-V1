'use client';

/**
 * CategoryDropdown
 * Dropdown pour filtrer par catégorie (remplace la sidebar)
 * Design: bouton avec dropdown multi-niveau
 */

import { useMemo, useState, useRef, useEffect } from 'react';

import { ChevronDown, Check, FolderOpen, X } from 'lucide-react';

import type { LinkMeCatalogProduct } from '@/lib/hooks/use-linkme-catalog';
import { cn } from '@/lib/utils';

interface CategoryWithSubcategories {
  name: string;
  count: number;
  subcategories: {
    id: string;
    name: string;
    count: number;
  }[];
}

interface CategoryDropdownProps {
  products: LinkMeCatalogProduct[];
  selectedCategory: string | undefined;
  selectedSubcategory: string | undefined;
  onCategorySelect: (category: string | undefined) => void;
  onSubcategorySelect: (subcategoryId: string | undefined) => void;
}

export function CategoryDropdown({
  products,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
}: CategoryDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Construire la hiérarchie des catégories
  const categories = useMemo(() => {
    const categoryMap = new Map<string, CategoryWithSubcategories>();

    products.forEach(product => {
      const categoryName = product.category_name || 'Autres';
      const subcategoryId = product.subcategory_id;
      const subcategoryName = product.subcategory_name || 'Autres';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          count: 0,
          subcategories: [],
        });
      }

      const category = categoryMap.get(categoryName)!;
      category.count++;

      if (subcategoryId) {
        const existingSub = category.subcategories.find(
          s => s.id === subcategoryId
        );
        if (existingSub) {
          existingSub.count++;
        } else {
          category.subcategories.push({
            id: subcategoryId,
            name: subcategoryName,
            count: 1,
          });
        }
      }
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(cat => ({
        ...cat,
        subcategories: cat.subcategories.sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }));
  }, [products]);

  // Trouver le nom de la sous-catégorie sélectionnée
  const selectedSubcategoryName = useMemo(() => {
    if (!selectedSubcategory) return null;
    for (const cat of categories) {
      const sub = cat.subcategories.find(s => s.id === selectedSubcategory);
      if (sub) return sub.name;
    }
    return null;
  }, [categories, selectedSubcategory]);

  const handleCategoryClick = (categoryName: string): void => {
    if (selectedCategory === categoryName && !selectedSubcategory) {
      onCategorySelect(undefined);
    } else {
      onCategorySelect(categoryName);
      onSubcategorySelect(undefined);
    }
  };

  const handleSubcategoryClick = (
    categoryName: string,
    subcategoryId: string
  ): void => {
    onCategorySelect(categoryName);
    onSubcategorySelect(subcategoryId);
    setIsOpen(false);
  };

  const handleShowAll = (): void => {
    onCategorySelect(undefined);
    onSubcategorySelect(undefined);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onCategorySelect(undefined);
    onSubcategorySelect(undefined);
  };

  // Label du bouton
  const buttonLabel = selectedSubcategoryName
    ? `${selectedCategory} > ${selectedSubcategoryName}`
    : selectedCategory || 'Toutes les catégories';

  const hasSelection = selectedCategory || selectedSubcategory;

  return (
    <div className="relative z-30" ref={dropdownRef}>
      {/* Bouton trigger - z-30 pour être au-dessus du sidebar (z-20) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all min-w-[180px] max-w-[280px]',
          isOpen
            ? 'border-linkme-turquoise bg-linkme-turquoise/5 text-linkme-marine'
            : hasSelection
              ? 'border-linkme-turquoise/50 bg-linkme-turquoise/5 text-linkme-marine'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        <FolderOpen className="h-4 w-4 flex-shrink-0" />
        <span className="truncate flex-1 text-left">{buttonLabel}</span>
        {hasSelection ? (
          <button
            onClick={handleClear}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown
            className={cn(
              'h-4 w-4 flex-shrink-0 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-80 overflow-y-auto p-2">
            {/* Option "Toutes les catégories" */}
            <button
              onClick={handleShowAll}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                !selectedCategory
                  ? 'bg-linkme-turquoise/15 text-linkme-marine font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <span>Toutes les catégories</span>
              {!selectedCategory && <Check className="h-4 w-4" />}
            </button>

            <div className="border-t border-gray-100 my-2" />

            {/* Liste des catégories */}
            {categories.map(category => (
              <div key={category.name} className="mb-1">
                {/* Catégorie principale */}
                <button
                  onClick={() => handleCategoryClick(category.name)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                    selectedCategory === category.name && !selectedSubcategory
                      ? 'bg-linkme-turquoise/15 text-linkme-marine font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{category.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {category.count}
                    </span>
                  </div>
                  {selectedCategory === category.name &&
                    !selectedSubcategory && <Check className="h-4 w-4" />}
                </button>

                {/* Sous-catégories */}
                {category.subcategories.length > 0 && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {category.subcategories.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() =>
                          handleSubcategoryClick(category.name, sub.id)
                        }
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all',
                          selectedSubcategory === sub.id
                            ? 'bg-linkme-turquoise text-white font-medium'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        )}
                      >
                        <span className="truncate">{sub.name}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs px-1.5 py-0.5 rounded',
                              selectedSubcategory === sub.id
                                ? 'bg-white/20'
                                : 'bg-gray-100 text-gray-400'
                            )}
                          >
                            {sub.count}
                          </span>
                          {selectedSubcategory === sub.id && (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
