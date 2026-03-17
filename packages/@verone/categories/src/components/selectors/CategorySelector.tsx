'use client';

import { useState, useEffect, useCallback } from 'react';

import { Button } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { ChevronDown, Folder, FolderOpen } from 'lucide-react';

// Types hiérarchie selon business rules
interface Family {
  id: string;
  name: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  family_id: string;
}

interface Subcategory {
  id: string;
  name: string;
  description?: string;
  category_id: string;
}

interface SubcategoryWithRelations {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  categories: {
    id: string;
    name: string;
    description: string | null;
    family_id: string;
    families: {
      id: string;
      name: string;
      description: string | null;
    };
  };
}

interface CategorySelectorProps {
  value?: string; // subcategory_id
  onChange: (
    subcategoryId: string,
    hierarchy: {
      family: Family;
      category: Category;
      subcategory: Subcategory;
    }
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CategorySelector({
  value,
  onChange,
  placeholder = 'Sélectionner une catégorie...',
  disabled = false,
  className,
}: CategorySelectorProps) {
  const supabase = createClient();

  // États pour la hiérarchie
  const [families, setFamilies] = useState<Family[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // États de sélection
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);

  // États UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const loadFamilies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('families')
        .select('id, name, description')
        .order('name');

      if (fetchError) throw fetchError;

      setFamilies(data ?? []);
    } catch (_err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const loadCategories = useCallback(
    async (familyId: string) => {
      try {
        const { data, error: fetchError } = await supabase
          .from('categories')
          .select('id, name, description, family_id')
          .eq('family_id', familyId)
          .order('name');

        if (fetchError) throw fetchError;

        setCategories(data ?? []);
        setSubcategories([]); // Reset sous-catégories
        setSelectedCategory(null);
        setSelectedSubcategory(null);
      } catch (_err) {
        setError('Erreur de chargement');
      }
    },
    [supabase]
  );

  const loadSubcategories = useCallback(
    async (categoryId: string) => {
      try {
        const { data, error: fetchError } = await supabase
          .from('subcategories')
          .select('id, name, description, category_id')
          .eq('category_id', categoryId)
          .order('name');

        if (fetchError) throw fetchError;

        setSubcategories(data ?? []);
        setSelectedSubcategory(null);
      } catch (_err) {
        setError('Erreur de chargement');
      }
    },
    [supabase]
  );

  const loadInitialSelection = useCallback(
    async (subcategoryId: string) => {
      try {
        const { data, error: fetchError } = await supabase
          .from('subcategories')
          .select(
            `
          id,
          name,
          description,
          category_id,
          categories (
            id,
            name,
            description,
            family_id,
            families (
              id,
              name,
              description
            )
          )
        `
          )
          .eq('id', subcategoryId)
          .single();

        if (fetchError) throw fetchError;

        const typedData = data as unknown as SubcategoryWithRelations | null;

        if (typedData?.categories?.families) {
          const family: Family = typedData.categories.families;
          const category: Category = {
            id: typedData.categories.id,
            name: typedData.categories.name,
            description: typedData.categories.description ?? undefined,
            family_id: typedData.categories.family_id,
          };
          const subcategory: Subcategory = {
            id: typedData.id,
            name: typedData.name,
            description: typedData.description ?? undefined,
            category_id: typedData.category_id,
          };

          setSelectedFamily(family);
          setSelectedCategory(category);
          setSelectedSubcategory(subcategory);

          // Charger les listes dépendantes
          await loadCategories(family.id);
          await loadSubcategories(category.id);
        }
      } catch (_err) {
        // Silence initial selection errors
      }
    },
    [supabase, loadCategories, loadSubcategories]
  );

  // Charger les familles au montage
  useEffect(() => {
    void loadFamilies();
  }, [loadFamilies]);

  // Charger valeur initiale si fournie
  useEffect(() => {
    if (value && !selectedSubcategory) {
      void loadInitialSelection(value);
    }
  }, [value, loadInitialSelection, selectedSubcategory]);

  const handleFamilySelect = (family: Family) => {
    setSelectedFamily(family);
    void loadCategories(family.id);
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    void loadSubcategories(category.id);
  };

  const handleSubcategorySelect = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);

    if (selectedFamily && selectedCategory) {
      onChange(subcategory.id, {
        family: selectedFamily,
        category: selectedCategory,
        subcategory,
      });
    }

    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (selectedSubcategory && selectedCategory && selectedFamily) {
      return `${selectedFamily.name} › ${selectedCategory.name} › ${selectedSubcategory.name}`;
    }
    return placeholder;
  };

  if (loading && families.length === 0) {
    return (
      <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
        Chargement des catégories...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-3 border border-red-300 rounded-md bg-red-50 text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Bouton sélecteur */}
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full justify-between text-left font-normal',
          !selectedSubcategory && 'text-gray-500'
        )}
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 opacity-50 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="max-h-80 overflow-y-auto">
            {/* Sélection famille */}
            <div className="p-2 border-b border-gray-200">
              <div className="text-xs font-medium text-gray-500 mb-2">
                Famille
              </div>
              <div className="space-y-1">
                {families.map(family => (
                  <button
                    key={family.id}
                    type="button"
                    onClick={() => handleFamilySelect(family)}
                    className={cn(
                      'w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center',
                      selectedFamily?.id === family.id &&
                        'bg-black text-white hover:bg-gray-800'
                    )}
                  >
                    <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{family.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sélection catégorie */}
            {selectedFamily && (
              <div className="p-2 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Catégorie
                </div>
                <div className="space-y-1">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center pl-6',
                        selectedCategory?.id === category.id &&
                          'bg-black text-white hover:bg-gray-800'
                      )}
                    >
                      <FolderOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sélection sous-catégorie */}
            {selectedCategory && (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Sous-catégorie
                </div>
                <div className="space-y-1">
                  {subcategories.map(subcategory => (
                    <button
                      key={subcategory.id}
                      type="button"
                      onClick={() => handleSubcategorySelect(subcategory)}
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center pl-8',
                        selectedSubcategory?.id === subcategory.id &&
                          'bg-black text-white hover:bg-gray-800'
                      )}
                    >
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-3 flex-shrink-0" />
                      <span className="truncate">{subcategory.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message si pas de données */}
            {selectedFamily && categories.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                Aucune catégorie dans cette famille
              </div>
            )}

            {selectedCategory && subcategories.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                Aucune sous-catégorie dans cette catégorie
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
