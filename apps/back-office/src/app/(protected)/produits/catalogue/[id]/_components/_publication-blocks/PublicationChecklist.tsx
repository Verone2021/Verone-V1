'use client';

/**
 * PublicationChecklist — liste des critères requis (6) et optionnels (3).
 * Sprint : BO-UI-PROD-PUB-001
 */

import { CheckCircle, XCircle, Circle } from 'lucide-react';

export interface ChecklistItem {
  key: string;
  label: string;
  ok: boolean;
  required: boolean;
  /** Valeur courte affichée en gris quand ok (ex: slug, catégorie). */
  valueLabel?: string;
  /** Si non ok, afficher un lien de navigation vers un autre onglet. */
  linkLabel?: string;
  linkTabId?: string;
}

interface PublicationChecklistProps {
  items: ChecklistItem[];
  onTabChange: (tabId: string) => void;
}

export function PublicationChecklist({
  items,
  onTabChange,
}: PublicationChecklistProps) {
  const required = items.filter(i => i.required);
  const optional = items.filter(i => !i.required);

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 h-full">
      <h3 className="text-sm font-semibold text-neutral-900 mb-4">
        Critères de publication
      </h3>

      {/* Requis */}
      <div className="mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-2">
          Requis
        </p>
        <ul className="space-y-2">
          {required.map(item => (
            <li key={item.key} className="flex items-start gap-2 text-sm">
              {item.ok ? (
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <span>
                <span className={item.ok ? 'text-neutral-700' : 'text-red-500'}>
                  {item.label}
                </span>
                {item.ok && item.valueLabel && (
                  <span className="text-neutral-400 ml-1 text-xs">
                    — {item.valueLabel}
                  </span>
                )}
                {!item.ok && item.linkLabel && item.linkTabId && (
                  <button
                    type="button"
                    onClick={() => onTabChange(item.linkTabId!)}
                    className="ml-1 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    {item.linkLabel}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Optionnels */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-2">
          Optionnels
        </p>
        <ul className="space-y-2">
          {optional.map(item => (
            <li key={item.key} className="flex items-start gap-2 text-sm">
              {item.ok ? (
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              <span>
                <span
                  className={item.ok ? 'text-neutral-700' : 'text-gray-400'}
                >
                  {item.label}
                </span>
                {!item.ok && (
                  <span className="text-gray-400 ml-1 text-xs">
                    (optionnel)
                  </span>
                )}
                {item.ok && item.valueLabel && (
                  <span className="text-neutral-400 ml-1 text-xs">
                    — {item.valueLabel}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
