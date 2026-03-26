'use client';

import { useState } from 'react';

import {
  useAllOrganisationsWithApproval,
  useApproveOrganisation,
  useRejectOrganisation,
  type PendingOrganisation,
  type OrganisationApprovalStatus,
} from '../../hooks/use-organisation-approvals';

import { deleteOrganisationFromDB } from './use-organisations-tab-handlers';

// ============================================================================
// STATE HOOK
// ============================================================================

function useOrgTabState() {
  const [selectedStatus, setSelectedStatus] = useState<
    OrganisationApprovalStatus | 'all'
  >('pending_validation');
  const [selectedOrg, setSelectedOrg] = useState<PendingOrganisation | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PendingOrganisation | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: organisations,
    isLoading,
    refetch,
  } = useAllOrganisationsWithApproval(
    selectedStatus === 'all' ? undefined : selectedStatus
  );
  const approveOrg = useApproveOrganisation();
  const rejectOrg = useRejectOrganisation();

  return {
    selectedStatus,
    setSelectedStatus,
    organisations,
    isLoading,
    refetch,
    approveOrg,
    rejectOrg,
    selectedOrg,
    setSelectedOrg,
    isDetailOpen,
    setIsDetailOpen,
    isRejectDialogOpen,
    setIsRejectDialogOpen,
    rejectReason,
    setRejectReason,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    setIsDeleting,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useOrganisationsTab() {
  const state = useOrgTabState();
  const {
    approveOrg,
    rejectOrg,
    refetch,
    selectedOrg,
    rejectReason,
    deleteTarget,
  } = state;

  const doRefetch = () => {
    void refetch().catch(err => {
      console.error('[Approbations] Refetch failed:', err);
    });
  };

  const handleApprove = (org: PendingOrganisation) => {
    void approveOrg
      .mutateAsync({ organisationId: org.id })
      .then(() => doRefetch())
      .catch(() => alert("Erreur lors de l'approbation"));
  };

  const handleRejectClick = (org: PendingOrganisation) => {
    state.setSelectedOrg(org);
    state.setRejectReason('');
    state.setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedOrg || !rejectReason.trim()) return;
    void rejectOrg
      .mutateAsync({
        organisationId: selectedOrg.id,
        reason: rejectReason.trim(),
      })
      .then(() => {
        state.setIsRejectDialogOpen(false);
        state.setSelectedOrg(null);
        doRefetch();
      })
      .catch(() => alert('Erreur lors du rejet'));
  };

  const handleDeleteOrg = () => {
    if (!deleteTarget) return;
    state.setIsDeleting(true);
    void deleteOrganisationFromDB(deleteTarget.id)
      .then(() => {
        state.setDeleteTarget(null);
        doRefetch();
      })
      .catch((err: unknown) => {
        console.error('[Approbations] Org delete failed:', err);
        alert("Erreur lors de la suppression de l'organisation");
      })
      .finally(() => state.setIsDeleting(false));
  };

  const openDetail = (org: PendingOrganisation) => {
    state.setSelectedOrg(org);
    state.setIsDetailOpen(true);
  };

  return {
    ...state,
    openDetail,
    handleApprove,
    handleRejectClick,
    handleRejectConfirm,
    handleDeleteOrg,
  };
}
