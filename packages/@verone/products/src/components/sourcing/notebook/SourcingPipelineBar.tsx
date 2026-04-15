'use client';

import { cn } from '@verone/ui';

const PIPELINE_STEPS = [
  { key: 'need_identified', label: 'Besoin', short: 'Besoin' },
  { key: 'supplier_search', label: 'Recherche', short: 'Recherche' },
  { key: 'initial_contact', label: 'Contact', short: 'Contact' },
  { key: 'evaluation', label: 'Évaluation', short: 'Éval.' },
  { key: 'negotiation', label: 'Négociation', short: 'Négo.' },
  { key: 'sample_requested', label: 'Échantillon demandé', short: 'Éch. dem.' },
  { key: 'sample_received', label: 'Échantillon reçu', short: 'Éch. reçu' },
  { key: 'sample_approved', label: 'Échantillon validé', short: 'Validé' },
  { key: 'order_placed', label: 'Commande passée', short: 'Commandé' },
  { key: 'received', label: 'Reçu', short: 'Reçu' },
] as const;

const SPECIAL_STATUSES = {
  sample_rejected: { label: 'Échantillon refusé', color: 'bg-red-500' },
  on_hold: { label: 'En pause', color: 'bg-yellow-500' },
  cancelled: { label: 'Annulé', color: 'bg-gray-400' },
} as const;

interface SourcingPipelineBarProps {
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
  priority?: string;
  onPriorityChange?: (priority: string) => void;
  compact?: boolean;
}

const priorityConfig = {
  low: {
    label: 'Basse',
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  medium: {
    label: 'Moyenne',
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  high: {
    label: 'Haute',
    className: 'bg-orange-100 text-orange-700 border-orange-300',
  },
  urgent: {
    label: 'Urgente',
    className: 'bg-red-100 text-red-700 border-red-300',
  },
} as Record<string, { label: string; className: string }>;

export function SourcingPipelineBar({
  currentStatus,
  onStatusChange,
  priority,
  onPriorityChange,
  compact = false,
}: SourcingPipelineBarProps) {
  const currentIndex = PIPELINE_STEPS.findIndex(s => s.key === currentStatus);
  const isSpecial = currentStatus in SPECIAL_STATUSES;

  return (
    <div className="space-y-3">
      {/* Pipeline progress bar */}
      <div className="flex items-center gap-0.5">
        {PIPELINE_STEPS.map((step, index) => {
          const isCompleted = !isSpecial && index < currentIndex;
          const isCurrent = !isSpecial && index === currentIndex;
          const isFuture = !isSpecial && index > currentIndex;

          return (
            <button
              key={step.key}
              onClick={() => onStatusChange?.(step.key)}
              disabled={!onStatusChange}
              title={step.label}
              className={cn(
                'flex-1 h-8 text-[10px] font-medium transition-all relative',
                'first:rounded-l-md last:rounded-r-md',
                isCompleted && 'bg-green-500 text-white',
                isCurrent &&
                  'bg-black text-white ring-2 ring-black ring-offset-1',
                isFuture && 'bg-gray-100 text-gray-400',
                isSpecial && 'bg-gray-100 text-gray-400',
                onStatusChange && 'cursor-pointer hover:opacity-80',
                !onStatusChange && 'cursor-default'
              )}
            >
              <span className="hidden lg:inline">
                {compact ? step.short : step.label}
              </span>
              <span className="lg:hidden">{step.short}</span>
            </button>
          );
        })}
      </div>

      {/* Special status + Priority */}
      <div className="flex items-center gap-2 flex-wrap">
        {isSpecial && (
          <span
            className={cn(
              'text-xs px-2 py-1 rounded-full text-white',
              SPECIAL_STATUSES[currentStatus as keyof typeof SPECIAL_STATUSES]
                .color
            )}
          >
            {
              SPECIAL_STATUSES[currentStatus as keyof typeof SPECIAL_STATUSES]
                .label
            }
          </span>
        )}

        {/* Special status actions */}
        {onStatusChange && !isSpecial && (
          <div className="flex gap-1">
            <button
              onClick={() => onStatusChange('on_hold')}
              className="text-[10px] px-2 py-0.5 rounded border border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              Mettre en pause
            </button>
            <button
              onClick={() => onStatusChange('cancelled')}
              className="text-[10px] px-2 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50"
            >
              Annuler
            </button>
          </div>
        )}

        {isSpecial && onStatusChange && (
          <button
            onClick={() => onStatusChange('need_identified')}
            className="text-[10px] px-2 py-0.5 rounded border border-green-300 text-green-700 hover:bg-green-50"
          >
            Reprendre
          </button>
        )}

        {/* Priority selector */}
        {priority && (
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-gray-500">Priorité:</span>
            {onPriorityChange ? (
              <select
                value={priority}
                onChange={e => onPriorityChange(e.target.value)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded border appearance-none cursor-pointer',
                  priorityConfig[priority]?.className ?? 'bg-gray-100'
                )}
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            ) : (
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded border',
                  priorityConfig[priority]?.className ?? 'bg-gray-100'
                )}
              >
                {priorityConfig[priority]?.label ?? priority}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
