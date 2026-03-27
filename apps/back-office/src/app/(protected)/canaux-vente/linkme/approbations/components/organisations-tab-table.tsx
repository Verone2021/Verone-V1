'use client';

import { Button } from '@verone/ui';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
  Trash2,
} from 'lucide-react';

import { type PendingOrganisation } from '../../hooks/use-organisation-approvals';

import { OrgStatusBadge } from './organisations-tab-types';

// ============================================================================
// SHARED PROPS
// ============================================================================

interface RowActionProps {
  org: PendingOrganisation;
  isApprovePending: boolean;
  onViewDetails: (org: PendingOrganisation) => void;
  onRejectClick: (org: PendingOrganisation) => void;
  onApprove: (org: PendingOrganisation) => void;
  onDeleteClick: (org: PendingOrganisation) => void;
}

// ============================================================================
// ROW ACTIONS CELL
// ============================================================================

function OrgTableRowActions({
  org,
  isApprovePending,
  onViewDetails,
  onRejectClick,
  onApprove,
  onDeleteClick,
}: RowActionProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => onViewDetails(org)}>
        <Eye className="h-4 w-4" />
      </Button>
      {org.approval_status === 'pending_validation' && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRejectClick(org)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Rejeter
          </Button>
          <Button
            size="sm"
            onClick={() => onApprove(org)}
            disabled={isApprovePending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isApprovePending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Approuver
          </Button>
        </>
      )}
      {org.approval_status === 'rejected' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeleteClick(org)}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Supprimer
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// TABLE ROW
// ============================================================================

export function OrgTableRow(props: RowActionProps) {
  const { org } = props;
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900">
            {org.trade_name ?? org.legal_name}
          </p>
          {org.trade_name && (
            <p className="text-sm text-gray-500">{org.legal_name}</p>
          )}
          {org.siret && (
            <p className="text-xs text-gray-400 mt-0.5">SIRET: {org.siret}</p>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-gray-900">{org.enseigne_name ?? '-'}</p>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          {org.email && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Mail className="h-3 w-3" />
              {org.email}
            </div>
          )}
          {org.phone && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Phone className="h-3 w-3" />
              {org.phone}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="h-3 w-3" />
          {org.city ?? '-'}
          {org.postal_code && ` (${org.postal_code})`}
        </div>
      </td>
      <td className="px-6 py-4">
        <OrgStatusBadge status={org.approval_status} />
      </td>
      <td className="px-6 py-4">
        <OrgTableRowActions {...props} />
      </td>
    </tr>
  );
}

// ============================================================================
// TABLE
// ============================================================================

interface OrgTableProps {
  organisations: PendingOrganisation[];
  isApprovePending: boolean;
  onViewDetails: (org: PendingOrganisation) => void;
  onRejectClick: (org: PendingOrganisation) => void;
  onApprove: (org: PendingOrganisation) => void;
  onDeleteClick: (org: PendingOrganisation) => void;
}

export function OrgTable({
  organisations,
  isApprovePending,
  onViewDetails,
  onRejectClick,
  onApprove,
  onDeleteClick,
}: OrgTableProps) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Organisation
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Enseigne
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Contact
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Localisation
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Statut
            </th>
            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {organisations.map(org => (
            <OrgTableRow
              key={org.id}
              org={org}
              isApprovePending={isApprovePending}
              onViewDetails={onViewDetails}
              onRejectClick={onRejectClick}
              onApprove={onApprove}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
