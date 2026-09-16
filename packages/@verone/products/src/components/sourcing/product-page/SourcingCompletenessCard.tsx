'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { cn } from '@verone/utils';
import { AlertCircle, Check, ChevronRight, FlaskConical } from 'lucide-react';

import {
  blockingRequirements,
  missingRequirements,
  requirementsFor,
  type SourcingCompletenessProduct,
  type SourcingFieldSection,
  type SourcingRequirement,
  type SourcingRequirementScope,
} from '../../../utils/sourcing-completeness';

export interface SourcingCompletenessCardProps {
  product: SourcingCompletenessProduct;
  /** Ouvre la section de la fiche où se remplit le champ. */
  onGoToField: (section: SourcingFieldSection) => void;
  className?: string;
}

/**
 * Checklist « ce qu'il reste à compléter » — [BO-SOURCING-COMPLETUDE-001]
 *
 * Deux portes, la même règle que la base (`sourcing_missing_fields`) : ce qui
 * est grisé dans la barre d'actions est expliqué ici, ligne par ligne, et
 * chaque ligne manquante emmène au bon champ.
 */
export function SourcingCompletenessCard({
  product,
  onGoToField,
  className,
}: SourcingCompletenessCardProps) {
  const sampleBlocked = blockingRequirements(product, 'sample').length > 0;
  const catalogueBlocked =
    blockingRequirements(product, 'catalogue').length > 0;
  const advised = missingRequirements(product, 'catalogue').filter(
    r => !r.blocking
  );

  return (
    <Card className={cn('border-black', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {sampleBlocked || catalogueBlocked ? (
            <AlertCircle className="h-4 w-4 text-amber-600" />
          ) : (
            <Check className="h-4 w-4 text-green-600" />
          )}
          {sampleBlocked || catalogueBlocked
            ? 'Ce qu’il reste à compléter'
            : 'Fiche complète'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <GateBlock
          scope="sample"
          icon={<FlaskConical className="h-4 w-4" />}
          title="Commander l’échantillon"
          product={product}
          onGoToField={onGoToField}
        />
        <GateBlock
          scope="catalogue"
          icon={<Check className="h-4 w-4" />}
          title="Valider au catalogue"
          product={product}
          onGoToField={onGoToField}
        />

        {advised.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Conseillé — ne bloque rien
            </p>
            <ul className="space-y-1">
              {advised.map(requirement => (
                <RequirementLine
                  key={requirement.key}
                  requirement={requirement}
                  satisfied={false}
                  onGoToField={onGoToField}
                />
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GateBlock({
  scope,
  icon,
  title,
  product,
  onGoToField,
}: {
  scope: SourcingRequirementScope;
  icon: React.ReactNode;
  title: string;
  product: SourcingCompletenessProduct;
  onGoToField: (section: SourcingFieldSection) => void;
}) {
  const required = requirementsFor(scope).filter(r => r.blocking);
  const missingKeys = new Set(
    blockingRequirements(product, scope).map(r => r.key)
  );
  const ready = missingKeys.size === 0;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className={ready ? 'text-green-600' : 'text-gray-400'}>
          {icon}
        </span>
        <span className="text-sm font-medium text-black">{title}</span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            ready
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          )}
        >
          {ready
            ? 'Prêt'
            : `${missingKeys.size} champ${missingKeys.size > 1 ? 's' : ''} à remplir`}
        </span>
      </div>
      <ul className="space-y-1">
        {required.map(requirement => (
          <RequirementLine
            key={requirement.key}
            requirement={requirement}
            satisfied={!missingKeys.has(requirement.key)}
            onGoToField={onGoToField}
          />
        ))}
      </ul>
    </div>
  );
}

function RequirementLine({
  requirement,
  satisfied,
  onGoToField,
}: {
  requirement: SourcingRequirement;
  satisfied: boolean;
  onGoToField: (section: SourcingFieldSection) => void;
}) {
  if (satisfied) {
    return (
      <li className="flex min-h-11 items-center gap-2 text-sm text-gray-500 md:min-h-0 md:py-0.5">
        <Check className="h-4 w-4 shrink-0 text-green-600" />
        <span className="truncate">{requirement.label}</span>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onGoToField(requirement.section)}
        className="flex min-h-11 w-full items-center gap-2 rounded-md px-1 text-left text-sm text-black hover:bg-gray-50 md:min-h-0 md:py-1"
      >
        <span
          className={cn(
            'h-4 w-4 shrink-0 rounded-full border-2',
            requirement.blocking ? 'border-amber-500' : 'border-gray-300'
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="font-medium">{requirement.label}</span>
          <span className="block text-xs text-gray-500">
            {requirement.hint}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
      </button>
    </li>
  );
}
