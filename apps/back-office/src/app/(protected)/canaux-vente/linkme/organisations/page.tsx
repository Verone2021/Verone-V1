'use client';

/**
 * Page Approbations Organisations - Back-Office LinkMe
 *
 * Queue de validation des organisations creees via le stepper enseigne.
 * Les organisations en `pending_validation` doivent etre approuvees
 * avant d'apparaitre dans le dropdown "Restaurant existant".
 *
 * @module OrganisationsPage
 * @since 2026-01-05
 */

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
  Building2,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

import {
  usePendingOrganisationsCount,
  useAllOrganisationsWithApproval,
  useApproveOrganisation,
  useRejectOrganisation,
  type PendingOrganisation,
  type OrganisationApprovalStatus,
} from '../hooks/use-organisation-approvals';

// Status filter options
const STATUS_OPTIONS: {
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

export default function OrganisationsPage() {
  const [selectedStatus, setSelectedStatus] = useState<
    OrganisationApprovalStatus | 'all'
  >('pending_validation');
  const [selectedOrg, setSelectedOrg] = useState<PendingOrganisation | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);

  const { data: pendingCount } = usePendingOrganisationsCount();
  const {
    data: organisations,
    isLoading,
    refetch,
  } = useAllOrganisationsWithApproval(
    selectedStatus === 'all' ? undefined : selectedStatus
  );

  const approveOrganisation = useApproveOrganisation();
  const rejectOrganisation = useRejectOrganisation();

  const handleApproveClick = (org: PendingOrganisation) => {
    setSelectedOrg(org);
    setIsApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedOrg) return;

    try {
      await approveOrganisation.mutateAsync({
        organisationId: selectedOrg.id,
      });
      setIsApproveDialogOpen(false);
      setSelectedOrg(null);
      void refetch().catch(error => {
        console.error(
          '[OrganisationsPage] refetch after approve failed:',
          error
        );
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
      await rejectOrganisation.mutateAsync({
        organisationId: selectedOrg.id,
        reason: rejectReason.trim(),
      });
      setIsRejectDialogOpen(false);
      setSelectedOrg(null);
      void refetch().catch(error => {
        console.error(
          '[OrganisationsPage] refetch after reject failed:',
          error
        );
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Organisations LinkMe
          </h1>
          <p className="text-gray-500 mt-1">
            Validez les restaurants crees via le stepper enseigne
          </p>
        </div>
        {(pendingCount ?? 0) > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-amber-700">
              {pendingCount} en attente
            </span>
          </div>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {STATUS_OPTIONS.map(option => {
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
              : 'Aucune organisation trouvee'}
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
                        <p className="text-sm text-gray-500">
                          {org.legal_name}
                        </p>
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
                            onClick={() => handleApproveClick(org)}
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
      )}

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Approuver l&apos;organisation
            </DialogTitle>
            <DialogDescription>
              Cette organisation sera visible dans le dropdown &quot;Restaurant
              existant&quot; du stepper enseigne.
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="py-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="font-medium">
                  {selectedOrg.trade_name ?? selectedOrg.legal_name}
                </p>
                {selectedOrg.trade_name && (
                  <p className="text-sm text-gray-500">
                    {selectedOrg.legal_name}
                  </p>
                )}
                {selectedOrg.enseigne_name && (
                  <p className="text-sm text-blue-600">
                    Enseigne: {selectedOrg.enseigne_name}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                void handleApproveConfirm().catch(error => {
                  console.error(
                    '[OrganisationsPage] handleApproveConfirm failed:',
                    error
                  );
                });
              }}
              disabled={approveOrganisation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveOrganisation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirmer l&apos;approbation
            </Button>
          </DialogFooter>
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
            <DialogDescription>
              Indiquez le motif du rejet. L&apos;organisation ne sera pas
              visible dans les selections.
            </DialogDescription>
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
                  console.error(
                    '[OrganisationsPage] handleRejectConfirm failed:',
                    error
                  );
                });
              }}
              disabled={!rejectReason.trim() || rejectOrganisation.isPending}
            >
              {rejectOrganisation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Details de l&apos;organisation</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nom commercial</p>
                  <p className="font-medium">{selectedOrg.trade_name ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Raison sociale</p>
                  <p className="font-medium">{selectedOrg.legal_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">SIRET</p>
                  <p className="font-medium">{selectedOrg.siret ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Enseigne</p>
                  <p className="font-medium">
                    {selectedOrg.enseigne_name ?? '-'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <p className="text-sm font-medium text-gray-700">Contact</p>
                {selectedOrg.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{selectedOrg.email}</span>
                  </div>
                )}
                {selectedOrg.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{selectedOrg.phone}</span>
                  </div>
                )}
              </div>

              {(selectedOrg.address_line1 ||
                selectedOrg.city ||
                selectedOrg.postal_code) && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Adresse
                  </p>
                  <p className="text-gray-600">
                    {selectedOrg.address_line1}
                    {selectedOrg.address_line2 && (
                      <>
                        <br />
                        {selectedOrg.address_line2}
                      </>
                    )}
                    <br />
                    {selectedOrg.postal_code} {selectedOrg.city}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-gray-500">Creee le</p>
                  <p className="font-medium">
                    {new Date(selectedOrg.created_at).toLocaleDateString(
                      'fr-FR'
                    )}
                  </p>
                </div>
                {selectedOrg.approved_at && (
                  <div>
                    <p className="text-sm text-gray-500">
                      {selectedOrg.approval_status === 'approved'
                        ? 'Approuvee le'
                        : 'Rejetee le'}
                    </p>
                    <p className="font-medium">
                      {new Date(selectedOrg.approved_at).toLocaleDateString(
                        'fr-FR'
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: OrganisationApprovalStatus }) {
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
