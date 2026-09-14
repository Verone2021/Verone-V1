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
  hasSupplier: boolean;
  hasCostPrice: boolean;
  sample: SampleStateResult;
  busy: boolean;
  onAddNote: () => void;
  onOrderSample: () => void;
  onViewOrder: (orderId: string) => void;
  onLifecycle: (action: SourcingBarLifecycleAction) => void;
}

/**
 * Barre d'actions unique de la fiche sourcing : seules les actions que la base
 * acceptera sont proposées (availableLifecycleActions). Boutons avec libellé
 * sur grand écran ; actions secondaires regroupées dans « Plus » en dessous.
 */
export function SourcingActionBar({
  status,
  isWithdrawn,
  hasSupplier,
  hasCostPrice,
  sample,
  busy,
  onAddNote,
  onOrderSample,
  onViewOrder,
  onLifecycle,
}: SourcingActionBarProps) {
  const allowed = new Set(availableLifecycleActions(status, isWithdrawn));
  const missing = !hasSupplier
    ? "Liez d'abord un fournisseur"
    : !hasCostPrice
      ? "Renseignez d'abord le prix d'achat"
      : undefined;
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
      disabled: busy || Boolean(missing),
      title: missing,
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
      disabled: busy || Boolean(missing),
      title: missing,
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

  return (
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
  );
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
