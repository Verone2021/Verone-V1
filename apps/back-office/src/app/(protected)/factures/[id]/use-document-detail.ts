'use client';

import { useState, useEffect, useMemo } from 'react';

import type { useRouter } from 'next/navigation';

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

export function useDocumentDetail({
  id,
  typeParam,
  router,
}: UseDocumentDetailParams) {
  const [document, setDocument] = useState<QontoDocument | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(
    typeParam ?? 'invoice'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [orderLink, setOrderLink] = useState<{
    sales_order_id: string;
    order_number: string | null;
  } | null>(null);

  // Contacts from linked sales order (for email sending)
  const [orderContacts, setOrderContacts] = useState<
    Array<{ id: string; name: string; email: string; role: string }>
  >([]);

  // Dialog states
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
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [partnerLegalName, setPartnerLegalName] = useState<string | null>(null);
  const [partnerTradeName, setPartnerTradeName] = useState<string | null>(null);
  // Status of the linked sales order (loaded alongside customer data)
  const [linkedOrderStatus, setLinkedOrderStatus] = useState<string | null>(
    null
  );

  // Fetch document data
  useEffect(() => {
    async function fetchDocument() {
      setLoading(true);
      setError(null);

      // Try to fetch based on type param or auto-detect
      const typesToTry: DocumentType[] = typeParam
        ? [typeParam]
        : ['invoice', 'quote', 'credit_note'];

      let lastError: string | null = null;

      for (const type of typesToTry) {
        try {
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
              setDocument(doc);
              setDocumentType(type);
              if (type === 'invoice' && data.localData) {
                if (data.localData.sales_order_id) {
                  setOrderLink({
                    sales_order_id: data.localData.sales_order_id,
                    order_number: data.localData.order_number ?? null,
                  });
                }
                if (data.localData.partner_legal_name) {
                  setPartnerLegalName(data.localData.partner_legal_name);
                  setPartnerTradeName(
                    data.localData.partner_trade_name ?? null
                  );
                }
              }
              setLoading(false);
              return;
            }
          }

          lastError =
            data.error ??
            `Réponse invalide pour ${type} (success=${String(data.success)})`;
          console.error(
            `[DocumentDetail] API error for ${type}/${id}:`,
            lastError
          );
        } catch (fetchError) {
          lastError =
            fetchError instanceof Error ? fetchError.message : 'Erreur réseau';
          console.error(
            `[DocumentDetail] Fetch failed for ${type}/${id}:`,
            fetchError
          );
        }
      }

      setError(lastError ?? 'Document non trouvé');
      setLoading(false);
    }

    void fetchDocument().catch(error => {
      console.error('[DocumentDetail] Fetch failed:', error);
    });
  }, [id, typeParam]);

  // Resolve organisation ID and names from linked sales order
  useEffect(() => {
    if (!orderLink?.sales_order_id) return;

    const supabase = createClient();
    const loadCustomerData = async () => {
      const { data } = await supabase
        .from('sales_orders')
        .select(
          'customer_id, status, customer:organisations!sales_orders_customer_id_fkey(legal_name, trade_name)'
        )
        .eq('id', orderLink.sales_order_id)
        .single();

      if (data?.customer_id) {
        setOrganisationId(data.customer_id);
        setLinkedOrderStatus(data.status ?? null);

        // Set org names if not already populated from localData
        if (!partnerLegalName) {
          const org = data.customer as {
            legal_name: string | null;
            trade_name: string | null;
          } | null;
          if (org?.legal_name) {
            setPartnerLegalName(org.legal_name);
            setPartnerTradeName(org.trade_name ?? null);
          }
        }
      }

      // Load contacts linked to the sales order
      const { data: orderData } = await supabase
        .from('sales_orders')
        .select(
          'billing_contact_id, responsable_contact_id, delivery_contact_id'
        )
        .eq('id', orderLink.sales_order_id)
        .single();

      if (orderData) {
        const contactIds = [
          orderData.billing_contact_id,
          orderData.responsable_contact_id,
          orderData.delivery_contact_id,
        ].filter((cid): cid is string => !!cid);

        const uniqueIds = [...new Set(contactIds)];
        if (uniqueIds.length > 0) {
          const { data: contacts } = await supabase
            .from('contacts')
            .select(
              'id, first_name, last_name, email, is_billing_contact, is_primary_contact'
            )
            .in('id', uniqueIds);

          if (contacts) {
            const mapped = contacts
              .filter(c => !!c.email)
              .map(c => ({
                id: c.id,
                name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
                email: c.email,
                role:
                  c.id === orderData.billing_contact_id
                    ? 'Facturation'
                    : c.id === orderData.responsable_contact_id
                      ? 'Responsable'
                      : 'Livraison',
              }));
            setOrderContacts(mapped);
          }
        }
      }
    };

    void loadCustomerData().catch((err: unknown) => {
      console.error('[DocumentDetail] Failed to load customer data:', err);
    });
  }, [orderLink, partnerLegalName]);

  // ===== ACTION HANDLERS =====

  // Derived: is the linked order a draft?
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

  // Calculate totals from items if API doesn't provide them
  const computedTotals = useMemo(() => {
    if (!document?.items || document.items.length === 0) {
      return {
        subtotalCents: document?.subtotal_amount_cents ?? 0,
        vatCents: document?.total_vat_amount_cents ?? 0,
        totalCents: document?.total_amount_cents ?? 0,
      };
    }
    // If API provides the values, use them; otherwise calculate
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
    // Calculate from items
    return calculateTotalsFromItems(document.items);
  }, [document]);

  // Build invoice data for CreditNoteCreateModal
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
    linkedDraftOrderNumber,
    // Action state
    actionLoading,
    // Handlers (from useDocumentActions)
    ...actions,
  };
}
