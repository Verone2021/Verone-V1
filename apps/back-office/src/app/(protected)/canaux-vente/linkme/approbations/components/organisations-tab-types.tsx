'use client';

import { Building2, CheckCircle, Clock, Filter, XCircle } from 'lucide-react';

import { type OrganisationApprovalStatus } from '../../hooks/use-organisation-approvals';

// ============================================================================
// STATUS OPTIONS
// ============================================================================

export const ORG_STATUS_OPTIONS: {
  value: OrganisationApprovalStatus | 'all';
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: 'all', label: 'Toutes', icon: Building2, color: 'text-gray-600' },
  {
    value: 'pending_validation',
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600',
  },
  {
    value: 'approved',
    label: 'Approuvees',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  {
    value: 'rejected',
    label: 'Rejetees',
    icon: XCircle,
    color: 'text-red-600',
  },
];

// ============================================================================
// STATUS BADGE
// ============================================================================

export function OrgStatusBadge({
  status,
}: {
  status: OrganisationApprovalStatus;
}) {
  const config = {
    pending_validation: {
      label: 'En attente',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    approved: {
      label: 'Approuvee',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50',
    },
    rejected: {
      label: 'Rejetee',
      icon: XCircle,
      color: 'text-red-600 bg-red-50',
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

// ============================================================================
// STATUS FILTER
// ============================================================================

interface OrgStatusFilterProps {
  selectedStatus: OrganisationApprovalStatus | 'all';
  onStatusChange: (status: OrganisationApprovalStatus | 'all') => void;
}

export function OrgStatusFilter({
  selectedStatus,
  onStatusChange,
}: OrgStatusFilterProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <Filter className="h-4 w-4 text-gray-400" />
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {ORG_STATUS_OPTIONS.map(option => {
          const Icon = option.icon;
          const isActive = selectedStatus === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-white shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${option.color}`} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface OrgEmptyStateProps {
  selectedStatus: OrganisationApprovalStatus | 'all';
}

export function OrgEmptyState({ selectedStatus }: OrgEmptyStateProps) {
  return (
    <div className="bg-white rounded-xl p-12 text-center border">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Building2 className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Aucune organisation
      </h2>
      <p className="text-gray-500">
        {selectedStatus === 'pending_validation'
          ? 'Aucune organisation en attente de validation'
          : 'Aucune organisation trouvee avec ce filtre'}
      </p>
    </div>
  );
}
