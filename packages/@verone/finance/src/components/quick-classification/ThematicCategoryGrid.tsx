'use client';

import { useMemo } from 'react';

import { cn } from '@verone/ui';

import { PCG_THEMES, getPcgEntriesByTheme } from '../../lib/pcg-themes';

interface ThematicCategoryGridProps {
  onSelect: (code: string) => void;
  side: 'debit' | 'credit';
}

export function ThematicCategoryGrid({
  onSelect,
  side,
}: ThematicCategoryGridProps): React.ReactNode {
  const entriesByTheme = useMemo(() => getPcgEntriesByTheme(), []);

  // Pour les credits, montrer seulement "Revenus"
  // Pour les debits, montrer tout sauf "Revenus"
  const visibleThemes = useMemo(() => {
    if (side === 'credit') {
      return PCG_THEMES.filter(t => t.id === 'revenus');
    }
    return PCG_THEMES.filter(t => t.id !== 'revenus');
  }, [side]);

  return (
    <div
      className={cn(
        'grid gap-4',
        side === 'credit'
          ? 'grid-cols-1'
          : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
      )}
    >
      {visibleThemes.map(theme => {
        const entries = entriesByTheme[theme.id] ?? [];
        if (entries.length === 0) return null;

        return (
          <div key={theme.id} className="space-y-1">
            {/* En-tete theme */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className={cn('w-2 h-2 rounded-full', theme.color)} />
              <span className={cn('text-xs font-semibold', theme.textColor)}>
                {theme.label}
              </span>
            </div>

            {/* Entrees */}
            <div className="space-y-0.5">
              {entries.map(entry => (
                <button
                  key={entry.code}
                  type="button"
                  onClick={() => onSelect(entry.code)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors',
                    'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                  )}
                  title={entry.description}
                >
                  {entry.label_fr}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
