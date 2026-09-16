'use client';

import { ButtonV2 } from '@verone/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { cn } from '@verone/utils';
import { ArrowRight, Compass } from 'lucide-react';

import type { SourcingStage } from '../../../utils/sourcing-stage';
import {
  SOURCING_STAGE_PLAYBOOK,
  stageCounter,
  type SourcingStageActionKey,
  type SourcingStageProgressInput,
} from '../../../utils/sourcing-stage-playbook';

export interface SourcingStagePanelProps {
  stage: SourcingStage | null;
  progress: SourcingStageProgressInput;
  /** Actions indisponibles ici, avec la raison affichée en aide. */
  unavailableActions?: Partial<Record<SourcingStageActionKey, string>>;
  busy?: boolean;
  onAction: (key: SourcingStageActionKey) => void;
  className?: string;
}

/**
 * Panneau de l'étape en cours — [BO-SOURCING-ETAPES-003]
 *
 * Les 4 étapes ne servaient qu'à changer un statut : même écran à Recherche et
 * à Négociation. Le panneau dit ce qu'on cherche à obtenir ici, ce qui permet
 * de passer à la suite, et propose les actions de l'étape.
 *
 * Rien n'y est bloquant : les seules portes qui refusent sont celles de la
 * règle de complétude.
 */
export function SourcingStagePanel({
  stage,
  progress,
  unavailableActions = {},
  busy = false,
  onAction,
  className,
}: SourcingStagePanelProps) {
  // Hors parcours (en pause, refusé, validé, retiré) : pas d'étape en cours.
  if (stage === null) return null;

  const playbook = SOURCING_STAGE_PLAYBOOK[stage];
  const counter = stageCounter(stage, progress);

  return (
    <Card className={cn('border-gray-200', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Compass className="h-4 w-4 text-gray-500" />
            Étape {playbook.title}
          </CardTitle>
          {counter !== null && (
            <span className="text-xs text-gray-500">{counter}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-black">{playbook.goal}</p>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-500">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0" />
            {playbook.exit}
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {playbook.actions.map(action => {
            const raison = unavailableActions[action.key];
            const indisponible = raison !== undefined;
            return (
              <li key={action.key}>
                <ButtonV2
                  variant="outline"
                  size="sm"
                  onClick={() => onAction(action.key)}
                  disabled={busy || indisponible}
                  className="h-11 w-full justify-start md:h-9"
                >
                  {action.label}
                </ButtonV2>
                <p
                  className={cn(
                    'mt-1 text-xs',
                    indisponible ? 'text-amber-700' : 'text-gray-500'
                  )}
                >
                  {raison ?? action.hint}
                </p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
