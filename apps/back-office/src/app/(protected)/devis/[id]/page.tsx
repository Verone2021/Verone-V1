'use client';

import { useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useToast } from '@verone/common/hooks';
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
  Skeleton,
} from '@verone/ui';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Download,
  ExternalLink,
  Eye,
  FileEdit,
  Loader2,
  Send,
  Trash2,
} from 'lucide-react';

interface QuoteItem {
  title: string;
  description?: string;
  quantity: number | string;
  unit?: string;
  // Qonto returns unit_price as object { value: string, currency: string }
  unit_price: number | { value: string; currency: string };
  vat_rate: number | string;
  total_amount?: number | { value: string; currency: string };
}

// Qonto amount type - can be number or object
type QontoAmount = number | { value: string; currency: string };

interface Quote {
  id: string;
  quote_number: string;
  number?: string; // Qonto uses 'number' field
  // Qonto uses 'pending_approval' for drafts
  status:
    | 'draft'
    | 'pending_approval'
    | 'finalized'
    | 'accepted'
    | 'declined'
    | 'expired';
  currency: string;
  // Qonto may return amounts as objects { value, currency } or numbers
  total_amount: QontoAmount;
  total_amount_cents?: number;
  total_vat_amount: QontoAmount;
  total_vat_amount_cents?: number;
  subtotal_amount: QontoAmount;
  subtotal_amount_cents?: number;
  issue_date: string;
  expiry_date: string;
  pdf_url?: string;
  public_url?: string;
  converted_to_invoice_id?: string;
  client?: {
    name: string;
    email?: string;
    billing_address?: {
      street_address?: string;
      city?: string;
      zip_code?: string;
      country_code?: string;
    };
  };
  items?: QuoteItem[];
}

// Parse Qonto amount - handles both number and object formats
function parseQontoAmount(
  amount: QontoAmount | undefined,
  fallbackCents?: number
): number {
  if (amount === undefined || amount === null) {
    return fallbackCents ? fallbackCents / 100 : 0;
  }
  if (typeof amount === 'number') {
    return amount;
  }
  if (typeof amount === 'object' && 'value' in amount) {
    return parseFloat(amount.value) ?? 0;
  }
  return 0;
}

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(dateString));
}

function StatusBadge({ status }: { status: string }): React.ReactNode {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    draft: 'secondary',
    pending_approval: 'secondary', // Qonto uses this for drafts
    finalized: 'default',
    accepted: 'default',
    declined: 'destructive',
    expired: 'outline',
  };

  const labels: Record<string, string> = {
    draft: 'Brouillon',
    pending_approval: 'Brouillon', // Qonto uses this for drafts
    finalized: 'Finalisé',
    accepted: 'Accepté',
    declined: 'Refusé',
    expired: 'Expiré',
  };

  return (
    <Badge variant={variants[status] ?? 'outline'}>
      {labels[status] ?? status}
    </Badge>
  );
}

export default function QuoteDetailPage(): React.ReactNode {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFinalizeWarning, setShowFinalizeWarning] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showConvertWarning, setShowConvertWarning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuote = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/qonto/quotes/${id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to fetch quote');
      }

      setQuote(data.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      void fetchQuote();
    }
  }, [id]);

  const handleFinalize = async (): Promise<void> => {
    setShowFinalizeWarning(false);
    setActionLoading(true);

    try {
      const response = await fetch(`/api/qonto/quotes/${id}/finalize`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to finalize');
      }

      setQuote(data.quote);
      toast({
        title: 'Devis finalisé',
        description: 'Devis finalisé avec succès',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setShowDeleteWarning(false);
    setActionLoading(true);

    try {
      const response = await fetch(`/api/qonto/quotes/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to delete');
      }

      toast({
        title: 'Devis supprimé',
        description: 'Devis supprimé avec succès',
      });
      router.push('/devis');
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async (): Promise<void> => {
    setShowConvertWarning(false);
    setActionLoading(true);

    try {
      const response = await fetch(`/api/qonto/quotes/${id}/convert`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to convert');
      }

      toast({
        title: 'Devis converti',
        description: 'Facture créée en brouillon',
      });

      // Redirect to invoice
      if (data.invoice?.id) {
        router.push(`/factures/${data.invoice.id}`);
      }
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async (): Promise<void> => {
    if (!quote) return;

    try {
      const response = await fetch(`/api/qonto/quotes/${id}/pdf`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ?? `Erreur ${response.status}: ${response.statusText}`
        );
      }

      const blob = await response.blob();

      // Vérifier que le blob contient des données
      if (blob.size === 0) {
        throw new Error('Le PDF est vide');
      }

      // Utiliser le numéro de devis ou l'ID si non disponible
      const filename = quote.quote_number ?? quote.number ?? id;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${filename}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Délai avant de révoquer l'URL pour laisser le téléchargement démarrer
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
    } catch (err) {
      toast({
        title: 'Erreur',
        description:
          err instanceof Error
            ? err.message
            : 'Impossible de télécharger le PDF',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-6 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          {error ?? 'Devis non trouvé'}
        </div>
      </div>
    );
  }

  // Qonto uses 'pending_approval' for drafts, we also handle 'draft' for compatibility
  const isDraft =
    quote.status === 'draft' || quote.status === 'pending_approval';
  const isFinalized = ['finalized', 'accepted', 'declined', 'expired'].includes(
    quote.status
  );

  const canFinalize = isDraft;
  const canDelete = isDraft;
  const canConvert =
    quote.status === 'finalized' && !quote.converted_to_invoice_id;

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <FileEdit className="h-6 w-6" />
              Devis {quote.quote_number}
            </h1>
            <p className="text-muted-foreground">
              {quote.client?.name} - {formatDate(quote.issue_date)}
            </p>
          </div>
        </div>
        <StatusBadge status={quote.status} />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Voir PDF - ouvre dans un nouvel onglet */}
        <Button
          variant="default"
          onClick={() => window.open(`/api/qonto/quotes/${id}/view`, '_blank')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Voir PDF
        </Button>
        {/* Télécharger PDF */}
        <Button
          variant="outline"
          onClick={() => {
            void handleDownloadPdf().catch(error => {
              console.error('[Devis] handleDownloadPdf failed:', error);
            });
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Télécharger PDF
        </Button>
        {canFinalize && (
          <Button
            onClick={() => setShowFinalizeWarning(true)}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Envoyer au client
          </Button>
        )}
        {canConvert && (
          <Button
            variant="default"
            onClick={() => setShowConvertWarning(true)}
            disabled={actionLoading}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Convertir en facture
          </Button>
        )}
        {canDelete && (
          <Button
            variant="outline"
            onClick={() => setShowDeleteWarning(true)}
            disabled={actionLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        )}
        {quote.public_url && (
          <Button variant="outline" asChild>
            <a
              href={quote.public_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir sur Qonto
            </a>
          </Button>
        )}
      </div>

      {/* Draft notice */}
      {isDraft && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div>
            <p className="font-medium text-blue-800">
              Ce devis est en brouillon
            </p>
            <p className="mt-1 text-sm text-blue-700">
              Vous pouvez télécharger le PDF à tout moment. Pour convertir ce
              devis en facture, vous devez d&apos;abord l&apos;envoyer au
              client.
            </p>
          </div>
        </div>
      )}

      {/* Finalized notice */}
      {isFinalized && !quote.converted_to_invoice_id && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div>
            <p className="font-medium text-green-800">
              Devis finalisé - PDF disponible
            </p>
            <p className="mt-1 text-sm text-green-700">
              Vous pouvez télécharger le PDF et le partager avec votre client.
              {quote.status === 'finalized' &&
                ' Si le client accepte, vous pouvez convertir ce devis en facture.'}
            </p>
          </div>
        </div>
      )}

      {/* Converted notice */}
      {quote.converted_to_invoice_id && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-green-800">
            Ce devis a été converti en facture.{' '}
            <Button
              variant="ghost"
              className="h-auto p-0 text-green-800 underline"
              onClick={() =>
                router.push(`/factures/${quote.converted_to_invoice_id}`)
              }
            >
              Voir la facture
            </Button>
          </p>
        </div>
      )}

      {/* Items/Articles */}
      {quote.items && quote.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Articles ({quote.items.length} ligne
              {quote.items.length > 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Article</th>
                    <th className="pb-3 text-right font-medium">Qté</th>
                    <th className="pb-3 text-right font-medium">Prix HT</th>
                    <th className="pb-3 text-right font-medium">TVA</th>
                    <th className="pb-3 text-right font-medium">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, index) => {
                    const qty =
                      typeof item.quantity === 'string'
                        ? parseFloat(item.quantity)
                        : item.quantity;
                    const vatRate =
                      typeof item.vat_rate === 'string'
                        ? parseFloat(item.vat_rate)
                        : item.vat_rate;
                    // Handle unit_price as number or object { value, currency }
                    const unitPrice =
                      typeof item.unit_price === 'object' && item.unit_price
                        ? parseFloat(item.unit_price.value)
                        : typeof item.unit_price === 'number'
                          ? item.unit_price
                          : 0;
                    const totalHT = qty * unitPrice;
                    const vatPercent = vatRate < 1 ? vatRate * 100 : vatRate;

                    return (
                      <tr
                        key={index}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="py-4">
                          <p className="font-medium">{item.title}</p>
                          {item.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                          {item.unit && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Unité: {item.unit}
                            </p>
                          )}
                        </td>
                        <td className="py-4 text-right tabular-nums">{qty}</td>
                        <td className="py-4 text-right tabular-nums">
                          {formatAmount(unitPrice)}
                        </td>
                        <td className="py-4 text-right tabular-nums">
                          {vatPercent.toFixed(0)}%
                        </td>
                        <td className="py-4 text-right font-medium tabular-nums">
                          {formatAmount(totalHT)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for items */}
      {(!quote.items || quote.items.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Aucun article dans ce devis.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{quote.client?.name}</p>
              {quote.client?.email && (
                <p className="text-sm text-muted-foreground">
                  {quote.client.email}
                </p>
              )}
              {quote.client?.billing_address && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {quote.client.billing_address.street_address && (
                    <p>{quote.client.billing_address.street_address}</p>
                  )}
                  {(quote.client.billing_address.zip_code ??
                    quote.client.billing_address.city) && (
                    <p>
                      {quote.client.billing_address.zip_code}{' '}
                      {quote.client.billing_address.city}
                    </p>
                  )}
                  {quote.client.billing_address.country_code && (
                    <p>{quote.client.billing_address.country_code}</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Date d&apos;émission
              </p>
              <p className="font-medium">{formatDate(quote.issue_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Date d&apos;expiration
              </p>
              <p className="font-medium">{formatDate(quote.expiry_date)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Montants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(() => {
              // Calculer les montants à partir des items si l'API ne les retourne pas
              let subtotalHT = parseQontoAmount(
                quote.subtotal_amount,
                quote.subtotal_amount_cents
              );
              let totalVAT = parseQontoAmount(
                quote.total_vat_amount,
                quote.total_vat_amount_cents
              );
              const totalTTC = parseQontoAmount(
                quote.total_amount,
                quote.total_amount_cents
              );

              // Si subtotal est 0 mais qu'on a des items, calculer depuis les items
              if (subtotalHT === 0 && quote.items && quote.items.length > 0) {
                subtotalHT = quote.items.reduce((sum, item) => {
                  const qty =
                    typeof item.quantity === 'string'
                      ? parseFloat(item.quantity)
                      : item.quantity;
                  const unitPrice =
                    typeof item.unit_price === 'object' && item.unit_price
                      ? parseFloat(item.unit_price.value)
                      : typeof item.unit_price === 'number'
                        ? item.unit_price
                        : 0;
                  return sum + qty * unitPrice;
                }, 0);
              }

              // Calculer la TVA si elle est 0
              if (totalVAT === 0 && quote.items && quote.items.length > 0) {
                totalVAT = quote.items.reduce((sum, item) => {
                  const qty =
                    typeof item.quantity === 'string'
                      ? parseFloat(item.quantity)
                      : item.quantity;
                  const unitPrice =
                    typeof item.unit_price === 'object' && item.unit_price
                      ? parseFloat(item.unit_price.value)
                      : typeof item.unit_price === 'number'
                        ? item.unit_price
                        : 0;
                  const vatRate =
                    typeof item.vat_rate === 'string'
                      ? parseFloat(item.vat_rate)
                      : item.vat_rate;
                  // Si vatRate < 1, c'est un pourcentage décimal (0.2 = 20%)
                  const vatMultiplier = vatRate < 1 ? vatRate : vatRate / 100;
                  return sum + qty * unitPrice * vatMultiplier;
                }, 0);
              }

              return (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span className="tabular-nums">
                      {formatAmount(subtotalHT)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA</span>
                    <span className="tabular-nums">
                      {formatAmount(totalVAT)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="tabular-nums">
                      {formatAmount(
                        totalTTC > 0 ? totalTTC : subtotalHT + totalVAT
                      )}
                    </span>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AlertDialog
        open={showFinalizeWarning}
        onOpenChange={setShowFinalizeWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer le devis au client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le devis sera envoyé par email à{' '}
              {quote.client?.email ?? "l'adresse du client"}. Une fois envoyé,
              le PDF sera disponible au téléchargement et vous pourrez le
              convertir en facture.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleFinalize().catch(error => {
                  console.error('[Devis] handleFinalize failed:', error);
                });
              }}
            >
              Envoyer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement ce devis brouillon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void handleDelete().catch(error => {
                  console.error('[Devis] handleDelete failed:', error);
                });
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showConvertWarning}
        onOpenChange={setShowConvertWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action créera une facture en brouillon basée sur ce devis.
              Vous devrez ensuite finaliser la facture manuellement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleConvert().catch(error => {
                  console.error('[Devis] handleConvert failed:', error);
                });
              }}
            >
              Convertir en facture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
