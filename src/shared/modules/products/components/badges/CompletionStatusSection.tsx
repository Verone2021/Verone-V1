'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  useCompletionStatus,
  type CompletionStatusData,
} from '@/shared/modules/products/hooks';

interface CompletionStatusSectionProps {
  product: CompletionStatusData & { id: string; name?: string };
  className?: string;
}

/**
 * Section affichant le statut de complétude automatique (LECTURE SEULE)
 *
 * Calculé automatiquement par trigger PostgreSQL (calculate_product_completion)
 * Affiche "Complété" (vert) ou "À compléter" (rouge) selon completion_percentage
 */
export function CompletionStatusSection({
  product,
  className,
}: CompletionStatusSectionProps) {
  const completionStatus = useCompletionStatus(product);

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-900">Complétude Fiche</h3>
        </div>

        {/* Badge Statut */}
        <Badge
          variant={completionStatus.variant}
          className="text-sm font-medium"
        >
          {completionStatus.icon} {completionStatus.label}
        </Badge>
      </div>

      {/* Barre de Progression */}
      <div className="mb-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={cn(
              'h-full transition-all duration-300',
              completionStatus.percentage === 100
                ? 'bg-green-500'
                : 'bg-red-500'
            )}
            style={{ width: `${completionStatus.percentage}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs font-medium text-gray-600">
          {completionStatus.percentage}%
        </p>
      </div>

      {/* Description */}
      <div className="rounded-md bg-gray-50 p-3">
        <p className="text-sm text-gray-600">{completionStatus.description}</p>
        <p className="mt-1 text-xs text-gray-500">
          ℹ️ Calculé automatiquement par le système (lecture seule)
        </p>
      </div>

      {/* Aide Complétude */}
      {completionStatus.percentage < 100 && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            💡 <strong>Conseil :</strong> Complétez les champs manquants dans
            les sections ci-dessous pour atteindre 100%
          </p>
        </div>
      )}
    </div>
  );
}
