'use client';

import { useState, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { useFamilies } from '@verone/categories';
import { useCategories } from '@verone/categories';
import { useSubcategories } from '@verone/categories';
import type { FamilyWithStats } from '@verone/categories';
import type { CategoryWithChildren } from '@verone/categories';
import type { SubcategoryWithDetails } from '@verone/categories';
import { Badge } from '@verone/ui';
import { ButtonUnified, IconButton } from '@verone/ui';
import { cn } from '@verone/utils';
import { checkSLOCompliance } from '@verone/utils';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  FolderPlus,
  Folder,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Minus,
  Image as ImageIcon,
} from 'lucide-react';

import { CategoryForm } from '@/components/forms/category-form';
import { FamilyForm } from '@/components/forms/family-form';
import { SubcategoryForm } from '@/components/forms/subcategory-form';

// 🔗 HOOKS SUPABASE - Connexion aux vraies données

// 📋 TYPES - Importés depuis les hooks

// Interface filtres pour la hiérarchie complète
interface HierarchyFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  level: 'all' | 'family' | 'category' | 'subcategory';
}

// ⚠️ POLITIQUE ABSOLUE: JAMAIS DE DONNÉES MOCK
// Toutes les données proviennent exclusivement de la base Supabase

export default function CategoriesPage() {
  const startTime = performance.now();
  const router = useRouter();

  // 🔗 HOOKS SUPABASE - Connexion aux vraies données
  const {
    families,
    loading: familiesLoading,
    error: familiesError,
    createFamily,
    updateFamily,
    deleteFamily,
    toggleFamilyStatus,
  } = useFamilies();

  const {
    categories,
    allCategories, // Liste plate pour accès par family_id
    loading: categoriesLoading,
    error: categoriesError,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const {
    subcategories,
    loading: subcategoriesLoading,
    error: subcategoriesError,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useSubcategories();

  // États pour la gestion des filtres et de l'interface
  const [filters, setFilters] = useState<HierarchyFilters>({
    search: '',
    status: 'all',
    level: 'all',
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedFamilies, setExpandedFamilies] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // États pour les formulaires CRUD
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    type: 'family' | 'category' | 'subcategory';
    mode: 'create' | 'edit';
    data?: any;
    parentId?: string;
  }>({
    isOpen: false,
    type: 'family',
    mode: 'create',
  });

  // 🔍 FILTRAGE DES DONNÉES RÉELLES
  const filteredFamilies = useMemo(() => {
    if (!families) return [];

    let filtered = [...families];

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        family =>
          family.name.toLowerCase().includes(searchLower) ||
          family.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par statut
    if (filters.status !== 'all') {
      const isActiveFilter = filters.status === 'active';
      filtered = filtered.filter(family => family.is_active === isActiveFilter);
    }

    return filtered;
  }, [families, filters]);

  // 🔍 FONCTION POUR OBTENIR LES CATÉGORIES D'UNE FAMILLE
  const getCategoriesForFamily = (familyId: string): CategoryWithChildren[] => {
    if (!allCategories) return [];
    return allCategories
      .filter(cat => cat.family_id === familyId)
      .map(cat => ({ ...cat, children: [], level: cat.level || 0 }));
  };

  // 🔍 FONCTION POUR OBTENIR LES SOUS-CATÉGORIES D'UNE CATÉGORIE
  const getSubcategoriesForCategory = (
    categoryId: string
  ): SubcategoryWithDetails[] => {
    if (!subcategories) return [];
    return subcategories.filter(sub => sub.category_id === categoryId);
  };

  // Fonctions utilitaires pour l'interface
  const toggleFamilyExpansion = (familyId: string) => {
    setExpandedFamilies(prev =>
      prev.includes(familyId)
        ? prev.filter(id => id !== familyId)
        : [...prev, familyId]
    );
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // === FONCTIONS CRUD CONNECTÉES ===

  // Ouvrir le formulaire de création
  const openCreateForm = (
    type: 'family' | 'category' | 'subcategory',
    parentId?: string
  ) => {
    setFormState({
      isOpen: true,
      type,
      mode: 'create',
      parentId,
    });
  };

  // Ouvrir le formulaire de modification
  const openEditForm = (
    type: 'family' | 'category' | 'subcategory',
    data: any
  ) => {
    setFormState({
      isOpen: true,
      type,
      mode: 'edit',
      data,
    });
  };

  // Fermer le formulaire
  const closeForm = () => {
    setFormState({
      isOpen: false,
      type: 'family',
      mode: 'create',
    });
  };

  // Gestionnaire de soumission de formulaire
  const handleFormSubmit = async (formData: any) => {
    try {
      if (formState.mode === 'create') {
        switch (formState.type) {
          case 'family':
            await createFamily(formData);
            break;
          case 'category':
            await createCategory({
              ...formData,
              family_id: formState.parentId,
            });
            break;
          case 'subcategory':
            await createSubcategory({
              ...formData,
              category_id: formState.parentId,
            });
            break;
        }
      } else {
        switch (formState.type) {
          case 'family':
            await updateFamily(formState.data.id, formData);
            break;
          case 'category':
            await updateCategory(formState.data.id, formData);
            break;
          case 'subcategory':
            await updateSubcategory(formState.data.id, formData);
            break;
        }
      }
      closeForm();
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
    }
  };

  // Supprimer un élément
  const handleDelete = async (
    type: 'family' | 'category' | 'subcategory',
    id: string
  ) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    try {
      switch (type) {
        case 'family':
          await deleteFamily(id);
          break;
        case 'category':
          await deleteCategory(id);
          break;
        case 'subcategory':
          await deleteSubcategory(id);
          break;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert(
        "Erreur lors de la suppression. Vérifiez qu'il n'y a pas d'éléments liés."
      );
    }
  };

  // Changement de statut en lot
  const handleBulkStatusToggle = async () => {
    console.log('Changement de statut en lot pour :', selectedItems);
    // TODO: Implémenter le changement en lot avec les hooks
  };

  const handleDeleteItems = async () => {
    if (!confirm(`Supprimer ${selectedItems.length} élément(s) ?`)) return;
    console.log('Suppression des éléments :', selectedItems);
    // TODO: Implémenter la suppression en lot avec les hooks
  };

  // 🧭 NAVIGATION - Fonctions de navigation vers les pages détail
  const navigateToFamily = (familyId: string) => {
    router.push(`/catalogue/families/${familyId}`);
  };

  const navigateToCategory = (categoryId: string) => {
    router.push(`/catalogue/categories/${categoryId}`);
  };

  const navigateToSubcategory = (subcategoryId: string) => {
    router.push(`/catalogue/subcategories/${subcategoryId}`);
  };

  // États de chargement combinés
  const isLoading =
    familiesLoading || categoriesLoading || subcategoriesLoading;
  const hasError = familiesError || categoriesError || subcategoriesError;

  // Calcul du temps de chargement
  const loadTime = Math.round(performance.now() - startTime);

  // 🎨 RENDU DES COMPOSANTS

  const FamilyRow = ({ family }: { family: FamilyWithStats }) => {
    const isExpanded = expandedFamilies.includes(family.id);
    const isSelected = selectedItems.includes(family.id);
    const familyCategories = getCategoriesForFamily(family.id);

    return (
      <div className="border-b border-gray-100">
        {/* Ligne famille */}
        <div
          className={cn(
            'flex items-center py-3 px-4 hover:bg-gray-50 transition-colors',
            isSelected && 'bg-gray-50'
          )}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleItemSelection(family.id)}
            className="w-4 h-4 mr-3 rounded border-gray-300"
          />

          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => toggleFamilyExpansion(family.id)}
            className="p-1 mr-2"
            icon={isExpanded ? ChevronDown : ChevronRight}
            label={isExpanded ? 'Réduire' : 'Développer'}
          />

          {/* Image thumbnail */}
          <div className="w-16 h-16 mr-3 flex-shrink-0">
            {family.image_url ? (
              <img
                src={family.image_url}
                alt={family.name}
                className="w-full h-full object-cover rounded-md border border-gray-200"
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
                onClick={() => navigateToFamily(family.id)}
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
              onClick={() => openCreateForm('category', family.id)}
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
              onClick={() => openEditForm('family', family)}
              label="Modifier"
              icon={Edit3}
            />
            <IconButton
              variant="danger"
              size="sm"
              onClick={() => handleDelete('family', family.id)}
              label="Supprimer"
              icon={Trash2}
            />
          </div>
        </div>

        {/* Catégories de la famille */}
        {isExpanded &&
          familyCategories.map(category => (
            <CategoryRow key={category.id} category={category} />
          ))}
      </div>
    );
  };

  const CategoryRow = ({ category }: { category: CategoryWithChildren }) => {
    const isExpanded = expandedCategories.includes(category.id);
    const isSelected = selectedItems.includes(category.id);
    const categorySubcategories = getSubcategoriesForCategory(category.id);

    return (
      <div className="ml-8">
        {/* Ligne catégorie */}
        <div
          className={cn(
            'flex items-center py-2 px-4 hover:bg-gray-50 transition-colors',
            isSelected && 'bg-gray-50'
          )}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleItemSelection(category.id)}
            className="w-4 h-4 mr-3 rounded border-gray-300"
          />

          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => toggleCategoryExpansion(category.id)}
            className="p-1 mr-2"
            icon={isExpanded ? ChevronDown : ChevronRight}
            label={isExpanded ? 'Réduire' : 'Développer'}
          />

          {/* Image thumbnail */}
          <div className="w-12 h-12 mr-3 flex-shrink-0">
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-full h-full object-cover rounded-md border border-gray-200"
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
                onClick={() => navigateToCategory(category.id)}
                title="Cliquer pour voir le détail de la catégorie"
              >
                {category.name}
              </span>
              <Badge variant={category.is_active ? 'secondary' : 'secondary'}>
                {category.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              <span className="text-sm text-gray-500">
                {categorySubcategories.length} sous-catégorie(s)
              </span>
            </div>
          </div>

          <div className="flex space-x-1">
            <ButtonUnified
              variant="outline"
              size="sm"
              onClick={() => openCreateForm('subcategory', category.id)}
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
              onClick={() => openEditForm('category', category)}
              label="Modifier"
              icon={Edit3}
            />
            <IconButton
              variant="danger"
              size="sm"
              onClick={() => handleDelete('category', category.id)}
              label="Supprimer"
              icon={Trash2}
            />
          </div>
        </div>

        {/* Sous-catégories de la catégorie */}
        {isExpanded &&
          categorySubcategories.map(subcategory => (
            <div key={subcategory.id} className="ml-8">
              <div
                className={cn(
                  'flex items-center py-2 px-4 hover:bg-gray-50 transition-colors',
                  selectedItems.includes(subcategory.id) && 'bg-gray-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(subcategory.id)}
                  onChange={() => toggleItemSelection(subcategory.id)}
                  className="w-4 h-4 mr-3 rounded border-gray-300"
                />

                {/* Image thumbnail for subcategory */}
                <div className="w-10 h-10 mr-3 flex-shrink-0">
                  {subcategory.image_url ? (
                    <img
                      src={subcategory.image_url}
                      alt={subcategory.name}
                      className="w-full h-full object-cover rounded-md border border-gray-200"
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
                      onClick={() => navigateToSubcategory(subcategory.id)}
                      title="Cliquer pour voir le détail de la sous-catégorie"
                    >
                      {subcategory.name}
                    </span>
                    <Badge
                      variant={
                        subcategory.is_active ? 'secondary' : 'secondary'
                      }
                    >
                      {subcategory.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>

                <div className="flex space-x-1">
                  <IconButton
                    variant="outline"
                    size="sm"
                    onClick={() => openEditForm('subcategory', subcategory)}
                    label="Modifier"
                    icon={Edit3}
                  />
                  <IconButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete('subcategory', subcategory.id)}
                    label="Supprimer"
                    icon={Trash2}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  };

  const HierarchyFilters = () => (
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher familles, catégories, sous-catégories..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <select
        value={filters.status}
        onChange={e =>
          setFilters(prev => ({ ...prev, status: e.target.value as any }))
        }
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
      >
        <option value="all">Tous les statuts</option>
        <option value="active">Actifs uniquement</option>
        <option value="inactive">Inactifs uniquement</option>
      </select>

      <select
        value={filters.level}
        onChange={e =>
          setFilters(prev => ({ ...prev, level: e.target.value as any }))
        }
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
      >
        <option value="all">Tous les niveaux</option>
        <option value="family">Familles uniquement</option>
        <option value="category">Catégories uniquement</option>
        <option value="subcategory">Sous-catégories uniquement</option>
      </select>
    </div>
  );

  // 🎯 RENDU PRINCIPAL
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Catalogue - Hiérarchie
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des familles, catégories et sous-catégories
            {!isLoading && (
              <span className="ml-2 text-sm">
                ({families?.length || 0} familles • Chargé en {loadTime}ms)
              </span>
            )}
          </p>
        </div>
        <ButtonUnified
          onClick={() => openCreateForm('family')}
          variant="default"
          icon={Plus}
          iconPosition="left"
        >
          Nouvelle famille
        </ButtonUnified>
      </div>

      {/* Validation SLO */}
      {loadTime && loadTime < 2000 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <span className="text-green-800 text-sm">
            ✅ Performance optimale : {loadTime}ms (SLO : &lt;2s)
          </span>
        </div>
      )}

      {/* Filtres */}
      <HierarchyFilters />

      {/* Actions en lot */}
      {selectedItems.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-black text-sm font-medium">
            {selectedItems.length} élément(s) sélectionné(s)
          </span>
          <ButtonUnified
            variant="outline"
            size="sm"
            onClick={handleBulkStatusToggle}
            icon={Eye}
            iconPosition="left"
          >
            Changer statut
          </ButtonUnified>
          <ButtonUnified
            variant="danger"
            size="sm"
            onClick={handleDeleteItems}
            icon={Trash2}
            iconPosition="left"
          >
            Supprimer
          </ButtonUnified>
        </div>
      )}

      {/* État de chargement */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="text-gray-600 mt-2">
            Chargement des données Supabase...
          </p>
        </div>
      )}

      {/* Erreurs */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
          {familiesError && (
            <p className="text-red-700 text-sm mt-1">
              Familles: {familiesError}
            </p>
          )}
          {categoriesError && (
            <p className="text-red-700 text-sm mt-1">
              Catégories: {categoriesError}
            </p>
          )}
          {subcategoriesError && (
            <p className="text-red-700 text-sm mt-1">
              Sous-catégories: {subcategoriesError}
            </p>
          )}
        </div>
      )}

      {/* Liste hiérarchique - DONNÉES RÉELLES SUPABASE */}
      {!isLoading && !hasError && (
        <div className="bg-white border border-gray-200 rounded-lg">
          {filteredFamilies.length === 0 ? (
            <div className="text-center py-8">
              <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucune famille trouvée</p>
              <ButtonUnified
                onClick={() => openCreateForm('family')}
                variant="outline"
                className="mt-3"
              >
                Créer la première famille
              </ButtonUnified>
            </div>
          ) : (
            filteredFamilies.map(family => (
              <FamilyRow key={family.id} family={family} />
            ))
          )}
        </div>
      )}

      {/* Formulaires séparés selon le type */}
      {formState.isOpen && formState.type === 'family' && (
        <FamilyForm
          isOpen={formState.isOpen}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
          initialData={formState.data}
          mode={formState.mode}
        />
      )}

      {formState.isOpen && formState.type === 'category' && (
        <CategoryForm
          isOpen={formState.isOpen}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
          initialData={
            formState.mode === 'create' && formState.parentId
              ? ({ family_id: formState.parentId } as any)
              : formState.data
          }
          mode={formState.mode}
          families={families?.map(f => ({ id: f.id, name: f.name })) || []}
        />
      )}

      {formState.isOpen && formState.type === 'subcategory' && (
        <SubcategoryForm
          isOpen={formState.isOpen}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
          initialData={
            formState.mode === 'create' && formState.parentId
              ? ({ category_id: formState.parentId } as any)
              : formState.data
                ? {
                    ...formState.data,
                    parent_id:
                      formState.data.category_id || formState.data.parent_id,
                    family_id: formState.data.family_id,
                  }
                : null
          }
          mode={formState.mode}
          categories={
            allCategories?.map(c => ({
              id: c.id,
              name: c.name,
              family_name:
                families?.find(f => f.id === c.family_id)?.name ||
                'Famille inconnue',
            })) || []
          }
        />
      )}
    </div>
  );
}
