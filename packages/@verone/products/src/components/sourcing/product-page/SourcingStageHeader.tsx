'use client';

import { Badge } from '@verone/ui/components/ui/badge';
import { cn } from '@verone/utils';
import { Check, FlaskConical } from 'lucide-react';

import {
  SAMPLE_STATE_LABELS,
  type SampleState,
  type SampleStateResult,
} from '../../../utils/derive-sample-state';
import {
  SOURCING_STAGES,
  SOURCING_STAGE_LABELS,
  SOURCING_STATE_LABELS,
  stageOfStatus,
  type SourcingStage,
} from '../../../utils/sourcing-stage';
import {
  stageCounter,
  type SourcingStageProgressInput,
} from '../../../utils/sourcing-stage-playbook';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'urgent', label: 'Urgente' },
] as const;

const STATE_BADGE_VARIANT = {
  on_hold: 'warning',
  refused: 'danger',
  validated: 'success',
} as const;

const SAMPLE_BADGE_VARIANT: Record<
  SampleState,
  'outline' | 'warning' | 'info' | 'success' | 'secondary'
> = {
  none: 'outline',
  to_send: 'warning',
  ordered: 'info',
  received: 'success',
  cancelled: 'secondary',
};

interface SourcingStageHeaderProps {
  status: string | null | undefined;
  isWithdrawn: boolean;
  sample: SampleStateResult;
  sampleLoading: boolean;
  priority: string;
  canChangeStage: boolean;
  /** Avancement réel, pour chiffrer chaque étape sous son libellé. */
  progress?: SourcingStageProgressInput;
  onStageSelect: (stage: SourcingStage) => void;
  onPriorityChange: (priority: string) => void;
}

/**
 * Les 4 étapes du sourcing (cliquables) et les pastilles d'état : pause,
 * refus, retrait, échantillon (lu dans la commande échantillon).
 */
export function SourcingStageHeader({
  status,
  isWithdrawn,
  sample,
  sampleLoading,
  priority,
  canChangeStage,
  progress,
  onStageSelect,
  onPriorityChange,
}: SourcingStageHeaderProps) {
  const { stage, group } = stageOfStatus(status);
  const currentIndex = stage ? SOURCING_STAGES.indexOf(stage) : -1;

  return (
    <div className="space-y-3">
      <ol
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        aria-label="Étapes du sourcing"
      >
        {SOURCING_STAGES.map((item, index) => {
          const isCurrent = index === currentIndex;
          const isDone = currentIndex >= 0 && index < currentIndex;
          const clickable = canChangeStage && !isCurrent;
          const counter =
            progress !== undefined ? stageCounter(item, progress) : null;
          return (
            <li key={item}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStageSelect(item)}
                aria-current={isCurrent ? 'step' : undefined}
                title={
                  clickable
                    ? `Passer à l'étape ${SOURCING_STAGE_LABELS[item]}`
                    : undefined
                }
                className={cn(
                  'flex min-h-11 w-full items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors md:min-h-10',
                  isCurrent && 'border-black bg-black text-white',
                  isDone && 'border-green-200 bg-green-50 text-green-800',
                  !isCurrent &&
                    !isDone &&
                    'border-gray-200 bg-white text-gray-600',
                  clickable
                    ? 'cursor-pointer hover:border-gray-400'
                    : 'cursor-default',
                  group !== 'in_progress' && 'opacity-60'
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                    isCurrent && 'bg-white text-black',
                    isDone && 'bg-green-600 text-white',
                    !isCurrent && !isDone && 'bg-gray-100 text-gray-600'
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate">
                    {SOURCING_STAGE_LABELS[item]}
                  </span>
                  {counter !== null && (
                    <span
                      className={cn(
                        'block truncate text-[11px] font-normal',
                        isCurrent ? 'text-white/70' : 'text-gray-500'
                      )}
                    >
                      {counter}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        {group !== 'in_progress' && (
          <Badge variant={STATE_BADGE_VARIANT[group]}>
            {SOURCING_STATE_LABELS[group]}
          </Badge>
        )}
        {isWithdrawn && <Badge variant="default">Retiré</Badge>}
        <Badge
          variant={SAMPLE_BADGE_VARIANT[sample.state]}
          className="gap-1"
          title={sample.order ? `Commande ${sample.order.poNumber}` : undefined}
        >
          <FlaskConical className="h-3 w-3" />
          {sampleLoading ? 'Échantillon…' : SAMPLE_STATE_LABELS[sample.state]}
          {!sampleLoading && sample.order ? ` · ${sample.order.poNumber}` : ''}
        </Badge>

        <label className="ml-auto flex items-center gap-2 text-sm text-gray-500">
          Priorité
          <select
            value={priority}
            onChange={e => onPriorityChange(e.target.value)}
            className="h-11 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 md:h-9"
          >
            {PRIORITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
