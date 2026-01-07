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
  ArrowLeft,
  ArrowRight,
  Download,
  ExternalLink,
  FileEdit,
  Loader2,
  Send,
  Trash2,
} from 'lucide-react';

interface Quote {
  id: string;
  quote_number: string;
  status: 'draft' | 'finalized' | 'accepted' | 'declined' | 'expired';
  currency: string;
  total_amount: number;
  total_vat_amount: number;
  subtotal_amount: number;
  issue_date: string;
  expiry_date: string;
  pdf_url?: string;
  public_url?: string;
  converted_to_invoice_id?: string;
  client?: {
    name: string;
    email?: string;
  };
  items?: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
  }>;
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
    finalized: 'default',
    accepted: 'default',
    declined: 'destructive',
    expired: 'outline',
  };

  const labels: Record<string, string> = {
    draft: 'Brouillon',
    finalized: 'Finalisé',
    accepted: 'Accepté',
    declined: 'Refusé',
    expired: 'Expiré',
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {labels[status] || status}
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
        throw new Error(data.error || 'Failed to fetch quote');
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
        throw new Error(data.error || 'Failed to finalize');
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
        throw new Error(data.error || 'Failed to delete');
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
        throw new Error(data.error || 'Failed to convert');
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
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${quote.quote_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le PDF',
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
          {error || 'Devis non trouvé'}
        </div>
      </div>
    );
  }

  const canFinalize = quote.status === 'draft';
  const canDelete = quote.status === 'draft';
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
            Finaliser
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
        {quote.status !== 'draft' && (
          <>
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger PDF
            </Button>
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
          </>
        )}
      </div>

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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total HT</span>
              <span>{formatAmount(quote.subtotal_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA</span>
              <span>{formatAmount(quote.total_vat_amount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total TTC</span>
              <span>{formatAmount(quote.total_amount)}</span>
            </div>
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
            <AlertDialogTitle>Finaliser le devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Une fois finalisé, le devis ne pourra plus être modifié. Vous
              pourrez ensuite le convertir en facture.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize}>
              Finaliser
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
              onClick={handleDelete}
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
            <AlertDialogAction onClick={handleConvert}>
              Convertir en facture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
