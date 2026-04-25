'use client';

import { Badge, Button } from '@verone/ui';
import { AlertCircle, Send } from 'lucide-react';

import {
  CATEGORY_LABELS,
  type MissingFieldCategory,
  type MissingFieldsResult,
} from '../../../../utils/order-missing-fields';

interface MissingInfoBannerProps {
  missingFields: MissingFieldsResult;
  onRequestComplements: () => void;
}

// Couleurs alignees avec ContactsUnified et le reste du monorepo : on garde
// les memes teintes par categorie pour que l'utilisateur les associe d'un
// modal a l'autre.
const CATEGORY_BADGE_COLORS: Record<MissingFieldCategory, string> = {
  responsable: 'bg-blue-100 text-blue-700',
  billing: 'bg-green-100 text-green-700',
  delivery: 'bg-cyan-100 text-cyan-700',
  organisation: 'bg-purple-100 text-purple-700',
  custom: 'bg-gray-100 text-gray-700',
};

const CATEGORY_ORDER: MissingFieldCategory[] = [
  'organisation',
  'responsable',
  'billing',
  'delivery',
];

export function MissingInfoBanner({
  missingFields,
  onRequestComplements,
}: MissingInfoBannerProps) {
  if (missingFields.total === 0) return null;

  const groups = CATEGORY_ORDER.map(cat => ({
    category: cat,
    fields: missingFields.byCategory[cat],
  })).filter(g => g.fields.length > 0);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 items-start gap-3 min-w-0">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              {missingFields.total} information
              {missingFields.total > 1 ? 's' : ''} manquante
              {missingFields.total > 1 ? 's' : ''} pour finaliser cette commande
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Cliquez sur « Demander des compléments » pour les réclamer au
              client en un seul email.
            </p>

            <div className="mt-3 space-y-2">
              {groups.map(group => (
                <div
                  key={group.category}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
                >
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 ${CATEGORY_BADGE_COLORS[group.category]}`}
                  >
                    {CATEGORY_LABELS[group.category]}
                  </Badge>
                  <span className="text-xs text-gray-700">
                    {group.fields.map(f => f.label).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="default"
          className="w-full md:w-auto md:flex-shrink-0 gap-2 bg-amber-600 hover:bg-amber-700"
          onClick={onRequestComplements}
        >
          <Send className="h-4 w-4" />
          Demander des compléments
        </Button>
      </div>
    </div>
  );
}
