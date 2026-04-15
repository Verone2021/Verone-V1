'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import { useSearchParams } from 'next/navigation';

import { useSalesOrders } from '@verone/orders/hooks';
import type { SalesOrder } from '@verone/orders/hooks';
import {
  useMissingInvoices,
  type TransactionMissingInvoice,
} from '@verone/finance';
import {
  type TransactionForUpload,
  type OrderForLink,
} from '@verone/finance/components';
import { toast } from 'sonner';

import type {
  TabType,
  Invoice,
  ApiResponse,
  ConsolidateReport,
} from '../components/types';
import { VALID_TABS } from '../components/types';
import { useFacturesFetch } from './use-factures-fetch';
import type { FacturesFetchState } from './use-factures-fetch';

export type FacturesPageState = FacturesFetchState & {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  showUploadModal: boolean;
  setShowUploadModal: (v: boolean) => void;
  selectedMissingTx: TransactionMissingInvoice | null;
  transactionForUpload: TransactionForUpload | null;
  handleOpenUpload: (tx: TransactionMissingInvoice) => void;
  fetchInvoices: () => void;
  fetchQontoQuotes: () => void;
  fetchCreditNotes: () => void;
  kpis: FacturesKpis;
  missingInvoices: TransactionMissingInvoice[];
  loadingMissing: boolean;
  errorMissing: string | null;
  refreshMissing: () => Promise<void>;
  missingCount: number;
  selectedOrderForModal: SalesOrder | null;
  showOrderModal: boolean;
  setShowOrderModal: (v: boolean) => void;
  setSelectedOrderForModal: (o: SalesOrder | null) => void;
  handleOpenOrderModal: (orderId: string) => void;
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  showOrgModal: boolean;
  setShowOrgModal: (v: boolean) => void;
  showRapprochementModal: boolean;
  setShowRapprochementModal: (v: boolean) => void;
  rapprochementOrder: OrderForLink | null;
  setRapprochementOrder: (o: OrderForLink | null) => void;
  handleRapprochement: (invoice: Invoice) => void;
  isConsolidating: boolean;
  handleConsolidate: () => void;
  handleSync: () => void;
  handleView: (id: string, type?: 'invoice' | 'quote' | 'credit_note') => void;
};

export interface FacturesKpis {
  totalFacture: number;
  totalPaye: number;
  nombreFacturesActives: number;
  enAttente: number;
  montantEnAttente: number;
  enRetard: number;
  montantEnRetard: number;
}

export function useFacturesPage(): FacturesPageState {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'factures'
  );

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType | null;
    if (tab && VALID_TABS.includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  const fetchState = useFacturesFetch();
  const {
    invoices,
    qontoQuotes,
    creditNotes,
    fetchInvoicesAsync,
    fetchQontoQuotesAsync,
    fetchCreditNotesAsync,
  } = fetchState;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMissingTx, setSelectedMissingTx] =
    useState<TransactionMissingInvoice | null>(null);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] =
    useState<SalesOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showRapprochementModal, setShowRapprochementModal] = useState(false);
  const [rapprochementOrder, setRapprochementOrder] =
    useState<OrderForLink | null>(null);

  const { fetchOrder } = useSalesOrders();
  const {
    transactions: missingInvoices,
    loading: loadingMissing,
    error: errorMissing,
    refresh: refreshMissing,
    count: missingCount,
  } = useMissingInvoices();

  useEffect(() => {
    void fetchInvoicesAsync();
  }, []);

  useEffect(() => {
    if (activeTab === 'factures' && invoices.length === 0)
      void fetchInvoicesAsync();
    else if (activeTab === 'devis' && qontoQuotes.length === 0)
      void fetchQontoQuotesAsync();
    else if (activeTab === 'avoirs' && creditNotes.length === 0)
      void fetchCreditNotesAsync();
  }, [activeTab, invoices.length, qontoQuotes.length, creditNotes.length]);

  const transactionForUpload: TransactionForUpload | null = useMemo(() => {
    if (!selectedMissingTx) return null;
    return {
      id: selectedMissingTx.id,
      transaction_id: selectedMissingTx.transaction_id,
      label: selectedMissingTx.label,
      counterparty_name: selectedMissingTx.counterparty_name,
      amount: selectedMissingTx.amount,
      currency: selectedMissingTx.currency,
      emitted_at: selectedMissingTx.emitted_at,
      has_attachment: selectedMissingTx.has_attachment,
      matched_document_id: selectedMissingTx.matched_document_id,
      order_number: selectedMissingTx.order_number,
    };
  }, [selectedMissingTx]);

  const handleOpenUpload = (tx: TransactionMissingInvoice): void => {
    setSelectedMissingTx(tx);
    setShowUploadModal(true);
  };

  const kpis = useMemo((): FacturesKpis => {
    const isAnnulee = (status: string) =>
      status === 'cancelled' || status === 'canceled';
    const facturesActives = invoices.filter(
      inv => !isAnnulee(inv.status) && inv.status !== 'draft'
    );
    const totalFacture =
      facturesActives.reduce(
        (sum, inv) => sum + (inv.total_amount_cents ?? 0),
        0
      ) / 100;
    const totalPaye =
      invoices
        .filter(inv => inv.status === 'paid' || inv.status === 'partially_paid')
        .reduce(
          (sum, inv) =>
            sum +
            (inv.local_amount_paid != null
              ? inv.local_amount_paid * 100
              : (inv.total_amount_cents ?? 0)),
          0
        ) / 100;
    const enRetard = invoices.filter(
      inv =>
        inv.due_date &&
        new Date(inv.due_date) < new Date() &&
        inv.status !== 'paid' &&
        !isAnnulee(inv.status)
    );
    const enAttente = invoices.filter(
      inv =>
        inv.status !== 'paid' &&
        !isAnnulee(inv.status) &&
        inv.status !== 'draft'
    );
    return {
      totalFacture,
      totalPaye,
      nombreFacturesActives: facturesActives.length,
      enAttente: enAttente.length,
      montantEnAttente:
        enAttente.reduce((sum, inv) => sum + (inv.total_amount_cents ?? 0), 0) /
        100,
      enRetard: enRetard.length,
      montantEnRetard:
        enRetard.reduce((sum, inv) => sum + (inv.total_amount_cents ?? 0), 0) /
        100,
    };
  }, [invoices]);

  const handleView = (
    id: string,
    type: 'invoice' | 'quote' | 'credit_note' = 'invoice'
  ) => {
    window.location.href = `/factures/${id}?type=${type}`;
  };

  const handleSync = (): void => {
    void (async () => {
      try {
        const txRes = await window.fetch('/api/qonto/sync', { method: 'POST' });
        const txData = (await txRes.json()) as ApiResponse<unknown>;
        if (!txData.success)
          console.error('[Qonto Sync Transactions] Failed:', txData.message);

        const invRes = await window.fetch('/api/qonto/sync-invoices', {
          method: 'POST',
        });
        const invData = (await invRes.json()) as ApiResponse<unknown>;
        if (!invData.success)
          console.error('[Qonto Sync Invoices] Failed:', invData.message);

        void fetchInvoicesAsync();
        void fetchQontoQuotesAsync();
        void fetchCreditNotesAsync();
      } catch (error) {
        console.error('[Qonto Sync] Error:', error);
        void fetchInvoicesAsync();
      }
    })();
  };

  const handleConsolidate = (): void => {
    setIsConsolidating(true);
    void window
      .fetch('/api/qonto/invoices/consolidate', { method: 'POST' })
      .then(r => r.json())
      .then((report: ConsolidateReport) => {
        toast.success(
          `${report.synced.toString()} liaisons creees · ${report.skipped_existing.toString()} deja existantes`
        );
        if (report.errors.length > 0)
          toast.error(
            `${report.errors.length.toString()} erreur(s) lors de la consolidation`
          );
        if (report.synced > 0) void fetchInvoicesAsync();
      })
      .catch(() => {
        toast.error('Erreur de consolidation');
      })
      .finally(() => {
        setIsConsolidating(false);
      });
  };

  const handleOpenOrderModal = useCallback(
    (orderId: string): void => {
      void (async () => {
        const order = await fetchOrder(orderId);
        if (order) {
          setSelectedOrderForModal(order);
          setShowOrderModal(true);
        }
      })();
    },
    [fetchOrder]
  );

  const handleRapprochement = useCallback(
    (invoice: Invoice): void => {
      if (!invoice.sales_order_id) return;
      void (async () => {
        const order = await fetchOrder(invoice.sales_order_id!);
        if (order) {
          const customerName =
            order.organisations?.legal_name ??
            (order.individual_customers
              ? `${order.individual_customers.first_name} ${order.individual_customers.last_name}`
              : null);
          setRapprochementOrder({
            id: order.id,
            order_number: order.order_number,
            customer_name: customerName ?? null,
            customer_name_alt: order.organisations?.trade_name ?? null,
            total_ttc: order.total_ttc,
            created_at: order.created_at,
            order_date: order.order_date ?? null,
            shipped_at: order.shipped_at ?? null,
          });
          setShowRapprochementModal(true);
        }
      })();
    },
    [fetchOrder]
  );

  return {
    ...fetchState,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    showUploadModal,
    setShowUploadModal,
    selectedMissingTx,
    transactionForUpload,
    handleOpenUpload,
    fetchInvoices: () => void fetchInvoicesAsync(),
    fetchQontoQuotes: () => void fetchQontoQuotesAsync(),
    fetchCreditNotes: () => void fetchCreditNotesAsync(),
    kpis,
    missingInvoices,
    loadingMissing,
    errorMissing,
    refreshMissing,
    missingCount,
    selectedOrderForModal,
    showOrderModal,
    setShowOrderModal,
    setSelectedOrderForModal,
    handleOpenOrderModal,
    selectedOrgId,
    setSelectedOrgId,
    showOrgModal,
    setShowOrgModal,
    showRapprochementModal,
    setShowRapprochementModal,
    rapprochementOrder,
    setRapprochementOrder,
    handleRapprochement,
    isConsolidating,
    handleConsolidate,
    handleSync,
    handleView,
  };
}
