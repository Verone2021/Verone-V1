'use client';

import { ButtonV2 } from '@verone/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@verone/ui/components/ui/dropdown-menu';
import { cn } from '@verone/utils';
import {
  Archive,
  Ban,
  CheckCircle,
  ClipboardCheck,
  ExternalLink,
  FlaskConical,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  StickyNote,
  Undo2,
  type LucideIcon,
} from 'lucide-react';

import type { SampleStateResult } from '../../../utils/derive-sample-state';
import {
  blockingRequirements,
  type SourcingCompletenessProduct,
} from '../../../utils/sourcing-completeness';
import {
  availableLifecycleActions,
  type SourcingLifecycleAction,
} from '../../../utils/sourcing-stage';

export type SourcingBarLifecycleAction = Exclude<
  SourcingLifecycleAction,
  'set_stage'
>;

interface BarAction {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  tone?: 'primary' | 'success' | 'danger';
  /** Visible à toutes les tailles ; les autres passent dans « Plus » sous lg. */
  primary?: boolean;
}

export interface SourcingActionBarProps {
  status: string | null | undefined;
  isWithdrawn: boolean;
  /**
   * Champs du produit contrôlés par la règle de complétude. La barre calcule
   * elle-même ce qui bloque, avec la même règle que la base
   * (`sourcing_missing_fields`), et l'affiche en toutes lettres.
   */
  product: SourcingCompletenessProduct;
  sample: SampleStateResult;
  busy: boolean;
  /** Vrai si une évaluation a déjà été enregistrée pour ce produit. */
  hasEvaluation?: boolean;
  onAddNote: () => void;
  onOrderSample: () => void;
  onViewOrder: (orderId: string) => void;
  onLifecycle: (action: SourcingBarLifecycleAction) => void;
  /** Ouvre la fenêtre d'évaluation de l'échantillon. */
  onEvaluateSample?: () => void;
}

/**
 * Barre d'actions unique de la fiche sourcing : seules les actions que la base
 * acceptera sont proposées (availableLifecycleActions). Boutons avec libellé
 * sur grand écran ; actions secondaires regroupées dans « Plus » en dessous.
 */
export function SourcingActionBar({
  status,
  isWithdrawn,
  product,
  sample,
  busy,
  hasEvaluation = false,
  onAddNote,
  onOrderSample,
  onViewOrder,
  onLifecycle,
  onEvaluateSample,
}: SourcingActionBarProps) {
  const allowed = new Set(availableLifecycleActions(status, isWithdrawn));
  // Les exigences de l'échantillon sont un sous-ensemble de celles du
  // catalogue : ce qui bloque l'un bloque forcément l'autre.
  const sampleBlockers = blockingRequirements(product, 'sample');
  const catalogueBlockers = blockingRequirements(product, 'catalogue');
  const sampleBlocked = sampleBlockers.length > 0;
  const catalogueBlocked = catalogueBlockers.length > 0;
  const actions: BarAction[] = [];

  const activeOrder =
    sample.state !== 'none' && sample.state !== 'cancelled'
      ? sample.order
      : null;
  if (activeOrder) {
    actions.push({
      key: 'view-order',
      label: 'Voir la commande',
      icon: ExternalLink,
      onClick: () => onViewOrder(activeOrder.id),
      primary: true,
    });
  } else if (allowed.has('validate')) {
    actions.push({
      key: 'order-sample',
      label: "Commander l'échantillon",
      icon: FlaskConical,
      onClick: onOrderSample,
      disabled: busy || sampleBlocked,
      tone: 'primary',
      primary: true,
    });
  }
  // Bouton « Évaluer l'échantillon » : visible quand l'échantillon est reçu
  // et qu'aucune évaluation n'a encore été enregistrée.
  if (
    sample.state === 'received' &&
    !hasEvaluation &&
    onEvaluateSample !== undefined
  ) {
    actions.push({
      key: 'evaluate-sample',
      label: "Évaluer l'échantillon",
      icon: ClipboardCheck,
      onClick: onEvaluateSample,
      disabled: busy,
      tone: 'primary',
      primary: true,
    });
  }

  if (allowed.has('validate')) {
    actions.push({
      key: 'validate',
      label: 'Valider au catalogue',
      icon: CheckCircle,
      onClick: () => onLifecycle('validate'),
      disabled: busy || catalogueBlocked,
      tone: 'success',
      primary: true,
    });
  }
  const recoveries: Array<[SourcingBarLifecycleAction, string, LucideIcon]> = [
    ['resume', 'Reprendre', Play],
    ['reopen', 'Rouvrir', RotateCcw],
    ['restore', 'Restaurer', Undo2],
  ];
  for (const [action, label, icon] of recoveries) {
    if (allowed.has(action)) {
      actions.push({
        key: action,
        label,
        icon,
        onClick: () => onLifecycle(action),
        disabled: busy,
        tone: 'primary',
        primary: true,
      });
    }
  }

  actions.push({
    key: 'note',
    label: 'Annoter',
    icon: StickyNote,
    onClick: onAddNote,
  });
  if (allowed.has('pause')) {
    actions.push({
      key: 'pause',
      label: 'Mettre en pause',
      icon: Pause,
      onClick: () => onLifecycle('pause'),
      disabled: busy,
    });
  }
  if (allowed.has('refuse')) {
    actions.push({
      key: 'refuse',
      label: 'Refuser',
      icon: Ban,
      onClick: () => onLifecycle('refuse'),
      disabled: busy,
      tone: 'danger',
    });
  }
  if (allowed.has('withdraw')) {
    actions.push({
      key: 'withdraw',
      label: 'Retirer',
      icon: Archive,
      onClick: () => onLifecycle('withdraw'),
      disabled: busy,
      tone: 'danger',
    });
  }

  const primaryActions = actions.filter(action => action.primary);
  const secondaryActions = actions.filter(action => !action.primary);

  // Explication visible sous la barre : un bouton grisé sans phrase laisse
  // croire que la fonction a disparu (constat du 16/09).
  const showsOrderSample = actions.some(a => a.key === 'order-sample');
  const showsValidate = actions.some(a => a.key === 'validate');
  const blockedNotice = (() => {
    if (sampleBlocked && (showsOrderSample || showsValidate)) {
      const cible =
        showsOrderSample && showsValidate
          ? "Pour commander l'échantillon et valider au catalogue"
          : showsOrderSample
            ? "Pour commander l'échantillon"
            : 'Pour valider au catalogue';
      return `${cible} : ${joinLabels(showsValidate ? catalogueBlockers : sampleBlockers)}.`;
    }
    if (catalogueBlocked && showsValidate) {
      return `Pour valider au catalogue : ${joinLabels(catalogueBlockers)}.`;
    }
    return null;
  })();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {primaryActions.map(action => (
          <BarButton key={action.key} action={action} />
        ))}

        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          {secondaryActions.map(action => (
            <BarButton key={action.key} action={action} />
          ))}
        </div>

        {secondaryActions.length > 0 && (
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ButtonV2
                  variant="outline"
                  size="sm"
                  icon={MoreHorizontal}
                  className="h-11 md:h-9"
                >
                  Plus
                </ButtonV2>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {secondaryActions.map(action => (
                  <DropdownMenuItem
                    key={action.key}
                    disabled={action.disabled}
                    onClick={action.onClick}
                    className={cn(
                      'min-h-11 md:min-h-0',
                      action.tone === 'danger' &&
                        'text-red-600 focus:text-red-600'
                    )}
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {blockedNotice !== null && (
        <p className="text-sm text-amber-700" role="status">
          {blockedNotice}
        </p>
      )}
    </div>
  );
}

/** « renseignez le fournisseur et le prix d'achat » */
function joinLabels(requirements: ReadonlyArray<{ label: string }>): string {
  const labels = requirements.map(r => r.label.toLowerCase());
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')} et ${labels[labels.length - 1]}`;
  return `renseignez ${list}`;
}

function BarButton({ action }: { action: BarAction }) {
  const variant =
    action.tone === 'success'
      ? 'success'
      : action.tone === 'primary'
        ? 'primary'
        : 'outline';
  return (
    <ButtonV2
      variant={variant}
      size="sm"
      icon={action.icon}
      onClick={action.onClick}
      disabled={action.disabled}
      title={action.title}
      className={cn(
        'h-11 md:h-9',
        action.tone === 'danger' && 'text-red-600 hover:text-red-700'
      )}
    >
      {action.label}
    </ButtonV2>
  );
}
