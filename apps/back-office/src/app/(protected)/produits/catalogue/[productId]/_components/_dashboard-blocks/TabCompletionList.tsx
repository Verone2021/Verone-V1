'use client';

/**
 * TabCompletionList — liste des 7 onglets fiche produit avec leur taux de
 * complétion. Clic = scroll vers l'onglet correspondant.
 *
 * Phase 1 (skeleton) : rendu minimal. La logique de calcul par onglet sera
 * branchée dans la phase suivante via useProductGeneralDashboard.
 */

import { cn } from '@verone/utils';

interface TabEntry {
  id: string;
  label: string;
  percent: number;
}

interface TabCompletionListProps {
  entries: TabEntry[];
  onTabClick: (id: string) => void;
}

function colorForPercent(p: number): string {
  if (p >= 90) return 'text-green-600';
  if (p >= 60) return 'text-orange-500';
  return 'text-red-500';
}

export function TabCompletionList({
  entries,
  onTabClick,
}: TabCompletionListProps) {
  return (
    <ul className="space-y-1">
      {entries.map(t => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => onTabClick(t.id)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-neutral-100 transition-colors text-sm"
          >
            <span className="text-neutral-700">{t.label}</span>
            <span
              className={cn(
                'tabular-nums text-xs font-medium',
                colorForPercent(t.percent)
              )}
            >
              {t.percent}%
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
