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
  Download,
  ExternalLink,
  FileX,
  Loader2,
  Send,
  Trash2,
} from 'lucide-react';

interface CreditNote {
  id: string;
  credit_note_number: string;
  status: 'draft' | 'finalized';
  currency: string;
  total_amount: number;
  total_vat_amount: number;
  subtotal_amount: number;
  issue_date: string;
  reason?: string;
  pdf_url?: string;
  public_url?: string;
  client?: {
    name: string;
    email?: string;
  };
  invoice_id?: string;
  items?: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
  }>;
}

interface CreditNoteApiResponse {
  success: boolean;
  credit_note?: CreditNote;
  error?: string;
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

export default function CreditNoteDetailPage(): React.ReactNode {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [creditNote, setCreditNote] = useState<CreditNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFinalizeWarning, setShowFinalizeWarning] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCreditNote = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/qonto/credit-notes/${id}`);
      const data = (await response.json()) as CreditNoteApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to fetch credit note');
      }

      setCreditNote(data.credit_note ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      void fetchCreditNote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFinalize = async (): Promise<void> => {
    setShowFinalizeWarning(false);
    setActionLoading(true);

    try {
      const response = await fetch(`/api/qonto/credit-notes/${id}/finalize`, {
        method: 'POST',
      });
      const data = (await response.json()) as CreditNoteApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to finalize');
      }

      setCreditNote(data.credit_note ?? null);
      toast({
        title: 'Avoir finalisé',
        description: 'Avoir finalisé avec succès (IRRÉVERSIBLE)',
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
      const response = await fetch(`/api/qonto/credit-notes/${id}`, {
        method: 'DELETE',
      });
      const data = (await response.json()) as CreditNoteApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to delete');
      }

      toast({
        title: 'Avoir supprimé',
        description: 'Avoir supprimé avec succès',
      });
      router.push('/avoirs');
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
    if (!creditNote) return;

    try {
      const response = await fetch(`/api/qonto/credit-notes/${id}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avoir-${creditNote.credit_note_number}.pdf`;
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

  if (error || !creditNote) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          {error ?? 'Avoir non trouvé'}
        </div>
      </div>
    );
  }

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
              <FileX className="h-6 w-6" />
              Avoir {creditNote.credit_note_number}
            </h1>
            <p className="text-muted-foreground">
              {creditNote.client?.name} - {formatDate(creditNote.issue_date)}
            </p>
          </div>
        </div>
        <Badge
          variant={creditNote.status === 'draft' ? 'secondary' : 'default'}
        >
          {creditNote.status === 'draft' ? 'Brouillon' : 'Finalisé'}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {creditNote.status === 'draft' && (
          <>
            <Button
              variant="destructive"
              onClick={() => setShowFinalizeWarning(true)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Finaliser (IRRÉVERSIBLE)
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteWarning(true)}
              disabled={actionLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </>
        )}
        {creditNote.status === 'finalized' && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                void handleDownloadPdf().catch(error => {
                  console.error('[Avoirs] handleDownloadPdf failed:', error);
                });
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger PDF
            </Button>
            {creditNote.public_url && (
              <Button variant="outline" asChild>
                <a
                  href={creditNote.public_url}
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

      {/* Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{creditNote.client?.name}</p>
              {creditNote.client?.email && (
                <p className="text-sm text-muted-foreground">
                  {creditNote.client.email}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Date d&apos;émission
              </p>
              <p className="font-medium">{formatDate(creditNote.issue_date)}</p>
            </div>
            {creditNote.reason && (
              <div>
                <p className="text-sm text-muted-foreground">Motif</p>
                <p className="font-medium">{creditNote.reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Montants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total HT</span>
              <span>{formatAmount(creditNote.subtotal_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA</span>
              <span>{formatAmount(creditNote.total_vat_amount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold text-destructive">
              <span>Total avoir</span>
              <span>-{formatAmount(creditNote.total_amount)}</span>
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
            <AlertDialogTitle className="text-destructive">
              Finaliser l&apos;avoir ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est IRRÉVERSIBLE. Une fois finalisé, l&apos;avoir ne
              pourra plus être modifié ni supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void handleFinalize().catch(error => {
                  console.error('[Avoirs] handleFinalize failed:', error);
                });
              }}
            >
              Finaliser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;avoir ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement cet avoir brouillon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void handleDelete().catch(error => {
                  console.error('[Avoirs] handleDelete failed:', error);
                });
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
