'use client';

import { useState, useEffect } from 'react';

import { ChevronDown, Tag, Check } from 'lucide-react';

import { cn } from '@verone/utils';
import { useFamilies } from '@verone/categories/hooks';
import { useCategories } from '@verone/categories/hooks';
import { useSubcategories } from '@verone/categories/hooks';

interface CategoryHierarchySelectorProps {
  value?: string; // subcategory_id
  onChange: (
    subcategoryId: string | null,
    hierarchyInfo?: {
      family_id: string;
      category_id: string;
      subcategory_id: string;
      hierarchy_name: string;
    }
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

interface HierarchyInfo {
  family_id: string;
  family_name: string;
  category_id: string;
  category_name: string;
  subcategory_id: string;
  subcategory_name: string;
}

export function CategoryHierarchySelector({
  value,
  onChange,
  placeholder = 'Sélectionner une sous-catégorie',
  disabled = false,
  className,
  required = false,
}: CategoryHierarchySelectorProps) {
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [currentHierarchy, setCurrentHierarchy] =
    useState<HierarchyInfo | null>(null);

  // Hooks pour charger les données
  const { families, loading: familiesLoading } = useFamilies();
  const { allCategories, loading: categoriesLoading } = useCategories();
  const { subcategories, loading: subcategoriesLoading } = useSubcategories();

  // Initialiser la sélection si une valeur est fournie
  useEffect(() => {
    if (value && subcategories.length > 0) {
      const foundSubcategory = subcategories.find(sub => sub.id === value);
      if (foundSubcategory?.category) {
        const foundCategory = allCategories.find(
          cat => cat.id === foundSubcategory.category_id
        );
        if (foundCategory) {
          setSelectedFamily(foundCategory.family_id || '');
          setSelectedCategory(foundCategory.id);
          setSelectedSubcategory(foundSubcategory.id);

          setCurrentHierarchy({
            family_id: foundCategory.family_id || '',
            family_name:
              families.find(f => f.id === foundCategory.family_id)?.name || '',
            category_id: foundCategory.id,
            category_name: foundCategory.name,
            subcategory_id: foundSubcategory.id,
            subcategory_name: foundSubcategory.name,
          });
        }
      }
    }
  }, [value, subcategories, allCategories, families]);

  // Filtrer les catégories par famille sélectionnée
  const filteredCategories = selectedFamily
    ? allCategories.filter(cat => cat.family_id === selectedFamily)
    : [];

  // Filtrer les sous-catégories par catégorie sélectionnée
  const filteredSubcategories = selectedCategory
    ? subcategories.filter(sub => sub.category_id === selectedCategory)
    : [];

  const handleFamilySelect = (familyId: string) => {
    setSelectedFamily(familyId);
    setSelectedCategory('');
    setSelectedSubcategory('');
    setCurrentHierarchy(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
    setCurrentHierarchy(null);
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);

    // Construire les informations hiérarchiques complètes
    const subcategory = filteredSubcategories.find(
      sub => sub.id === subcategoryId
    );
    const category = allCategories.find(cat => cat.id === selectedCategory);
    const family = families.find(f => f.id === selectedFamily);

    if (subcategory && category && family) {
      const hierarchyInfo = {
        family_id: family.id,
        family_name: family.name,
        category_id: category.id,
        category_name: category.name,
        subcategory_id: subcategory.id,
        subcategory_name: subcategory.name,
      };

      setCurrentHierarchy(hierarchyInfo);

      // Appeler onChange avec les informations complètes
      onChange(subcategoryId, {
        family_id: family.id,
        category_id: category.id,
        subcategory_id: subcategory.id,
        hierarchy_name: `${family.name} › ${category.name} › ${subcategory.name}`,
      });

      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedFamily('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setCurrentHierarchy(null);
    onChange(null);
  };

  if (familiesLoading || categoriesLoading || subcategoriesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-2" />
          <p className="text-sm text-gray-600">Chargement catégories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <label className="block text-sm font-medium text-black mb-2">
        <Tag className="inline h-4 w-4 mr-2" />
        Catégorisation {required && <span className="text-red-600">*</span>}
      </label>

      {/* Affichage de la sélection actuelle */}
      <div
        className={cn(
          'min-h-[40px] px-3 py-2 border rounded-md bg-white cursor-pointer transition-colors',
          isOpen
            ? 'border-black ring-2 ring-black ring-opacity-20'
            : 'border-gray-300',
          disabled && 'bg-gray-50 cursor-not-allowed',
          'flex items-center justify-between'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex-1">
          {currentHierarchy ? (
            <div className="text-sm">
              <span className="text-black font-medium">
                {currentHierarchy.family_name} ›{' '}
                {currentHierarchy.category_name} ›{' '}
                {currentHierarchy.subcategory_name}
              </span>
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {currentHierarchy && !disabled && (
            <button
              onClick={e => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-gray-400 hover:text-red-600 text-xs"
            >
              ✕
            </button>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </div>

      {/* Dropdown de sélection */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-black rounded-md shadow-lg max-h-96 overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-200 h-80">
            {/* Colonne Familles */}
            <div className="overflow-y-auto">
              <div className="p-2 bg-gray-50 border-b">
                <h4 className="text-xs font-medium text-gray-700">Familles</h4>
              </div>
              <div className="p-1">
                {families.map(family => (
                  <div
                    key={family.id}
                    onClick={() => handleFamilySelect(family.id)}
                    className={cn(
                      'px-2 py-1 text-sm cursor-pointer rounded hover:bg-gray-100',
                      selectedFamily === family.id
                        ? 'bg-black text-white'
                        : 'text-gray-900'
                    )}
                  >
                    {family.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Colonne Catégories */}
            <div className="overflow-y-auto">
              <div className="p-2 bg-gray-50 border-b">
                <h4 className="text-xs font-medium text-gray-700">
                  Catégories
                </h4>
              </div>
              <div className="p-1">
                {selectedFamily ? (
                  filteredCategories.map(category => (
                    <div
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={cn(
                        'px-2 py-1 text-sm cursor-pointer rounded hover:bg-gray-100',
                        selectedCategory === category.id
                          ? 'bg-black text-white'
                          : 'text-gray-900'
                      )}
                    >
                      {category.name}
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-1 text-xs text-gray-400 italic">
                    Sélectionnez une famille
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Sous-catégories */}
            <div className="overflow-y-auto">
              <div className="p-2 bg-gray-50 border-b">
                <h4 className="text-xs font-medium text-gray-700">
                  Sous-catégories
                </h4>
              </div>
              <div className="p-1">
                {selectedCategory ? (
                  filteredSubcategories.map(subcategory => (
                    <div
                      key={subcategory.id}
                      onClick={() => handleSubcategorySelect(subcategory.id)}
                      className={cn(
                        'px-2 py-1 text-sm cursor-pointer rounded hover:bg-gray-100 flex items-center justify-between',
                        selectedSubcategory === subcategory.id
                          ? 'bg-green-600 text-white'
                          : 'text-gray-900'
                      )}
                    >
                      <span>{subcategory.name}</span>
                      {selectedSubcategory === subcategory.id && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-1 text-xs text-gray-400 italic">
                    Sélectionnez une catégorie
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer avec actions */}
          <div className="p-2 bg-gray-50 border-t flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {currentHierarchy
                ? 'Sélection confirmée'
                : 'Sélectionnez une sous-catégorie pour valider'}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Overlay de fermeture */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
