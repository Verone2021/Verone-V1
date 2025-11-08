'use client';

import { CheckCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@verone/utils';
import {
  useCompletionStatus,
  type CompletionStatusData,
} from '@/shared/modules/products/hooks';

interface CompletionStatusCompactProps {
  product: CompletionStatusData & { id: string };
  missingFields?: {
    infosGenerales: number;
    descriptions: number;
    categorisation: number;
    fournisseur: number;
    identifiants: number;
  };
  className?: string;
}

/**
 * Version compacte du statut complétude (hauteur dynamique)
 * Affichage : Label + pourcentage restant + liste COMPLÈTE champs manquants
 * Lecture seule - Calcul automatique via trigger PostgreSQL
 */
export function CompletionStatusCompact({
  product,
  missingFields,
  className,
}: CompletionStatusCompactProps) {
  const completionStatus = useCompletionStatus(product);

  // Identifier TOUTES les sections avec champs manquants
  const getAllMissingFields = () => {
    if (!missingFields) return [];

    const fields: Array<{ name: string; count: number }> = [];

    if (missingFields.infosGenerales > 0) {
      fields.push({
        name: 'Informations Générales',
        count: missingFields.infosGenerales,
      });
    }
    if (missingFields.descriptions > 0) {
      fields.push({ name: 'Descriptions', count: missingFields.descriptions });
    }
    if (missingFields.categorisation > 0) {
      fields.push({
        name: 'Catégorisation',
        count: missingFields.categorisation,
      });
    }
    if (missingFields.fournisseur > 0) {
      fields.push({
        name: 'Fournisseur & Références',
        count: missingFields.fournisseur,
      });
    }
    if (missingFields.identifiants > 0) {
      fields.push({ name: 'Identifiants', count: missingFields.identifiants });
    }

    return fields;
  };

  const allMissingFields = getAllMissingFields();
  const hasMissingFields = allMissingFields.length > 0;

  // Calcul pourcentage restant à compléter (inverse de completion_percentage)
  const percentageToComplete = 100 - completionStatus.percentage;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 min-h-[60px] px-3 py-2',
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        'hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {/* Header : Label + Badge pourcentage */}
      <div className="flex items-center justify-between">
        {/* Label avec icône */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-50">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">
            Complétude fiche
          </span>
        </div>

        {/* Badge pourcentage RESTANT avec libellé "à compléter" */}
        <Badge
          variant={completionStatus.variant}
          className="text-[10px] px-2 py-0.5 font-medium"
        >
          <span className="mr-1">{completionStatus.icon}</span>
          {percentageToComplete}% à compléter
        </Badge>
      </div>

      {/* Liste verticale COMPLÈTE des champs manquants (si présents) */}
      {hasMissingFields && (
        <div className="flex flex-col gap-1 pl-8 text-xs text-gray-600">
          <span className="font-medium text-gray-700">Champs manquants :</span>
          {allMissingFields.map(field => (
            <div key={field.name} className="flex items-start gap-1.5">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>
                {field.name} ({field.count})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
