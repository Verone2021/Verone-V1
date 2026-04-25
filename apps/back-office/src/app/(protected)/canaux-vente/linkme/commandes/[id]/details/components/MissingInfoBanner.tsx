'use client';

import { Button } from '@verone/ui';
import { AlertCircle, Send } from 'lucide-react';

import {
  CATEGORY_LABELS,
  type MissingFieldCategory,
  type MissingFieldsResult,
} from '../../../../utils/order-missing-fields';

import { dedupeContactFields, MissingFieldRow } from './MissingFieldRow';

interface MissingInfoBannerProps {
  missingFields: MissingFieldsResult;
  /** Ouvre le modal avec toutes les categories pertinentes pre-cochees. */
  onRequestComplements: () => void;
  /** Ouvre le modal avec UNIQUEMENT la categorie cliquee pre-cochee. */
  onRequestComplementForCategory: (cat: MissingFieldCategory) => void;
  onSaveInlineField: (
    target: 'organisations' | 'sales_order_linkme_details',
    column: string,
    value: string
  ) => Promise<void>;
  onOpenContactModal: (role: 'responsable' | 'billing' | 'delivery') => void;
}

const CATEGORY_ORDER: MissingFieldCategory[] = [
  'organisation',
  'responsable',
  'billing',
  'delivery',
];

// Couleurs sobres : un point coloré comme accent, pas de fond ni de badge
// criard. La hiérarchie visuelle vient de la typo et de l'espacement, pas
// de la couleur. Les teintes restent alignées avec les autres modules de la
// page (responsable=blue, billing=emerald, delivery=cyan, org=violet).
const CATEGORY_DOT_COLORS: Record<MissingFieldCategory, string> = {
  responsable: 'bg-blue-500',
  billing: 'bg-emerald-500',
  delivery: 'bg-cyan-500',
  organisation: 'bg-violet-500',
  custom: 'bg-slate-400',
};

export function MissingInfoBanner({
  missingFields,
  onRequestComplements,
  onRequestComplementForCategory,
  onSaveInlineField,
  onOpenContactModal,
}: MissingInfoBannerProps) {
  if (missingFields.total === 0) return null;

  const groups = CATEGORY_ORDER.map(cat => ({
    category: cat,
    fields: dedupeContactFields(missingFields.byCategory[cat]),
  })).filter(g => g.fields.length > 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Header — compact, accent discret */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              {missingFields.total} information
              {missingFields.total > 1 ? 's' : ''} manquante
              {missingFields.total > 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              Renseignez chaque ligne ou demandez les infos au client.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 flex-shrink-0 border-slate-200 text-slate-700 hover:bg-slate-50"
          onClick={onRequestComplements}
        >
          <Send className="h-3.5 w-3.5" />
          Tout demander
        </Button>
      </div>

      {/* Categories — grid 2 colonnes sur desktop pour densifier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 px-4 py-3">
        {groups.map(group => (
          <div key={group.category} className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${CATEGORY_DOT_COLORS[group.category]}`}
                  aria-hidden
                />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 truncate">
                  {CATEGORY_LABELS[group.category]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRequestComplementForCategory(group.category)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 flex-shrink-0"
              >
                <Send className="h-3 w-3" />
                Demander
              </button>
            </div>
            <div className="rounded-md border border-slate-100 divide-y divide-slate-100">
              {group.fields.map(field => (
                <MissingFieldRow
                  key={field.key}
                  field={field}
                  onSaveInline={onSaveInlineField}
                  onOpenContactModal={onOpenContactModal}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
