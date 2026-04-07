'use client';

// Note: Les hooks useFamilies/useCategories/useSubcategories génèrent automatiquement le slug
// à partir du name, mais leurs types l'exigent. Les casts ci-dessous sont nécessaires car
// les formulaires ne fournissent pas le slug (il sera généré).
import { type ComponentProps } from 'react';

import { CategoryForm } from '@/components/forms/category-form';
import { FamilyForm } from '@/components/forms/family-form';
import { SubcategoryForm } from '@/components/forms/subcategory-form';

import { BulkActionsBar } from './components/BulkActionsBar';
import { CategoriesFilters } from './components/CategoriesFilters';
import { CategoriesHeader } from './components/CategoriesHeader';
import { HierarchyTree } from './components/HierarchyTree';
import { useCategoriesPage } from './hooks';

export default function CategoriesPage() {
  const {
    families,
    filteredFamilies,
    allCategories,
    filters,
    setFilters,
    selectedItems,
    expandedFamilies,
    expandedCategories,
    formState,
    isLoading,
    hasError,
    familiesError,
    categoriesError,
    subcategoriesError,
    loadTime,
    toggleFamilyExpansion,
    toggleCategoryExpansion,
    toggleItemSelection,
    openCreateForm,
    openEditForm,
    closeForm,
    handleFormSubmit,
    handleDelete,
    handleBulkStatusToggle,
    handleDeleteItems,
    navigateToFamily,
    navigateToCategory,
    navigateToSubcategory,
    getCategoriesForFamily,
    getSubcategoriesForCategory,
  } = useCategoriesPage();

  const callbacks = {
    toggleFamilyExpansion,
    toggleCategoryExpansion,
    toggleItemSelection,
    openCreateForm,
    openEditForm,
    handleDelete,
    navigateToFamily,
    navigateToCategory,
    navigateToSubcategory,
    getCategoriesForFamily,
    getSubcategoriesForCategory,
  };

  return (
    <div className="space-y-6">
      <CategoriesHeader
        familiesCount={families?.length ?? 0}
        loadTime={loadTime}
        isLoading={isLoading}
        onCreateFamily={() => openCreateForm('family')}
      />

      <CategoriesFilters filters={filters} setFilters={setFilters} />

      <BulkActionsBar
        selectedCount={selectedItems.length}
        onBulkStatusToggle={() => {
          void handleBulkStatusToggle().catch(error => {
            console.error('[CategoriesPage] Bulk status toggle failed:', error);
          });
        }}
        onDeleteItems={() => {
          void handleDeleteItems().catch(error => {
            console.error('[CategoriesPage] Delete items failed:', error);
          });
        }}
      />

      <HierarchyTree
        isLoading={isLoading}
        hasError={hasError}
        familiesError={familiesError}
        categoriesError={categoriesError}
        subcategoriesError={subcategoriesError}
        filteredFamilies={filteredFamilies}
        expandedFamilies={expandedFamilies}
        expandedCategories={expandedCategories}
        selectedItems={selectedItems}
        callbacks={callbacks}
        onCreateFamily={() => openCreateForm('family')}
      />

      {formState.isOpen && formState.type === 'family' && (
        <FamilyForm
          isOpen={formState.isOpen}
          onClose={closeForm}
          onSubmit={formData => {
            void handleFormSubmit(formData).catch(error => {
              console.error(
                '[CategoriesPage] Family form submit failed:',
                error
              );
            });
          }}
          initialData={
            formState.data as ComponentProps<typeof FamilyForm>['initialData']
          }
          mode={formState.mode}
        />
      )}

      {formState.isOpen && formState.type === 'category' && (
        <CategoryForm
          isOpen={formState.isOpen}
          onClose={closeForm}
          onSubmit={formData => {
            void handleFormSubmit(formData).catch(error => {
              console.error(
                '[CategoriesPage] Category form submit failed:',
                error
              );
            });
          }}
          initialData={
            formState.mode === 'create' && formState.parentId
              ? ({ family_id: formState.parentId } as ComponentProps<
                  typeof CategoryForm
                >['initialData'])
              : (formState.data as ComponentProps<
                  typeof CategoryForm
                >['initialData'])
          }
          mode={formState.mode}
          families={families?.map(f => ({ id: f.id, name: f.name })) ?? []}
        />
      )}

      {formState.isOpen && formState.type === 'subcategory' && (
        <SubcategoryForm
          isOpen={formState.isOpen}
          onClose={closeForm}
          onSubmit={formData => {
            void handleFormSubmit(formData).catch(error => {
              console.error(
                '[CategoriesPage] Subcategory form submit failed:',
                error
              );
            });
          }}
          initialData={
            formState.mode === 'create' && formState.parentId
              ? ({
                  category_id: formState.parentId,
                } as ComponentProps<typeof SubcategoryForm>['initialData'])
              : (formState.data as ComponentProps<
                  typeof SubcategoryForm
                >['initialData'])
          }
          mode={formState.mode}
          categories={
            allCategories?.map(c => ({
              id: c.id,
              name: c.name,
              family_name:
                families?.find(f => f.id === c.family_id)?.name ??
                'Famille inconnue',
            })) ?? []
          }
        />
      )}
    </div>
  );
}
