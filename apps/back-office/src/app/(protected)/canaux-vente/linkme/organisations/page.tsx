'use client';

import { useState } from 'react';

import { Building2, Clock, Filter, CheckCircle, XCircle } from 'lucide-react';

import {
  usePendingOrganisationsCount,
  useAllOrganisationsWithApproval,
  useApproveOrganisation,
  useRejectOrganisation,
  type PendingOrganisation,
  type OrganisationApprovalStatus,
} from '../hooks/use-organisation-approvals';

import { ApproveDialog } from './_components/ApproveDialog';
import { DetailDialog } from './_components/DetailDialog';
import { OrganisationsTable } from './_components/OrganisationsTable';
import { RejectDialog } from './_components/RejectDialog';

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

  const handleApproveConfirm = () => {
    if (!selectedOrg) return;
    void approveOrganisation
      .mutateAsync({ organisationId: selectedOrg.id })
      .then(() => {
        setIsApproveDialogOpen(false);
        setSelectedOrg(null);
        void refetch().catch(error => {
          console.error(
            '[OrganisationsPage] refetch after approve failed:',
            error
          );
        });
      })
      .catch(() => {
        alert("Erreur lors de l'approbation");
      });
  };

  const handleRejectClick = (org: PendingOrganisation) => {
    setSelectedOrg(org);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedOrg || !rejectReason.trim()) return;
    void rejectOrganisation
      .mutateAsync({
        organisationId: selectedOrg.id,
        reason: rejectReason.trim(),
      })
      .then(() => {
        setIsRejectDialogOpen(false);
        setSelectedOrg(null);
        void refetch().catch(error => {
          console.error(
            '[OrganisationsPage] refetch after reject failed:',
            error
          );
        });
      })
      .catch(() => {
        alert('Erreur lors du rejet');
      });
  };

  const handleViewDetails = (org: PendingOrganisation) => {
    setSelectedOrg(org);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-6">
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

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

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

      {!isLoading && organisations && organisations.length > 0 && (
        <OrganisationsTable
          organisations={organisations}
          onViewDetails={handleViewDetails}
          onApprove={handleApproveClick}
          onReject={handleRejectClick}
        />
      )}

      <ApproveDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        organisation={selectedOrg}
        isPending={approveOrganisation.isPending}
        onConfirm={handleApproveConfirm}
      />

      <RejectDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        isPending={rejectOrganisation.isPending}
        onConfirm={handleRejectConfirm}
      />

      <DetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        organisation={selectedOrg}
      />
    </div>
  );
}
