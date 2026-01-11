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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  Plus,
  Send,
  Trash2,
  Truck,
} from 'lucide-react';

import { type IOrderForDocument, type ICustomLine } from './OrderSelectModal';

interface IQuoteCreateFromOrderModalProps {
  order: IOrderForDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (quoteId: string) => void;
}

type CreateStatus = 'idle' | 'creating' | 'success' | 'error';

interface ICreatedQuote {
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
  const [createdQuote, setCreatedQuote] = useState<ICreatedQuote | null>(null);
  const [showFinalizeWarning, setShowFinalizeWarning] = useState(false);

  // États pour les frais de service (initialisés depuis la commande)
  const [shippingCostHt, setShippingCostHt] = useState<number>(
    order?.shipping_cost_ht ?? 0
  );
  const [handlingCostHt, setHandlingCostHt] = useState<number>(
    order?.handling_cost_ht ?? 0
  );
  const [insuranceCostHt, setInsuranceCostHt] = useState<number>(
    order?.insurance_cost_ht ?? 0
  );
  const [feesVatRate, setFeesVatRate] = useState<number>(
    order?.fees_vat_rate ?? 0.2
  );

  // États pour les lignes personnalisées
  const [customLines, setCustomLines] = useState<ICustomLine[]>([]);
  const [showAddLine, setShowAddLine] = useState(false);
  const [newLineTitle, setNewLineTitle] = useState('');
  const [newLineQty, setNewLineQty] = useState(1);
  const [newLinePriceHt, setNewLinePriceHt] = useState(0);
  const [newLineVatRate, setNewLineVatRate] = useState(0.2);

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
          // Frais de service
          fees: {
            shipping_cost_ht: shippingCostHt,
            handling_cost_ht: handlingCostHt,
            insurance_cost_ht: insuranceCostHt,
            fees_vat_rate: feesVatRate,
          },
          // Lignes personnalisées
          customLines: customLines.map(line => ({
            title: line.title,
            description: line.description,
            quantity: line.quantity,
            unit_price_ht: line.unit_price_ht,
            vat_rate: line.vat_rate,
          })),
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
                      <TableHead className="text-right">TVA</TableHead>
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
                        <TableCell className="text-right text-muted-foreground">
                          {Math.round((item.tax_rate || 0) * 100)}%
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

            {/* Frais de service */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Frais de service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Livraison HT</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingCostHt}
                      onChange={e =>
                        setShippingCostHt(parseFloat(e.target.value) || 0)
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Manutention HT</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={handlingCostHt}
                      onChange={e =>
                        setHandlingCostHt(parseFloat(e.target.value) || 0)
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Assurance HT</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={insuranceCostHt}
                      onChange={e =>
                        setInsuranceCostHt(parseFloat(e.target.value) || 0)
                      }
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">TVA sur les frais</Label>
                  <Select
                    value={String(feesVatRate)}
                    onValueChange={v => setFeesVatRate(parseFloat(v))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.2">20%</SelectItem>
                      <SelectItem value="0.1">10%</SelectItem>
                      <SelectItem value="0.055">5,5%</SelectItem>
                      <SelectItem value="0">0%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lignes personnalisées */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Lignes personnalisées
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddLine(!showAddLine)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {showAddLine && (
                  <div className="border rounded-lg p-3 space-y-3 bg-muted/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Libellé</Label>
                        <Input
                          value={newLineTitle}
                          onChange={e => setNewLineTitle(e.target.value)}
                          placeholder="Ex: Frais de conseil"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quantité</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newLineQty}
                          onChange={e =>
                            setNewLineQty(parseInt(e.target.value) || 1)
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Prix unitaire HT</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newLinePriceHt}
                          onChange={e =>
                            setNewLinePriceHt(parseFloat(e.target.value) || 0)
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Select
                        value={String(newLineVatRate)}
                        onValueChange={v => setNewLineVatRate(parseFloat(v))}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.2">20%</SelectItem>
                          <SelectItem value="0.1">10%</SelectItem>
                          <SelectItem value="0.055">5,5%</SelectItem>
                          <SelectItem value="0">0%</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!newLineTitle || newLinePriceHt <= 0}
                        onClick={() => {
                          setCustomLines([
                            ...customLines,
                            {
                              id: crypto.randomUUID(),
                              title: newLineTitle,
                              quantity: newLineQty,
                              unit_price_ht: newLinePriceHt,
                              vat_rate: newLineVatRate,
                            },
                          ]);
                          setNewLineTitle('');
                          setNewLineQty(1);
                          setNewLinePriceHt(0);
                          setShowAddLine(false);
                        }}
                      >
                        Ajouter la ligne
                      </Button>
                    </div>
                  </div>
                )}
                {customLines.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Libellé</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">Prix HT</TableHead>
                        <TableHead className="text-right">TVA</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customLines.map(line => (
                        <TableRow key={line.id}>
                          <TableCell>{line.title}</TableCell>
                          <TableCell className="text-right">
                            {line.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatAmount(line.unit_price_ht)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {Math.round(line.vat_rate * 100)}%
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setCustomLines(
                                  customLines.filter(l => l.id !== line.id)
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {customLines.length === 0 && !showAddLine && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Aucune ligne personnalisée
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Totaux avec TVA groupée par taux */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total HT</span>
                  <span>{formatAmount(order.total_ht)}</span>
                </div>
                {/* Calculer TVA par taux */}
                {(() => {
                  const vatByRate: Record<number, number> = {};
                  order.sales_order_items?.forEach(item => {
                    const rate = item.tax_rate || 0;
                    const lineHt = item.quantity * item.unit_price_ht;
                    const lineVat = lineHt * rate;
                    vatByRate[rate] = (vatByRate[rate] || 0) + lineVat;
                  });
                  return Object.entries(vatByRate)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([rate, amount]) => (
                      <div key={rate} className="flex justify-between">
                        <span className="text-muted-foreground">
                          TVA {Math.round(Number(rate) * 100)}%
                        </span>
                        <span>{formatAmount(amount)}</span>
                      </div>
                    ));
                })()}
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
