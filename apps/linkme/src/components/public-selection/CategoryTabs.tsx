'use client';

import { useRef, useEffect } from 'react';

interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

interface ICategory {
  id: string;
  name: string;
  count: number;
  subcategories?: ISubcategory[];
}

interface ISubcategory {
  id: string;
  name: string;
  count: number;
}

interface ICategoryTabsProps {
  categories: ICategory[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  onSubcategoryChange: (subcategoryId: string | null) => void;
  branding: IBranding;
  totalCount: number;
}

export function CategoryTabs({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  branding,
  totalCount,
}: ICategoryTabsProps): React.JSX.Element {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get subcategories for selected category
  const activeCategory = categories.find(c => c.id === selectedCategory);
  const subcategories = activeCategory?.subcategories ?? [];

  // Scroll active tab into view
  useEffect(() => {
    if (scrollContainerRef.current && selectedCategory) {
      const activeTab = scrollContainerRef.current.querySelector(
        `[data-category-id="${selectedCategory}"]`
      );
      if (activeTab) {
        activeTab.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedCategory]);

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main Categories */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide"
        >
          {/* All Products Tab */}
          <button
            onClick={() => {
              onCategoryChange(null);
              onSubcategoryChange(null);
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'text-white shadow-sm'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
            style={
              selectedCategory === null
                ? { backgroundColor: branding.primary_color }
                : undefined
            }
          >
            Tous ({totalCount})
          </button>

          {/* Category Tabs */}
          {categories.map(category => (
            <button
              key={category.id}
              data-category-id={category.id}
              onClick={() => {
                onCategoryChange(category.id);
                onSubcategoryChange(null);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={
                selectedCategory === category.id
                  ? { backgroundColor: branding.primary_color }
                  : undefined
              }
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Subcategories - only show if category is selected and has subcategories */}
        {selectedCategory && subcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide">
            <span className="flex-shrink-0 text-xs text-gray-400 uppercase tracking-wide mr-1">
              Filtrer :
            </span>

            {/* All in category */}
            <button
              onClick={() => onSubcategoryChange(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSubcategory === null
                  ? 'text-white'
                  : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
              }`}
              style={
                selectedSubcategory === null
                  ? { backgroundColor: branding.accent_color }
                  : undefined
              }
            >
              Tous
            </button>

            {/* Subcategory chips */}
            {subcategories.map(sub => (
              <button
                key={sub.id}
                onClick={() => onSubcategoryChange(sub.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedSubcategory === sub.id
                    ? 'text-white'
                    : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
                }`}
                style={
                  selectedSubcategory === sub.id
                    ? { backgroundColor: branding.accent_color }
                    : undefined
                }
              >
                {sub.name} ({sub.count})
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
