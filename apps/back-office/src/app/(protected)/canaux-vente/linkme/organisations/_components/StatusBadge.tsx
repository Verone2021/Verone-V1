import { CheckCircle, Clock, XCircle } from 'lucide-react';

import type { OrganisationApprovalStatus } from '../../hooks/use-organisation-approvals';

const STATUS_CONFIG: Record<
  OrganisationApprovalStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
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
};

export function StatusBadge({
  status,
}: {
  status: OrganisationApprovalStatus;
}) {
  const config = STATUS_CONFIG[status];
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
