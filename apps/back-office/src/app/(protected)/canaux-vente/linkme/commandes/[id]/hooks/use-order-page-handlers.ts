/**
 * Hook: useOrderPageHandlers
 *
 * Aggregateur des handlers de la page detail commande LinkMe.
 * Delegue aux sous-hooks specialises : useWorkflowActions + useEditContactActions.
 */

import type { OrderWithDetails } from '../components/types';
import type { OrderPageState } from './use-order-page-state';
import { useWorkflowActions } from './use-workflow-actions';
import { useEditContactActions } from './use-edit-contact-actions';

// ============================================
// PARAMS TYPE
// ============================================

export interface UseOrderPageHandlersParams {
  orderId: string;
  order: OrderWithDetails | null;
  isSuccursale: boolean;
  organisationId: string | null;
  enseigneId: string | null;
  pageState: OrderPageState;
  refetch: () => void;
}

// ============================================
// HOOK
// ============================================

export function useOrderPageHandlers(p: UseOrderPageHandlersParams) {
  const s = p.pageState;

  const workflow = useWorkflowActions({
    orderId: p.orderId,
    order: p.order,
    requestMessage: s.requestMessage,
    selectedEmails: s.selectedEmails,
    rejectReason: s.rejectReason,
    setShowApproveDialog: s.setShowApproveDialog,
    setShowRequestInfoDialog: s.setShowRequestInfoDialog,
    setShowRejectDialog: s.setShowRejectDialog,
    setRequestMessage: s.setRequestMessage,
    setSelectedCategories: s.setSelectedCategories,
    setSelectedEmails: s.setSelectedEmails,
    setRejectReason: s.setRejectReason,
    setSelectedRejectReason: s.setSelectedRejectReason,
    refetch: p.refetch,
  });

  const editContact = useEditContactActions({
    orderId: p.orderId,
    order: p.order,
    isSuccursale: p.isSuccursale,
    organisationId: p.organisationId,
    enseigneId: p.enseigneId,
    editingStep: s.editingStep,
    editForm: s.editForm,
    contactDialogFor: s.contactDialogFor,
    selectedContactId: s.selectedContactId,
    setEditingStep: s.setEditingStep,
    setEditForm: s.setEditForm,
    setContactDialogFor: s.setContactDialogFor,
    setSelectedContactId: s.setSelectedContactId,
    refetch: p.refetch,
  });

  return {
    approveOrder: workflow.approveOrder,
    requestInfo: workflow.requestInfo,
    rejectOrder: workflow.rejectOrder,
    handleApprove: workflow.handleApprove,
    handleRequestInfo: workflow.handleRequestInfo,
    handleReject: workflow.handleReject,
    updateDetails: editContact.updateDetails,
    createContactBO: editContact.createContactBO,
    openEditDialog: editContact.openEditDialog,
    handleSaveEdit: editContact.handleSaveEdit,
    handleConfirmContact: editContact.handleConfirmContact,
    handleCreateAndSelectContact: editContact.handleCreateAndSelectContact,
    handleUseOrgAddress: editContact.handleUseOrgAddress,
  };
}
