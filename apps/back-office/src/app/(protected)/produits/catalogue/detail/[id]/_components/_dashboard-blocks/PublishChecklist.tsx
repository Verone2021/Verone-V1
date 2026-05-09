'use client';

/**
 * PublishChecklist — col 1 du dashboard. Liste les 4-6 critères bloquants
 * pour publier le produit. Chaque item est cliquable et scroll / navigue vers
 * l'onglet concerné.
 */

import { cn } from '@verone/utils';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  ok: boolean;
  required: boolean;
  targetTab?: string;
}

interface PublishChecklistProps {
  items: ChecklistItem[];
  onItemClick: (targetTab: string) => void;
}

export function PublishChecklist({
  items,
  onItemClick,
}: PublishChecklistProps) {
  const required = items.filter(i => i.required);
  const passed = required.filter(i => i.ok).length;
  const progress = Math.round((passed / Math.max(required.length, 1)) * 100);
  const ready = progress === 100;

  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-neutral-900">À publier</h3>
        <span className="text-xs text-neutral-500 tabular-nums">
          {passed}/{required.length}
        </span>
      </div>

      <div className="w-full bg-neutral-100 rounded-full h-1.5 mb-3">
        <div
          className={cn(
            'h-1.5 rounded-full transition-all',
            ready
              ? 'bg-green-500'
              : progress >= 70
                ? 'bg-orange-400'
                : 'bg-red-400'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => item.targetTab && onItemClick(item.targetTab)}
              disabled={!item.targetTab}
              className={cn(
                'w-full flex items-center gap-2 text-sm py-0.5 text-left',
                item.targetTab &&
                  !item.ok &&
                  'hover:text-neutral-900 cursor-pointer',
                !item.targetTab && 'cursor-default'
              )}
            >
              {item.ok ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : item.required ? (
                <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
              )}
              <span
                className={cn(
                  item.ok
                    ? 'text-neutral-500 line-through'
                    : item.required
                      ? 'text-neutral-900'
                      : 'text-neutral-400'
                )}
              >
                {item.label}
                {!item.required && ' (optionnel)'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
