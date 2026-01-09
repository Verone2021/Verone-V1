'use client';

/**
 * CatalogTabs
 * Onglets pour basculer entre Catalogue général et Produits sur mesure
 */

import { Package, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

export type CatalogTabValue = 'general' | 'sur-mesure';

interface CatalogTabsProps {
  activeTab: CatalogTabValue;
  onTabChange: (tab: CatalogTabValue) => void;
  generalCount: number;
  customCount: number;
}

export function CatalogTabs({
  activeTab,
  onTabChange,
  generalCount,
  customCount,
}: CatalogTabsProps): JSX.Element {
  return (
    <div className="flex border-b border-gray-200">
      {/* Onglet Catalogue général */}
      <button
        onClick={() => onTabChange('general')}
        className={cn(
          'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative',
          activeTab === 'general'
            ? 'text-linkme-marine'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <Package className="h-4 w-4" />
        <span>Catalogue général</span>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            activeTab === 'general'
              ? 'bg-linkme-turquoise/15 text-linkme-marine'
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {generalCount}
        </span>
        {activeTab === 'general' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linkme-turquoise" />
        )}
      </button>

      {/* Onglet Produits sur mesure */}
      <button
        onClick={() => onTabChange('sur-mesure')}
        className={cn(
          'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative',
          activeTab === 'sur-mesure'
            ? 'text-linkme-marine'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <Sparkles className="h-4 w-4" />
        <span>Produits sur mesure</span>
        {customCount > 0 && (
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              activeTab === 'sur-mesure'
                ? 'bg-linkme-royal/15 text-linkme-royal'
                : 'bg-gray-100 text-gray-500'
            )}
          >
            {customCount}
          </span>
        )}
        {activeTab === 'sur-mesure' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linkme-royal" />
        )}
      </button>
    </div>
  );
}
