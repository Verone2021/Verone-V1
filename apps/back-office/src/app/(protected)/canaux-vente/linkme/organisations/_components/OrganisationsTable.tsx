import { Button } from '@verone/ui';
import { CheckCircle, Eye, Mail, Phone, XCircle } from 'lucide-react';

import type { PendingOrganisation } from '../../hooks/use-organisation-approvals';

import { StatusBadge } from './StatusBadge';

interface OrganisationsTableProps {
  organisations: PendingOrganisation[];
  onViewDetails: (org: PendingOrganisation) => void;
  onApprove: (org: PendingOrganisation) => void;
  onReject: (org: PendingOrganisation) => void;
}

export function OrganisationsTable({
  organisations,
  onViewDetails,
  onApprove,
  onReject,
}: OrganisationsTableProps) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Organisation
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Contact
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Enseigne
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Date creation
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
            <tr key={org.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {org.trade_name ?? org.legal_name}
                  </p>
                  {org.trade_name && (
                    <p className="text-sm text-gray-500">{org.legal_name}</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  {org.email && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {org.email}
                    </p>
                  )}
                  {org.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {org.phone}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-gray-900">{org.enseigne_name ?? '-'}</p>
              </td>
              <td className="px-6 py-4">
                <p className="text-gray-600">
                  {new Date(org.created_at).toLocaleDateString('fr-FR')}
                </p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={org.approval_status} />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(org)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {org.approval_status === 'pending_validation' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReject(org)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onApprove(org)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
