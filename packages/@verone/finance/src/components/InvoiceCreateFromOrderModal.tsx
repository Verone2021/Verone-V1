'use client';

import { useCallback, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
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
  FileText,
  Loader2,
  Mail,
  Send,
} from 'lucide-react';

export interface IOrderForInvoice {
  id: string;
  order_number: string;
  total_ht: number;
  total_ttc: number;
  tax_rate: number;
  currency: string;
  payment_terms: string;
  organisations?: {
    name?: string;
    email?: string | null;
  } | null;
  individual_customers?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  sales_order_items?: Array<{
    id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate: number;
    products?: {
      name: string;
    } | null;
  }>;
}

interface IInvoiceCreateFromOrderModalProps {
  order: IOrderForInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (invoiceId: string) => void;
}

type CreateStatus = 'idle' | 'creating' | 'success' | 'error';

interface CreatedInvoice {
  id: string;
  invoice_number: string;
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

export function InvoiceCreateFromOrderModal({
  order,
  open,
  onOpenChange,
  onSuccess,
}: IInvoiceCreateFromOrderModalProps): React.ReactNode {
  const { toast } = useToast();
  const [status, setStatus] = useState<CreateStatus>('idle');
  const [autoFinalize, setAutoFinalize] = useState(true);
  const [createdInvoice, setCreatedInvoice] = useState<CreatedInvoice | null>(
    null
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const resetState = useCallback((): void => {
    setStatus('idle');
    setCreatedInvoice(null);
    setEmailSent(false);
  }, []);

  const handleClose = useCallback((): void => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const handleCreateInvoice = async (): Promise<void> => {
    if (!order) return;

    setStatus('creating');

    try {
      const response = await fetch('/api/qonto/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesOrderId: order.id,
          autoFinalize,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      setCreatedInvoice(data.invoice);
      setStatus('success');
      toast({
        title: 'Facture créée',
        description: `Facture ${data.invoice.invoice_number} créée avec succès`,
      });
      onSuccess?.(data.invoice.id);
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

  const handleDownloadPdf = async (): Promise<void> => {
    if (!createdInvoice?.id) return;

    try {
      const response = await fetch(
        `/api/qonto/invoices/${createdInvoice.id}/pdf`
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${createdInvoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF téléchargé',
        description: 'La facture a été téléchargée',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le PDF',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = async (): Promise<void> => {
    if (!createdInvoice?.id || !order) return;

    const customerEmail =
      order.organisations?.email || order.individual_customers?.email;

    if (!customerEmail) {
      toast({
        title: 'Erreur',
        description: 'Aucune adresse email client disponible',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      const response = await fetch('/api/emails/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: createdInvoice.id,
          to: customerEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      setEmailSent(true);
      toast({
        title: 'Email envoyé',
        description: `Facture envoyée à ${customerEmail}`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : "Erreur lors de l'envoi",
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!order) return null;

  const customerName =
    order.organisations?.name ||
    `${order.individual_customers?.first_name || ''} ${order.individual_customers?.last_name || ''}`.trim() ||
    'Client';

  const customerEmail =
    order.organisations?.email || order.individual_customers?.email;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {status === 'success' ? 'Facture créée' : 'Créer une facture'}
          </DialogTitle>
          <DialogDescription>
            {status === 'success'
              ? `Facture ${createdInvoice?.invoice_number} - ${formatAmount(createdInvoice?.total_amount || 0)}`
              : `Commande ${order.order_number} - ${customerName}`}
          </DialogDescription>
        </DialogHeader>

        {status === 'success' && createdInvoice ? (
          // Vue succès avec actions
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Facture créée avec succès
                </p>
                <p className="text-sm text-green-600">
                  N° {createdInvoice.invoice_number} -{' '}
                  {formatAmount(createdInvoice.total_amount)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={!createdInvoice.pdf_url}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger PDF
              </Button>

              <Button
                variant="outline"
                onClick={handleSendEmail}
                disabled={!customerEmail || isSendingEmail || emailSent}
              >
                {isSendingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : emailSent ? (
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {emailSent ? 'Email envoyé' : 'Envoyer par email'}
              </Button>

              {createdInvoice.public_url && (
                <Button variant="outline" asChild>
                  <a
                    href={createdInvoice.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Voir sur Qonto
                  </a>
                </Button>
              )}
            </div>

            {customerEmail && (
              <p className="text-xs text-muted-foreground">
                Email client: {customerEmail}
              </p>
            )}
          </div>
        ) : (
          // Vue création
          <div className="space-y-4">
            {/* Récap client */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Client</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{customerName}</p>
                {customerEmail && (
                  <p className="text-sm text-muted-foreground">
                    {customerEmail}
                  </p>
                )}
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="autoFinalize"
                checked={autoFinalize}
                onCheckedChange={checked => setAutoFinalize(checked === true)}
              />
              <Label htmlFor="autoFinalize" className="text-sm">
                Finaliser automatiquement (génère le PDF)
              </Label>
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
                onClick={handleCreateInvoice}
                disabled={status === 'creating'}
              >
                {status === 'creating' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Créer la facture
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
