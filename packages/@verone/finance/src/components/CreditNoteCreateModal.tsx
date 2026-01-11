'use client';

import { useCallback, useState } from 'react';

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
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileX,
  Loader2,
  Send,
} from 'lucide-react';

export interface IInvoiceForCreditNote {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  total_vat_amount: number;
  subtotal_amount: number;
  currency: string;
  client_id: string;
  client?: {
    name?: string;
    email?: string | null;
  } | null;
  items?: Array<{
    id?: string;
    title: string;
    description?: string;
    quantity: number;
    unit: string;
    unit_price: number;
    vat_rate: number;
  }>;
}

interface ICreditNoteCreateModalProps {
  invoice: IInvoiceForCreditNote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (creditNoteId: string) => void;
}

type CreateStatus = 'idle' | 'creating' | 'success' | 'error';

interface CreatedCreditNote {
  id: string;
  credit_note_number: string;
  pdf_url?: string;
  public_url?: string;
  total_amount: number;
  currency: string;
}

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

const CREDIT_NOTE_REASONS = [
  { value: 'return', label: 'Retour marchandise' },
  { value: 'error', label: 'Erreur de facturation' },
  { value: 'discount', label: 'Remise commerciale' },
  { value: 'partial_cancel', label: 'Annulation partielle' },
  { value: 'other', label: 'Autre motif' },
];

export function CreditNoteCreateModal({
  invoice,
  open,
  onOpenChange,
  onSuccess,
}: ICreditNoteCreateModalProps): React.ReactNode {
  const { toast } = useToast();
  const [status, setStatus] = useState<CreateStatus>('idle');
  const [reason, setReason] = useState('');
  const [createdCreditNote, setCreatedCreditNote] =
    useState<CreatedCreditNote | null>(null);
  const [showFinalizeWarning, setShowFinalizeWarning] = useState(false);

  const resetState = useCallback((): void => {
    setStatus('idle');
    setReason('');
    setCreatedCreditNote(null);
    setShowFinalizeWarning(false);
  }, []);

  const handleClose = useCallback((): void => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const handleCreateCreditNote = async (): Promise<void> => {
    if (!invoice) return;

    setStatus('creating');

    try {
      const response = await fetch('/api/qonto/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          reason: reason || `Avoir sur facture ${invoice.invoice_number}`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create credit note');
      }

      setCreatedCreditNote(data.credit_note);
      setStatus('success');
      toast({
        title: 'Avoir créé',
        description: `Avoir ${data.credit_note.credit_note_number} créé en brouillon`,
      });
      onSuccess?.(data.credit_note.id);
    } catch (error) {
      setStatus('error');
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive',
      });
    }
  };

  const handleFinalizeCreditNote = async (): Promise<void> => {
    if (!createdCreditNote?.id) return;

    setShowFinalizeWarning(false);

    try {
      const response = await fetch(
        `/api/qonto/credit-notes/${createdCreditNote.id}/finalize`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to finalize credit note');
      }

      setCreatedCreditNote(data.credit_note);
      toast({
        title: 'Avoir finalisé',
        description: 'Avoir finalisé avec succès (IRRÉVERSIBLE)',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la finalisation',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPdf = async (): Promise<void> => {
    if (!createdCreditNote?.id) return;

    try {
      const response = await fetch(
        `/api/qonto/credit-notes/${createdCreditNote.id}/pdf`
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avoir-${createdCreditNote.credit_note_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF téléchargé',
        description: "L'avoir a été téléchargé",
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le PDF',
        variant: 'destructive',
      });
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileX className="h-5 w-5" />
            {status === 'success' ? 'Avoir créé' : 'Créer un avoir'}
          </DialogTitle>
          <DialogDescription>
            {status === 'success'
              ? `Avoir ${createdCreditNote?.credit_note_number} - ${formatAmount(createdCreditNote?.total_amount || 0)}`
              : `Sur facture ${invoice.invoice_number} - ${invoice.client?.name || 'Client'}`}
          </DialogDescription>
        </DialogHeader>

        {status === 'success' && createdCreditNote ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Avoir créé en brouillon
                </p>
                <p className="text-sm text-green-600">
                  N° {createdCreditNote.credit_note_number} -{' '}
                  {formatAmount(createdCreditNote.total_amount)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={!createdCreditNote.pdf_url}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger PDF
              </Button>

              <Button
                variant="destructive"
                onClick={() => setShowFinalizeWarning(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Finaliser (IRRÉVERSIBLE)
              </Button>

              {createdCreditNote.public_url && (
                <Button variant="outline" asChild>
                  <a
                    href={createdCreditNote.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Voir sur Qonto
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info facture */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Facture de référence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.client?.name}
                    </p>
                  </div>
                  <Badge variant="outline">{invoice.status}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Items à rembourser */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Articles à rembourser (copie de la facture)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Prix HT</TableHead>
                      <TableHead className="text-right">Total HT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items?.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell>{item.title}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(item.quantity * item.unit_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Totaux */}
            <div className="flex justify-end">
              <div className="w-48 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total HT</span>
                  <span>{formatAmount(invoice.subtotal_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA</span>
                  <span>{formatAmount(invoice.total_vat_amount)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold text-destructive">
                  <span>Total avoir</span>
                  <span>-{formatAmount(invoice.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Motif */}
            <div className="space-y-2">
              <Label htmlFor="reason">Motif de l&apos;avoir</Label>
              <Textarea
                id="reason"
                placeholder="Décrivez le motif de cet avoir..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
              />
              <div className="flex flex-wrap gap-1">
                {CREDIT_NOTE_REASONS.map(r => (
                  <Badge
                    key={r.value}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setReason(r.label)}
                  >
                    {r.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {status === 'success' ? (
            <Button onClick={handleClose}>Fermer</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleCreateCreditNote}
                disabled={status === 'creating'}
              >
                {status === 'creating' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <FileX className="mr-2 h-4 w-4" />
                    Créer l&apos;avoir (brouillon)
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Dialog de confirmation pour finalisation */}
      <AlertDialog
        open={showFinalizeWarning}
        onOpenChange={setShowFinalizeWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Finaliser l&apos;avoir ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-foreground">
                Cette action est IRRÉVERSIBLE.
              </p>
              <p>
                Une fois finalisé, l&apos;avoir ne pourra plus être modifié ni
                supprimé. Il recevra un numéro officiel et sera enregistré
                définitivement.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowFinalizeWarning(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleFinalizeCreditNote}
            >
              Oui, finaliser définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
