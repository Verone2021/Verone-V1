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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TooltipProvider,
} from '@verone/ui';
import { qontoInvoiceStatusConfig, StatusPill } from '@verone/ui-business';
import { featureFlags } from '@verone/utils/feature-flags';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronRight,
  FileText,
  CreditCard,
  Clock,
  Hash,
  Lock,
  Loader2,
  ExternalLink,
  MapPin,
  MinusCircle,
  MoreVertical,
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

interface QontoApiResponse {
  success: boolean;
  error?: string;
  invoice?: QontoDocument;
  quote?: QontoDocument;
  credit_note?: QontoDocument;
}

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
  number?: string; // Qonto API returns 'number' (e.g. "F-2026-002")
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
  // Workflow
  workflow_status?: string;
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
    const unitPrice = parseFloat(item.unit_price?.value ?? '0');
    const vatRate = parseFloat(item.vat_rate ?? '0');

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
  return labels[type] ?? type;
}

function getDocumentNumber(doc: QontoDocument, type: DocumentType): string {
  // Qonto API returns 'number' field (e.g. "F-2026-002")
  // Legacy mapping also checks type-specific fields
  switch (type) {
    case 'invoice':
      return doc.number ?? doc.invoice_number ?? doc.id;
    case 'quote':
      return doc.number ?? doc.quote_number ?? doc.id;
    case 'credit_note':
      return doc.number ?? doc.credit_note_number ?? doc.id;
    default:
      return doc.number ?? doc.id;
  }
}

// Helper: check if email is a technical/generated email (not a real client email)
function isTechnicalEmail(email: string): boolean {
  return email.includes('noreply') || email.endsWith('@verone.app');
}

// Friendly error messages for Qonto API errors
function getFriendlyErrorMessage(action: string, errorMessage: string): string {
  if (errorMessage.includes('422')) {
    switch (action) {
      case 'email':
        return "L'email du client n'est pas configuré ou est invalide dans Qonto. Veuillez vérifier la fiche client sur Qonto avant d'envoyer.";
      case 'reconcile':
        return 'Impossible de charger les transactions bancaires. Vérifiez la connexion Qonto et les paramètres du compte bancaire.';
      case 'finalize':
        return 'Impossible de finaliser ce document. Vérifiez que tous les champs obligatoires sont remplis dans Qonto.';
      case 'creditNote':
        return "Impossible de créer l'avoir. Vérifiez que la facture est bien finalisée dans Qonto.";
      default:
        return `Erreur de validation Qonto. Vérifiez la configuration dans Qonto. (${errorMessage})`;
    }
  }
  return errorMessage;
}

// =====================================================================
// COMPOSANTS
// =====================================================================

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
    typeParam ?? 'invoice'
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
          const data = (await response.json()) as QontoApiResponse;

          if (data.success) {
            const doc = data.invoice ?? data.quote ?? data.credit_note ?? null;
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

    void fetchDocument().catch(error => {
      console.error('[DocumentDetail] Fetch failed:', error);
    });
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
      const data = (await response.json()) as QontoApiResponse;

      if (!data.success) throw new Error(data.error);

      toast.success('Document finalisé avec succès');
      window.location.reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(getFriendlyErrorMessage('finalize', msg));
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
      const data = (await response.json()) as QontoApiResponse;

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
      const data = (await response.json()) as QontoApiResponse;

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
      const data = (await response.json()) as QontoApiResponse;

      if (!data.success) throw new Error(data.error);

      toast.success('Avoir créé en brouillon');
      if (data.credit_note?.id) {
        router.push(`/factures/${data.credit_note.id}?type=credit_note`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(getFriendlyErrorMessage('creditNote', msg));
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
      const data = (await response.json()) as QontoApiResponse;

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
      const data = (await response.json()) as QontoApiResponse;

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
      const data = (await response.json()) as QontoApiResponse;

      if (!data.success) throw new Error(data.error);

      toast.success('Email envoyé au client');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(getFriendlyErrorMessage('email', msg));
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
      const data = (await response.json()) as QontoApiResponse;

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
      const data = (await response.json()) as QontoApiResponse;

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
  const isCancelled =
    document?.status === 'cancelled' || document?.status === 'canceled';
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
              <p>{error ?? 'Document non trouvé'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const docNumber = getDocumentNumber(document, documentType);
  const clientEmail = document.client?.email;
  const showClientEmail = clientEmail && !isTechnicalEmail(clientEmail);

  // Extended status config for StatusPill
  const statusConfig = {
    ...qontoInvoiceStatusConfig,
    canceled: { label: 'Annulée', variant: 'secondary' as const }, // US spelling from Qonto API
    finalized: { label: 'Finalisée', variant: 'default' as const },
    pending: { label: 'En attente', variant: 'warning' as const },
    sent: { label: 'Envoyée', variant: 'default' as const },
    accepted: { label: 'Accepté', variant: 'success' as const },
    declined: { label: 'Refusé', variant: 'destructive' as const },
  };

  // Client initials for avatar
  const clientInitials = document.client?.name
    ? document.client.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '??';

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            href="/factures"
            className="hover:text-foreground transition-colors"
          >
            Finance
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href="/factures"
            className="hover:text-foreground transition-colors"
          >
            Factures
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{docNumber}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{docNumber}</h1>
              <StatusPill
                status={document.status}
                config={statusConfig}
                size="md"
              />
              {isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <Clock className="h-3 w-3" />
                  En retard
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {getDocumentTypeLabel(documentType)} Qonto
              {document.issue_date &&
                ` · Émise le ${formatDate(document.issue_date)}`}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* PDF - Primary action */}
            <Button onClick={handleDownloadPdf}>
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

            {/* Payment actions (invoices, finalized, not paid) */}
            {documentType === 'invoice' && isFinalized && !isPaid && (
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Enregistrer paiement
              </Button>
            )}

            {/* More actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Plus d&apos;actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Send email */}
                {isFinalized && (
                  <DropdownMenuItem
                    disabled={actionLoading === 'email'}
                    onClick={() => {
                      void handleSendEmail().catch(err => {
                        console.error(
                          '[DocumentDetail] Send email failed:',
                          err
                        );
                      });
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer par email
                  </DropdownMenuItem>
                )}

                {/* Reconcile */}
                {documentType === 'invoice' && isFinalized && !isPaid && (
                  <DropdownMenuItem onClick={() => setShowReconcileModal(true)}>
                    <Landmark className="h-4 w-4 mr-2" />
                    Rapprochement bancaire
                  </DropdownMenuItem>
                )}

                {/* Convert to invoice (quotes) */}
                {documentType === 'quote' &&
                  (document.status === 'finalized' ||
                    document.status === 'accepted') && (
                    <DropdownMenuItem
                      disabled={actionLoading === 'convert'}
                      onClick={() => setShowConvertDialog(true)}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Convertir en facture
                    </DropdownMenuItem>
                  )}

                {/* Accept/Decline (quotes) */}
                {documentType === 'quote' &&
                  document.status === 'finalized' && (
                    <>
                      <DropdownMenuItem
                        disabled={actionLoading === 'accept'}
                        onClick={() => setShowAcceptDialog(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accepter
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={actionLoading === 'decline'}
                        onClick={() => setShowDeclineDialog(true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Refuser
                      </DropdownMenuItem>
                    </>
                  )}

                {/* Create credit note */}
                {documentType === 'invoice' && isFinalized && (
                  <DropdownMenuItem
                    disabled={actionLoading === 'creditNote'}
                    onClick={() => setShowCreditNoteDialog(true)}
                  >
                    <MinusCircle className="h-4 w-4 mr-2" />
                    Créer un avoir
                  </DropdownMenuItem>
                )}

                {/* Archive */}
                {documentType === 'invoice' &&
                  !isCancelled &&
                  ['draft_validated', 'finalized', 'sent', 'paid'].includes(
                    document?.workflow_status ?? ''
                  ) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={actionLoading === 'archive'}
                        onClick={() => setShowArchiveDialog(true)}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archiver
                      </DropdownMenuItem>
                    </>
                  )}

                {/* Delete (drafts only) */}
                {isDraft && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={actionLoading === 'delete'}
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Hash className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Numéro</p>
                        <p className="font-medium">{docNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Date d&apos;émission
                        </p>
                        <p className="font-medium">
                          {formatDate(document.issue_date)}
                        </p>
                      </div>
                    </div>
                    {documentType === 'invoice' &&
                      document.payment_deadline && (
                        <div className="flex items-start gap-3">
                          <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Échéance
                            </p>
                            <p
                              className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}
                            >
                              {formatDate(document.payment_deadline)}
                              {isOverdue && ' (en retard)'}
                            </p>
                          </div>
                        </div>
                      )}
                    {documentType === 'quote' && document.expiry_date && (
                      <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Validité
                          </p>
                          <p className="font-medium">
                            {formatDate(document.expiry_date)}
                          </p>
                        </div>
                      </div>
                    )}
                    {documentType === 'credit_note' && document.invoice_id && (
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Facture liée
                          </p>
                          <Link
                            href={`/factures/${document.invoice_id}?type=invoice`}
                            className="font-medium text-primary hover:underline"
                          >
                            Voir la facture
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-muted-foreground">
                        Montant HT
                      </span>
                      <span className="text-sm font-medium">
                        {formatAmount(
                          computedTotals.subtotalCents,
                          document.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-muted-foreground">TVA</span>
                      <span className="text-sm font-medium">
                        {formatAmount(
                          computedTotals.vatCents,
                          document.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm font-semibold">Total TTC</span>
                      <span className="text-lg font-bold">
                        {formatAmount(
                          documentType === 'credit_note'
                            ? Math.abs(computedTotals.totalCents)
                            : computedTotals.totalCents,
                          document.currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {document.reason && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
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
                      {document.items.map((item, index) => {
                        // Calculate real HT = unit_price * quantity
                        const qty = parseFloat(item.quantity) || 0;
                        const unitPrice = parseFloat(
                          item.unit_price?.value ?? '0'
                        );
                        const lineHt = qty * unitPrice;
                        return (
                          <TableRow
                            key={index}
                            className={index % 2 === 1 ? 'bg-muted/50' : ''}
                          >
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
                            <TableCell className="text-right tabular-nums">
                              {item.quantity} {item.unit ?? ''}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatAmount(
                                Math.round(unitPrice * 100),
                                item.unit_price?.currency ?? document.currency
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatVatRate(item.vat_rate)}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatAmount(
                                Math.round(lineHt * 100),
                                document.currency
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-right font-medium"
                        >
                          Sous-total HT
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatAmount(
                            computedTotals.subtotalCents,
                            document.currency
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-right text-muted-foreground"
                        >
                          TVA
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {formatAmount(
                            computedTotals.vatCents,
                            document.currency
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold">
                          Total TTC
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                          {formatAmount(
                            documentType === 'credit_note'
                              ? Math.abs(computedTotals.totalCents)
                              : computedTotals.totalCents,
                            document.currency
                          )}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
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
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {clientInitials}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium leading-tight">
                        {document.client.name}
                      </p>
                      {showClientEmail && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{clientEmail}</span>
                        </p>
                      )}
                      {document.client.billing_address && (
                        <div className="text-sm text-muted-foreground flex items-start gap-1 pt-1">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                          <div>
                            {document.client.billing_address.street_address && (
                              <p>
                                {document.client.billing_address.street_address}
                              </p>
                            )}
                            <p>
                              {document.client.billing_address.zip_code}{' '}
                              {document.client.billing_address.city}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment summary (invoices only) */}
            {documentType === 'invoice' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment progress bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        {isPaid ? 'Payé' : 'Restant à payer'}
                      </span>
                      <span className="font-bold">
                        {formatAmount(
                          document.total_amount_cents,
                          document.currency
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isPaid
                            ? 'bg-green-500 w-full'
                            : isOverdue
                              ? 'bg-red-400 w-0'
                              : 'bg-amber-400 w-0'
                        }`}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Statut
                    </span>
                    <StatusPill
                      status={document.status}
                      config={statusConfig}
                      size="sm"
                    />
                  </div>
                  {document.paid_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Payée le
                      </span>
                      <span className="text-sm text-green-600 font-medium">
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
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Métadonnées
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Créé le {formatDate(document.created_at)}</p>
                  <p>Modifié le {formatDate(document.updated_at)}</p>
                  {document.finalized_at && (
                    <p>Finalisé le {formatDate(document.finalized_at)}</p>
                  )}
                  <p className="font-mono text-[10px] text-slate-400 pt-2 break-all">
                    ID: {document.id}
                  </p>
                </div>
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
                onClick={() => {
                  void handleFinalize().catch(error => {
                    console.error('[DocumentDetail] Finalize failed:', error);
                  });
                }}
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
                onClick={() => {
                  void handleDelete().catch(error => {
                    console.error('[DocumentDetail] Delete failed:', error);
                  });
                }}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Convert to invoice dialog */}
        <AlertDialog
          open={showConvertDialog}
          onOpenChange={setShowConvertDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Convertir en facture ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action créera une facture basée sur ce devis. Le devis
                sera marqué comme converti.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  void handleConvertToInvoice().catch(error => {
                    console.error('[DocumentDetail] Convert failed:', error);
                  });
                }}
              >
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
              <AlertDialogAction
                onClick={() => {
                  void handleCreateCreditNote().catch(error => {
                    console.error(
                      '[DocumentDetail] Create credit note failed:',
                      error
                    );
                  });
                }}
              >
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
                onClick={() => {
                  void handleAcceptQuote().catch(error => {
                    console.error(
                      '[DocumentDetail] Accept quote failed:',
                      error
                    );
                  });
                }}
              >
                Marquer accepté
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Decline quote dialog */}
        <AlertDialog
          open={showDeclineDialog}
          onOpenChange={setShowDeclineDialog}
        >
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
                onClick={() => {
                  void handleDeclineQuote().catch(error => {
                    console.error(
                      '[DocumentDetail] Decline quote failed:',
                      error
                    );
                  });
                }}
              >
                Marquer refusé
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Archive dialog */}
        <AlertDialog
          open={showArchiveDialog}
          onOpenChange={setShowArchiveDialog}
        >
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
              <AlertDialogAction
                onClick={() => {
                  void handleArchive().catch(error => {
                    console.error('[DocumentDetail] Archive failed:', error);
                  });
                }}
              >
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
            invoiceNumber={docNumber}
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
            invoiceNumber={docNumber}
            invoiceAmount={computedTotals.totalCents}
            currency={document.currency}
            onSuccess={() => window.location.reload()}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
