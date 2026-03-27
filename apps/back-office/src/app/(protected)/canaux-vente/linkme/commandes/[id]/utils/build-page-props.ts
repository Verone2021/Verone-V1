/**
 * Builders: prop objects for OrderPageColumns and OrderPageDialogs
 * Extracted to keep LinkMeOrderDetailPage under 75 lines.
 */

import type { NewContactFormData } from '../../../components/contacts/NewContactForm';
import type { MissingFieldsResult } from '../../../utils/order-missing-fields';

import type { OrderPageColumnsProps } from '../components/OrderPageColumns';
import type { OrderPageDialogsProps } from '../components/OrderPageDialogs';
import type {
  OrderWithDetails,
  ContactRole,
  FusedContactGroup,
  EnrichedOrderItem,
} from '../components/types';
import type { OrderPageData } from '../hooks/use-order-page-data';

interface ColumnsPropsInput {
  order: OrderWithDetails;
  enrichedItems: EnrichedOrderItem[];
  fusedContacts: FusedContactGroup[];
  missingFieldsResult: MissingFieldsResult | null;
  deliveryAddressMatchesOrg: boolean;
  data: OrderPageData;
}

export function buildColumnsProps({
  order,
  enrichedItems,
  fusedContacts,
  missingFieldsResult,
  deliveryAddressMatchesOrg,
  data,
}: ColumnsPropsInput): OrderPageColumnsProps {
  const { handlers, historyEvents, historyLoading, pageState: s } = data;
  return {
    order,
    details: order.linkmeDetails,
    enrichedItems,
    fusedContacts,
    missingFieldsResult,
    deliveryAddressMatchesOrg,
    updateDetailsIsPending: handlers.updateDetails.isPending,
    approveIsPending: handlers.approveOrder.isPending,
    historyEvents,
    historyLoading,
    onApprove: () => s.setShowApproveDialog(true),
    onRequestInfo: () => s.setShowRequestInfoDialog(true),
    onReject: () => s.setShowRejectDialog(true),
    onChangeContact: (role: ContactRole) => {
      s.setSelectedContactId(null);
      s.setContactDialogFor(role);
    },
    onEditDeliveryAddress: () => handlers.openEditDialog('delivery_address'),
    onEditDeliveryOptions: () => handlers.openEditDialog('delivery_options'),
    onChangeDeliveryContact: () => {
      s.setSelectedContactId(null);
      s.setContactDialogFor('delivery');
    },
    onUseOrgAddress: () => {
      void handlers.handleUseOrgAddress().catch((err: unknown) => {
        console.error('[LinkMeOrderDetail] Use org address failed:', err);
      });
    },
  };
}

type Handlers = OrderPageData['handlers'];
type PageState = OrderPageData['pageState'];

function makeVoidHandler(fn: () => Promise<void>, label: string) {
  return () => {
    void fn().catch(err => {
      console.error(`[LinkMeOrderDetail] ${label} failed:`, err);
    });
  };
}

interface DialogsPropsInput {
  order: OrderWithDetails;
  data: OrderPageData;
}

function buildContactProps(h: Handlers, s: PageState) {
  return {
    contactDialogFor: s.contactDialogFor,
    selectedContactId: s.selectedContactId,
    isContactSubmitting:
      h.createContactBO.isPending || h.updateDetails.isPending,
    onSelectContact: (id: string) => s.setSelectedContactId(id),
    onConfirmContact: makeVoidHandler(
      h.handleConfirmContact,
      'Confirm contact'
    ),
    onCreateAndSelectContact: (d: NewContactFormData) =>
      h.handleCreateAndSelectContact(d),
    onCloseContactDialog: () => {
      s.setContactDialogFor(null);
      s.setSelectedContactId(null);
    },
  };
}

function buildApprovalProps(
  h: Handlers,
  s: PageState,
  order: OrderWithDetails
) {
  return {
    showApproveDialog: s.showApproveDialog,
    onOpenChangeApprove: s.setShowApproveDialog,
    onConfirmApprove: makeVoidHandler(h.handleApprove, 'Approve'),
    approveIsPending: h.approveOrder.isPending,
    showRequestInfoDialog: s.showRequestInfoDialog,
    onOpenChangeRequestInfo: s.setShowRequestInfoDialog,
    order,
    details: order.linkmeDetails,
    createdByProfile: order.createdByProfile,
    requestMessage: s.requestMessage,
    setRequestMessage: s.setRequestMessage,
    selectedCategories: s.selectedCategories,
    setSelectedCategories: s.setSelectedCategories,
    selectedEmails: s.selectedEmails,
    setSelectedEmails: s.setSelectedEmails,
    onSendRequestInfo: makeVoidHandler(h.handleRequestInfo, 'Request info'),
    requestInfoIsPending: h.requestInfo.isPending,
    showRejectDialog: s.showRejectDialog,
    onOpenChangeReject: s.setShowRejectDialog,
    rejectReason: s.rejectReason,
    setRejectReason: s.setRejectReason,
    selectedRejectReason: s.selectedRejectReason,
    setSelectedRejectReason: s.setSelectedRejectReason,
    onReject: makeVoidHandler(h.handleReject, 'Reject'),
    rejectIsPending: h.rejectOrder.isPending,
  };
}

export function buildDialogsProps({
  order,
  data,
}: DialogsPropsInput): OrderPageDialogsProps {
  const { handlers: h, availableContacts, pageState: s } = data;
  return {
    availableContacts,
    ...buildContactProps(h, s),
    ...buildApprovalProps(h, s, order),
    editingStep: s.editingStep,
    editForm: s.editForm,
    setEditForm: s.setEditForm,
    organisation: order.organisation,
    orderStatus: order.status,
    updateDetailsIsPending: h.updateDetails.isPending,
    onCloseEdit: () => {
      s.setEditingStep(null);
      s.setEditForm({});
    },
    onSaveEdit: makeVoidHandler(h.handleSaveEdit, 'Save edit'),
  };
}
