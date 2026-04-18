/**
 * ResponsiveDataView - Vue donnees responsive Verone
 *
 * Composant qui bascule automatiquement entre :
 * - MOBILE (< md / 768px) : liste de cartes empilees
 * - TABLETTE + (>= md) : tableau classique
 *
 * C'est LA technique des developpeurs seniors pour afficher des donnees
 * tabulaires sur tous les ecrans. Un tableau n'est PAS adapte au mobile
 * et ne doit JAMAIS y apparaitre.
 *
 * Le developpeur fournit 2 renderers :
 * - renderTable : UI du tableau (pour >= md)
 * - renderCard  : UI de la carte pour UNE ligne (pour < md)
 *
 * @example
 * <ResponsiveDataView
 *   data={invoices}
 *   loading={loading}
 *   emptyMessage="Aucune facture"
 *   renderTable={(items) => (
 *     <Table>
 *       <TableHeader>...</TableHeader>
 *       <TableBody>
 *         {items.map(invoice => <InvoiceRow key={invoice.id} invoice={invoice} />)}
 *       </TableBody>
 *     </Table>
 *   )}
 *   renderCard={(invoice) => (
 *     <Card>
 *       <CardHeader>{invoice.numero}</CardHeader>
 *       <CardContent>{invoice.client} - {invoice.total}</CardContent>
 *     </Card>
 *   )}
 * />
 */

'use client';

import * as React from 'react';

import { cn } from '@verone/utils';

import { Skeleton } from './skeleton';

export interface ResponsiveDataViewProps<T> {
  /** Donnees a afficher */
  data: T[];
  /** Rendu mode tableau (>= md). Recoit toutes les donnees. */
  renderTable: (data: T[]) => React.ReactNode;
  /** Rendu mode carte (< md). Appele pour chaque item. */
  renderCard: (item: T, index: number) => React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Message affiche si data est vide */
  emptyMessage?: React.ReactNode;
  /** Composant skeleton custom pendant loading */
  loadingSkeleton?: React.ReactNode;
  /** Nombre de skeletons a afficher */
  skeletonCount?: number;
  /** Breakpoint de bascule card -> table */
  breakpoint?: 'sm' | 'md' | 'lg';
  /** className sur conteneur */
  className?: string;
}

const BREAKPOINT_MOBILE_SHOW = {
  sm: 'sm:hidden',
  md: 'md:hidden',
  lg: 'lg:hidden',
} as const;

const BREAKPOINT_DESKTOP_SHOW = {
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
} as const;

export function ResponsiveDataView<T>({
  data,
  renderTable,
  renderCard,
  loading = false,
  emptyMessage = 'Aucun element a afficher',
  loadingSkeleton,
  skeletonCount = 5,
  breakpoint = 'md',
  className,
}: ResponsiveDataViewProps<T>) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {loadingSkeleton ??
          Array.from({ length: skeletonCount }).map((_, idx) => (
            <Skeleton key={idx} className="h-20 w-full" />
          ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-12 text-sm text-muted-foreground',
          className
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile : cartes empilees */}
      <div className={cn(BREAKPOINT_MOBILE_SHOW[breakpoint], 'space-y-3')}>
        {data.map((item, idx) => (
          <React.Fragment key={idx}>{renderCard(item, idx)}</React.Fragment>
        ))}
      </div>

      {/* Desktop : tableau classique avec scroll horizontal si besoin */}
      <div
        className={cn(
          BREAKPOINT_DESKTOP_SHOW[breakpoint],
          'w-full overflow-x-auto'
        )}
      >
        {renderTable(data)}
      </div>
    </div>
  );
}
