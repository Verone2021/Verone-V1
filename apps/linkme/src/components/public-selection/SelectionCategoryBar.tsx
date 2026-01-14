'use client';

/**
 * SelectionCategoryBar
 *
 * Barre de catégorisation horizontale avec compteurs pour les sélections publiques
 * Design moderne avec badges et scroll horizontal
 *
 * @module SelectionCategoryBar
 * @since 2026-01-14
 */

import { useRef, useEffect } from 'react';

import { Tag } from 'lucide-react';

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
}

interface ISelectionCategoryBarProps {
  categories: ICategory[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  branding: IBranding;
  totalCount: number;
}

export function SelectionCategoryBar({
  categories,
  selectedCategory,
  onCategoryChange,
  branding,
  totalCount,
}: ISelectionCategoryBarProps): React.JSX.Element {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll active category into view
  useEffect(() => {
    if (scrollContainerRef.current && selectedCategory) {
      const activeButton = scrollContainerRef.current.querySelector(
        `[data-category-id="${selectedCategory}"]`
      );
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedCategory]);

  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 py-4">
          {/* Icon + Label */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Catégories :
            </span>
          </div>

          {/* Categories Container */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1"
          >
            {/* All Products */}
            <button
              onClick={() => onCategoryChange(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                selectedCategory === null
                  ? 'text-white border-transparent shadow-md scale-105'
                  : 'text-gray-700 bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              style={
                selectedCategory === null
                  ? { backgroundColor: branding.primary_color }
                  : undefined
              }
            >
              <span>Tous</span>
              <span
                className={`ml-2 ${
                  selectedCategory === null ? 'text-white/90' : 'text-gray-500'
                }`}
              >
                ({totalCount})
              </span>
            </button>

            {/* Category Buttons */}
            {categories.map(category => (
              <button
                key={category.id}
                data-category-id={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  selectedCategory === category.id
                    ? 'text-white border-transparent shadow-md scale-105'
                    : 'text-gray-700 bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                style={
                  selectedCategory === category.id
                    ? { backgroundColor: branding.primary_color }
                    : undefined
                }
              >
                <span>{category.name}</span>
                <span
                  className={`ml-2 ${
                    selectedCategory === category.id
                      ? 'text-white/90'
                      : 'text-gray-500'
                  }`}
                >
                  ({category.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
