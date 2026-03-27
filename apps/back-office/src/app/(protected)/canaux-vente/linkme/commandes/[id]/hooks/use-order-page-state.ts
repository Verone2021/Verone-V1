/**
 * Hook: useOrderPageState
 *
 * Centralise tout le state local de la page detail commande LinkMe.
 */

import { useState } from 'react';

import type { MissingFieldCategory } from '../../../utils/order-missing-fields';
import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';

export type OrderPageState = ReturnType<typeof useOrderPageState>;

export function useOrderPageState() {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<
    Set<MissingFieldCategory>
  >(new Set());
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRejectReason, setSelectedRejectReason] = useState<
    string | null
  >(null);
  const [editingStep, setEditingStep] = useState<
    'responsable' | 'billing' | 'delivery_address' | 'delivery_options' | null
  >(null);
  const [editForm, setEditForm] = useState<Partial<LinkMeOrderDetails>>({});
  const [contactDialogFor, setContactDialogFor] = useState<
    'responsable' | 'billing' | 'delivery' | null
  >(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );

  return {
    showApproveDialog,
    setShowApproveDialog,
    showRequestInfoDialog,
    setShowRequestInfoDialog,
    showRejectDialog,
    setShowRejectDialog,
    requestMessage,
    setRequestMessage,
    selectedCategories,
    setSelectedCategories,
    selectedEmails,
    setSelectedEmails,
    rejectReason,
    setRejectReason,
    selectedRejectReason,
    setSelectedRejectReason,
    editingStep,
    setEditingStep,
    editForm,
    setEditForm,
    contactDialogFor,
    setContactDialogFor,
    selectedContactId,
    setSelectedContactId,
  };
}
