'use client';

import Link from 'next/link';

import {
  Package,
  Calendar,
  Clock,
  User,
  FileText,
  ExternalLink,
  Filter,
  RotateCcw,
} from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import type { StockReasonCode } from '@verone/stock/hooks';

import {
  getMovementTypeLabel,
  getMovementTypeColor,
  getSourceInfo,
  getPerformerName,
  type StockMovement,
} from './types';

interface ProductHistoryTimelineProps {
  movements: StockMovement[];
  filteredMovements: StockMovement[];
  onResetFilters: () => void;
  getReasonDescription: (code: StockReasonCode) => string;
}

export function ProductHistoryTimeline({
  movements,
  filteredMovements,
  onResetFilters,
  getReasonDescription,
}: ProductHistoryTimelineProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Aucun mouvement trouvé</p>
        <p className="text-sm text-gray-400 mt-1">
          Ce produit n'a pas encore d'historique de mouvements
        </p>
      </div>
    );
  }

  if (filteredMovements.length === 0) {
    return (
      <div className="text-center py-12">
        <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">
          Aucun mouvement pour ces filtres
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Modifiez les critères ou réinitialisez les filtres
        </p>
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="mt-4"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Réinitialiser les filtres
        </ButtonV2>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-700 sticky top-0">
        <div className="col-span-2">Date & Heure</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-1 text-right">Quantité</div>
        <div className="col-span-2 text-center">Stock</div>
        <div className="col-span-2">Motif / Notes</div>
        <div className="col-span-2">Par</div>
        <div className="col-span-2">Source</div>
      </div>

      <div className="relative">
        <div className="absolute left-[16.666%] top-0 bottom-0 w-px bg-gray-200" />

        {filteredMovements.map(movement => {
          const sourceInfo = getSourceInfo(movement);
          const performerName = getPerformerName(movement);
          const reasonLabel = movement.reason_code
            ? getReasonDescription(movement.reason_code)
            : '-';

          return (
            <div
              key={movement.id}
              className="grid grid-cols-12 gap-2 px-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm relative"
            >
              <div className="col-span-2 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-black font-medium">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  {new Date(movement.performed_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 text-xs ml-4">
                  <Clock className="h-3 w-3" />
                  {new Date(movement.performed_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="col-span-1 flex items-center relative z-10">
                <div className="absolute left-[-8.333%] w-2 h-2 rounded-full bg-black border-2 border-white" />
                <Badge
                  className={`text-xs font-medium ${getMovementTypeColor(movement.movement_type)}`}
                >
                  {getMovementTypeLabel(movement.movement_type)}
                </Badge>
              </div>

              <div className="col-span-1 flex items-center justify-end">
                <span
                  className={`font-bold text-base ${
                    movement.quantity_change > 0
                      ? 'text-black'
                      : 'text-gray-700'
                  }`}
                >
                  {movement.quantity_change > 0 ? '+' : ''}
                  {movement.quantity_change}
                </span>
              </div>

              <div className="col-span-2 flex items-center justify-center gap-2 font-mono text-sm">
                <span className="text-gray-500">
                  {movement.quantity_before}
                </span>
                <span className="text-gray-400">→</span>
                <span className="text-black font-bold">
                  {movement.quantity_after}
                </span>
              </div>

              <div className="col-span-2 flex flex-col gap-1">
                {movement.reason_code && (
                  <span className="text-gray-900 text-xs font-medium">
                    {reasonLabel}
                  </span>
                )}
                {movement.notes && (
                  <span className="text-gray-600 text-xs line-clamp-2">
                    {movement.notes}
                  </span>
                )}
                {!movement.reason_code && !movement.notes && (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                <span className="text-gray-900 text-xs font-medium truncate">
                  {performerName}
                </span>
              </div>

              <div className="col-span-2 flex items-center gap-2">
                {sourceInfo.type === 'manual' ? (
                  <Badge
                    variant="outline"
                    className="text-xs border-gray-300 text-gray-600"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    {sourceInfo.label}
                  </Badge>
                ) : (
                  <Link
                    href={sourceInfo.link ?? '#'}
                    className="flex items-center gap-1.5 text-black hover:text-gray-700 transition-colors group"
                    onClick={e => e.stopPropagation()}
                  >
                    <Badge className="bg-black text-white text-xs group-hover:bg-gray-700 transition-colors">
                      {sourceInfo.label}
                    </Badge>
                    <ExternalLink className="h-3 w-3 text-gray-500 group-hover:text-black" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
