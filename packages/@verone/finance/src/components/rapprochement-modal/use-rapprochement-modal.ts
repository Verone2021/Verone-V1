'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import toast from 'react-hot-toast';

import type {
  ExistingLink,
  FinancialDocument,
  LinkSuccess,
  PurchaseOrder,
  SalesOrder,
} from './types';
import { calculateMatchScore } from './utils';

interface UseRapprochementModalProps {
  open: boolean;
  transactionId: string | undefined;
  transactionQontoId?: string | null;
  amount: number;
  counterpartyName?: string | null;
  organisationId?: string | null;
  onSuccess?: () => void;
}

export function useRapprochementModal({
  open,
  transactionId,
  transactionQontoId,
  amount,
  counterpartyName,
  organisationId,
  onSuccess,
}: UseRapprochementModalProps) {
  const [activeTab, setActiveTab] = useState<
    'orders' | 'purchase_orders' | 'documents'
  >('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState<LinkSuccess | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<
    string | null
  >(null);
  const [allocatedAmount, setAllocatedAmount] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string | undefined>();
  const [existingLinks, setExistingLinks] = useState<ExistingLink[]>([]);

  // Montant total déjà alloué via les liens existants
  const totalAllocated = useMemo(
    () =>
      existingLinks.reduce(
        (sum, link) => sum + Math.abs(link.allocated_amount),
        0
      ),
    [existingLinks]
  );
  const remainingAmount = Math.abs(amount) - totalAllocated;

  const fetchAvailableItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      if (transactionId) {
        const { data: txData } = await supabase
          .from('bank_transactions')
          .select('emitted_at, side')
          .eq('id', transactionId)
          .single();
        if (txData) {
          setTransactionDate(txData.emitted_at);
        }

        const { data: linksData } = await supabase
          .from('transaction_document_links')
          .select(
            'id, link_type, allocated_amount, document_id, sales_order_id, purchase_order_id'
          )
          .eq('transaction_id', transactionId);

        if (linksData && linksData.length > 0) {
          const resolvedLinks: ExistingLink[] = [];
          for (const link of linksData) {
            const resolved: ExistingLink = {
              id: link.id,
              link_type: link.link_type as ExistingLink['link_type'],
              allocated_amount: Number(link.allocated_amount) || 0,
              document_number: null,
              order_number: null,
              po_number: null,
              partner_name: null,
            };

            if (link.document_id) {
              const { data: doc } = await supabase
                .from('financial_documents')
                .select(
                  'document_number, partner_id, organisations!partner_id(legal_name, trade_name)'
                )
                .eq('id', link.document_id)
                .single();
              if (doc) {
                resolved.document_number = doc.document_number;
                const org = doc.organisations as {
                  legal_name: string;
                  trade_name: string | null;
                } | null;
                resolved.partner_name =
                  org?.trade_name ?? org?.legal_name ?? null;
              }
            }
            if (link.sales_order_id) {
              const { data: so } = await supabase
                .from('sales_orders')
                .select('order_number, customer_id, customer_type')
                .eq('id', link.sales_order_id)
                .single();
              if (so) {
                resolved.order_number = so.order_number;
                if (so.customer_type === 'organization' && so.customer_id) {
                  const { data: org } = await supabase
                    .from('organisations')
                    .select('legal_name, trade_name')
                    .eq('id', so.customer_id)
                    .single();
                  resolved.partner_name =
                    org?.trade_name ?? org?.legal_name ?? null;
                }
              }
            }
            if (link.purchase_order_id) {
              const { data: po } = await supabase
                .from('purchase_orders')
                .select(
                  'po_number, supplier_id, organisations!supplier_id(legal_name, trade_name)'
                )
                .eq('id', link.purchase_order_id)
                .single();
              if (po) {
                resolved.po_number = po.po_number;
                const org = po.organisations as {
                  legal_name: string;
                  trade_name: string | null;
                } | null;
                resolved.partner_name =
                  org?.trade_name ?? org?.legal_name ?? null;
              }
            }
            resolvedLinks.push(resolved);
          }
          setExistingLinks(resolvedLinks);
        } else {
          setExistingLinks([]);
        }
      }

      const { data: docs, error: docsError } = await supabase
        .from('financial_documents')
        .select(
          'id, document_type, document_number, total_ttc, amount_paid, document_date, partner_id, organisations!partner_id(legal_name, trade_name)'
        )
        .in('status', ['sent', 'received', 'partially_paid'])
        .in('document_type', ['customer_invoice', 'supplier_invoice'])
        .order('document_date', { ascending: false })
        .limit(100);

      if (!docsError && docs) {
        type DocRow = {
          id: string;
          document_type: string;
          document_number: string;
          total_ttc: number;
          amount_paid: number;
          document_date: string;
          partner_id: string;
          organisations: {
            legal_name: string;
            trade_name: string | null;
          } | null;
        };
        setDocuments(
          (docs as DocRow[]).map(d => ({
            id: d.id,
            document_type: d.document_type,
            document_number: d.document_number,
            total_ttc: d.total_ttc,
            amount_paid: d.amount_paid || 0,
            partner_name:
              d.organisations?.trade_name ?? d.organisations?.legal_name,
            document_date: d.document_date,
          }))
        );
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('sales_orders')
        .select(
          'id, order_number, total_ht, total_ttc, created_at, status, customer_id, customer_type, payment_status_v2'
        )
        .in('status', ['validated', 'delivered', 'shipped'])
        .order('created_at', { ascending: false })
        .limit(100);

      console.warn('[RapprochementModal] sales_orders query result:', {
        dataLength: ordersData?.length,
        error: ordersError,
        firstOrder: ordersData?.[0],
      });

      if (!ordersError && ordersData) {
        type OrderRow = {
          id: string;
          order_number: string;
          total_ht: number;
          total_ttc: number;
          created_at: string;
          status: string;
          customer_id: string;
          customer_type: string;
          payment_status_v2: string | null;
        };

        const orderIds = (ordersData as OrderRow[]).map(o => o.id);
        const allocatedByOrder = new Map<string, number>();
        if (orderIds.length > 0) {
          const { data: allocatedData } = await supabase
            .from('transaction_document_links')
            .select('sales_order_id, allocated_amount')
            .in('sales_order_id', orderIds);
          allocatedData?.forEach(link => {
            const key = link.sales_order_id as string;
            const current = allocatedByOrder.get(key) ?? 0;
            allocatedByOrder.set(
              key,
              current + (Number(link.allocated_amount) || 0)
            );
          });
        }

        const orgOrders = (ordersData as OrderRow[]).filter(
          o => o.customer_type === 'organization'
        );
        const orgIds = orgOrders.map(o => o.customer_id);
        type OrgNamePair = { legal: string; trade: string | null };
        const orgNamePairs: Record<string, OrgNamePair> = {};
        if (orgIds.length > 0) {
          const { data: orgs } = await supabase
            .from('organisations')
            .select('id, legal_name, trade_name')
            .in('id', orgIds);
          if (orgs) {
            orgs.forEach(o => {
              orgNamePairs[o.id] = { legal: o.legal_name, trade: o.trade_name };
            });
          }
        }

        setOrders(
          (ordersData as OrderRow[]).map(o => {
            const ttc = Number(o.total_ttc) || Number(o.total_ht) * 1.2;
            const paid = allocatedByOrder.get(o.id) ?? 0;
            return {
              id: o.id,
              order_number: o.order_number,
              total_ht: Number(o.total_ht) || 0,
              total_ttc: ttc,
              created_at: o.created_at,
              status: o.status,
              payment_status_v2: o.payment_status_v2 ?? undefined,
              amount_paid: paid,
              remaining: ttc - paid,
              organisation_id:
                o.customer_type === 'organization' ? o.customer_id : undefined,
              customer_name:
                o.customer_type === 'organization'
                  ? [
                      orgNamePairs[o.customer_id]?.trade,
                      orgNamePairs[o.customer_id]?.legal,
                    ]
                      .filter(Boolean)
                      .join(' | ')
                  : 'Client particulier',
            };
          })
        );
      }

      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(
          'id, po_number, total_ht, total_ttc, created_at, status, supplier_id, organisations!supplier_id(legal_name, trade_name)'
        )
        .in('status', ['validated', 'partially_received', 'received'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (!poError && poData) {
        type PORow = {
          id: string;
          po_number: string;
          total_ht: number;
          total_ttc: number;
          created_at: string;
          status: string;
          supplier_id: string;
          organisations: {
            legal_name: string;
            trade_name: string | null;
          } | null;
        };
        setPurchaseOrders(
          (poData as PORow[]).map(po => ({
            id: po.id,
            po_number: po.po_number,
            total_ht: Number(po.total_ht) || 0,
            total_ttc: Number(po.total_ttc) || Number(po.total_ht) * 1.2,
            created_at: po.created_at,
            status: po.status,
            supplier_id: po.supplier_id,
            supplier_name: [
              po.organisations?.trade_name,
              po.organisations?.legal_name,
            ]
              .filter(Boolean)
              .join(' | '),
          }))
        );
      }
    } catch (err) {
      console.error('[RapprochementModal] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  const ordersWithScores = useMemo(() => {
    const result = orders
      .map(order => {
        const { score, reasons } = calculateMatchScore(
          amount,
          transactionDate,
          organisationId ?? undefined,
          order,
          counterpartyName
        );
        return { ...order, matchScore: score, matchReasons: reasons };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    if (result.length > 0) {
      console.warn('[RapprochementModal] Scoring results:', {
        transactionAmount: amount,
        ordersCount: result.length,
        topMatches: result.slice(0, 3).map(o => ({
          order: o.order_number,
          ttc: o.total_ttc,
          score: o.matchScore,
          reasons: o.matchReasons,
        })),
      });
    }
    return result;
  }, [orders, amount, transactionDate, organisationId, counterpartyName]);

  const suggestions = useMemo(
    () => ordersWithScores.filter(o => (o.matchScore || 0) >= 40).slice(0, 3),
    [ordersWithScores]
  );

  const purchaseOrdersWithScores = useMemo(() => {
    return purchaseOrders
      .map(po => {
        const { score, reasons } = calculateMatchScore(
          amount,
          transactionDate,
          undefined,
          {
            total_ttc: po.total_ttc,
            created_at: po.created_at,
            organisation_id: po.supplier_id,
            customer_name: po.supplier_name,
          },
          counterpartyName
        );
        return { ...po, matchScore: score, matchReasons: reasons };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [purchaseOrders, amount, transactionDate, counterpartyName]);

  const purchaseOrderSuggestions = useMemo(
    () =>
      purchaseOrdersWithScores
        .filter(o => (o.matchScore || 0) >= 40)
        .slice(0, 3),
    [purchaseOrdersWithScores]
  );

  useEffect(() => {
    if (!open) return;
    void fetchAvailableItems();
    setSelectedDocumentId(null);
    setSelectedOrderId(null);
    setSelectedPurchaseOrderId(null);
    setAllocatedAmount('');
    setLinkSuccess(null);
    if (amount < 0) {
      setActiveTab('purchase_orders');
    } else {
      setActiveTab('orders');
    }
  }, [open, fetchAvailableItems, amount]);

  const filteredDocuments = documents.filter(
    d =>
      d.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = ordersWithScores.filter(
    o =>
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPurchaseOrders = purchaseOrdersWithScores.filter(
    po =>
      po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const autoAttachPDF = useCallback(
    async (documentId: string) => {
      if (!transactionQontoId) return;
      try {
        const res = await fetch('/api/qonto/attachments/auto-attach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: transactionQontoId,
            documentId,
          }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          skipped?: boolean;
          message?: string;
          documentNumber?: string;
        };
        if (data.success && !data.skipped) {
          console.warn(
            `[RapprochementModal] Auto-attach: ${data.documentNumber ?? documentId} attache`
          );
        }
      } catch (err) {
        console.warn(
          '[RapprochementModal] Auto-attach failed (non-blocking):',
          err
        );
      }
    },
    [transactionQontoId]
  );

  const autoCalculateVAT = useCallback(async () => {
    if (!transactionId) return;
    try {
      const supabase = createClient();
      const { data: links } = await supabase
        .from('transaction_document_links')
        .select(
          'allocated_amount, document_id, sales_order_id, purchase_order_id'
        )
        .eq('transaction_id', transactionId);

      if (!links || links.length === 0) {
        await supabase
          .from('bank_transactions')
          .update({
            vat_rate: null,
            amount_ht: null,
            amount_vat: null,
            vat_breakdown: null,
            vat_source: null,
          })
          .eq('id', transactionId);
        return;
      }

      const docIds = links
        .filter(l => l.document_id)
        .map(l => l.document_id as string);
      const soIds = links
        .filter(l => l.sales_order_id)
        .map(l => l.sales_order_id as string);
      const poIds = links
        .filter(l => l.purchase_order_id)
        .map(l => l.purchase_order_id as string);

      type AmountPair = { id: string; total_ht: number; total_ttc: number };
      const amounts: AmountPair[] = [];

      if (docIds.length > 0) {
        const { data: docs } = await supabase
          .from('financial_documents')
          .select('id, total_ht, total_ttc')
          .in('id', docIds);
        docs?.forEach(d =>
          amounts.push({
            id: d.id,
            total_ht: Number(d.total_ht) || 0,
            total_ttc: Number(d.total_ttc) || 0,
          })
        );
      }
      if (soIds.length > 0) {
        const { data: sos } = await supabase
          .from('sales_orders')
          .select('id, total_ht, total_ttc')
          .in('id', soIds);
        sos?.forEach(s =>
          amounts.push({
            id: s.id,
            total_ht: Number(s.total_ht) || 0,
            total_ttc: Number(s.total_ttc) || 0,
          })
        );
      }
      if (poIds.length > 0) {
        const { data: pos } = await supabase
          .from('purchase_orders')
          .select('id, total_ht, total_ttc')
          .in('id', poIds);
        pos?.forEach(p =>
          amounts.push({
            id: p.id,
            total_ht: Number(p.total_ht) || 0,
            total_ttc: Number(p.total_ttc) || 0,
          })
        );
      }

      if (amounts.length === 0) return;

      const rates = new Set<number>();
      const breakdownEntries: Array<{
        description: string;
        amount_ht: number;
        tva_rate: number;
        tva_amount: number;
      }> = [];

      for (const a of amounts) {
        const ht = a.total_ht;
        const ttc = a.total_ttc;
        const rate =
          ht > 0 ? Math.round(((ttc - ht) / ht) * 100 * 100) / 100 : 0;
        rates.add(Math.round(rate));
        breakdownEntries.push({
          description: `Document`,
          amount_ht: ht,
          tva_rate: Math.round(rate),
          tva_amount: Math.round((ttc - ht) * 100) / 100,
        });
      }

      const totalHT = amounts.reduce((sum, a) => sum + a.total_ht, 0);
      const totalTTC = amounts.reduce((sum, a) => sum + a.total_ttc, 0);
      const totalVAT = Math.round((totalTTC - totalHT) * 100) / 100;

      if (rates.size === 1) {
        const singleRate = [...rates][0];
        await supabase
          .from('bank_transactions')
          .update({
            vat_rate: singleRate,
            amount_ht: Math.round(totalHT * 100) / 100,
            amount_vat: totalVAT,
            vat_breakdown: null,
            vat_source: 'reconciliation',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);
      } else {
        await supabase
          .from('bank_transactions')
          .update({
            vat_rate: null,
            amount_ht: Math.round(totalHT * 100) / 100,
            amount_vat: totalVAT,
            vat_breakdown: breakdownEntries,
            vat_source: 'reconciliation',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);
      }

      console.warn('[RapprochementModal] Auto-VAT applied:', {
        rates: [...rates],
        totalHT,
        totalVAT,
      });
    } catch (err) {
      console.warn('[RapprochementModal] Auto-VAT failed (non-blocking):', err);
    }
  }, [transactionId]);

  const handleLinkDocument = async () => {
    if (!transactionId || !selectedDocumentId) return;
    setIsLinking(true);
    try {
      const supabase = createClient();
      const amountToAllocate = allocatedAmount
        ? parseFloat(allocatedAmount)
        : remainingAmount;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const { error } = (await (supabase.rpc as CallableFunction)(
        'link_transaction_to_document',
        {
          p_transaction_id: transactionId,
          p_document_id: selectedDocumentId,
          p_allocated_amount: amountToAllocate,
        }
      )) as { data: unknown; error: { message: string } | null };
      if (error) throw new Error(error.message);
      void autoAttachPDF(selectedDocumentId);
      const linkedDoc = documents.find(d => d.id === selectedDocumentId);
      setLinkSuccess({
        type: 'document',
        label: linkedDoc?.document_number ?? 'Document',
        amount: amountToAllocate,
      });
      void autoCalculateVAT();
      onSuccess?.();
    } catch (err) {
      console.error('[RapprochementModal] Link error:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkOrder = async () => {
    if (!transactionId || !selectedOrderId) return;
    setIsLinking(true);
    try {
      const supabase = createClient();
      const amountToAllocate = allocatedAmount
        ? parseFloat(allocatedAmount)
        : remainingAmount;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const { error } = (await (supabase.rpc as CallableFunction)(
        'link_transaction_to_document',
        {
          p_transaction_id: transactionId,
          p_sales_order_id: selectedOrderId,
          p_allocated_amount: amountToAllocate,
        }
      )) as { data: unknown; error: { message: string } | null };
      if (error) throw new Error(error.message);
      const { data: linkedDoc } = await supabase
        .from('financial_documents')
        .select('id')
        .eq('sales_order_id', selectedOrderId)
        .eq('document_type', 'customer_invoice')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (linkedDoc) void autoAttachPDF(linkedDoc.id);
      const linkedOrder = orders.find(o => o.id === selectedOrderId);
      setLinkSuccess({
        type: 'sales_order',
        label: `Commande #${linkedOrder?.order_number ?? ''}`,
        amount: amountToAllocate,
      });
      void autoCalculateVAT();
      onSuccess?.();
    } catch (err) {
      console.error('[RapprochementModal] Link order error:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkPurchaseOrder = async () => {
    if (!transactionId || !selectedPurchaseOrderId) return;
    setIsLinking(true);
    try {
      const supabase = createClient();
      const amountToAllocate = allocatedAmount
        ? parseFloat(allocatedAmount)
        : remainingAmount;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const { error } = (await (supabase.rpc as CallableFunction)(
        'link_transaction_to_document',
        {
          p_transaction_id: transactionId,
          p_purchase_order_id: selectedPurchaseOrderId,
          p_allocated_amount: amountToAllocate,
        }
      )) as { data: unknown; error: { message: string } | null };
      if (error) throw new Error(error.message);
      const { data: linkedSupplierDoc } = await supabase
        .from('financial_documents')
        .select('id')
        .eq('purchase_order_id', selectedPurchaseOrderId)
        .eq('document_type', 'supplier_invoice')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (linkedSupplierDoc) void autoAttachPDF(linkedSupplierDoc.id);
      const linkedPO = purchaseOrders.find(
        po => po.id === selectedPurchaseOrderId
      );
      setLinkSuccess({
        type: 'purchase_order',
        label: `Commande #${linkedPO?.po_number ?? ''}`,
        amount: amountToAllocate,
      });
      void autoCalculateVAT();
      onSuccess?.();
    } catch (err) {
      console.error('[RapprochementModal] Link purchase order error:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  const handleQuickLink = async (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    const orderRemaining = order ? order.remaining : remainingAmount;
    const defaultAmount = Math.min(remainingAmount, orderRemaining);
    setAllocatedAmount(String(defaultAmount.toFixed(2)));
  };

  const handleQuickLinkPurchaseOrder = async (purchaseOrderId: string) => {
    setSelectedPurchaseOrderId(purchaseOrderId);
    const po = purchaseOrders.find(p => p.id === purchaseOrderId);
    const poRemaining = po ? po.total_ttc : remainingAmount;
    const defaultAmount = Math.min(remainingAmount, poRemaining);
    setAllocatedAmount(String(defaultAmount.toFixed(2)));
  };

  const handleUnlink = async (linkId: string) => {
    if (!transactionId) return;
    if (
      !confirm(
        'Supprimer ce rapprochement ? La facture/commande sera remise en attente de paiement.'
      )
    )
      return;

    try {
      const supabase = createClient();
      const { data: linkData } = await supabase
        .from('transaction_document_links')
        .select('document_id')
        .eq('id', linkId)
        .single();
      const { error } = await supabase
        .from('transaction_document_links')
        .delete()
        .eq('id', linkId);
      if (error) throw error;

      if (linkData?.document_id) {
        const { data: doc } = await supabase
          .from('financial_documents')
          .select('qonto_attachment_id')
          .eq('id', linkData.document_id)
          .single();
        if (doc?.qonto_attachment_id) {
          void fetch(
            `/api/qonto/attachments/${doc.qonto_attachment_id}?transactionId=${transactionId}`,
            { method: 'DELETE' }
          ).catch(err => {
            console.warn(
              '[RapprochementModal] Auto-detach failed (non-blocking):',
              err
            );
          });
        }
      }

      const { data: remainingLinks } = await supabase
        .from('transaction_document_links')
        .select('id')
        .eq('transaction_id', transactionId);

      if (!remainingLinks || remainingLinks.length === 0) {
        await supabase
          .from('bank_transactions')
          .update({
            matching_status: 'unmatched',
            matched_document_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);
      }

      toast.success('Rapprochement supprime');
      void autoCalculateVAT();
      void fetchAvailableItems();
      onSuccess?.();
    } catch (err) {
      console.error('[RapprochementModal] Unlink error:', err);
      toast.error('Erreur lors de la suppression du rapprochement');
    }
  };

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isLoading,
    isLinking,
    linkSuccess,
    setLinkSuccess,
    selectedDocumentId,
    setSelectedDocumentId,
    selectedOrderId,
    setSelectedOrderId,
    selectedPurchaseOrderId,
    setSelectedPurchaseOrderId,
    allocatedAmount,
    setAllocatedAmount,
    existingLinks,
    totalAllocated,
    remainingAmount,
    filteredDocuments,
    filteredOrders,
    filteredPurchaseOrders,
    suggestions,
    purchaseOrderSuggestions,
    fetchAvailableItems,
    handleLinkDocument,
    handleLinkOrder,
    handleLinkPurchaseOrder,
    handleQuickLink,
    handleQuickLinkPurchaseOrder,
    handleUnlink,
  };
}

export type UseRapprochementModalReturn = ReturnType<
  typeof useRapprochementModal
>;
