'use client';

import { useState, useEffect } from 'react';

import { ChevronDown, Folder, FolderOpen } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { cn } from '@verone/utils';

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

  // Charger les familles au montage
  useEffect(() => {
    loadFamilies();
  }, []);

  // Charger valeur initiale si fournie
  useEffect(() => {
    if (value && !selectedSubcategory) {
      loadInitialSelection(value);
    }
  }, [value]);

  const loadFamilies = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('families')
        .select('id, name, description')
        .order('name');

      if (error) throw error;

      setFamilies((data as any) || []);
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, family_id')
        .eq('family_id', familyId)
        .order('name');

      if (error) throw error;

      setCategories((data as any) || []);
      setSubcategories([]); // Reset sous-catégories
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } catch (err) {
      setError('Erreur de chargement');
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, description, category_id')
        .eq('category_id', categoryId)
        .order('name');

      if (error) throw error;

      setSubcategories((data as any) || []);
      setSelectedSubcategory(null);
    } catch (err) {
      setError('Erreur de chargement');
    }
  };

  const loadInitialSelection = async (subcategoryId: string) => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;

      if (data && (data as any).categories?.families) {
        const family = (data as any).categories.families;
        const category = {
          id: (data as any).categories.id,
          name: (data as any).categories.name,
          description: (data as any).categories.description,
          family_id: (data as any).categories.family_id,
        };
        const subcategory = {
          id: data.id,
          name: data.name,
          description: data.description,
          category_id: data.category_id,
        };

        setSelectedFamily(family);
        setSelectedCategory(category);
        setSelectedSubcategory(subcategory as any);

        // Charger les listes dépendantes
        await loadCategories(family.id);
        await loadSubcategories(category.id);
      }
    } catch (err) {
      // Silence initial selection errors
    }
  };

  const handleFamilySelect = (family: Family) => {
    setSelectedFamily(family);
    loadCategories(family.id);
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    loadSubcategories(category.id);
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
      <ButtonV2
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
      </ButtonV2>

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
