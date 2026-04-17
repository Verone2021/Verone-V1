import React from 'react';
import { cn } from '@verone/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Skeleton } from './skeleton';

import type {
  ResponsiveBreakpoint,
  ResponsiveAlign,
  ResponsiveDensity,
  ResponsiveDataTableProps,
} from './responsive-data-table.types';

export type {
  ResponsiveBreakpoint,
  ResponsiveAlign,
  ResponsiveDensity,
  ResponsiveColumn,
  ResponsiveDataTableProps,
} from './responsive-data-table.types';

// ---------------------------------------------------------------------------
// Static Tailwind JIT — classes must appear as literals for extraction
// ---------------------------------------------------------------------------

const HIDE_BELOW: Record<ResponsiveBreakpoint, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
  '2xl': 'hidden 2xl:table-cell',
};

const ALIGN_CLASS: Record<ResponsiveAlign, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

const DENSITY_HEAD_CLASS: Record<ResponsiveDensity, string> = {
  compact: 'py-2 text-xs',
  normal: 'py-3 text-sm',
};

const DENSITY_CELL_CLASS: Record<ResponsiveDensity, string> = {
  compact: 'py-2 text-xs',
  normal: 'py-2.5 text-sm',
};

const STICKY_TH =
  'sticky right-0 bg-background z-20 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]';
const STICKY_TD =
  'sticky right-0 bg-background z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResponsiveDataTable<T>(
  props: ResponsiveDataTableProps<T>
): React.ReactElement {
  const {
    columns,
    data,
    rowKey,
    actions,
    actionsWidth = 90,
    emptyState,
    loading = false,
    skeletonRows = 3,
    onRowClick,
    density = 'compact',
    className,
  } = props;

  const totalCols = columns.length + (actions !== undefined ? 1 : 0);
  const densityHead = DENSITY_HEAD_CLASS[density];
  const densityCell = DENSITY_CELL_CLASS[density];

  return (
    <Table className={cn('w-auto', className)}>
      <TableHeader>
        <TableRow>
          {columns.map(col => {
            const hideClass = col.hideBelow ? HIDE_BELOW[col.hideBelow] : '';
            const alignClass = col.align
              ? ALIGN_CLASS[col.align]
              : ALIGN_CLASS.left;
            return (
              <TableHead
                key={col.id}
                className={cn(hideClass, alignClass, densityHead)}
                style={{
                  width: col.width,
                  minWidth: col.minWidth ?? col.width,
                }}
              >
                {col.header}
              </TableHead>
            );
          })}
          {actions !== undefined && (
            <TableHead
              className={cn(STICKY_TH, densityHead, 'text-right')}
              style={{ width: actionsWidth, minWidth: actionsWidth }}
            >
              Actions
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell colSpan={totalCols} className="py-2">
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={totalCols}
              className="py-12 text-center text-muted-foreground"
            >
              {emptyState ?? 'Aucune donnée'}
            </TableCell>
          </TableRow>
        ) : (
          <>
            {data.map(row => (
              <TableRow
                key={rowKey(row)}
                className={cn(onRowClick ? 'cursor-pointer' : '')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map(col => {
                  const hideClass = col.hideBelow
                    ? HIDE_BELOW[col.hideBelow]
                    : '';
                  const alignClass = col.align
                    ? ALIGN_CLASS[col.align]
                    : ALIGN_CLASS.left;
                  return (
                    <TableCell
                      key={col.id}
                      className={cn(hideClass, alignClass, densityCell)}
                      style={{
                        width: col.width,
                        minWidth: col.minWidth ?? col.width,
                      }}
                    >
                      {col.cell(row)}
                    </TableCell>
                  );
                })}
                {actions !== undefined && (
                  <TableCell
                    className={cn(STICKY_TD, densityCell, 'text-right')}
                    style={{ width: actionsWidth, minWidth: actionsWidth }}
                  >
                    {actions(row)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </>
        )}
      </TableBody>
    </Table>
  );
}
