'use client';

import {
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

import type { AffiliateProductApprovalStatus } from '../../hooks/use-product-approvals';

export type StatusOption = {
  value: AffiliateProductApprovalStatus | 'all';
  label: string;
  icon: React.ElementType;
  color: string;
};

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'all', label: 'Tous', icon: Package, color: 'text-gray-600' },
  {
    value: 'pending_approval',
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600',
  },
  {
    value: 'approved',
    label: 'Approuves',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  {
    value: 'rejected',
    label: 'Rejetes',
    icon: XCircle,
    color: 'text-red-600',
  },
];

export const STATUS_BADGE_CONFIG: Record<
  AffiliateProductApprovalStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  draft: {
    label: 'Brouillon',
    icon: AlertCircle,
    color: 'text-gray-600 bg-gray-100',
  },
  pending_approval: {
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600 bg-amber-50',
  },
  approved: {
    label: 'Approuve',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50',
  },
  rejected: {
    label: 'Rejete',
    icon: XCircle,
    color: 'text-red-600 bg-red-50',
  },
};
