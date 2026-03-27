'use client';

import { Loader2 } from 'lucide-react';

import { OrgStatusFilter, OrgEmptyState } from './organisations-tab-types';
import { OrgTable } from './organisations-tab-table';
import {
  OrgDetailDialog,
  OrgRejectDialog,
  OrgDeleteDialog,
} from './organisations-tab-dialogs';
import { useOrganisationsTab } from './use-organisations-tab';

// ============================================================================
// COMPONENT
// ============================================================================

export function OrganisationsTab() {
  const tab = useOrganisationsTab();

  return (
    <>
      <OrgStatusFilter
        selectedStatus={tab.selectedStatus}
        onStatusChange={tab.setSelectedStatus}
      />

      {tab.isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}

      {!tab.isLoading &&
        (!tab.organisations || tab.organisations.length === 0) && (
          <OrgEmptyState selectedStatus={tab.selectedStatus} />
        )}

      {!tab.isLoading && tab.organisations && tab.organisations.length > 0 && (
        <OrgTable
          organisations={tab.organisations}
          isApprovePending={tab.approveOrg.isPending}
          onViewDetails={tab.openDetail}
          onRejectClick={tab.handleRejectClick}
          onApprove={tab.handleApprove}
          onDeleteClick={tab.setDeleteTarget}
        />
      )}

      <OrgDetailDialog
        org={tab.selectedOrg}
        open={tab.isDetailOpen}
        onOpenChange={tab.setIsDetailOpen}
      />

      <OrgRejectDialog
        open={tab.isRejectDialogOpen}
        onOpenChange={tab.setIsRejectDialogOpen}
        rejectReason={tab.rejectReason}
        onRejectReasonChange={tab.setRejectReason}
        onConfirm={tab.handleRejectConfirm}
        isPending={tab.rejectOrg.isPending}
      />

      <OrgDeleteDialog
        target={tab.deleteTarget}
        isDeleting={tab.isDeleting}
        onCancel={() => tab.setDeleteTarget(null)}
        onConfirm={tab.handleDeleteOrg}
      />
    </>
  );
}
