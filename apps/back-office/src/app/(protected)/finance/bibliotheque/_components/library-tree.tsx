'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  ScrollArea,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { FolderArchive, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

import type { LibraryTreeYear, LibraryCategory } from '@verone/finance/hooks';

// =====================================================================
// TYPES
// =====================================================================

export interface TreeSelection {
  year?: number;
  category?: LibraryCategory;
  month?: number;
}

interface LibraryTreeProps {
  tree: LibraryTreeYear[];
  selection: TreeSelection;
  onSelect: (selection: TreeSelection) => void;
}

// =====================================================================
// HELPERS
// =====================================================================

const CATEGORY_ICONS: Record<LibraryCategory, typeof TrendingUp> = {
  ventes: TrendingUp,
  achats: TrendingDown,
  avoirs: Receipt,
};

const CATEGORY_COLORS: Record<LibraryCategory, string> = {
  ventes: 'text-green-600',
  achats: 'text-red-600',
  avoirs: 'text-amber-600',
};

// =====================================================================
// COMPONENT
// =====================================================================

export function LibraryTree({ tree, selection, onSelect }: LibraryTreeProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-4 px-1">
          <FolderArchive className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Arborescence
          </h2>
        </div>

        {tree.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">Aucun document</p>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={tree.length > 0 ? [String(tree[0].year)] : []}
          >
            {tree.map(yearNode => (
              <AccordionItem key={yearNode.year} value={String(yearNode.year)}>
                <AccordionTrigger className="py-2 px-1 text-sm hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{yearNode.year}</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {yearNode.count}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <Accordion
                    type="multiple"
                    defaultValue={yearNode.categories.map(
                      c => `${yearNode.year}-${c.category}`
                    )}
                  >
                    {yearNode.categories.map(catNode => {
                      const Icon = CATEGORY_ICONS[catNode.category];
                      const colorClass = CATEGORY_COLORS[catNode.category];
                      return (
                        <AccordionItem
                          key={`${yearNode.year}-${catNode.category}`}
                          value={`${yearNode.year}-${catNode.category}`}
                          className="border-none"
                        >
                          <AccordionTrigger className="py-1.5 pl-4 pr-1 text-sm hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Icon className={cn('h-4 w-4', colorClass)} />
                              <span className="font-medium">
                                {catNode.label}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0"
                              >
                                {catNode.count}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-0">
                            <div className="space-y-0.5 pl-6">
                              {catNode.months.map(monthNode => {
                                const isSelected =
                                  selection.year === yearNode.year &&
                                  selection.category === catNode.category &&
                                  selection.month === monthNode.month;

                                return (
                                  <button
                                    key={`${yearNode.year}-${catNode.category}-${monthNode.month}`}
                                    onClick={() =>
                                      onSelect({
                                        year: yearNode.year,
                                        category: catNode.category,
                                        month: monthNode.month,
                                      })
                                    }
                                    className={cn(
                                      'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors',
                                      'hover:bg-muted/80',
                                      isSelected &&
                                        'bg-primary/10 text-primary font-medium'
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{monthNode.label}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {monthNode.count}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </ScrollArea>
  );
}
