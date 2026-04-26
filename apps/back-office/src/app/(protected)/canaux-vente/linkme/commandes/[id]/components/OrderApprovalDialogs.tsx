'use client';

/**
 * OrderApprovalDialogs — dialogs Approuver / Demander infos / Refuser
 */

import type { MissingFieldCategory } from '../../../utils/order-missing-fields';
import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';

import {
  ApproveDialog,
  RequestInfoDialog,
  RejectDialog,
} from './ApprovalActionDialogs';

import type { OrderWithDetails, CreatedByProfile } from './types';

interface OrderApprovalDialogsProps {
  showApproveDialog: boolean;
  onOpenChangeApprove: (v: boolean) => void;
  onConfirmApprove: () => void;
  approveIsPending: boolean;
  showRequestInfoDialog: boolean;
  onOpenChangeRequestInfo: (v: boolean) => void;
  order: OrderWithDetails;
  details: LinkMeOrderDetails | null;
  createdByProfile: CreatedByProfile | null;
  requestMessage: string;
  setRequestMessage: (v: string) => void;
  selectedCategories: Set<MissingFieldCategory>;
  setSelectedCategories: (v: Set<MissingFieldCategory>) => void;
  selectedEmails: string[];
  setSelectedEmails: (v: string[]) => void;
  onSendRequestInfo: () => void;
  requestInfoIsPending: boolean;
  showRejectDialog: boolean;
  onOpenChangeReject: (v: boolean) => void;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  selectedRejectReason: string | null;
  setSelectedRejectReason: (v: string | null) => void;
  onReject: () => void;
  rejectIsPending: boolean;
}

export function OrderApprovalDialogs({
  showApproveDialog,
  onOpenChangeApprove,
  onConfirmApprove,
  approveIsPending,
  showRequestInfoDialog,
  onOpenChangeRequestInfo,
  order,
  details,
  createdByProfile,
  requestMessage,
  setRequestMessage,
  selectedCategories,
  setSelectedCategories,
  selectedEmails,
  setSelectedEmails,
  onSendRequestInfo,
  requestInfoIsPending,
  showRejectDialog,
  onOpenChangeReject,
  rejectReason,
  setRejectReason,
  selectedRejectReason,
  setSelectedRejectReason,
  onReject,
  rejectIsPending,
}: OrderApprovalDialogsProps) {
  return (
    <>
      <ApproveDialog
        open={showApproveDialog}
        onOpenChange={onOpenChangeApprove}
        onConfirm={onConfirmApprove}
        isPending={approveIsPending}
      />

      <RequestInfoDialog
        open={showRequestInfoDialog}
        onOpenChange={onOpenChangeRequestInfo}
        order={order}
        details={details}
        createdByProfile={createdByProfile}
        excludeCreator={createdByProfile?.is_back_office === true}
        requestMessage={requestMessage}
        setRequestMessage={setRequestMessage}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedEmails={selectedEmails}
        setSelectedEmails={setSelectedEmails}
        onSend={onSendRequestInfo}
        isPending={requestInfoIsPending}
      />

      <RejectDialog
        open={showRejectDialog}
        onOpenChange={onOpenChangeReject}
        details={details}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        selectedRejectReason={selectedRejectReason}
        setSelectedRejectReason={setSelectedRejectReason}
        onReject={onReject}
        isPending={rejectIsPending}
      />
    </>
  );
}
