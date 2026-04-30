'use client';

import { cn } from '@verone/utils';

import type { Filters } from './types';
import {
  useSavedViews,
  viewToFilters,
  type SavedView,
} from './use-saved-views';

interface CatalogueSavedViewsProps {
  activeTab: 'active' | 'incomplete' | 'archived';
  onApplyView: (filters: Filters, tab: SavedView['tab']) => void;
}

/**
 * Bandeau de vues sauvegardées au-dessus du catalogue.
 * Phase 1 : 5 vues système non-modifiables. Phase 2 (PR future) :
 * ajout vues personnelles localStorage.
 */
export function CatalogueSavedViews({
  activeTab,
  onApplyView,
}: CatalogueSavedViewsProps) {
  const views = useSavedViews();

  if (views.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="text-xs font-medium text-gray-500 flex-shrink-0">
        Vues rapides :
      </span>
      {views.map(view => {
        const isCurrentTab = activeTab === view.tab;
        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onApplyView(viewToFilters(view), view.tab)}
            title={view.description}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0',
              'border',
              isCurrentTab
                ? 'border-black bg-gray-50 text-black hover:bg-gray-100'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            <span aria-hidden>{view.emoji}</span>
            <span>{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
