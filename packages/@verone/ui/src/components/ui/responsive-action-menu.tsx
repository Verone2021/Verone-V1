/**
 * ResponsiveActionMenu - Menu d'actions responsive Verone
 *
 * Composant qui affiche :
 * - Sur MOBILE/TABLETTE (< lg / 1024px) : UN SEUL bouton "..." qui ouvre
 *   un dropdown contenant toutes les actions.
 * - Sur LAPTOP+ (>= lg / 1024px) : boutons icones separes, visibles directement.
 *
 * Respecte les 5 techniques responsive (CLAUDE.md) :
 * - Touch target 44px sur mobile (h-11 w-11)
 * - Touch target 36px sur desktop (h-9 w-9)
 * - Actions critiques restent accessibles a toutes les tailles
 * - Zero debordement horizontal
 *
 * @example
 * <ResponsiveActionMenu
 *   actions={[
 *     { label: 'Voir', icon: Eye, onClick: handleView },
 *     { label: 'Modifier', icon: Pencil, onClick: handleEdit },
 *     { label: 'Telecharger', icon: Download, onClick: handleDownload },
 *     {
 *       label: 'Supprimer',
 *       icon: Trash2,
 *       onClick: handleDelete,
 *       variant: 'destructive'
 *     },
 *   ]}
 * />
 */

'use client';

import * as React from 'react';

import { cn } from '@verone/utils';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';

import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

export interface ResponsiveAction {
  /** Label texte affiche dans le dropdown et en tooltip */
  label: string;
  /** Icone lucide-react */
  icon: LucideIcon;
  /** Handler du clic */
  onClick: (e?: React.MouseEvent) => void;
  /** Variant visuel. 'destructive' = rouge (suppression) */
  variant?: 'default' | 'destructive';
  /** Action desactivee */
  disabled?: boolean;
  /** Ajoute un separateur AVANT cet item dans le dropdown */
  separatorBefore?: boolean;
  /**
   * Si true, cette action est TOUJOURS visible en tant que bouton separe,
   * meme sur mobile. Utilise pour les actions critiques (ex: Voir).
   * @default false
   */
  alwaysVisible?: boolean;
}

export interface ResponsiveActionMenuProps {
  /** Liste des actions */
  actions: ResponsiveAction[];
  /** Breakpoint a partir duquel on affiche les boutons separes */
  breakpoint?: 'md' | 'lg' | 'xl';
  /** Alignement du dropdown */
  align?: 'start' | 'end' | 'center';
  /** className additionnelle sur le conteneur racine */
  className?: string;
}

const BREAKPOINT_MOBILE_HIDE: Record<'md' | 'lg' | 'xl', string> = {
  md: 'md:hidden',
  lg: 'lg:hidden',
  xl: 'xl:hidden',
};

const BREAKPOINT_DESKTOP_SHOW: Record<'md' | 'lg' | 'xl', string> = {
  md: 'hidden md:flex',
  lg: 'hidden lg:flex',
  xl: 'hidden xl:flex',
};

export function ResponsiveActionMenu({
  actions,
  breakpoint = 'lg',
  align = 'end',
  className,
}: ResponsiveActionMenuProps) {
  if (actions.length === 0) return null;

  const alwaysVisibleActions = actions.filter(a => a.alwaysVisible);
  const dropdownActions = actions.filter(a => !a.alwaysVisible);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Actions toujours visibles (meme sur mobile) */}
      {alwaysVisibleActions.map(action => (
        <ActionButton key={action.label} action={action} />
      ))}

      {/* Mobile/Tablette : dropdown unique */}
      {dropdownActions.length > 0 && (
        <div className={BREAKPOINT_MOBILE_HIDE[breakpoint]}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Menu d'actions"
                className="h-11 w-11"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align}>
              {dropdownActions.map((action, idx) => (
                <React.Fragment key={action.label}>
                  {action.separatorBefore && idx > 0 && (
                    <DropdownMenuSeparator />
                  )}
                  <DropdownMenuItem
                    disabled={action.disabled}
                    onClick={e => {
                      e.stopPropagation();
                      action.onClick(e);
                    }}
                    className={cn(
                      action.variant === 'destructive' &&
                        'text-destructive focus:text-destructive'
                    )}
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Desktop : boutons separes */}
      <div
        className={cn(
          BREAKPOINT_DESKTOP_SHOW[breakpoint],
          'items-center gap-1'
        )}
      >
        {dropdownActions.map(action => (
          <ActionButton key={action.label} action={action} />
        ))}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  action: ResponsiveAction;
}

function ActionButton({ action }: ActionButtonProps) {
  const Icon = action.icon;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={action.label}
      title={action.label}
      disabled={action.disabled}
      onClick={e => {
        e.stopPropagation();
        action.onClick(e);
      }}
      className={cn(
        'h-11 w-11 md:h-9 md:w-9',
        action.variant === 'destructive' &&
          'text-destructive hover:bg-destructive/10'
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
