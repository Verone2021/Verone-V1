'use client';

import { useState } from 'react';
import { Badge } from '@verone/ui';
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  FolderOpen,
  Folder,
} from 'lucide-react';

const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const CATEGORIES = [
  { key: 'achats' as const, label: 'Achats' },
  { key: 'ventes' as const, label: 'Ventes' },
  { key: 'avoirs' as const, label: 'Avoirs' },
];

interface TreeSelection {
  year: number;
  month?: number;
  category?: 'achats' | 'ventes' | 'avoirs';
}

interface LibraryTreeProps {
  onSelect: (selection: TreeSelection) => void;
  selection: TreeSelection | null;
}

export function LibraryTree({ onSelect, selection }: LibraryTreeProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    new Set([currentYear])
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isSelected = (year: number, category?: string, month?: number) => {
    if (!selection) return false;
    if (selection.year !== year) return false;
    if (category && selection.category !== category) return false;
    if (month !== undefined && selection.month !== month) return false;
    if (!category && selection.category) return false;
    if (month === undefined && selection.month) return false;
    return true;
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
        Navigation
      </p>
      {years.map(year => {
        const yearExpanded = expandedYears.has(year);
        return (
          <div key={year}>
            {/* Year node */}
            <button
              onClick={() => {
                toggleYear(year);
                onSelect({ year });
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                isSelected(year)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              {yearExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{year}</span>
            </button>

            {/* Categories under year */}
            {yearExpanded && (
              <div className="ml-4 space-y-0.5">
                {CATEGORIES.map(cat => {
                  const catKey = `${year}-${cat.key}`;
                  const catExpanded = expandedCategories.has(catKey);

                  return (
                    <div key={catKey}>
                      <button
                        onClick={() => {
                          toggleCategory(catKey);
                          onSelect({ year, category: cat.key });
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors ${
                          isSelected(year, cat.key)
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {catExpanded ? (
                          <ChevronDown className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 flex-shrink-0" />
                        )}
                        {catExpanded ? (
                          <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                        ) : (
                          <Folder className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                        )}
                        <span>{cat.label}</span>
                      </button>

                      {/* Months under category */}
                      {catExpanded && (
                        <div className="ml-6 space-y-0.5">
                          {MONTHS.map((monthName, idx) => {
                            const monthNum = idx + 1;
                            const isCurrent =
                              year === currentYear &&
                              monthNum === new Date().getMonth() + 1;
                            return (
                              <button
                                key={monthNum}
                                onClick={() =>
                                  onSelect({
                                    year,
                                    category: cat.key,
                                    month: monthNum,
                                  })
                                }
                                className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors ${
                                  isSelected(year, cat.key, monthNum)
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'hover:bg-muted text-muted-foreground'
                                }`}
                              >
                                <span>{monthName}</span>
                                {isCurrent && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1 py-0"
                                  >
                                    en cours
                                  </Badge>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
