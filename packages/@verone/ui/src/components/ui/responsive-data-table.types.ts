import type React from 'react';

export type ResponsiveBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ResponsiveAlign = 'left' | 'right' | 'center';
export type ResponsiveDensity = 'compact' | 'normal';

export interface ResponsiveColumn<T> {
  id: string;
  header: string;
  width?: number;
  minWidth?: number;
  hideBelow?: ResponsiveBreakpoint;
  align?: ResponsiveAlign;
  cell: (row: T) => React.ReactNode;
  tooltipWhenHidden?: (row: T) => string;
}

export interface ResponsiveDataTableProps<T> {
  columns: ResponsiveColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
  actionsWidth?: number;
  emptyState?: React.ReactNode;
  loading?: boolean;
  skeletonRows?: number;
  onRowClick?: (row: T) => void;
  density?: ResponsiveDensity;
  className?: string;
}
