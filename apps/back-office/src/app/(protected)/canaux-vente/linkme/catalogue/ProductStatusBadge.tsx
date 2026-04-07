'use client';

import { Badge } from '@verone/ui';

export const PRODUCT_STATUS_CONFIG = {
  active: {
    label: 'Actif',
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  preorder: {
    label: 'Precommande',
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  discontinued: {
    label: 'Arrete',
    className: 'bg-red-100 text-red-700 border-red-300',
  },
  draft: {
    label: 'Brouillon',
    className: 'bg-gray-100 text-gray-600 border-gray-300',
  },
} as const;

interface ProductStatusBadgeProps {
  status: 'active' | 'preorder' | 'discontinued' | 'draft';
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  const config = PRODUCT_STATUS_CONFIG[status] ?? PRODUCT_STATUS_CONFIG.draft;
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}
