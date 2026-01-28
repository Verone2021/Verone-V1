'use client';

import { useCallback, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import {
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
  FileText,
  Loader2,
  Mail,
  Plus,
  Send,
  Trash2,
  Truck,
} from 'lucide-react';

import { type IOrderForDocument, type ICustomLine } from './OrderSelectModal';

interface IInvoiceCreateFromOrderModalProps {
  order: IOrderForDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (invoiceId: string) => void;
}

type CreateStatus = 'idle' | 'creating' | 'success' | 'error';

interface ICreatedInvoice {
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
  // SUPPRIMÉ: autoFinalize - JAMAIS de finalisation automatique
  // Les factures sont TOUJOURS créées en brouillon
  const [createdInvoice, setCreatedInvoice] = useState<ICreatedInvoice | null>(
    null
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
    setCreatedInvoice(null);
    setEmailSent(false);
  }, []);

  const handleClose = useCallback((): void => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  // Toujours créer en brouillon - pas de confirmation nécessaire
  const handleCreateClick = (): void => {
    void handleCreateInvoice();
  };

  const handleCreateInvoice = async (): Promise<void> => {
    if (!order) return;

    setStatus('creating');

    try {
      const response = await fetch('/api/qonto/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesOrderId: order.id,
          // FORCÉ: autoFinalize = false - TOUJOURS brouillon
          autoFinalize: false,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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

        <div className="flex-1 overflow-y-auto pr-2">
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

              {/* Totaux avec TVA groupée par taux - incluant frais et lignes personnalisées */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    {(() => {
                      // Calculer les totaux incluant frais et lignes personnalisées
                      const vatByRate: Record<number, number> = {};
                      let totalHt = 0;

                      // 1. Articles de la commande
                      order.sales_order_items?.forEach(item => {
                        const rate = item.tax_rate || 0;
                        const lineHt = item.quantity * item.unit_price_ht;
                        const lineVat = lineHt * rate;
                        totalHt += lineHt;
                        vatByRate[rate] = (vatByRate[rate] || 0) + lineVat;
                      });

                      // 2. Frais de service
                      const totalFees =
                        shippingCostHt + handlingCostHt + insuranceCostHt;
                      if (totalFees > 0) {
                        totalHt += totalFees;
                        const feesVat = totalFees * feesVatRate;
                        vatByRate[feesVatRate] =
                          (vatByRate[feesVatRate] || 0) + feesVat;
                      }

                      // 3. Lignes personnalisées
                      customLines.forEach(line => {
                        const lineHt = line.quantity * line.unit_price_ht;
                        const lineVat = lineHt * line.vat_rate;
                        totalHt += lineHt;
                        vatByRate[line.vat_rate] =
                          (vatByRate[line.vat_rate] || 0) + lineVat;
                      });

                      // Calculer total TVA et TTC
                      const totalVat = Object.values(vatByRate).reduce(
                        (sum, v) => sum + v,
                        0
                      );
                      const totalTtc = totalHt + totalVat;

                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Articles commande
                            </span>
                            <span>{formatAmount(order.total_ht)}</span>
                          </div>
                          {totalFees > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Frais de service
                              </span>
                              <span>{formatAmount(totalFees)}</span>
                            </div>
                          )}
                          {customLines.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Lignes personnalisées
                              </span>
                              <span>
                                {formatAmount(
                                  customLines.reduce(
                                    (sum, l) =>
                                      sum + l.quantity * l.unit_price_ht,
                                    0
                                  )
                                )}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="font-medium">Total HT</span>
                            <span className="font-medium">
                              {formatAmount(totalHt)}
                            </span>
                          </div>
                          {Object.entries(vatByRate)
                            .sort(([a], [b]) => Number(b) - Number(a))
                            .map(([rate, amount]) => (
                              <div key={rate} className="flex justify-between">
                                <span className="text-muted-foreground">
                                  TVA {Math.round(Number(rate) * 100)}%
                                </span>
                                <span>{formatAmount(amount)}</span>
                              </div>
                            ))}
                          <div className="flex justify-between border-t pt-2 mt-2 font-bold text-base">
                            <span>Total TTC</span>
                            <span>{formatAmount(totalTtc)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* SUPPRIMÉ: Checkbox autoFinalize - Les factures sont TOUJOURS créées en brouillon */}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
          {status === 'success' ? (
            <Button onClick={handleClose}>Fermer</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleCreateClick}
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
                    Créer en brouillon
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
      {/* SUPPRIMÉ: AlertDialog de confirmation - Plus de finalisation automatique */}
    </Dialog>
  );
}
