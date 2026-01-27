'use client';

import { useState, useEffect, useMemo, use } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { PaymentRecordModal, ReconcileTransactionModal } from '@verone/finance';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { StatusPill } from '@verone/ui-business';
import { featureFlags } from '@verone/utils/feature-flags';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  FileText,
  CreditCard,
  Clock,
  Lock,
  Loader2,
  ExternalLink,
  MinusCircle,
  Send,
  Trash2,
  Mail,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Pencil,
  Landmark,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';

// =====================================================================
// TYPES
// =====================================================================

type DocumentType = 'invoice' | 'quote' | 'credit_note';

interface QontoClient {
  id: string;
  name: string;
  email?: string;
  billing_address?: {
    street_address?: string;
    city?: string;
    zip_code?: string;
    country_code?: string;
  };
}

interface QontoInvoiceItem {
  title: string;
  description?: string;
  quantity: string;
  unit?: string;
  unit_price: { value: string; currency: string };
  vat_rate: string;
  total_amount?: { value: string; currency: string };
}

interface QontoDocument {
  id: string;
  // Common fields
  status: string;
  currency: string;
  issue_date: string;
  client_id: string;
  client?: QontoClient;
  items?: QontoInvoiceItem[];
  pdf_url?: string;
  attachment_id?: string;
  public_url?: string;
  created_at: string;
  updated_at: string;
  // Invoice specific
  invoice_number?: string;
  payment_deadline?: string;
  total_amount_cents?: number;
  total_vat_amount_cents?: number;
  subtotal_amount_cents?: number;
  paid_at?: string;
  finalized_at?: string;
  cancelled_at?: string;
  // Quote specific
  quote_number?: string;
  expiry_date?: string;
  converted_to_invoice_id?: string;
  accepted_at?: string;
  declined_at?: string;
  // Credit note specific
  credit_note_number?: string;
  invoice_id?: string;
  reason?: string;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatAmount(cents: number | undefined, currency = 'EUR'): string {
  if (cents === undefined || cents === null) return '-';
  const amount = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatVatRate(vatRate: string | number | undefined): string {
  if (vatRate === undefined || vatRate === null) return '-';
  // Qonto returns vat_rate as decimal (e.g., "0.20" for 20%)
  const rate = typeof vatRate === 'string' ? parseFloat(vatRate) : vatRate;
  // If rate is less than 1, it's a decimal - multiply by 100
  const percentage = rate < 1 ? rate * 100 : rate;
  return `${percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}%`;
}

// Calculate totals from items if not provided by API
function calculateTotalsFromItems(items: QontoInvoiceItem[]): {
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
} {
  let subtotalCents = 0;
  let vatCents = 0;

  for (const item of items) {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price?.value || '0');
    const vatRate = parseFloat(item.vat_rate || '0');

    const itemSubtotal = quantity * unitPrice;
    // vatRate is decimal (0.20 for 20%)
    const itemVat = itemSubtotal * vatRate;

    subtotalCents += Math.round(itemSubtotal * 100);
    vatCents += Math.round(itemVat * 100);
  }

  return {
    subtotalCents,
    vatCents,
    totalCents: subtotalCents + vatCents,
  };
}

function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    invoice: 'Facture',
    quote: 'Devis',
    credit_note: 'Avoir',
  };
  return labels[type] || type;
}

function getDocumentNumber(doc: QontoDocument, type: DocumentType): string {
  switch (type) {
    case 'invoice':
      return doc.invoice_number || doc.id;
    case 'quote':
      return doc.quote_number || doc.id;
    case 'credit_note':
      return doc.credit_note_number || doc.id;
    default:
      return doc.id;
  }
}

// =====================================================================
// COMPOSANTS
// =====================================================================

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-900">{children}</span>
    </div>
  );
}

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get type from query param, default to trying invoice first
  const typeParam = searchParams.get('type') as DocumentType | null;

  const [document, setDocument] = useState<QontoDocument | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(
    typeParam || 'invoice'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // Fetch document data
  useEffect(() => {
    async function fetchDocument() {
      setLoading(true);
      setError(null);

      // Try to fetch based on type param or auto-detect
      const typesToTry: DocumentType[] = typeParam
        ? [typeParam]
        : ['invoice', 'quote', 'credit_note'];

      for (const type of typesToTry) {
        try {
          const endpoint =
            type === 'invoice'
              ? `/api/qonto/invoices/${id}`
              : type === 'quote'
                ? `/api/qonto/quotes/${id}`
                : `/api/qonto/credit-notes/${id}`;

          const response = await fetch(endpoint);
          const data = await response.json();

          if (data.success) {
            const doc = data.invoice || data.quote || data.credit_note;
            setDocument(doc);
            setDocumentType(type);
            setLoading(false);
            return;
          }
        } catch {
          // Continue to next type
        }
      }

      setError('Document non trouvé');
      setLoading(false);
    }

    fetchDocument();
  }, [id, typeParam]);

  // ===== ACTION HANDLERS =====

  const handleFinalize = async () => {
    if (!document) return;
    setActionLoading('finalize');
    setShowFinalizeDialog(false);

    try {
      const endpoint =
        documentType === 'invoice'
          ? `/api/qonto/invoices/${id}/finalize`
          : documentType === 'quote'
            ? `/api/qonto/quotes/${id}/finalize`
            : `/api/qonto/credit-notes/${id}/finalize`;

      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      toast.success('Document finalisé avec succès');
      window.location.reload();
    } catch (err) {
      toast.error(
        `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    setActionLoading('delete');
    setShowDeleteDialog(false);

    try {
      const endpoint =
        documentType === 'invoice'
          ? `/api/qonto/invoices/${id}/delete`
          : documentType === 'quote'
            ? `/api/qonto/quotes/${id}`
            : `/api/qonto/credit-notes/${id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });
      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      toast.success('Document supprimé');
      router.push('/factures');
    } catch (err) {
      toast.error(
        `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!document || documentType !== 'quote') return;
    setActionLoading('convert');
    setShowConvertDialog(false);

    try {
      const response = await fetch(`/api/qonto/quotes/${id}/convert`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      toast.success('Devis converti en facture');
      if (data.invoice?.id) {
        router.push(`/factures/${data.invoice.id}?type=invoice`);
      } else {
        window.location.reload();
      }
    } catch (err) {
      toast.error(
        `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCreditNote = async () => {
    if (!document || documentType !== 'invoice') return;
    setActionLoading('creditNote');
    setShowCreditNoteDialog(false);

    try {
      const response = await fetch('/api/qonto/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: id,
          reason: `Avoir sur facture ${document.invoice_number}`,
        }),
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      toast.success('Avoir créé en brouillon');
      if (data.creditNote?.id) {
        router.push(`/factures/${data.creditNote.id}?type=credit_note`);
      }
    } catch (err) {
      toast.error(
        `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptQuote = async () => {
    if (!document || documentType !== 'quote') return;
    setActionLoading('accept');
    setShowAcceptDialog(false);

    try {
      const response = await fetch(`/api/qonto/quotes/${id}/accept`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      toast.success('Devis accepté');
      window.location.reload();
    } catch (err) {
      toast.error(
        `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineQuote = async () => {
    if (!document || documentType !== 'quote') return;
    setActionLoading('decline');
    setShowDeclineDialog(false);

    try {
      const response = await fetch(`/api/qonto/quotes/${id}/decline`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      toast.success('Devis refusé');
      window.location.reload();
    } catch (err) {
      toast.error(
        `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async () => {
    if (!document) return;
    setActionLoading('email');

    try {
      const endpoint =
        documentType === 'invoice'
          ? `/api/qonto/invoices/${id}/send`
          : documentType === 'quote'
            ? `/api/qonto/quotes/${id}/send`
            : `/api/qonto/credit-notes/${id}/send`;

      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      toast.success('Email envoyé au client');
    } catch (err) {
      toast.error(
        `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = () => {
    if (!document) return;
    const pdfPath =
      documentType === 'invoice'
        ? `/api/qonto/invoices/${id}/pdf`
        : documentType === 'quote'
          ? `/api/qonto/quotes/${id}/pdf`
          : `/api/qonto/credit-notes/${id}/pdf`;
    window.open(pdfPath, '_blank');
  };

  const _handleMarkPaid = async () => {
    if (!document || documentType !== 'invoice') return;
    setActionLoading('markPaid');

    try {
      const response = await fetch(`/api/qonto/invoices/${id}/mark-paid`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      toast.success('Facture marquée comme payée');
      window.location.reload();
    } catch (err) {
      toast.error(
        `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async () => {
    if (!document) return;
    setActionLoading('archive');
    setShowArchiveDialog(false);

    try {
      const response = await fetch(`/api/financial-documents/${id}/archive`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      toast.success('Facture archivée avec succès');
      router.push('/factures');
    } catch (err) {
      toast.error(
        `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    } finally {
      setActionLoading(null);
    }
  };

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

  // ===== RENDER =====

  // Feature flag check
  if (!featureFlags.financeEnabled) {
    return (
      <div className="w-full py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">
                  Module Finance - Phase 2
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Ce module sera disponible après le déploiement Phase 1
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/factures">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <p>{error || 'Document non trouvé'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const docNumber = getDocumentNumber(document, documentType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/factures">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{docNumber}</h1>
              <StatusPill status={document.status} size="md" />
              {isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <Clock className="h-3 w-3" />
                  En retard
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {getDocumentTypeLabel(documentType)} Qonto
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* PDF */}
          <Button variant="outline" onClick={handleDownloadPdf}>
            <FileText className="h-4 w-4 mr-2" />
            Voir PDF
          </Button>

          {/* Edit (drafts only) */}
          {isDraft && (
            <Button variant="outline" asChild>
              <Link href={`/factures/${id}/edit?type=${documentType}`}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </Button>
          )}

          {/* Finalize (drafts only) */}
          {isDraft && (
            <Button
              variant="outline"
              onClick={() => setShowFinalizeDialog(true)}
              disabled={actionLoading === 'finalize'}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {actionLoading === 'finalize' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Finaliser
            </Button>
          )}

          {/* Send email (finalized only) */}
          {isFinalized && (
            <Button
              variant="outline"
              onClick={handleSendEmail}
              disabled={actionLoading === 'email'}
            >
              {actionLoading === 'email' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Envoyer par email
            </Button>
          )}

          {/* Payment actions (invoices, finalized, not paid) */}
          {documentType === 'invoice' && isFinalized && !isPaid && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Enregistrer paiement
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReconcileModal(true)}
              >
                <Landmark className="h-4 w-4 mr-2" />
                Rapprochement bancaire
              </Button>
            </>
          )}

          {/* Convert to invoice (quotes) */}
          {documentType === 'quote' &&
            (document.status === 'finalized' ||
              document.status === 'accepted') && (
              <Button
                variant="outline"
                onClick={() => setShowConvertDialog(true)}
                disabled={actionLoading === 'convert'}
              >
                {actionLoading === 'convert' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                )}
                Convertir en facture
              </Button>
            )}

          {/* Accept/Decline (quotes, finalized) */}
          {documentType === 'quote' && document.status === 'finalized' && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowAcceptDialog(true)}
                disabled={actionLoading === 'accept'}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                {actionLoading === 'accept' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Accepter
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeclineDialog(true)}
                disabled={actionLoading === 'decline'}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                {actionLoading === 'decline' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Refuser
              </Button>
            </>
          )}

          {/* Create credit note (invoices, finalized) */}
          {documentType === 'invoice' && isFinalized && (
            <Button
              variant="outline"
              onClick={() => setShowCreditNoteDialog(true)}
              disabled={actionLoading === 'creditNote'}
            >
              {actionLoading === 'creditNote' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MinusCircle className="h-4 w-4 mr-2" />
              )}
              Créer un avoir
            </Button>
          )}

          {/* Archive (validated invoices only) */}
          {documentType === 'invoice' &&
            !isCancelled &&
            ['draft_validated', 'finalized', 'sent', 'paid'].includes(
              (document as any)?.workflow_status || ''
            ) && (
              <Button
                variant="outline"
                onClick={() => setShowArchiveDialog(true)}
                disabled={actionLoading === 'archive'}
              >
                {actionLoading === 'archive' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4 mr-2" />
                )}
                Archiver
              </Button>
            )}

          {/* Delete (drafts only) */}
          {isDraft && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              disabled={actionLoading === 'delete'}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              {actionLoading === 'delete' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations {getDocumentTypeLabel(documentType).toLowerCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <InfoRow label="Numéro">{docNumber}</InfoRow>
                  <InfoRow label="Statut">
                    <StatusPill status={document.status} size="sm" />
                  </InfoRow>
                  <InfoRow label="Date d'émission">
                    {formatDate(document.issue_date)}
                  </InfoRow>
                  {documentType === 'invoice' && document.payment_deadline && (
                    <InfoRow label="Échéance">
                      <span className={isOverdue ? 'text-red-600' : ''}>
                        {formatDate(document.payment_deadline)}
                      </span>
                    </InfoRow>
                  )}
                  {documentType === 'quote' && document.expiry_date && (
                    <InfoRow label="Validité">
                      {formatDate(document.expiry_date)}
                    </InfoRow>
                  )}
                  {documentType === 'credit_note' && document.invoice_id && (
                    <InfoRow label="Facture liée">
                      <Link
                        href={`/factures/${document.invoice_id}?type=invoice`}
                        className="text-primary hover:underline"
                      >
                        Voir la facture
                      </Link>
                    </InfoRow>
                  )}
                </div>
                <div>
                  <InfoRow label="Montant HT">
                    {formatAmount(
                      computedTotals.subtotalCents,
                      document.currency
                    )}
                  </InfoRow>
                  <InfoRow label="Montant TVA">
                    {formatAmount(computedTotals.vatCents, document.currency)}
                  </InfoRow>
                  <InfoRow label="Montant TTC">
                    <span className="font-bold">
                      {formatAmount(
                        documentType === 'credit_note'
                          ? Math.abs(computedTotals.totalCents)
                          : computedTotals.totalCents,
                        document.currency
                      )}
                    </span>
                  </InfoRow>
                </div>
              </div>

              {document.reason && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-slate-600 mb-1">
                      Motif de l&apos;avoir
                    </p>
                    <p className="text-sm">{document.reason}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Items table */}
          {document.items && document.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lignes</CardTitle>
                <CardDescription>
                  {document.items.length} ligne
                  {document.items.length > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">P.U. HT</TableHead>
                      <TableHead className="text-right">TVA</TableHead>
                      <TableHead className="text-right">Total HT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {document.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {item.unit || ''}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.unit_price?.value} {item.unit_price?.currency}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatVatRate(item.vat_rate)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.total_amount?.value}{' '}
                          {item.total_amount?.currency}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client info */}
          {document.client && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{document.client.name}</p>
                  {document.client.email && (
                    <p className="text-sm text-slate-600">
                      {document.client.email}
                    </p>
                  )}
                  {document.client.billing_address && (
                    <div className="text-sm text-slate-600">
                      {document.client.billing_address.street_address && (
                        <p>{document.client.billing_address.street_address}</p>
                      )}
                      <p>
                        {document.client.billing_address.zip_code}{' '}
                        {document.client.billing_address.city}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment summary (invoices only) */}
          {documentType === 'invoice' && (
            <Card>
              <CardHeader>
                <CardTitle>Paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total TTC</span>
                  <span className="font-bold">
                    {formatAmount(
                      document.total_amount_cents,
                      document.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Statut</span>
                  <StatusPill status={document.status} size="sm" />
                </div>
                {document.paid_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Payée le</span>
                    <span className="text-green-600 font-medium">
                      {formatDate(document.paid_at)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Related invoice (credit notes) */}
          {documentType === 'credit_note' && document.invoice_id && (
            <Card>
              <CardHeader>
                <CardTitle>Facture d&apos;origine</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/factures/${document.invoice_id}?type=invoice`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Voir la facture
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Converted invoice (quotes) */}
          {documentType === 'quote' && document.converted_to_invoice_id && (
            <Card>
              <CardHeader>
                <CardTitle>Facture créée</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/factures/${document.converted_to_invoice_id}?type=invoice`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Voir la facture
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Métadonnées</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500 space-y-1">
              <p>Créé le {formatDate(document.created_at)}</p>
              <p>Modifié le {formatDate(document.updated_at)}</p>
              {document.finalized_at && (
                <p>Finalisé le {formatDate(document.finalized_at)}</p>
              )}
              <p className="font-mono text-[10px] text-slate-400 mt-2">
                ID: {document.id}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== DIALOGS ===== */}

      {/* Finalize dialog */}
      <AlertDialog
        open={showFinalizeDialog}
        onOpenChange={setShowFinalizeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Finaliser ce document ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                Cette action est IRRÉVERSIBLE.
              </p>
              <p>
                Une fois finalisé, le document ne pourra plus être modifié ni
                supprimé. Il recevra un numéro officiel et sera enregistré
                définitivement.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={handleFinalize}
            >
              Oui, finaliser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Supprimer ce document ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive et ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to invoice dialog */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action créera une facture basée sur ce devis. Le devis sera
              marqué comme converti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertToInvoice}>
              Convertir en facture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create credit note dialog */}
      <AlertDialog
        open={showCreditNoteDialog}
        onOpenChange={setShowCreditNoteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Créer un avoir ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action créera un avoir en brouillon lié à cette facture.
              L&apos;avoir devra être finalisé séparément.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateCreditNote}>
              Créer l&apos;avoir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept quote dialog */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Accepter ce devis ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le devis sera marqué comme accepté par le client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={handleAcceptQuote}
            >
              Marquer accepté
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline quote dialog */}
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Refuser ce devis ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le devis sera marqué comme refusé par le client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeclineQuote}
            >
              Marquer refusé
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archiver cette facture ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Cette facture sera masquée de la liste principale et déplacée
                dans les archives.
              </p>
              <p>
                Vous pourrez la restaurer depuis l&apos;onglet
                &quot;Archives&quot; si nécessaire.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Record Modal */}
      {documentType === 'invoice' && (
        <PaymentRecordModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          invoiceId={id}
          invoiceNumber={document.invoice_number || docNumber}
          totalAmount={computedTotals.totalCents / 100}
          currency={document.currency}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Reconcile Transaction Modal */}
      {documentType === 'invoice' && (
        <ReconcileTransactionModal
          open={showReconcileModal}
          onOpenChange={setShowReconcileModal}
          invoiceId={id}
          invoiceNumber={document.invoice_number || docNumber}
          invoiceAmount={computedTotals.totalCents}
          currency={document.currency}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
