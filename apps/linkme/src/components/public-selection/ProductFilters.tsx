'use client';

import { useEffect, useRef, useState } from 'react';

import { Search, X } from 'lucide-react';

interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

interface IProductFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  branding: IBranding;
  isSearchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  placeholder?: string;
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  branding,
  isSearchOpen,
  onSearchOpenChange,
  placeholder = 'Rechercher un produit...',
}: IProductFiltersProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Sync local query with parent
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, onSearchChange]);

  const handleClear = (): void => {
    setLocalQuery('');
    onSearchChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClose = (): void => {
    setLocalQuery('');
    onSearchChange('');
    onSearchOpenChange(false);
  };

  if (!isSearchOpen) {
    return <></>;
  }

  return (
    <div className="bg-white border-b border-gray-100 py-3">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={e => setLocalQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-transparent focus:ring-2"
            style={
              {
                '--tw-ring-color': branding.primary_color,
              } as React.CSSProperties
            }
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {localQuery && (
              <button
                onClick={handleClear}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
