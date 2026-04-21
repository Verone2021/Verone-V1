'use client';

/**
 * ActivityHistoryCompact — col 3 du dashboard. Timeline verticale des
 * derniers événements liés au produit (création, PO reçue, changement prix,
 * publication) + mini-stats activité stock récente.
 */

import { cn } from '@verone/utils';
import { Circle } from 'lucide-react';

interface ActivityEvent {
  id: string;
  kind: 'creation' | 'po' | 'price' | 'publication' | 'stock';
  label: string;
  date: string;
}

interface StockMove {
  id: string;
  date: string;
  type: 'in' | 'out' | 'adjust';
  qty: number;
  label: string;
}

interface ActivityHistoryCompactProps {
  events: ActivityEvent[];
  stockMoves: StockMove[];
}

const KIND_COLOR: Record<ActivityEvent['kind'], string> = {
  creation: 'bg-neutral-400',
  po: 'bg-blue-500',
  price: 'bg-orange-500',
  publication: 'bg-green-500',
  stock: 'bg-neutral-500',
};

export function ActivityHistoryCompact({
  events,
  stockMoves,
}: ActivityHistoryCompactProps) {
  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-4">
      <h3 className="text-sm font-semibold text-neutral-900 mb-3">
        Historique · Stock récent
      </h3>

      {/* Timeline events */}
      {events.length > 0 ? (
        <ul className="space-y-2 mb-4">
          {events.slice(0, 5).map(e => (
            <li key={e.id} className="flex items-start gap-2 text-sm">
              <Circle
                className={cn(
                  'h-2 w-2 mt-1.5 shrink-0 rounded-full fill-current stroke-none',
                  KIND_COLOR[e.kind]
                )}
              />
              <div className="min-w-0 flex-1 flex items-baseline justify-between gap-2">
                <span className="text-neutral-700 truncate">{e.label}</span>
                <span className="text-[10px] text-neutral-400 tabular-nums shrink-0">
                  {new Date(e.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-neutral-400 italic mb-4">
          Aucun événement récent
        </p>
      )}

      {/* Mini stock moves */}
      {stockMoves.length > 0 && (
        <div className="pt-3 border-t border-neutral-100">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 mb-2">
            Stock récent
          </div>
          <ul className="space-y-1 text-xs">
            {stockMoves.slice(0, 4).map(m => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-neutral-600 truncate">{m.label}</span>
                <span
                  className={cn(
                    'tabular-nums font-medium shrink-0',
                    m.type === 'in'
                      ? 'text-green-600'
                      : m.type === 'out'
                        ? 'text-red-600'
                        : 'text-neutral-500'
                  )}
                >
                  {m.type === 'in' ? '+' : m.type === 'out' ? '−' : '±'}
                  {Math.abs(m.qty)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
