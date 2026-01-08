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
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  FileEdit,
  Loader2,
  Send,
} from 'lucide-react';

import { type IOrderForDocument } from './OrderSelectModal';

interface IQuoteCreateFromOrderModalProps {
  order: IOrderForDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (quoteId: string) => void;
}

type CreateStatus = 'idle' | 'creating' | 'success' | 'error';

interface CreatedQuote {
  id: string;
  quote_number: string;
  pdf_url?: string;
  public_url?: string;
  total_amount: number;
  currency: string;
  status: string;
}

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function QuoteCreateFromOrderModal({
  order,
  open,
  onOpenChange,
  onSuccess,
}: IQuoteCreateFromOrderModalProps): React.ReactNode {
  const { toast } = useToast();
  const [status, setStatus] = useState<CreateStatus>('idle');
  const [expiryDays, setExpiryDays] = useState(30);
  const [createdQuote, setCreatedQuote] = useState<CreatedQuote | null>(null);
  const [showFinalizeWarning, setShowFinalizeWarning] = useState(false);

  const resetState = useCallback((): void => {
    setStatus('idle');
    setExpiryDays(30);
    setCreatedQuote(null);
    setShowFinalizeWarning(false);
  }, []);

  const handleClose = useCallback((): void => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const handleCreateQuote = async (): Promise<void> => {
    if (!order) return;

    setStatus('creating');

    try {
      const response = await fetch('/api/qonto/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesOrderId: order.id,
          expiryDays,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create quote');
      }

      setCreatedQuote(data.quote);
      setStatus('success');
      toast({
        title: 'Devis créé',
        description: `Devis ${data.quote.quote_number} créé en brouillon`,
      });
      onSuccess?.(data.quote.id);
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

  const handleFinalizeQuote = async (): Promise<void> => {
    if (!createdQuote?.id) return;

    setShowFinalizeWarning(false);

    try {
      const response = await fetch(
        `/api/qonto/quotes/${createdQuote.id}/finalize`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to finalize quote');
      }

      setCreatedQuote(data.quote);
      toast({
        title: 'Devis finalisé',
        description: 'Devis finalisé et envoyable au client',
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
    if (!createdQuote?.id) return;

    try {
      const response = await fetch(`/api/qonto/quotes/${createdQuote.id}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${createdQuote.quote_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF téléchargé',
        description: 'Le devis a été téléchargé',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le PDF',
        variant: 'destructive',
      });
    }
  };

  const handleConvertToInvoice = async (): Promise<void> => {
    if (!createdQuote?.id) return;

    try {
      const response = await fetch(
        `/api/qonto/quotes/${createdQuote.id}/convert`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to convert quote');
      }

      toast({
        title: 'Devis converti',
        description: 'Facture créée en brouillon depuis le devis',
      });

      handleClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la conversion',
        variant: 'destructive',
      });
    }
  };

  if (!order) return null;

  const customerName =
    order.organisations?.name ||
    `${order.individual_customers?.first_name || ''} ${order.individual_customers?.last_name || ''}`.trim() ||
    'Client';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            {status === 'success' ? 'Devis créé' : 'Créer un devis'}
          </DialogTitle>
          <DialogDescription>
            {status === 'success'
              ? `Devis ${createdQuote?.quote_number} - ${formatAmount(createdQuote?.total_amount || 0)}`
              : `Commande ${order.order_number} - ${customerName}`}
          </DialogDescription>
        </DialogHeader>

        {status === 'success' && createdQuote ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Devis créé en brouillon
                </p>
                <p className="text-sm text-green-600">
                  N° {createdQuote.quote_number} -{' '}
                  {formatAmount(createdQuote.total_amount)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={!createdQuote.pdf_url}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger PDF
              </Button>

              {createdQuote.status === 'draft' && (
                <Button
                  variant="default"
                  onClick={() => setShowFinalizeWarning(true)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Finaliser le devis
                </Button>
              )}

              {createdQuote.status === 'finalized' && (
                <Button variant="default" onClick={handleConvertToInvoice}>
                  <FileEdit className="mr-2 h-4 w-4" />
                  Convertir en facture
                </Button>
              )}

              {createdQuote.public_url && (
                <Button variant="outline" asChild>
                  <a
                    href={createdQuote.public_url}
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
            {/* Récap client */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Client</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{customerName}</p>
                <p className="text-sm text-muted-foreground">
                  {order.organisations?.email ||
                    order.individual_customers?.email}
                </p>
              </CardContent>
            </Card>

            {/* Récap lignes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Articles</CardTitle>
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
                    {order.sales_order_items?.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.products?.name || 'Article'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(item.unit_price_ht)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(item.quantity * item.unit_price_ht)}
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
                  <span>{formatAmount(order.total_ht)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    TVA ({order.tax_rate}%)
                  </span>
                  <span>{formatAmount(order.total_ttc - order.total_ht)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold">
                  <span>Total TTC</span>
                  <span>{formatAmount(order.total_ttc)}</span>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label htmlFor="expiryDays">Validité du devis (jours)</Label>
              <Input
                id="expiryDays"
                type="number"
                min={1}
                max={365}
                value={expiryDays}
                onChange={e => setExpiryDays(Number(e.target.value))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Le devis expirera dans {expiryDays} jours
              </p>
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
                onClick={handleCreateQuote}
                disabled={status === 'creating'}
              >
                {status === 'creating' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Créer le devis (brouillon)
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
            <AlertDialogTitle>Finaliser le devis ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Une fois finalisé, le devis ne pourra plus être modifié. Il
                recevra un numéro officiel et pourra être envoyé au client.
              </p>
              <p className="text-sm text-muted-foreground">
                Vous pourrez ensuite le convertir en facture si le client
                accepte.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowFinalizeWarning(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizeQuote}>
              Finaliser le devis
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
