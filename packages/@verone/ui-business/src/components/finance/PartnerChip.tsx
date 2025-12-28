'use client';

import * as React from 'react';

import { Badge } from '@verone/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Building2,
  User,
  Package,
  Wrench,
  Users,
  CircleDot,
} from 'lucide-react';

/**
 * Types de rôles d'organisation (correspond à organisation_role_type enum)
 */
export type OrganisationRole =
  | 'customer'
  | 'supplier_goods'
  | 'supplier_services'
  | 'affiliate_partner';

/**
 * Props pour le composant PartnerChip
 */
export interface PartnerChipProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nom du partenaire */
  name: string;
  /** Rôles du partenaire (peut en avoir plusieurs) */
  roles: OrganisationRole[];
  /** ID de l'organisation (pour lien optionnel) */
  organisationId?: string;
  /** Type d'entité */
  entityType?: 'organisation' | 'contact';
  /** Affichage compact (sans label de rôle) */
  compact?: boolean;
  /** Callback clic */
  onClick?: () => void;
  /** Afficher tooltip avec détails */
  showTooltip?: boolean;
}

/**
 * Configuration des rôles
 */
const roleConfig: Record<
  OrganisationRole,
  {
    label: string;
    shortLabel: string;
    icon: typeof Building2;
    color: string;
    bgColor: string;
  }
> = {
  customer: {
    label: 'Client',
    shortLabel: 'C',
    icon: User,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
  supplier_goods: {
    label: 'Fournisseur marchandises',
    shortLabel: 'FM',
    icon: Package,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900',
  },
  supplier_services: {
    label: 'Fournisseur services',
    shortLabel: 'FS',
    icon: Wrench,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
  },
  affiliate_partner: {
    label: 'Partenaire affilié',
    shortLabel: 'PA',
    icon: Users,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
  },
};

/**
 * Détermine la couleur dominante basée sur les rôles
 */
function getDominantColor(roles: OrganisationRole[]): {
  color: string;
  bgColor: string;
} {
  // Priorité : customer > supplier_goods > supplier_services > affiliate_partner
  const priority: OrganisationRole[] = [
    'customer',
    'supplier_goods',
    'supplier_services',
    'affiliate_partner',
  ];

  for (const role of priority) {
    if (roles.includes(role)) {
      return {
        color: roleConfig[role].color,
        bgColor: roleConfig[role].bgColor,
      };
    }
  }

  return { color: 'text-muted-foreground', bgColor: 'bg-muted' };
}

/**
 * Composant PartnerChip - Badge affichant un partenaire avec ses rôles
 *
 * @example
 * <PartnerChip name="Acme Corp" roles={['customer', 'supplier_goods']} />
 * <PartnerChip name="John Doe" roles={['customer']} entityType="contact" compact />
 */
export function PartnerChip({
  name,
  roles,
  organisationId,
  entityType = 'organisation',
  compact = false,
  onClick,
  showTooltip = true,
  className,
  ...props
}: PartnerChipProps) {
  const hasMultipleRoles = roles.length > 1;
  const { color, bgColor } = getDominantColor(roles);

  // Icône principale
  const PrimaryIcon =
    entityType === 'contact' ? User : hasMultipleRoles ? CircleDot : Building2;

  // Contenu principal du chip
  const chipContent = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors',
        bgColor,
        color,
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      <PrimaryIcon className="h-3.5 w-3.5" />
      <span className="truncate max-w-[150px]">{name}</span>

      {/* Badges de rôles (mode non-compact) */}
      {!compact && roles.length > 0 && (
        <div className="flex items-center gap-0.5 ml-1">
          {roles.slice(0, 2).map(role => {
            const config = roleConfig[role];
            const RoleIcon = config.icon;
            return (
              <span
                key={role}
                className={cn(
                  'inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold',
                  config.bgColor,
                  config.color
                )}
                title={config.label}
              >
                <RoleIcon className="h-3 w-3" />
              </span>
            );
          })}
          {roles.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{roles.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Indicateur multi-rôle (mode compact) */}
      {compact && hasMultipleRoles && (
        <span className="text-[10px] opacity-70">({roles.length})</span>
      )}
    </div>
  );

  // Si pas de tooltip, retourner directement le chip
  if (!showTooltip) {
    return chipContent;
  }

  // Avec tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{chipContent}</TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{name}</p>
            <div className="flex flex-wrap gap-1">
              {roles.map(role => (
                <Badge key={role} variant="outline" className="text-xs">
                  {roleConfig[role].label}
                </Badge>
              ))}
            </div>
            {organisationId && (
              <p className="text-xs text-muted-foreground">
                ID: {organisationId.slice(0, 8)}...
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Version mini du PartnerChip pour les tableaux denses
 */
export function PartnerChipMini({
  name,
  roles,
  className,
}: {
  name: string;
  roles: OrganisationRole[];
  className?: string;
}) {
  const { color } = getDominantColor(roles);
  const primaryRole = roles[0];
  const RoleIcon = primaryRole ? roleConfig[primaryRole].icon : Building2;

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-sm', color, className)}
      title={roles.map(r => roleConfig[r].label).join(', ')}
    >
      <RoleIcon className="h-3 w-3" />
      <span className="truncate max-w-[100px]">{name}</span>
    </span>
  );
}

/**
 * Export de la configuration des rôles pour réutilisation
 */
export { roleConfig };
