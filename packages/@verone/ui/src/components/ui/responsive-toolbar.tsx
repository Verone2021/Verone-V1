/**
 * ResponsiveToolbar - Barre d'outils responsive Verone
 *
 * Pattern courant : titre + recherche + filtres + bouton primaire.
 * Sur desktop, tout est sur une ligne. Sur mobile, empile verticalement
 * avec bouton primaire toujours accessible.
 *
 * @example
 * <ResponsiveToolbar
 *   title="Factures"
 *   subtitle="Gestion des factures"
 *   search={<SearchInput />}
 *   filters={<FiltersDropdown />}
 *   primaryAction={
 *     <Button><Plus /> Nouvelle facture</Button>
 *   }
 *   secondaryActions={
 *     <>
 *       <Button variant="outline">Exporter</Button>
 *       <Button variant="outline">Sync</Button>
 *     </>
 *   }
 * />
 */

'use client';

import * as React from 'react';

import { cn } from '@verone/utils';

export interface ResponsiveToolbarProps {
  /** Titre principal */
  title?: React.ReactNode;
  /** Sous-titre */
  subtitle?: React.ReactNode;
  /** Champ de recherche (prend toute la largeur dispo sur mobile) */
  search?: React.ReactNode;
  /** Selects de filtres */
  filters?: React.ReactNode;
  /** Action primaire (CTA principal) - toujours visible et accessible */
  primaryAction?: React.ReactNode;
  /** Actions secondaires (repliees en dropdown sur mobile si besoin) */
  secondaryActions?: React.ReactNode;
  /** className additionnelle */
  className?: string;
}

export function ResponsiveToolbar({
  title,
  subtitle,
  search,
  filters,
  primaryAction,
  secondaryActions,
  className,
}: ResponsiveToolbarProps) {
  const hasTitle = title ?? subtitle;
  const hasActions = primaryAction ?? secondaryActions;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Ligne 1 : Titre + Actions primaires (desktop) */}
      {(hasTitle ?? hasActions) && (
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          {hasTitle && (
            <div className="flex flex-col gap-1">
              {title && (
                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          )}

          {hasActions && (
            <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
              {secondaryActions}
              {primaryAction}
            </div>
          )}
        </div>
      )}

      {/* Ligne 2 : Recherche + Filtres */}
      {(search ?? filters) && (
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {search && <div className="flex-1 md:max-w-md">{search}</div>}
          {filters && (
            <div className="flex flex-wrap gap-2 md:flex-nowrap">{filters}</div>
          )}
        </div>
      )}
    </div>
  );
}
