'use client';

/**
 * RapprochementModal - Modal pour le rapprochement bancaire
 *
 * Permet de lier une transaction bancaire à un document ou une commande.
 * Propose automatiquement des suggestions basées sur:
 * - Montant similaire (tolérance 5%)
 * - Date proche (±30 jours)
 * - Organisation/client correspondant
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ScrollArea,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  FileText,
  Check,
  CheckCircle2,
  Search,
  Building2,
  Package,
  RefreshCw,
  Plus,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ExistingLink {
  id: string;
  link_type: 'document' | 'sales_order' | 'purchase_order';
  allocated_amount: number;
  document_number: string | null;
  order_number: string | null;
  po_number: string | null;
  partner_name: string | null;
}

interface RapprochementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | undefined;
  /** transaction_id Qonto (pour auto-attachment justificatif) */
  transactionQontoId?: string | null;
  label: string;
  amount: number;
  counterpartyName?: string | null;
  organisationName?: string | null;
  organisationId?: string | null;
  onSuccess?: () => void;
}

interface FinancialDocument {
  id: string;
  document_type: string;
  document_number: string;
  total_ttc: number;
  amount_paid: number;
  partner_name?: string;
  document_date: string;
}

interface SalesOrder {
  id: string;
  order_number: string;
  total_ht: number;
  total_ttc: number;
  customer_name?: string;
  organisation_id?: string;
  created_at: string;
  status: string;
  payment_status_v2?: string;
  amount_paid: number;
  remaining: number;
  // Score de matching (calculé côté client)
  matchScore?: number;
  matchReasons?: string[];
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  total_ht: number;
  total_ttc: number;
  supplier_name?: string;
  supplier_id?: string;
  created_at: string;
  status: string;
  // Score de matching (calculé côté client)
  matchScore?: number;
  matchReasons?: string[];
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(amount));
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Calcule un score de matching entre une transaction et une commande.
 * Scoring à PRIORITÉ : montant exact = toujours en haut.
 * customer_name peut contenir plusieurs noms séparés par ' | ' (trade_name | legal_name).
 */
function calculateMatchScore(
  transactionAmount: number,
  transactionDate: string | undefined,
  transactionOrgId: string | undefined,
  order: {
    total_ttc: number;
    created_at: string;
    organisation_id?: string;
    customer_name?: string;
  },
  counterpartyName?: string | null
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const absAmount = Math.abs(transactionAmount);
  const amountDiff = Math.abs(absAmount - order.total_ttc);
  const isExactAmount = amountDiff < 0.01;

  // NAME MATCHING: split customer_name par ' | ' pour tester legal ET trade
  let nameMatches = false;
  if (order.customer_name && counterpartyName) {
    const names = order.customer_name
      .split(' | ')
      .map(n => n.toLowerCase().trim());
    const cpLower = counterpartyName.toLowerCase().trim();
    // Bidirectionnel : counterparty ⊂ nom OU mot du nom ⊂ counterparty
    nameMatches = names.some(name => {
      if (name.length < 3) return false;
      const words = name.split(/[\s,.-]+/).filter(w => w.length >= 3);
      return (
        cpLower.includes(name) ||
        name.includes(cpLower) ||
        words.some(w => cpLower.includes(w))
      );
    });
  }
  // Fallback: org ID match
  if (
    !nameMatches &&
    transactionOrgId &&
    order.organisation_id === transactionOrgId
  ) {
    nameMatches = true;
  }
  if (nameMatches) reasons.push('Nom correspondant');

  // DATE proximity
  let dateClose = false;
  if (transactionDate) {
    const daysDiff = Math.abs(
      (new Date(transactionDate).getTime() -
        new Date(order.created_at).getTime()) /
        86400000
    );
    if (daysDiff <= 30) dateClose = true;
  }

  // PRIORITY SCORING (montant exact = TOP)
  if (isExactAmount && nameMatches) {
    reasons.push('Montant exact');
    return { score: 100, reasons };
  }
  if (isExactAmount) {
    reasons.push('Montant exact');
    return { score: 90, reasons };
  }

  // Montant proche (±5%) + nom
  const pct = order.total_ttc > 0 ? (amountDiff / order.total_ttc) * 100 : 100;
  if (pct <= 5 && nameMatches) {
    reasons.push(`±${pct.toFixed(1)}%`);
    return { score: 80, reasons };
  }
  if (pct <= 5) {
    reasons.push(`±${pct.toFixed(1)}%`);
    return { score: 70, reasons };
  }

  // Montant ±10% + nom + date
  if (pct <= 10 && nameMatches && dateClose) {
    reasons.push(`±${pct.toFixed(1)}%`);
    return { score: 60, reasons };
  }
  if (pct <= 10 && nameMatches) {
    reasons.push(`±${pct.toFixed(1)}%`);
    return { score: 55, reasons };
  }
  if (pct <= 10) {
    reasons.push(`±${pct.toFixed(1)}%`);
    return { score: 45, reasons };
  }

  // Nom seul + date
  if (nameMatches && dateClose) return { score: 35, reasons };
  if (nameMatches) return { score: 25, reasons };

  return { score: 0, reasons };
}

export function RapprochementModal({
  open,
  onOpenChange,
  transactionId,
  transactionQontoId,
  label,
  amount,
  counterpartyName,
  organisationName,
  organisationId,
  onSuccess,
}: RapprochementModalProps) {
  // 3 onglets: Commandes Clients, Commandes Fournisseurs, Documents
  const [activeTab, setActiveTab] = useState<
    'orders' | 'purchase_orders' | 'documents'
  >('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState<{
    type: 'document' | 'sales_order' | 'purchase_order';
    label: string;
    amount: number;
  } | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<
    string | null
  >(null);
  const [allocatedAmount, setAllocatedAmount] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string | undefined>();
  const [_transactionSide, setTransactionSide] = useState<
    'credit' | 'debit' | undefined
  >();
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
  // Montant restant à rapprocher = montant transaction - déjà alloué
  const remainingAmount = Math.abs(amount) - totalAllocated;

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

  // Calculer les scores de matching pour les commandes
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
        return {
          ...order,
          matchScore: score,
          matchReasons: reasons,
        };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    // DEBUG: Log des scores calculés
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

  // Top suggestions pour commandes clients (score >= 40)
  const suggestions = useMemo(() => {
    return ordersWithScores.filter(o => (o.matchScore || 0) >= 40).slice(0, 3);
  }, [ordersWithScores]);

  // Calculer les scores de matching pour les commandes fournisseurs
  const purchaseOrdersWithScores = useMemo(() => {
    const result = purchaseOrders
      .map(po => {
        const { score, reasons } = calculateMatchScore(
          amount,
          transactionDate,
          undefined, // Pas d'organisation liée pour les dépenses
          {
            total_ttc: po.total_ttc,
            created_at: po.created_at,
            organisation_id: po.supplier_id,
            customer_name: po.supplier_name,
          },
          counterpartyName
        );
        return {
          ...po,
          matchScore: score,
          matchReasons: reasons,
        };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return result;
  }, [purchaseOrders, amount, transactionDate, counterpartyName]);

  // Top suggestions pour commandes fournisseurs (score >= 40)
  const purchaseOrderSuggestions = useMemo(() => {
    return purchaseOrdersWithScores
      .filter(o => (o.matchScore || 0) >= 40)
      .slice(0, 3);
  }, [purchaseOrdersWithScores]);

  // Charger les données au mount
  useEffect(() => {
    if (!open) return;

    void fetchAvailableItems();

    // Reset des sélections
    setSelectedDocumentId(null);
    setSelectedOrderId(null);
    setSelectedPurchaseOrderId(null);
    setAllocatedAmount('');
    setLinkSuccess(null);

    // Onglet par défaut selon le type de transaction
    // Débit = dépense = commandes fournisseurs, Crédit = recette = commandes clients
    if (amount < 0) {
      setActiveTab('purchase_orders');
    } else {
      setActiveTab('orders');
    }
  }, [open, fetchAvailableItems, amount]);

  // Filtrer les documents
  const filteredDocuments = documents.filter(
    d =>
      d.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrer les commandes clients (avec scores)
  const filteredOrders = ordersWithScores.filter(
    o =>
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrer les commandes fournisseurs (avec scores)
  const filteredPurchaseOrders = purchaseOrdersWithScores.filter(
    po =>
      po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-attach: apres rapprochement, attacher le PDF du document comme justificatif Qonto
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
        // Ne pas bloquer le rapprochement si l'auto-attach echoue
        console.warn(
          '[RapprochementModal] Auto-attach failed (non-blocking):',
          err
        );
      }
    },
    [transactionQontoId]
  );

  // Auto-calcul TVA depuis les documents/commandes rapprochés
  const autoCalculateVAT = useCallback(async () => {
    if (!transactionId) return;
    try {
      const supabase = createClient();

      // Lire tous les liens de la transaction avec les détails des documents
      const { data: links } = await supabase
        .from('transaction_document_links')
        .select(
          'allocated_amount, document_id, sales_order_id, purchase_order_id'
        )
        .eq('transaction_id', transactionId);

      if (!links || links.length === 0) {
        // Plus de liens → effacer la TVA auto
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

      // Collecter HT/TTC de chaque document lié
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

      // Calculer les taux uniques
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
        // Un seul taux → simple
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
        // Plusieurs taux → ventilation
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

  // Lier à un document
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

      // Auto-attach PDF comme justificatif Qonto (non-bloquant)
      void autoAttachPDF(selectedDocumentId);

      const linkedDoc = documents.find(d => d.id === selectedDocumentId);
      setLinkSuccess({
        type: 'document',
        label: linkedDoc?.document_number ?? 'Document',
        amount: amountToAllocate,
      });
      // Auto-calcul TVA depuis rapprochement + rafraîchir la page
      void autoCalculateVAT();
      onSuccess?.();
    } catch (err) {
      console.error('[RapprochementModal] Link error:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  // Lier à une commande
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

      // Auto-attach: résoudre la facture liée à la commande et attacher son PDF
      const { data: linkedDoc } = await supabase
        .from('financial_documents')
        .select('id')
        .eq('sales_order_id', selectedOrderId)
        .eq('document_type', 'customer_invoice')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (linkedDoc) {
        void autoAttachPDF(linkedDoc.id);
      }

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

  // Lier à une commande fournisseur
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

      // Auto-attach: résoudre la facture fournisseur liée et attacher son PDF
      const { data: linkedSupplierDoc } = await supabase
        .from('financial_documents')
        .select('id')
        .eq('purchase_order_id', selectedPurchaseOrderId)
        .eq('document_type', 'supplier_invoice')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (linkedSupplierDoc) {
        void autoAttachPDF(linkedSupplierDoc.id);
      }

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

  // Lier directement via suggestion (raccourci) - commandes clients
  const handleQuickLink = async (orderId: string) => {
    setSelectedOrderId(orderId);
    // Montant par défaut = min(restant transaction, restant commande)
    const order = orders.find(o => o.id === orderId);
    const orderRemaining = order ? order.remaining : remainingAmount;
    const defaultAmount = Math.min(remainingAmount, orderRemaining);
    setAllocatedAmount(String(defaultAmount.toFixed(2)));
  };

  // Lier directement via suggestion (raccourci) - commandes fournisseurs
  const handleQuickLinkPurchaseOrder = async (purchaseOrderId: string) => {
    setSelectedPurchaseOrderId(purchaseOrderId);
    const po = purchaseOrders.find(p => p.id === purchaseOrderId);
    const poRemaining = po ? po.total_ttc : remainingAmount;
    const defaultAmount = Math.min(remainingAmount, poRemaining);
    setAllocatedAmount(String(defaultAmount.toFixed(2)));
  };

  // Supprimer un rapprochement existant (dérapprocher)
  const handleUnlink = async (linkId: string) => {
    if (!transactionId) return;

    if (
      !confirm(
        'Supprimer ce rapprochement ? La facture/commande sera remise en attente de paiement.'
      )
    ) {
      return;
    }

    try {
      const supabase = createClient();

      // 1. Récupérer le document_id du lien AVANT suppression (pour retirer l'attachment)
      const { data: linkData } = await supabase
        .from('transaction_document_links')
        .select('document_id')
        .eq('id', linkId)
        .single();

      // 2. Supprimer le lien — les triggers DB mettent à jour automatiquement :
      // - payment_status_v2 de la commande (sales_order / purchase_order)
      // - amount_paid du financial_document
      const { error } = await supabase
        .from('transaction_document_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      // 3. Retirer l'attachment Qonto associé (non-bloquant)
      if (linkData?.document_id) {
        const { data: doc } = await supabase
          .from('financial_documents')
          .select('qonto_attachment_id')
          .eq('id', linkData.document_id)
          .single();

        if (doc?.qonto_attachment_id) {
          // Supprimer l'attachment via la route API existante
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

      // 4. Vérifier s'il reste des liens pour cette transaction
      const { data: remainingLinks } = await supabase
        .from('transaction_document_links')
        .select('id')
        .eq('transaction_id', transactionId);

      // Si plus aucun lien, remettre matching_status à 'unmatched'
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
      // Recalculer TVA + rafraîchir modal + page
      void autoCalculateVAT();
      void fetchAvailableItems();
      onSuccess?.();
    } catch (err) {
      console.error('[RapprochementModal] Unlink error:', err);
      toast.error('Erreur lors de la suppression du rapprochement');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Rapprocher Commande
          </DialogTitle>
          <DialogDescription>
            Liez cette transaction à une commande ou un document
          </DialogDescription>
        </DialogHeader>

        {/* Success confirmation screen */}
        {linkSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-lg text-slate-900">
                Rapprochement effectué
              </h3>
              <p className="text-sm text-slate-600">
                {linkSuccess.label} liée à la transaction
              </p>
              <p className="text-sm font-medium text-green-600">
                {formatAmount(linkSuccess.amount)}
              </p>
              {/* Montant restant après ce rapprochement */}
              {remainingAmount - linkSuccess.amount > 0.01 && (
                <p className="text-sm text-amber-600 mt-1">
                  Reste a rapprocher :{' '}
                  {formatAmount(remainingAmount - linkSuccess.amount)}
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              {/* Bouton "Ajouter un autre" si montant restant */}
              {remainingAmount - linkSuccess.amount > 0.01 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Refresh les données et revenir au formulaire
                    setLinkSuccess(null);
                    setSelectedDocumentId(null);
                    setSelectedOrderId(null);
                    setSelectedPurchaseOrderId(null);
                    setAllocatedAmount('');
                    void fetchAvailableItems();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un autre
                </Button>
              )}
              <Button
                onClick={() => {
                  onSuccess?.();
                  onOpenChange(false);
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Info transaction */}
            <div className="p-2 bg-slate-50 rounded-lg space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-slate-900">{label}</p>
                  {counterpartyName && (
                    <p className="text-sm text-slate-600">{counterpartyName}</p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`text-lg font-bold ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {amount < 0 ? '' : '+'}
                    {formatAmount(amount)}
                  </span>
                </div>
              </div>

              {/* Organisation liée */}
              {organisationName && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 mt-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-medium">
                    {organisationName}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Organisation liée
                  </Badge>
                </div>
              )}
            </div>

            {/* Liens existants (documents/commandes déjà rapprochés) — compact */}
            {existingLinks.length > 0 && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">
                      Deja rapproche ({existingLinks.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-blue-700">
                      {formatAmount(totalAllocated)}
                    </span>
                    {remainingAmount > 0.01 ? (
                      <span className="font-bold text-amber-600">
                        Reste: {formatAmount(remainingAmount)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-medium text-green-700">
                        <Check className="h-3 w-3" /> Complet
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-[120px] overflow-y-auto space-y-0.5">
                  {existingLinks.map(link => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between py-1 px-1.5 bg-white rounded border border-blue-100 text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {link.link_type === 'sales_order' && (
                          <Package className="h-3 w-3 text-blue-500 shrink-0" />
                        )}
                        {link.link_type === 'purchase_order' && (
                          <Building2 className="h-3 w-3 text-orange-500 shrink-0" />
                        )}
                        {link.link_type === 'document' && (
                          <FileText className="h-3 w-3 text-slate-500 shrink-0" />
                        )}
                        <span className="font-medium truncate">
                          {link.order_number
                            ? `#${link.order_number}`
                            : link.po_number
                              ? `#${link.po_number}`
                              : (link.document_number ?? 'Document')}
                        </span>
                        {link.partner_name && (
                          <span className="text-slate-400 truncate hidden sm:inline">
                            {link.partner_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-semibold text-blue-700">
                          {formatAmount(link.allocated_amount)}
                        </span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            void handleUnlink(link.id).catch(err => {
                              console.error(
                                '[RapprochementModal] Unlink failed:',
                                err
                              );
                            });
                          }}
                          className="p-0.5 rounded hover:bg-red-100 transition-colors"
                          title="Supprimer ce rapprochement"
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions automatiques */}
            {suggestions.length > 0 && !selectedOrderId && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Suggestions de rapprochement
                  </span>
                </div>
                <div className="space-y-2">
                  {suggestions.map(order => (
                    <button
                      key={order.id}
                      onClick={() => void handleQuickLink(order.id)}
                      className="w-full flex items-center justify-between p-2 bg-white rounded border border-amber-200 hover:border-amber-400 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-500" />
                        <div>
                          <span className="font-medium text-sm">
                            #{order.order_number}
                          </span>
                          {order.customer_name && (
                            <span className="text-xs text-slate-500 ml-2">
                              {order.customer_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {formatAmount(order.total_ttc)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            (order.matchScore || 0) >= 60
                              ? 'border-green-500 text-green-700'
                              : 'border-amber-500 text-amber-700'
                          }`}
                        >
                          {order.matchScore}%
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
                {suggestions[0]?.matchReasons && (
                  <p className="text-xs text-amber-600 mt-2">
                    Critères: {suggestions[0].matchReasons.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={v =>
                setActiveTab(v as 'orders' | 'purchase_orders' | 'documents')
              }
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="orders" className="gap-1 text-xs px-2">
                  <Package className="h-3 w-3" />
                  Clients
                </TabsTrigger>
                <TabsTrigger
                  value="purchase_orders"
                  className="gap-1 text-xs px-2"
                >
                  <Building2 className="h-3 w-3" />
                  Fournisseurs
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-1 text-xs px-2">
                  <FileText className="h-3 w-3" />
                  Documents
                </TabsTrigger>
              </TabsList>

              {/* Tab: Documents */}
              <TabsContent value="documents" className="flex-1 min-h-0 mt-4">
                {/* Recherche */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher par référence, organisation..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-[220px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Aucun document disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredDocuments.map(doc => {
                        const remaining = doc.total_ttc - doc.amount_paid;
                        return (
                          <div
                            key={doc.id}
                            onClick={() => {
                              setSelectedDocumentId(doc.id);
                              // Pré-remplir montant = min(restant transaction, restant document)
                              const defaultAmt = Math.min(
                                remainingAmount,
                                remaining
                              );
                              setAllocatedAmount(String(defaultAmt.toFixed(2)));
                            }}
                            className={`
                          p-3 rounded-lg border cursor-pointer transition-colors
                          ${selectedDocumentId === doc.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
                        `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {selectedDocumentId === doc.id ? (
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-blue-600" />
                                  </div>
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-sm">
                                    {doc.document_number}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {doc.partner_name ?? 'Sans partenaire'} -{' '}
                                    {formatDate(doc.document_date)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-sm">
                                  {formatAmount(doc.total_ttc)}
                                </span>
                                {doc.amount_paid > 0 && (
                                  <p className="text-xs text-slate-500">
                                    Reste: {formatAmount(remaining)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {selectedDocumentId && (
                  <div className="pt-4 border-t mt-4 space-y-3">
                    <div>
                      <label className="text-sm text-slate-600">
                        Montant à allouer (€)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={String(remainingAmount.toFixed(2))}
                        value={allocatedAmount}
                        onChange={e => setAllocatedAmount(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => void handleLinkDocument()}
                      disabled={isLinking}
                    >
                      {isLinking ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Liaison...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter ce document
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Tab: Commandes */}
              <TabsContent value="orders" className="flex-1 min-h-0 mt-4">
                {/* Recherche */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher par numéro de commande..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-[220px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Aucune commande trouvée</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredOrders.map(order => (
                        <div
                          key={order.id}
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            // Pré-remplir montant = min(restant transaction, restant commande)
                            const defaultAmt = Math.min(
                              remainingAmount,
                              order.remaining
                            );
                            setAllocatedAmount(String(defaultAmt.toFixed(2)));
                          }}
                          className={`
                        p-3 rounded-lg border cursor-pointer transition-colors
                        ${selectedOrderId === order.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
                        ${(order.matchScore || 0) >= 40 ? 'border-l-4 border-l-amber-400' : ''}
                      `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {selectedOrderId === order.id ? (
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-blue-600" />
                                </div>
                              ) : (order.matchScore || 0) >= 40 ? (
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                                  <Sparkles className="h-4 w-4 text-amber-600" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                  <Package className="h-4 w-4 text-slate-500" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  #{order.order_number}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {order.customer_name ?? 'Client'} -{' '}
                                  {formatDate(order.created_at)}
                                </p>
                                {order.matchReasons &&
                                  order.matchReasons.length > 0 && (
                                    <p className="text-xs text-amber-600 mt-0.5">
                                      {order.matchReasons.join(' • ')}
                                    </p>
                                  )}
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <span className="font-semibold text-sm">
                                  {formatAmount(order.total_ttc)}
                                </span>
                                {order.amount_paid > 0 && (
                                  <p className="text-xs text-slate-500">
                                    Payé: {formatAmount(order.amount_paid)} —
                                    Reste: {formatAmount(order.remaining)}
                                  </p>
                                )}
                                {(order.matchScore || 0) > 0 && (
                                  <Badge
                                    variant="outline"
                                    className={`ml-2 text-xs ${
                                      (order.matchScore || 0) >= 60
                                        ? 'border-green-500 text-green-700'
                                        : (order.matchScore || 0) >= 40
                                          ? 'border-amber-500 text-amber-700'
                                          : 'border-slate-300 text-slate-500'
                                    }`}
                                  >
                                    {order.matchScore}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {selectedOrderId && (
                  <div className="pt-4 border-t mt-4 space-y-3">
                    <div>
                      <label className="text-sm text-slate-600">
                        Montant à allouer (€)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={String(remainingAmount.toFixed(2))}
                        value={allocatedAmount}
                        onChange={e => setAllocatedAmount(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => void handleLinkOrder()}
                      disabled={isLinking}
                    >
                      {isLinking ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Liaison...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter cette commande
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Tab: Commandes Fournisseurs */}
              <TabsContent
                value="purchase_orders"
                className="flex-1 min-h-0 mt-4"
              >
                {/* Recherche */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher par numéro, fournisseur..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Suggestions pour commandes fournisseurs */}
                {purchaseOrderSuggestions.length > 0 &&
                  !selectedPurchaseOrderId && (
                    <div className="p-3 mb-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">
                          Suggestions
                        </span>
                      </div>
                      <div className="space-y-2">
                        {purchaseOrderSuggestions.map(po => (
                          <button
                            key={po.id}
                            onClick={() =>
                              void handleQuickLinkPurchaseOrder(po.id)
                            }
                            className="w-full flex items-center justify-between p-2 bg-white rounded border border-orange-200 hover:border-orange-400 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-slate-500" />
                              <div>
                                <span className="font-medium text-sm">
                                  #{po.po_number}
                                </span>
                                {po.supplier_name && (
                                  <span className="text-xs text-slate-500 ml-2">
                                    {po.supplier_name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                {formatAmount(po.total_ttc)}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${(po.matchScore || 0) >= 60 ? 'border-green-500 text-green-700' : 'border-orange-500 text-orange-700'}`}
                              >
                                {po.matchScore}%
                              </Badge>
                              <ArrowRight className="h-4 w-4 text-slate-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                <ScrollArea className="h-[180px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : filteredPurchaseOrders.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Aucune commande fournisseur trouvée</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPurchaseOrders.map(po => (
                        <div
                          key={po.id}
                          onClick={() => {
                            setSelectedPurchaseOrderId(po.id);
                            // Pré-remplir montant = min(restant transaction, total TTC PO)
                            const defaultAmt = Math.min(
                              remainingAmount,
                              po.total_ttc
                            );
                            setAllocatedAmount(String(defaultAmt.toFixed(2)));
                          }}
                          className={`
                        p-3 rounded-lg border cursor-pointer transition-colors
                        ${selectedPurchaseOrderId === po.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
                        ${(po.matchScore || 0) >= 40 ? 'border-l-4 border-l-orange-400' : ''}
                      `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {selectedPurchaseOrderId === po.id ? (
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-blue-600" />
                                </div>
                              ) : (po.matchScore || 0) >= 40 ? (
                                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                  <Sparkles className="h-4 w-4 text-orange-600" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-slate-500" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  #{po.po_number}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {po.supplier_name ?? 'Fournisseur'} -{' '}
                                  {formatDate(po.created_at)}
                                </p>
                                {po.matchReasons &&
                                  po.matchReasons.length > 0 && (
                                    <p className="text-xs text-orange-600 mt-0.5">
                                      {po.matchReasons.join(' • ')}
                                    </p>
                                  )}
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <span className="font-semibold text-sm">
                                  {formatAmount(po.total_ttc)}
                                </span>
                                {(po.matchScore || 0) > 0 && (
                                  <Badge
                                    variant="outline"
                                    className={`ml-2 text-xs ${
                                      (po.matchScore || 0) >= 60
                                        ? 'border-green-500 text-green-700'
                                        : (po.matchScore || 0) >= 40
                                          ? 'border-orange-500 text-orange-700'
                                          : 'border-slate-300 text-slate-500'
                                    }`}
                                  >
                                    {po.matchScore}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {selectedPurchaseOrderId && (
                  <div className="pt-4 border-t mt-4 space-y-3">
                    <div>
                      <label className="text-sm text-slate-600">
                        Montant à allouer (€)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={String(remainingAmount.toFixed(2))}
                        value={allocatedAmount}
                        onChange={e => setAllocatedAmount(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => void handleLinkPurchaseOrder()}
                      disabled={isLinking}
                    >
                      {isLinking ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Liaison...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter cette commande fournisseur
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
