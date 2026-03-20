'use client';

import { useState, useEffect, useCallback, use } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { QuoteStatusBadge } from '@verone/finance/components';
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
  CardHeader,
  CardTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
// Money removed — using formatAmountCents for Qonto _cents values
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  Check,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';

// =====================================================================
// TYPES (Qonto API response)
// =====================================================================

interface QontoQuoteItem {
  id?: string;
  title: string;
  description?: string;
  quantity: string; // Qonto returns string
  unit?: string;
  unit_price: { value: string; currency: string }; // Qonto returns object
  vat_rate: string; // Qonto returns decimal string e.g. "0.20"
  total_amount?: { value: string; currency: string };
}

interface QontoQuoteDetail {
  id: string;
  number?: string; // Qonto raw field
  quote_number?: string; // mapped field
  status: string;
  currency: string;
  client_id: string;
  client?: {
    id: string;
    name: string;
    type?: string;
    email?: string;
    address?: {
      street_address?: string;
      city?: string;
      zip_code?: string;
      country_code?: string;
    };
  };
  issue_date: string;
  expiry_date: string;
  accepted_at?: string;
  declined_at?: string;
  // Qonto uses _cents for amounts
  total_amount_cents?: number;
  total_vat_amount_cents?: number;
  subtotal_amount_cents?: number;
  items: QontoQuoteItem[];
  purchase_order_number?: string;
  header?: string;
  footer?: string;
  terms_and_conditions?: string;
  attachment_id?: string;
  pdf_url?: string;
  public_url?: string;
  converted_to_invoice_id?: string;
  created_at: string;
  updated_at: string;
  finalized_at?: string;
}

interface ApiResponse {
  success: boolean;
  quote?: QontoQuoteDetail;
  error?: string;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/** Format cents to EUR string (same as facture detail page) */
function formatAmountCents(
  cents: number | undefined | null,
  currency = 'EUR'
): string {
  if (cents === undefined || cents === null) return '-';
  const amount = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatVatRate(vatRate: string | number | undefined): string {
  if (vatRate === undefined || vatRate === null) return '-';
  const rate = typeof vatRate === 'string' ? parseFloat(vatRate) : vatRate;
  // If rate < 1, it's a decimal (e.g. 0.20 for 20%)
  const percentage = rate < 1 ? rate * 100 : rate;
  return `${percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}%`;
}

// =====================================================================
// STATUS ACTIONS
// =====================================================================

interface StatusAction {
  label: string;
  action: string;
  variant: 'default' | 'destructive' | 'outline';
  icon: React.ReactNode;
  confirmTitle: string;
  confirmDescription: string;
}

function getStatusActions(status: string): StatusAction[] {
  const actions: StatusAction[] = [];

  if (status === 'draft') {
    actions.push({
      label: 'Finaliser',
      action: 'finalize',
      variant: 'default',
      icon: <Check className="mr-2 h-4 w-4" />,
      confirmTitle: 'Finaliser le devis ?',
      confirmDescription:
        'Le devis sera finalisé et envoyé. Il ne pourra plus être modifié.',
    });
  }

  if (status === 'finalized' || status === 'pending_approval') {
    actions.push({
      label: 'Marquer accepté',
      action: 'accept',
      variant: 'default',
      icon: <Check className="mr-2 h-4 w-4" />,
      confirmTitle: 'Marquer comme accepté ?',
      confirmDescription: 'Le devis sera marqué comme accepté par le client.',
    });
    actions.push({
      label: 'Marquer refusé',
      action: 'decline',
      variant: 'destructive',
      icon: <XCircle className="mr-2 h-4 w-4" />,
      confirmTitle: 'Marquer comme refusé ?',
      confirmDescription:
        'Le devis sera marqué comme refusé. Cette action est irréversible.',
    });
  }

  if (status === 'accepted') {
    actions.push({
      label: 'Convertir en facture',
      action: 'convert',
      variant: 'default',
      icon: <ArrowRightLeft className="mr-2 h-4 w-4" />,
      confirmTitle: 'Convertir en facture ?',
      confirmDescription:
        'Une facture brouillon sera créée depuis ce devis. Cette action est irréversible.',
    });
  }

  return actions;
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [quote, setQuote] = useState<QontoQuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<StatusAction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // -----------------------------------------------------------------
  // LOAD QUOTE FROM QONTO API
  // -----------------------------------------------------------------
  const loadQuote = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/qonto/quotes/${id}`);
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.success || !data.quote) {
        throw new Error(data.error ?? 'Devis introuvable');
      }
      setQuote(data.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  // -----------------------------------------------------------------
  // ACTIONS
  // -----------------------------------------------------------------
  const handleAction = useCallback(
    async (action: string) => {
      setActionLoading(true);
      try {
        const response = await fetch(`/api/qonto/quotes/${id}/${action}`, {
          method: 'POST',
        });
        const data = (await response.json()) as {
          success: boolean;
          error?: string;
        };
        if (!response.ok || !data.success) {
          throw new Error(data.error ?? `Erreur: ${action}`);
        }
        toast.success(
          action === 'finalize'
            ? 'Devis finalisé'
            : action === 'accept'
              ? 'Devis accepté'
              : action === 'decline'
                ? 'Devis refusé'
                : action === 'convert'
                  ? 'Facture créée depuis le devis'
                  : 'Action effectuée'
        );
        await loadQuote();
      } catch (err) {
        console.error(`[QuoteDetail] ${action} error:`, err);
        toast.error(err instanceof Error ? err.message : 'Erreur');
      } finally {
        setActionLoading(false);
        setConfirmAction(null);
      }
    },
    [id, loadQuote]
  );

  const handleDelete = useCallback(async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/qonto/quotes/${id}`, {
        method: 'DELETE',
      });
      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur de suppression');
      }
      toast.success('Devis supprimé');
      router.push('/factures?tab=devis');
    } catch (err) {
      console.error('[QuoteDetail] delete error:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  }, [id, router]);

  const handleDownloadPdf = useCallback(async () => {
    try {
      const response = await fetch(`/api/qonto/quotes/${id}/pdf`);
      if (!response.ok) throw new Error('Erreur téléchargement PDF');
      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Le PDF est vide');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${quote?.number ?? quote?.quote_number ?? id}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
    } catch (err) {
      console.error('[QuoteDetail] PDF download error:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur PDF');
    }
  }, [id, quote?.number, quote?.quote_number]);

  // -----------------------------------------------------------------
  // LOADING / ERROR STATES
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{error ?? 'Devis introuvable'}</p>
        <Button variant="outline" asChild>
          <Link href="/factures?tab=devis">Retour aux devis</Link>
        </Button>
      </div>
    );
  }

  const statusActions = getStatusActions(quote.status);
  const canDelete = !quote.converted_to_invoice_id;
  const isDraft = quote.status === 'draft';

  // Compute totals from items if _cents fields are missing (Qonto may not return them)
  const computedTotals = (() => {
    // If Qonto provides _cents, use them
    if (
      quote.subtotal_amount_cents !== undefined &&
      quote.subtotal_amount_cents !== null
    ) {
      return {
        subtotalCents: quote.subtotal_amount_cents,
        vatCents: quote.total_vat_amount_cents ?? 0,
        totalCents: quote.total_amount_cents ?? 0,
      };
    }
    // Otherwise compute from items
    let subtotalHt = 0;
    let totalVat = 0;
    for (const item of quote.items) {
      const qty = parseFloat(item.quantity || '0');
      const unitPrice = parseFloat(item.unit_price?.value || '0');
      const vatRate =
        typeof item.vat_rate === 'string'
          ? parseFloat(item.vat_rate)
          : (item.vat_rate ?? 0);
      const lineHt = qty * unitPrice;
      subtotalHt += lineHt;
      totalVat += lineHt * vatRate;
    }
    return {
      subtotalCents: Math.round(subtotalHt * 100),
      vatCents: Math.round(totalVat * 100),
      totalCents:
        quote.total_amount_cents ?? Math.round((subtotalHt + totalVat) * 100),
    };
  })();

  // -----------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/factures?tab=devis">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {quote.number ?? quote.quote_number ?? '-'}
              </h1>
              <QuoteStatusBadge status={quote.status} />
              {quote.converted_to_invoice_id && (
                <Badge variant="outline" className="text-xs">
                  Converti
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Créé le {formatDate(quote.created_at)}
              {quote.expiry_date &&
                ` — Valide jusqu'au ${formatDate(quote.expiry_date)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status actions */}
          {statusActions.map(action => (
            <Button
              key={action.action}
              variant={action.variant}
              onClick={() => setConfirmAction(action)}
              disabled={actionLoading}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}

          {/* PDF buttons */}
          <Button
            variant="outline"
            onClick={() =>
              window.open(`/api/qonto/quotes/${quote.id}/pdf`, '_blank')
            }
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Voir PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void handleDownloadPdf().catch(console.error);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger
          </Button>

          {/* Send button */}
          {(isDraft || quote.status === 'finalized') && (
            <Button
              variant="outline"
              onClick={() => {
                void handleAction('send').catch(console.error);
              }}
              disabled={actionLoading}
            >
              <Send className="mr-2 h-4 w-4" />
              Envoyer
            </Button>
          )}

          {/* Delete */}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* CLIENT INFO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{quote.client?.name ?? '-'}</p>
                </div>
                {quote.client?.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{quote.client.email}</p>
                  </div>
                )}
                {quote.client?.address?.city && (
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="text-sm">
                      {[
                        quote.client.address.street_address,
                        [
                          quote.client.address.zip_code,
                          quote.client.address.city,
                        ]
                          .filter(Boolean)
                          .join(' '),
                        quote.client.address.country_code,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
                {quote.purchase_order_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">N° commande</p>
                    <p className="font-medium">{quote.purchase_order_number}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ITEMS TABLE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">
                      Produit / Description
                    </TableHead>
                    <TableHead className="text-right">Qté</TableHead>
                    <TableHead className="text-right">Prix unit. HT</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">Total HT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Aucun article
                      </TableCell>
                    </TableRow>
                  ) : (
                    quote.items.map((item, index) => (
                      <TableRow key={item.id ?? index}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {item.unit ?? ''}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.unit_price?.value}{' '}
                          {item.unit_price?.currency ?? quote.currency}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatVatRate(item.vat_rate)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(
                            parseFloat(item.quantity || '0') *
                            parseFloat(item.unit_price?.value || '0')
                          ).toFixed(2)}{' '}
                          {item.unit_price?.currency ?? quote.currency}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      Sous-total HT
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatAmountCents(
                        computedTotals.subtotalCents,
                        quote.currency
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      TVA
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmountCents(
                        computedTotals.vatCents,
                        quote.currency
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell colSpan={4} className="text-right">
                      Total TTC
                    </TableCell>
                    <TableCell className="text-right text-lg">
                      {formatAmountCents(
                        computedTotals.totalCents,
                        quote.currency
                      )}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* NOTES / HEADER / FOOTER */}
          {(quote.header ?? quote.footer ?? quote.terms_and_conditions) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Mentions & conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quote.header && (
                  <div>
                    <p className="text-sm text-muted-foreground">En-tête</p>
                    <p className="whitespace-pre-wrap text-sm">
                      {quote.header}
                    </p>
                  </div>
                )}
                {quote.footer && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pied de page
                    </p>
                    <p className="whitespace-pre-wrap text-sm">
                      {quote.footer}
                    </p>
                  </div>
                )}
                {quote.terms_and_conditions && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Conditions générales
                    </p>
                    <p className="whitespace-pre-wrap text-sm">
                      {quote.terms_and_conditions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-6">
          {/* METADATA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">N° Devis</p>
                <p className="font-medium">
                  {quote.number ?? quote.quote_number ?? '-'}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  Date d&apos;émission
                </p>
                <p className="font-medium">{formatDate(quote.issue_date)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  Date d&apos;expiration
                </p>
                <p className="font-medium">{formatDate(quote.expiry_date)}</p>
              </div>

              {quote.finalized_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Finalisé le</p>
                  <p className="font-medium">
                    {formatDate(quote.finalized_at)}
                  </p>
                </div>
              )}

              {quote.accepted_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Accepté le</p>
                  <p className="font-medium">{formatDate(quote.accepted_at)}</p>
                </div>
              )}

              {quote.declined_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Refusé le</p>
                  <p className="font-medium">{formatDate(quote.declined_at)}</p>
                </div>
              )}

              <Separator />

              {/* Conversion info */}
              {quote.converted_to_invoice_id && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Converti en facture
                  </p>
                  <Link
                    href={`/factures/${quote.converted_to_invoice_id}?type=invoice`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Voir la facture
                  </Link>
                </div>
              )}

              {/* Amounts summary */}
              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span>
                    {formatAmountCents(
                      computedTotals.subtotalCents,
                      quote.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA</span>
                  <span>
                    {formatAmountCents(computedTotals.vatCents, quote.currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total TTC</span>
                  <span>
                    {formatAmountCents(
                      computedTotals.totalCents,
                      quote.currency
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* STATUS TRANSITION CONFIRMATION */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={open => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  void handleAction(confirmAction.action).catch(console.error);
                }
              }}
              disabled={actionLoading}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le devis {quote.quote_number} sera supprimé de Qonto. Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void handleDelete().catch(console.error);
              }}
              disabled={actionLoading}
            >
              {actionLoading ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
