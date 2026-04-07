import { useState, useMemo, useEffect } from 'react';

import type { ExistingLink } from '@verone/finance/components';
import { createClient } from '@verone/utils/supabase/client';

import type {
  PurchaseOrder,
  ManualPaymentType,
  OrderPayment,
} from '@verone/orders/hooks';
import { usePurchaseOrders, usePurchaseReceptions } from '@verone/orders/hooks';

import type {
  SupplierInvoice,
  LinkedTransaction,
  ReceptionHistoryItem,
  CancellationItem,
  PODetailState,
} from './types';

export type { PODetailState };

export function usePODetailState(
  order: PurchaseOrder | null,
  open: boolean,
  initialPaymentOpen: boolean,
  onUpdate?: () => void
): PODetailState {
  const [showReceivingModal, setShowReceivingModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [manualPaymentType, setManualPaymentType] =
    useState<ManualPaymentType>('card');
  const [manualPaymentAmount, setManualPaymentAmount] = useState('');
  const [manualPaymentDate, setManualPaymentDate] = useState('');
  const [manualPaymentRef, setManualPaymentRef] = useState('');
  const [manualPaymentNote, setManualPaymentNote] = useState('');

  const [orderPayments, setOrderPayments] = useState<OrderPayment[]>([]);
  const [existingLinks, setExistingLinks] = useState<ExistingLink[]>([]);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(
    null
  );
  const [showDeletePaymentConfirmation, setShowDeletePaymentConfirmation] =
    useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const [receptionHistory, setReceptionHistory] = useState<
    ReceptionHistoryItem[]
  >([]);
  const [cancellations, setCancellations] = useState<CancellationItem[]>([]);

  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [linkedTransactions, setLinkedTransactions] = useState<
    LinkedTransaction[]
  >([]);
  const [isLoadingFinance, setIsLoadingFinance] = useState(false);

  const supabase = createClient();

  const { markAsManuallyPaid, fetchOrderPayments, deleteManualPayment } =
    usePurchaseOrders();
  const { loadReceptionHistory, loadCancellationHistory } =
    usePurchaseReceptions();

  // Open payment dialog automatically when requested from action menu
  useEffect(() => {
    if (open && order?.id && initialPaymentOpen) {
      const orderTotal = Math.abs(order.total_ttc ?? 0);
      const alreadyPaid = order.paid_amount ?? 0;
      const remaining = Math.max(0, orderTotal - alreadyPaid);
      setManualPaymentType('card');
      setManualPaymentAmount(remaining.toFixed(2));
      setManualPaymentDate(
        (
          order.order_date ??
          order.created_at ??
          new Date().toISOString()
        ).split('T')[0]
      );
      setManualPaymentRef('');
      setManualPaymentNote('');
      setShowPaymentDialog(true);
      void fetchOrderPayments(order.id)
        .then(setOrderPayments)
        .catch(console.error);
    }
  }, [
    open,
    order?.id,
    initialPaymentOpen,
    order?.total_ttc,
    order?.paid_amount,
    order?.order_date,
    order?.created_at,
    fetchOrderPayments,
  ]);

  // Charger historique quand modal ouvert
  useEffect(() => {
    if (open && order?.id) {
      void loadReceptionHistory(order.id)
        .then(setReceptionHistory)
        .catch((err: unknown) => {
          console.error(
            '[PurchaseOrderDetailModal] Load reception history failed:',
            err
          );
        });
      void loadCancellationHistory(order.id)
        .then(setCancellations)
        .catch((err: unknown) => {
          console.error(
            '[PurchaseOrderDetailModal] Load cancellation history failed:',
            err
          );
        });
    }
  }, [open, order?.id, loadReceptionHistory, loadCancellationHistory]);

  // Charger paiements manuels dès l'ouverture du modal
  useEffect(() => {
    if (!open || !order?.id) return;
    void fetchOrderPayments(order.id)
      .then(setOrderPayments)
      .catch(console.error);
  }, [open, order?.id, fetchOrderPayments]);

  // Charger factures fournisseur et transactions liées
  useEffect(() => {
    if (!open || !order?.id) return;

    const loadFinanceData = async () => {
      setIsLoadingFinance(true);
      try {
        // Fetch supplier invoices via API
        const invoiceRes = await fetch(
          `/api/qonto/invoices/by-order/${order.id}`
        );
        if (invoiceRes.ok) {
          const invoiceData = (await invoiceRes.json()) as {
            success: boolean;
            invoices?: SupplierInvoice[];
          };
          if (invoiceData.success && invoiceData.invoices) {
            setInvoices(invoiceData.invoices);
          }
        }

        // Fetch linked transactions
        const { data: links } = await supabase
          .from('transaction_document_links')
          .select(
            `
            id,
            allocated_amount,
            bank_transactions (label, amount, settled_at, emitted_at)
          `
          )
          .eq('purchase_order_id', order.id);

        if (links) {
          setLinkedTransactions(links as unknown as LinkedTransaction[]);
        }
      } catch (err) {
        console.error(
          '[PurchaseOrderDetailModal] Finance data fetch failed:',
          err
        );
      } finally {
        setIsLoadingFinance(false);
      }
    };

    void loadFinanceData();
  }, [open, order?.id, supabase]);

  // ✅ Calcul éco-taxe totale en useMemo (performance)
  // L'écotaxe est TOUJOURS par unité, donc on multiplie par la quantité
  const totalEcoTax = useMemo(() => {
    return (
      order?.purchase_order_items?.reduce(
        (sum, item) => sum + (item.eco_tax ?? 0) * item.quantity,
        0
      ) ?? 0
    );
  }, [order?.purchase_order_items]);

  // Memoize order object for RapprochementContent BEFORE early return (Rules of Hooks)
  const rapprochementOrder = useMemo(() => {
    if (!order) return null;
    const supplierName = order.organisations
      ? (order.organisations.trade_name ?? order.organisations.legal_name)
      : 'Fournisseur inconnu';
    return {
      id: order.id,
      order_number: order.po_number ?? '',
      customer_name: supplierName,
      customer_name_alt:
        order.organisations?.trade_name &&
        order.organisations?.legal_name !== order.organisations?.trade_name
          ? order.organisations.legal_name
          : null,
      total_ttc:
        order.total_ttc ??
        (order.total_ht ?? 0) * (1 + (order.tax_rate ?? 0.2)),
      paid_amount: order.paid_amount ?? 0,
      created_at: order.created_at,
      order_date: order.order_date ?? null,
      shipped_at: null,
      payment_status_v2: order.payment_status_v2,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    order?.id,
    order?.po_number,
    order?.total_ttc,
    order?.total_ht,
    order?.tax_rate,
    order?.paid_amount,
    order?.created_at,
    order?.order_date,
    order?.payment_status_v2,
    order?.organisations,
  ]);

  const formatDate = (date: string | null) => {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getSupplierName = () => {
    if (order?.organisations) {
      return order.organisations.trade_name ?? order.organisations.legal_name;
    }
    return 'Fournisseur inconnu';
  };

  const canMarkAsPaid =
    order !== null &&
    order.status !== 'draft' &&
    order.payment_status_v2 !== 'paid';

  const manualTotal = orderPayments.reduce((sum, p) => sum + p.amount, 0);
  // PO links have negative allocated_amount (bank debits) — use ABS for payment total
  const linksTotal = existingLinks.reduce(
    (sum, l) => sum + Math.abs(l.allocated_amount),
    0
  );
  const totalPaid = manualTotal + linksTotal;
  const orderTotalTtc = Math.abs(order?.total_ttc ?? 0);
  const unifiedRemaining = Math.max(0, orderTotalTtc - totalPaid);
  const isFullyPaid = totalPaid >= orderTotalTtc && orderTotalTtc > 0;

  const refreshPayments = () => {
    if (!order?.id) return;
    void fetchOrderPayments(order.id)
      .then(setOrderPayments)
      .catch(console.error);
    onUpdate?.();
  };

  const handleDeletePayment = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setShowDeletePaymentConfirmation(true);
  };

  const handleDeletePaymentConfirmed = () => {
    if (!paymentToDelete) return;
    setDeletingPaymentId(paymentToDelete);
    void deleteManualPayment(paymentToDelete)
      .then(() => {
        refreshPayments();
      })
      .catch(console.error)
      .finally(() => {
        setDeletingPaymentId(null);
        setShowDeletePaymentConfirmation(false);
        setPaymentToDelete(null);
      });
  };

  const openPaymentDialog = () => {
    setManualPaymentType('card');
    setManualPaymentAmount(
      unifiedRemaining > 0
        ? unifiedRemaining.toFixed(2)
        : orderTotalTtc.toFixed(2)
    );
    setManualPaymentDate(
      (
        order?.order_date ??
        order?.created_at ??
        new Date().toISOString()
      ).split('T')[0]
    );
    setManualPaymentRef('');
    setManualPaymentNote('');
    setShowPaymentDialog(true);
    if (order?.id) {
      void fetchOrderPayments(order.id)
        .then(setOrderPayments)
        .catch(console.error);
    }
  };

  // ✅ Workflow Achats: Permettre réception pour validated + partially_received
  const canReceive =
    order !== null &&
    ['validated', 'partially_received'].includes(order.status);

  // ✅ Récupérer payment_terms depuis organisation si non défini sur commande
  const paymentTerms =
    order?.payment_terms ?? order?.organisations?.payment_terms ?? null;

  return {
    showReceivingModal,
    setShowReceivingModal,
    showOrgModal,
    setShowOrgModal,
    showPaymentDialog,
    setShowPaymentDialog,
    paymentSubmitting,
    setPaymentSubmitting,
    manualPaymentType,
    setManualPaymentType,
    manualPaymentAmount,
    setManualPaymentAmount,
    manualPaymentDate,
    setManualPaymentDate,
    manualPaymentRef,
    setManualPaymentRef,
    manualPaymentNote,
    setManualPaymentNote,
    orderPayments,
    setOrderPayments,
    existingLinks,
    setExistingLinks,
    deletingPaymentId,
    setDeletingPaymentId,
    showDeletePaymentConfirmation,
    setShowDeletePaymentConfirmation,
    paymentToDelete,
    setPaymentToDelete,
    receptionHistory,
    cancellations,
    invoices,
    linkedTransactions,
    isLoadingFinance,
    totalEcoTax,
    rapprochementOrder,
    manualTotal,
    linksTotal,
    totalPaid,
    orderTotalTtc,
    unifiedRemaining,
    isFullyPaid,
    formatDate,
    getSupplierName,
    canMarkAsPaid,
    canReceive,
    paymentTerms,
    refreshPayments,
    handleDeletePayment,
    handleDeletePaymentConfirmed,
    openPaymentDialog,
    markAsManuallyPaid,
  };
}
