import { useState, useMemo } from 'react';

import type { Organisation } from '@verone/organisations';

import type {
  Category,
  EnrichedCategory,
  EnrichedFamily,
  EnrichedSubcategory,
  Family,
  FilterState,
  Product,
  Subcategory,
} from './catalogue-filter.types';

interface UseCatalogueFilterPanelProps {
  families: Family[];
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  suppliers: Organisation[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function useCatalogueFilterPanel({
  families,
  categories,
  subcategories,
  products,
  suppliers,
  filters,
  onFiltersChange,
}: UseCatalogueFilterPanelProps) {
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    new Set()
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const enrichedHierarchy = useMemo(() => {
    const subcategoryProductCounts = new Map<string, number>();

    if (products && Array.isArray(products)) {
      products.forEach(product => {
        if (product.subcategory_id) {
          const count =
            subcategoryProductCounts.get(product.subcategory_id) ?? 0;
          subcategoryProductCounts.set(product.subcategory_id, count + 1);
        }
      });
    }

    const enrichedSubcategories: EnrichedSubcategory[] = subcategories.map(
      sub => ({
        ...sub,
        productCount: subcategoryProductCounts.get(sub.id) ?? 0,
      })
    );

    const categoriesMap = new Map<string, EnrichedCategory>();
    categories.forEach(cat => {
      const catSubcategories = enrichedSubcategories.filter(
        sub => sub.category_id === cat.id
      );
      const productCount = catSubcategories.reduce(
        (sum, sub) => sum + sub.productCount,
        0
      );
      categoriesMap.set(cat.id, {
        ...cat,
        subcategories: catSubcategories,
        productCount,
      });
    });

    const enrichedFamilies: EnrichedFamily[] = families.map(family => {
      const familyCategories = categories
        .filter(cat => cat.family_id === family.id)
        .map(cat => categoriesMap.get(cat.id)!)
        .filter(cat => cat != null);

      const productCount = familyCategories.reduce(
        (sum, cat) => sum + cat.productCount,
        0
      );

      return { ...family, categories: familyCategories, productCount };
    });

    return enrichedFamilies;
  }, [families, categories, subcategories, products]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach(product => {
      if (product.product_status) {
        counts.set(
          product.product_status,
          (counts.get(product.product_status) ?? 0) + 1
        );
      }
    });
    return counts;
  }, [products]);

  const availableStatuses = useMemo(
    () => Array.from(statusCounts.keys()).sort(),
    [statusCounts]
  );

  const suppliersWithProducts = useMemo(
    () =>
      suppliers
        .filter(s => (s._count?.products ?? 0) > 0)
        .sort((a, b) => (b._count?.products ?? 0) - (a._count?.products ?? 0)),
    [suppliers]
  );

  const handleFamilyToggle = (familyId: string) => {
    const newFamilies = filters.families.includes(familyId)
      ? filters.families.filter(id => id !== familyId)
      : [...filters.families, familyId];
    onFiltersChange({ ...filters, families: newFamilies });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleSubcategoryToggle = (subcategoryId: string) => {
    const newSubcategories = filters.subcategories.includes(subcategoryId)
      ? filters.subcategories.filter(id => id !== subcategoryId)
      : [...filters.subcategories, subcategoryId];
    onFiltersChange({ ...filters, subcategories: newSubcategories });
  };

  const handleSupplierToggle = (supplierId: string) => {
    const newSuppliers = filters.suppliers.includes(supplierId)
      ? filters.suppliers.filter(id => id !== supplierId)
      : [...filters.suppliers, supplierId];
    onFiltersChange({ ...filters, suppliers: newSuppliers });
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const handleStockToggle = (level: string) => {
    const newStockLevels = filters.stockLevels.includes(level)
      ? filters.stockLevels.filter(l => l !== level)
      : [...filters.stockLevels, level];
    onFiltersChange({ ...filters, stockLevels: newStockLevels });
  };

  const handleConditionToggle = (condition: string) => {
    const newConditions = filters.conditions.includes(condition)
      ? filters.conditions.filter(c => c !== condition)
      : [...filters.conditions, condition];
    onFiltersChange({ ...filters, conditions: newConditions });
  };

  const handleCompletionToggle = (level: string) => {
    const newCompletionLevels = filters.completionLevels.includes(level)
      ? filters.completionLevels.filter(l => l !== level)
      : [...filters.completionLevels, level];
    onFiltersChange({ ...filters, completionLevels: newCompletionLevels });
  };

  const handleClearAll = () => {
    onFiltersChange({
      search: filters.search,
      families: [],
      categories: [],
      subcategories: [],
      suppliers: [],
      statuses: [],
      stockLevels: [],
      conditions: [],
      completionLevels: [],
    });
  };

  const toggleFamilyExpand = (familyId: string) => {
    setExpandedFamilies(prev => {
      const next = new Set(prev);
      if (next.has(familyId)) next.delete(familyId);
      else next.add(familyId);
      return next;
    });
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const categoryFilterCount =
    filters.families.length +
    filters.categories.length +
    filters.subcategories.length;

  const activeFilterCount =
    categoryFilterCount +
    filters.suppliers.length +
    filters.statuses.length +
    filters.stockLevels.length +
    filters.conditions.length +
    filters.completionLevels.length;

  return {
    expandedFamilies,
    expandedCategories,
    enrichedHierarchy,
    statusCounts,
    availableStatuses,
    suppliersWithProducts,
    categoryFilterCount,
    activeFilterCount,
    handleFamilyToggle,
    handleCategoryToggle,
    handleSubcategoryToggle,
    handleSupplierToggle,
    handleStatusToggle,
    handleStockToggle,
    handleConditionToggle,
    handleCompletionToggle,
    handleClearAll,
    toggleFamilyExpand,
    toggleCategoryExpand,
  };
}
