'use client';

import { useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type {
  ExistingLink,
  FinancialDocument,
  SalesOrder,
  PurchaseOrder,
} from './types';

export function useRapprochementData(transactionId: string | undefined) {
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionDate, setTransactionDate] = useState<string | undefined>();
  const [_transactionSide, setTransactionSide] = useState<
    'credit' | 'debit' | undefined
  >();
  const [existingLinks, setExistingLinks] = useState<ExistingLink[]>([]);

  // Charger les documents et commandes disponibles
  const fetchAvailableItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Récupérer la date et le côté (credit/debit) de la transaction pour le scoring
      if (transactionId) {
        const { data: txData } = await supabase
          .from('bank_transactions')
          .select('emitted_at, side')
          .eq('id', transactionId)
          .single();
        if (txData) {
          setTransactionDate(txData.emitted_at);
          setTransactionSide(txData.side);
        }

        // Charger les liens existants (documents/commandes déjà rapprochés)
        const { data: linksData } = await supabase
          .from('transaction_document_links')
          .select(
            `
            id,
            link_type,
            allocated_amount,
            document_id,
            sales_order_id,
            purchase_order_id
          `
          )
          .eq('transaction_id', transactionId);

        if (linksData && linksData.length > 0) {
          // Résoudre les noms des documents/commandes liés
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

      // Récupérer les documents non payés ou partiellement payés
      const { data: docs, error: docsError } = await supabase
        .from('financial_documents')
        .select(
          `
          id,
          document_type,
          document_number,
          total_ttc,
          amount_paid,
          document_date,
          partner_id,
          organisations!partner_id(legal_name, trade_name)
        `
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

      // Récupérer les commandes validées/livrées avec plus de détails
      // Note: customer_id peut pointer vers organisations ou individual_customers selon customer_type
      const { data: ordersData, error: ordersError } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          total_ht,
          total_ttc,
          created_at,
          status,
          customer_id,
          customer_type,
          payment_status_v2
        `
        )
        .in('status', ['validated', 'delivered', 'shipped'])
        .order('created_at', { ascending: false })
        .limit(100);

      // DEBUG: Log pour identifier le problème de rapprochement
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

        // Charger les montants déjà alloués par commande via transaction_document_links
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

        // Récupérer les noms des organisations pour les commandes B2B
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
              // FIX: Forcer conversion en number (Supabase peut retourner string pour numeric)
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

      // Récupérer les commandes fournisseurs validées
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(
          `
          id,
          po_number,
          total_ht,
          total_ttc,
          created_at,
          status,
          supplier_id,
          organisations!supplier_id(legal_name, trade_name)
        `
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

  return {
    documents,
    orders,
    purchaseOrders,
    isLoading,
    transactionDate,
    existingLinks,
    fetchAvailableItems,
  };
}
