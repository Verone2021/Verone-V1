'use client';

import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@verone/ui';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  Building2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

import {
  useAllOrganisationsWithApproval,
  useApproveOrganisation,
  useRejectOrganisation,
  type PendingOrganisation,
  type OrganisationApprovalStatus,
} from '../../hooks/use-organisation-approvals';

// ============================================================================
// ORG STATUS BADGE
// ============================================================================

function OrgStatusBadge({ status }: { status: OrganisationApprovalStatus }) {
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
// STATUS FILTER OPTIONS
// ============================================================================

const ORG_STATUS_OPTIONS: {
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
// COMPONENT
// ============================================================================

export function OrganisationsTab() {
  const [selectedStatus, setSelectedStatus] = useState<
    OrganisationApprovalStatus | 'all'
  >('pending_validation');

  const {
    data: organisations,
    isLoading,
    refetch,
  } = useAllOrganisationsWithApproval(
    selectedStatus === 'all' ? undefined : selectedStatus
  );

  const approveOrg = useApproveOrganisation();
  const rejectOrg = useRejectOrganisation();

  const [selectedOrg, setSelectedOrg] = useState<PendingOrganisation | null>(
    null
  );
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleApprove = async (org: PendingOrganisation) => {
    try {
      await approveOrg.mutateAsync({ organisationId: org.id });
      void refetch().catch(error => {
        console.error('[Approbations] Refetch failed:', error);
      });
    } catch {
      alert("Erreur lors de l'approbation");
    }
  };

  const handleRejectClick = (org: PendingOrganisation) => {
    setSelectedOrg(org);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedOrg || !rejectReason.trim()) return;

    try {
      await rejectOrg.mutateAsync({
        organisationId: selectedOrg.id,
        reason: rejectReason.trim(),
      });
      setIsRejectDialogOpen(false);
      setSelectedOrg(null);
      void refetch().catch(error => {
        console.error('[Approbations] Refetch failed:', error);
      });
    } catch {
      alert('Erreur lors du rejet');
    }
  };

  const handleViewDetails = (org: PendingOrganisation) => {
    setSelectedOrg(org);
    setIsDetailOpen(true);
  };

  return (
    <>
      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {ORG_STATUS_OPTIONS.map(option => {
            const Icon = option.icon;
            const isActive = selectedStatus === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!organisations || organisations.length === 0) && (
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
      )}

      {/* Organisations Table */}
      {!isLoading && organisations && organisations.length > 0 && (
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
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {org.trade_name ?? org.legal_name}
                      </p>
                      {org.trade_name && (
                        <p className="text-sm text-gray-500">
                          {org.legal_name}
                        </p>
                      )}
                      {org.siret && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          SIRET: {org.siret}
                        </p>
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
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(org)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {org.approval_status === 'pending_validation' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectClick(org)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              void handleApprove(org).catch(error => {
                                console.error(
                                  '[Approbations] Approve org failed:',
                                  error
                                );
                              });
                            }}
                            disabled={approveOrg.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {approveOrg.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
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
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Details de l&apos;organisation</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {selectedOrg.trade_name ?? selectedOrg.legal_name}
                </h3>
                {selectedOrg.trade_name && (
                  <p className="text-sm text-gray-600">
                    Raison sociale: {selectedOrg.legal_name}
                  </p>
                )}
                {selectedOrg.siret && (
                  <p className="text-sm text-gray-600">
                    SIRET: {selectedOrg.siret}
                  </p>
                )}
              </div>

              {selectedOrg.enseigne_name && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Enseigne</p>
                  <p className="font-medium">{selectedOrg.enseigne_name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium">{selectedOrg.email ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Telephone</p>
                  <p className="font-medium">{selectedOrg.phone ?? '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Adresse</p>
                <div className="text-gray-700">
                  {selectedOrg.address_line1 && (
                    <p>{selectedOrg.address_line1}</p>
                  )}
                  {selectedOrg.address_line2 && (
                    <p>{selectedOrg.address_line2}</p>
                  )}
                  <p>
                    {selectedOrg.postal_code} {selectedOrg.city}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Cree le</p>
                <p className="font-medium">
                  {new Date(selectedOrg.created_at).toLocaleDateString(
                    'fr-FR',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Rejeter l&apos;organisation
            </DialogTitle>
            <DialogDescription>Indiquez le motif du rejet.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Motif du rejet..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleRejectConfirm().catch(error => {
                  console.error('[Approbations] Reject failed:', error);
                });
              }}
              disabled={!rejectReason.trim() || rejectOrg.isPending}
            >
              {rejectOrg.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
