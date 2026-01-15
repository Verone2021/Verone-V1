'use client';

/**
 * SelectionCategoryDropdown
 *
 * Dropdown pour filtrer par sous-catégories dans les sélections publiques
 * Affiche les sous-catégories de la catégorie active
 *
 * @module SelectionCategoryDropdown
 * @since 2026-01-14
 */

import { useState, useRef, useEffect } from 'react';

import { ChevronDown } from 'lucide-react';

interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

interface ISubcategory {
  id: string;
  name: string;
  count: number;
}

interface ISelectionCategoryDropdownProps {
  subcategories: ISubcategory[];
  selectedSubcategory: string | null;
  onSubcategoryChange: (subcategoryId: string | null) => void;
  branding: IBranding;
}

export function SelectionCategoryDropdown({
  subcategories,
  selectedSubcategory,
  onSubcategoryChange,
  branding,
}: ISelectionCategoryDropdownProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (subcategories.length === 0) {
    return <></>;
  }

  const selectedSub = subcategories.find(s => s.id === selectedSubcategory);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all text-sm font-medium"
      >
        <span className="text-gray-700">
          {selectedSub ? selectedSub.name : 'Toutes les sous-catégories'}
        </span>
        {selectedSub && (
          <span className="text-gray-500">({selectedSub.count})</span>
        )}
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
          {/* All in category */}
          <button
            onClick={() => {
              onSubcategoryChange(null);
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
              selectedSubcategory === null
                ? 'text-white font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={
              selectedSubcategory === null
                ? { backgroundColor: branding.accent_color }
                : undefined
            }
          >
            <span>Toutes les sous-catégories</span>
            {selectedSubcategory === null && <span className="text-xs">✓</span>}
          </button>

          <div className="border-t border-gray-100 my-1" />

          {/* Subcategory Items */}
          {subcategories.map(sub => (
            <button
              key={sub.id}
              onClick={() => {
                onSubcategoryChange(sub.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                selectedSubcategory === sub.id
                  ? 'text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={
                selectedSubcategory === sub.id
                  ? { backgroundColor: branding.accent_color }
                  : undefined
              }
            >
              <span>{sub.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">({sub.count})</span>
                {selectedSubcategory === sub.id && (
                  <span className="text-xs">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
