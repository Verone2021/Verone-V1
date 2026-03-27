'use client';

/**
 * OrderPageDialogs — tous les modals de la page detail commande LinkMe
 */

import type { Dispatch, SetStateAction } from 'react';

import type { MissingFieldCategory } from '../../../utils/order-missing-fields';
import type { NewContactFormData } from '../../../components/contacts/NewContactForm';
import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';
import type { ContactBO } from '../../../hooks/use-organisation-contacts-bo';

import { ContactSelectionDialog } from './ContactSelectionDialog';
import { EditDialogs } from './EditDialogs';
import { OrderApprovalDialogs } from './OrderApprovalDialogs';

import type { OrderWithDetails, CreatedByProfile } from './types';

export interface OrderPageDialogsProps {
  contactDialogFor: 'responsable' | 'billing' | 'delivery' | null;
  selectedContactId: string | null;
  availableContacts: ContactBO[];
  isContactSubmitting: boolean;
  onSelectContact: (id: string) => void;
  onConfirmContact: () => void;
  onCreateAndSelectContact: (data: NewContactFormData) => Promise<void>;
  onCloseContactDialog: () => void;
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
  editingStep:
    | 'responsable'
    | 'billing'
    | 'delivery_address'
    | 'delivery_options'
    | null;
  editForm: Partial<LinkMeOrderDetails>;
  setEditForm: Dispatch<SetStateAction<Partial<LinkMeOrderDetails>>>;
  organisation: OrderWithDetails['organisation'];
  orderStatus: string;
  updateDetailsIsPending: boolean;
  onCloseEdit: () => void;
  onSaveEdit: () => void;
}

export function OrderPageDialogs(p: OrderPageDialogsProps) {
  return (
    <>
      <ContactSelectionDialog
        contactDialogFor={p.contactDialogFor}
        selectedContactId={p.selectedContactId}
        availableContacts={p.availableContacts}
        isSubmitting={p.isContactSubmitting}
        onSelectContact={p.onSelectContact}
        onConfirm={p.onConfirmContact}
        onCreateAndSelect={p.onCreateAndSelectContact}
        onClose={p.onCloseContactDialog}
      />
      <OrderApprovalDialogs
        showApproveDialog={p.showApproveDialog}
        onOpenChangeApprove={p.onOpenChangeApprove}
        onConfirmApprove={p.onConfirmApprove}
        approveIsPending={p.approveIsPending}
        showRequestInfoDialog={p.showRequestInfoDialog}
        onOpenChangeRequestInfo={p.onOpenChangeRequestInfo}
        order={p.order}
        details={p.details}
        createdByProfile={p.createdByProfile}
        requestMessage={p.requestMessage}
        setRequestMessage={p.setRequestMessage}
        selectedCategories={p.selectedCategories}
        setSelectedCategories={p.setSelectedCategories}
        selectedEmails={p.selectedEmails}
        setSelectedEmails={p.setSelectedEmails}
        onSendRequestInfo={p.onSendRequestInfo}
        requestInfoIsPending={p.requestInfoIsPending}
        showRejectDialog={p.showRejectDialog}
        onOpenChangeReject={p.onOpenChangeReject}
        rejectReason={p.rejectReason}
        setRejectReason={p.setRejectReason}
        selectedRejectReason={p.selectedRejectReason}
        setSelectedRejectReason={p.setSelectedRejectReason}
        onReject={p.onReject}
        rejectIsPending={p.rejectIsPending}
      />
      <EditDialogs
        editingStep={p.editingStep}
        editForm={p.editForm}
        setEditForm={p.setEditForm}
        organisation={p.organisation}
        orderStatus={p.orderStatus}
        updateDetailsIsPending={p.updateDetailsIsPending}
        onClose={p.onCloseEdit}
        onSave={p.onSaveEdit}
      />
    </>
  );
}
