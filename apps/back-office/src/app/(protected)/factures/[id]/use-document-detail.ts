'use client';

import { useState, useMemo } from 'react';

import type { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { IInvoiceForCreditNote } from '@verone/finance';
import { createClient } from '@verone/utils/supabase/client';

import {
  type DocumentType,
  type QontoDocument,
  type QontoApiResponse,
  calculateTotalsFromItems,
} from './types';
import { useDocumentActions } from './use-document-actions';

interface UseDocumentDetailParams {
  id: string;
  typeParam: DocumentType | null;
  router: ReturnType<typeof useRouter>;
}

// Fetcher pour le document Qonto (API route) — fonction pure
async function fetchDocumentFromApi(
  id: string,
  typeParam: DocumentType | null
): Promise<{
  document: QontoDocument;
  documentType: DocumentType;
  orderLink: { sales_order_id: string; order_number: string | null } | null;
  partnerLegalName: string | null;
  partnerTradeName: string | null;
}> {
  const typesToTry: DocumentType[] = typeParam
    ? [typeParam]
    : ['invoice', 'quote', 'credit_note'];

  let lastError: string | null = null;

  for (const type of typesToTry) {
    const endpoint =
      type === 'invoice'
        ? `/api/qonto/invoices/${id}`
        : type === 'quote'
          ? `/api/qonto/quotes/${id}`
          : `/api/qonto/credit-notes/${id}`;

    const response = await fetch(endpoint);
    const data = (await response.json()) as QontoApiResponse;

    if (data.success) {
      const doc = data.invoice ?? data.quote ?? data.credit_note ?? null;
      if (doc) {
        let orderLink: {
          sales_order_id: string;
          order_number: string | null;
        } | null = null;
        let partnerLegalName: string | null = null;
        let partnerTradeName: string | null = null;

        if (type === 'invoice' && data.localData) {
          if (data.localData.sales_order_id) {
            orderLink = {
              sales_order_id: data.localData.sales_order_id,
              order_number: data.localData.order_number ?? null,
            };
          }
          if (data.localData.partner_legal_name) {
            partnerLegalName = data.localData.partner_legal_name;
            partnerTradeName = data.localData.partner_trade_name ?? null;
          }
        }

        return {
          document: doc,
          documentType: type,
          orderLink,
          partnerLegalName,
          partnerTradeName,
        };
      }
    }

    lastError =
      data.error ??
      `Réponse invalide pour ${type} (success=${String(data.success)})`;
    console.error(`[DocumentDetail] API error for ${type}/${id}:`, lastError);
  }

  throw new Error(lastError ?? 'Document non trouvé');
}

// Fetcher pour les données client liées à la commande — fonction pure
async function fetchOrderCustomerData(
  salesOrderId: string,
  supabase: ReturnType<typeof createClient>
): Promise<{
  organisationId: string | null;
  linkedOrderStatus: string | null;
  partnerLegalName: string | null;
  partnerTradeName: string | null;
  orderContacts: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}> {
  const { data } = await supabase
    .from('sales_orders')
    .select(
      'customer_id, status, billing_contact_id, responsable_contact_id, delivery_contact_id, customer:organisations!sales_orders_customer_id_fkey(legal_name, trade_name)'
    )
    .eq('id', salesOrderId)
    .single();

  if (!data) {
    return {
      organisationId: null,
      linkedOrderStatus: null,
      partnerLegalName: null,
      partnerTradeName: null,
      orderContacts: [],
    };
  }

  let partnerLegalName: string | null = null;
  let partnerTradeName: string | null = null;
  if (data.customer_id) {
    const org = data.customer as {
      legal_name: string | null;
      trade_name: string | null;
    } | null;
    if (org?.legal_name) {
      partnerLegalName = org.legal_name;
      partnerTradeName = org.trade_name ?? null;
    }
  }

  const contactIds = [
    data.billing_contact_id,
    data.responsable_contact_id,
    data.delivery_contact_id,
  ].filter((cid): cid is string => !!cid);

  const uniqueIds = [...new Set(contactIds)];
  let orderContacts: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }> = [];

  if (uniqueIds.length > 0) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select(
        'id, first_name, last_name, email, is_billing_contact, is_primary_contact'
      )
      .in('id', uniqueIds);

    if (contacts) {
      orderContacts = contacts
        .filter(c => !!c.email)
        .map(c => ({
          id: c.id,
          name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
          email: c.email,
          role:
            c.id === data.billing_contact_id
              ? 'Facturation'
              : c.id === data.responsable_contact_id
                ? 'Responsable'
                : 'Livraison',
        }));
    }
  }

  return {
    organisationId: data.customer_id ?? null,
    linkedOrderStatus: data.status ?? null,
    partnerLegalName,
    partnerTradeName,
    orderContacts,
  };
}

export function useDocumentDetail({
  id,
  typeParam,
  router,
}: UseDocumentDetailParams) {
  const supabase = useMemo(() => createClient(), []);

  // Dialog states (UI only — inchangés)
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showCreditNoteDialog, setShowCreditNoteDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAcceptQuoteGuard, setShowAcceptQuoteGuard] = useState(false);
  const [showFinalizeInvoiceGuard, setShowFinalizeInvoiceGuard] =
    useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // --- useQuery #1 : fetch du document Qonto via API route ---
  const {
    data: docData,
    isLoading,
    error: docError,
  } = useQuery({
    queryKey: ['financial_document', id, typeParam],
    queryFn: () => fetchDocumentFromApi(id, typeParam),
    staleTime: 60_000,
    enabled: !!id,
    retry: 1,
  });

  const document = docData?.document ?? null;
  const documentType: DocumentType =
    docData?.documentType ?? typeParam ?? 'invoice';
  const orderLink = docData?.orderLink ?? null;
  // Noms partenaire depuis localData (API route) — priorité sur ceux de la commande
  const apiPartnerLegalName = docData?.partnerLegalName ?? null;
  const apiPartnerTradeName = docData?.partnerTradeName ?? null;

  const loading = isLoading;
  const error = docError
    ? docError instanceof Error
      ? docError.message
      : 'Erreur lors du chargement du document'
    : null;

  // --- useQuery #2 : données client liées à la commande (dépend de orderLink) ---
  const { data: customerData } = useQuery({
    queryKey: ['document_order_customer', orderLink?.sales_order_id],
    queryFn: () => fetchOrderCustomerData(orderLink!.sales_order_id, supabase),
    enabled: !!orderLink?.sales_order_id,
    staleTime: 60_000,
  });

  // Résolution des noms partenaire : API route en priorité, puis commande
  const partnerLegalName =
    apiPartnerLegalName ?? customerData?.partnerLegalName ?? null;
  const partnerTradeName =
    apiPartnerTradeName ?? customerData?.partnerTradeName ?? null;
  const organisationId = customerData?.organisationId ?? null;
  const linkedOrderStatus = customerData?.linkedOrderStatus ?? null;
  const orderContacts = customerData?.orderContacts ?? [];

  // ===== ACTION HANDLERS =====

  const linkedDraftOrderNumber =
    linkedOrderStatus === 'draft' ? (orderLink?.order_number ?? null) : null;

  const actions = useDocumentActions({
    id,
    document,
    documentType,
    router,
    setActionLoading,
    setShowFinalizeDialog,
    setShowDeleteDialog,
    setShowConvertDialog,
    setShowAcceptDialog,
    setShowDeclineDialog,
    setShowArchiveDialog,
    setShowAcceptQuoteGuard,
    setShowFinalizeInvoiceGuard,
    linkedDraftOrderNumber,
  });

  // ===== COMPUTED VALUES =====

  const isDraft = document?.status === 'draft';
  const isFinalized =
    document?.status === 'finalized' ||
    document?.status === 'paid' ||
    document?.status === 'unpaid' ||
    document?.status === 'overdue' ||
    document?.status === 'pending';
  const isPaid = document?.status === 'paid';
  const isCancelled = document?.status === 'cancelled';
  const isOverdue =
    documentType === 'invoice' &&
    document?.payment_deadline &&
    new Date(document.payment_deadline) < new Date() &&
    !isPaid;

  const computedTotals = useMemo(() => {
    if (!document?.items || document.items.length === 0) {
      return {
        subtotalCents: document?.subtotal_amount_cents ?? 0,
        vatCents: document?.total_vat_amount_cents ?? 0,
        totalCents: document?.total_amount_cents ?? 0,
      };
    }
    if (
      document.subtotal_amount_cents !== undefined &&
      document.total_vat_amount_cents !== undefined
    ) {
      return {
        subtotalCents: document.subtotal_amount_cents,
        vatCents: document.total_vat_amount_cents,
        totalCents: document.total_amount_cents ?? 0,
      };
    }
    return calculateTotalsFromItems(document.items);
  }, [document]);

  const invoiceForCreditNote: IInvoiceForCreditNote | null =
    document && documentType === 'invoice'
      ? {
          id: document.id,
          invoice_number:
            document.invoice_number ?? document.number ?? document.id,
          status: document.status,
          total_amount:
            (document.total_amount_cents ?? computedTotals.totalCents) / 100,
          total_vat_amount:
            (document.total_vat_amount_cents ?? computedTotals.vatCents) / 100,
          subtotal_amount:
            (document.subtotal_amount_cents ?? computedTotals.subtotalCents) /
            100,
          currency: document.currency ?? 'EUR',
          client_id: document.client_id ?? '',
          client: document.client
            ? { name: document.client.name, email: document.client.email }
            : null,
          items: document.items?.map(item => ({
            title: item.title,
            description: item.description,
            quantity: parseFloat(item.quantity) || 1,
            unit: item.unit ?? 'piece',
            unit_price: parseFloat(item.unit_price?.value ?? '0'),
            vat_rate: parseFloat(item.vat_rate ?? '0'),
          })),
        }
      : null;

  return {
    // Data
    document,
    documentType,
    loading,
    error,
    orderLink,
    orderContacts,
    organisationId,
    partnerLegalName,
    partnerTradeName,
    // Computed
    isDraft,
    isFinalized,
    isPaid,
    isCancelled,
    isOverdue,
    computedTotals,
    invoiceForCreditNote,
    // Dialog states
    showFinalizeDialog,
    setShowFinalizeDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    showConvertDialog,
    setShowConvertDialog,
    showCreditNoteDialog,
    setShowCreditNoteDialog,
    showAcceptDialog,
    setShowAcceptDialog,
    showDeclineDialog,
    setShowDeclineDialog,
    showPaymentModal,
    setShowPaymentModal,
    showReconcileModal,
    setShowReconcileModal,
    showArchiveDialog,
    setShowArchiveDialog,
    showOrgModal,
    setShowOrgModal,
    showEmailModal,
    setShowEmailModal,
    showAcceptQuoteGuard,
    setShowAcceptQuoteGuard,
    showFinalizeInvoiceGuard,
    setShowFinalizeInvoiceGuard,
    linkedDraftOrderNumber,
    // Action state
    actionLoading,
    // Handlers (from useDocumentActions)
    ...actions,
  };
}
