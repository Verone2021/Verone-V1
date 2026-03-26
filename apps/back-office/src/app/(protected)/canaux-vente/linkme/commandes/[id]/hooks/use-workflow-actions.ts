/**
 * Hook: useWorkflowActions
 * Approve / Request info / Reject handlers
 */

import {
  useApproveOrder,
  useRequestInfo,
  useRejectOrder,
  type LinkMeOrderDetails,
} from '../../../hooks/use-linkme-order-actions';

import {
  getOrderMissingFields,
  type MissingField,
  type MissingFieldCategory,
} from '../../../utils/order-missing-fields';
import type { OrderWithDetails } from '../components/types';

// ============================================
// STANDALONE HELPERS (outside hook = 0 fn lines)
// ============================================

function buildMissingFieldsPayload(
  order: OrderWithDetails | null,
  details: LinkMeOrderDetails | null
): MissingField[] {
  return getOrderMissingFields({
    details,
    organisationSiret: order?.organisation?.siret,
    organisationCountry: order?.organisation?.country,
    organisationVatNumber: order?.organisation?.vat_number,
    ownerType: details?.owner_type,
    organisationAddress: order?.organisation?.address_line1,
    organisationBillingAddress: order?.organisation?.billing_address_line1,
  }).fields;
}

interface UseWorkflowActionsParams {
  orderId: string;
  order: OrderWithDetails | null;
  requestMessage: string;
  selectedEmails: string[];
  rejectReason: string;
  setShowApproveDialog: (v: boolean) => void;
  setShowRequestInfoDialog: (v: boolean) => void;
  setShowRejectDialog: (v: boolean) => void;
  setRequestMessage: (v: string) => void;
  setSelectedCategories: (v: Set<MissingFieldCategory>) => void;
  setSelectedEmails: (v: string[]) => void;
  setRejectReason: (v: string) => void;
  setSelectedRejectReason: (v: string | null) => void;
  refetch: () => void;
}

export function useWorkflowActions(p: UseWorkflowActionsParams) {
  const approveOrder = useApproveOrder();
  const requestInfo = useRequestInfo();
  const rejectOrder = useRejectOrder();

  const handleApprove = async () => {
    try {
      await approveOrder.mutateAsync({ orderId: p.orderId });
      p.setShowApproveDialog(false);
      p.refetch();
    } catch (err) {
      console.error('[useWorkflowActions] Erreur approbation:', err);
    }
  };

  const handleRequestInfo = async () => {
    if (!p.requestMessage.trim()) return;
    const details = p.order?.linkmeDetails ?? null;
    const missingFields = buildMissingFieldsPayload(p.order, details);
    try {
      await requestInfo.mutateAsync({
        orderId: p.orderId,
        customMessage: p.requestMessage || undefined,
        missingFields: missingFields.map(f => ({
          key: f.key,
          label: f.label,
          category: f.category,
          inputType: f.inputType,
        })),
        recipientEmails:
          p.selectedEmails.length > 0 ? p.selectedEmails : undefined,
      });
      p.setShowRequestInfoDialog(false);
      p.setRequestMessage('');
      p.setSelectedCategories(new Set());
      p.setSelectedEmails([]);
      p.refetch();
    } catch (err) {
      console.error('[useWorkflowActions] Erreur demande info:', err);
    }
  };

  const handleReject = async () => {
    if (!p.rejectReason.trim()) return;
    try {
      await rejectOrder.mutateAsync({
        orderId: p.orderId,
        reason: p.rejectReason,
      });
      p.setShowRejectDialog(false);
      p.setRejectReason('');
      p.setSelectedRejectReason(null);
      p.refetch();
    } catch (err) {
      console.error('[useWorkflowActions] Erreur refus:', err);
    }
  };

  return {
    approveOrder,
    requestInfo,
    rejectOrder,
    handleApprove,
    handleRequestInfo,
    handleReject,
  };
}
