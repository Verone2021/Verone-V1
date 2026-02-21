'use client';

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
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
import { createClient } from '@verone/utils/supabase/client';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  Truck,
} from 'lucide-react';

import {
  type IOrderForDocument,
  type IDocumentAddress,
  type ICustomLine,
} from './OrderSelectModal';

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

/**
 * Normalize country name to ISO 3166-1 alpha-2 code.
 * Handles common French text values from org data vs ISO codes from order JSONB.
 */
function normalizeCountryCode(country: string | null | undefined): string {
  if (!country) return 'FR';
  const upper = country.trim().toUpperCase();
  // Already ISO code (2 chars)
  if (upper.length === 2) return upper;
  // Common French names → ISO codes
  const mapping: Record<string, string> = {
    FRANCE: 'FR',
    BELGIQUE: 'BE',
    SUISSE: 'CH',
    LUXEMBOURG: 'LU',
    ALLEMAGNE: 'DE',
    ITALIE: 'IT',
    ESPAGNE: 'ES',
    'PAYS-BAS': 'NL',
    PORTUGAL: 'PT',
    'ROYAUME-UNI': 'GB',
    MONACO: 'MC',
  };
  return mapping[upper] || 'FR';
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
  const supabaseClient = createClient();
  const [status, setStatus] = useState<CreateStatus>('idle');
  const [createdInvoice, setCreatedInvoice] = useState<ICreatedInvoice | null>(
    null
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // SIRET guard states
  const [siretInput, setSiretInput] = useState<string>('');
  const [savingSiret, setSavingSiret] = useState(false);
  const [siretSaved, setSiretSaved] = useState(false);

  // Nouveaux champs : date de facture et label
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [invoiceLabel, setInvoiceLabel] = useState<string>('');

  // Prochain numéro de facture (approximatif)
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string | null>(
    null
  );
  const [loadingNextNumber, setLoadingNextNumber] = useState(false);

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

  // Synchroniser les frais de service quand l'order change
  // (les useState initiaux ne se ré-exécutent pas quand order change)
  useEffect(() => {
    if (order) {
      setShippingCostHt(order.shipping_cost_ht ?? 0);
      setHandlingCostHt(order.handling_cost_ht ?? 0);
      setInsuranceCostHt(order.insurance_cost_ht ?? 0);
      setFeesVatRate(order.fees_vat_rate ?? 0.2);
    }
  }, [order]);

  // Résoudre l'adresse de facturation avec fallback :
  // 1. order.billing_address (JSONB commande)
  // 2. org.billing_* colonnes
  // 3. org.address_line1/city/postal_code/country (adresse principale)
  const resolveBillingAddress = useCallback((): IDocumentAddress => {
    const empty: IDocumentAddress = {
      address_line1: '',
      postal_code: '',
      city: '',
      country: 'FR',
    };
    if (!order) return empty;

    // Priority 1: order billing_address JSONB
    if (order.billing_address?.city && order.billing_address?.postal_code) {
      return {
        address_line1: order.billing_address.address_line1 || '',
        address_line2: order.billing_address.address_line2 || '',
        postal_code: order.billing_address.postal_code,
        city: order.billing_address.city,
        country: normalizeCountryCode(order.billing_address.country),
      };
    }

    const org = order.organisations;
    if (!org) return empty;

    // Priority 2: org billing_* columns
    if (org.billing_city && org.billing_postal_code) {
      return {
        address_line1: org.billing_address_line1 || '',
        postal_code: org.billing_postal_code,
        city: org.billing_city,
        country: normalizeCountryCode(org.billing_country),
      };
    }

    // Priority 3: org main address
    if (org.city && org.postal_code) {
      return {
        address_line1: org.address_line1 || '',
        postal_code: org.postal_code,
        city: org.city,
        country: normalizeCountryCode(org.country),
      };
    }

    return empty;
  }, [order]);

  const resolveShippingAddress = useCallback((): IDocumentAddress | null => {
    if (!order) return null;

    // Si la commande a une shipping_address
    if (order.shipping_address?.city && order.shipping_address?.postal_code) {
      return {
        address_line1: order.shipping_address.address_line1 || '',
        address_line2: order.shipping_address.address_line2 || '',
        postal_code: order.shipping_address.postal_code,
        city: order.shipping_address.city,
        country: normalizeCountryCode(order.shipping_address.country),
      };
    }

    const org = order.organisations;
    if (!org || !org.has_different_shipping_address) return null;

    // Org shipping columns
    if (org.shipping_city && org.shipping_postal_code) {
      return {
        address_line1: org.shipping_address_line1 || '',
        postal_code: org.shipping_postal_code,
        city: org.shipping_city,
        country: normalizeCountryCode(org.shipping_country),
      };
    }

    return null;
  }, [order]);

  // États adresses
  const [billingAddress, setBillingAddress] = useState<IDocumentAddress>(
    resolveBillingAddress()
  );
  const [hasDifferentShipping, setHasDifferentShipping] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<IDocumentAddress>({
    address_line1: '',
    postal_code: '',
    city: '',
    country: 'FR',
  });
  const [editingBilling, setEditingBilling] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);

  // Initialiser les adresses quand l'order change
  useEffect(() => {
    if (order) {
      setBillingAddress(resolveBillingAddress());
      const resolved = resolveShippingAddress();
      if (resolved) {
        setHasDifferentShipping(true);
        setShippingAddress(resolved);
      } else {
        setHasDifferentShipping(false);
        setShippingAddress({
          address_line1: '',
          postal_code: '',
          city: '',
          country: 'FR',
        });
      }
    }
  }, [order, resolveBillingAddress, resolveShippingAddress]);

  // Récupérer le prochain numéro de facture au chargement
  useEffect(() => {
    if (!open) return;
    setLoadingNextNumber(true);
    void fetch('/api/qonto/invoices?per_page=1&sort_by=number:desc')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.invoices?.[0]?.invoice_number) {
          const lastNumber = data.invoices[0].invoice_number as string;
          // Tenter d'incrémenter le numéro (format F-2026-XXXX)
          const match = lastNumber.match(/(\d+)$/);
          if (match) {
            const nextNum = String(parseInt(match[1], 10) + 1).padStart(
              match[1].length,
              '0'
            );
            const prefix = lastNumber.slice(
              0,
              lastNumber.length - match[1].length
            );
            setNextInvoiceNumber(`${prefix}${nextNum}`);
          } else {
            setNextInvoiceNumber(null);
          }
        }
      })
      .catch(() => {
        // Silently fail - non-critical info
      })
      .finally(() => setLoadingNextNumber(false));
  }, [open]);

  // SIRET guard: org customer without siret AND without vat_number
  const isMissingSiret =
    order?.customer_type === 'organization' &&
    !order.organisations?.siret &&
    !order.organisations?.vat_number &&
    !siretSaved;

  const handleSaveSiret = async (): Promise<void> => {
    if (!order?.customer_id || !siretInput.trim()) return;

    setSavingSiret(true);
    try {
      // Determine if it's a SIRET (14 digits) or VAT number
      const trimmed = siretInput.trim();
      const isSiretFormat = /^\d{14}$/.test(trimmed);

      const updateData = isSiretFormat
        ? { siret: trimmed }
        : { vat_number: trimmed };

      const { error } = await supabaseClient
        .from('organisations')
        .update(updateData)
        .eq('id', order.customer_id);

      if (error) throw error;

      setSiretSaved(true);
      toast({
        title: 'SIRET sauvegardé',
        description: `${isSiretFormat ? 'SIRET' : 'N° TVA'} enregistré pour l'organisation`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de sauvegarder le SIRET',
        variant: 'destructive',
      });
    } finally {
      setSavingSiret(false);
    }
  };

  const resetState = useCallback((): void => {
    setStatus('idle');
    setCreatedInvoice(null);
    setEmailSent(false);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setInvoiceLabel('');
    setSiretInput('');
    setSiretSaved(false);
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
          autoFinalize: false,
          issueDate,
          label: invoiceLabel || undefined,
          // Adresses
          billingAddress,
          shippingAddress: hasDifferentShipping ? shippingAddress : undefined,
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
        description: `Facture ${data.invoice.invoice_number} créée en brouillon`,
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
    order.organisations?.trade_name ||
    order.organisations?.legal_name ||
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
              {/* Client + Adresses */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Info client */}
                  <div>
                    <p className="font-medium">{customerName}</p>
                    {order.organisations?.legal_name &&
                      order.organisations.legal_name !== customerName && (
                        <p className="text-xs text-muted-foreground">
                          {order.organisations.legal_name}
                        </p>
                      )}
                    {customerEmail && (
                      <p className="text-sm text-muted-foreground">
                        {customerEmail}
                      </p>
                    )}
                  </div>

                  {/* Adresse de facturation - Mode lecture */}
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        Adresse de facturation
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setEditingBilling(!editingBilling)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        {editingBilling ? 'Fermer' : 'Modifier'}
                      </Button>
                    </div>

                    {!editingBilling ? (
                      // Mode lecture : adresse formatee
                      <div className="text-sm">
                        {billingAddress.address_line1 && (
                          <p>{billingAddress.address_line1}</p>
                        )}
                        <p>
                          {[billingAddress.postal_code, billingAddress.city]
                            .filter(Boolean)
                            .join(' ')}
                          {billingAddress.country
                            ? `, ${billingAddress.country}`
                            : ''}
                        </p>
                        {!billingAddress.city &&
                          !billingAddress.postal_code && (
                            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded mt-1">
                              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                              <span>
                                Ville et code postal requis pour Qonto
                              </span>
                            </div>
                          )}
                      </div>
                    ) : (
                      // Mode edition : champs editables
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Adresse</Label>
                          <Input
                            value={billingAddress.address_line1}
                            onChange={e =>
                              setBillingAddress(prev => ({
                                ...prev,
                                address_line1: e.target.value,
                              }))
                            }
                            placeholder="Rue, numero..."
                            className="h-8"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Code postal *</Label>
                            <Input
                              value={billingAddress.postal_code}
                              onChange={e =>
                                setBillingAddress(prev => ({
                                  ...prev,
                                  postal_code: e.target.value,
                                }))
                              }
                              placeholder="75001"
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Ville *</Label>
                            <Input
                              value={billingAddress.city}
                              onChange={e =>
                                setBillingAddress(prev => ({
                                  ...prev,
                                  city: e.target.value,
                                }))
                              }
                              placeholder="Paris"
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Pays</Label>
                            <Input
                              value={billingAddress.country}
                              onChange={e =>
                                setBillingAddress(prev => ({
                                  ...prev,
                                  country: e.target.value,
                                }))
                              }
                              placeholder="FR"
                              className="h-8"
                            />
                          </div>
                        </div>
                        {!billingAddress.city &&
                          !billingAddress.postal_code && (
                            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                              <span>
                                Ville et code postal requis pour Qonto
                              </span>
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Adresse de livraison differente */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="different-shipping"
                      checked={hasDifferentShipping}
                      onCheckedChange={checked =>
                        setHasDifferentShipping(checked === true)
                      }
                    />
                    <Label
                      htmlFor="different-shipping"
                      className="text-xs cursor-pointer"
                    >
                      Adresse de livraison differente
                    </Label>
                  </div>

                  {hasDifferentShipping && (
                    <div className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Truck className="h-3 w-3" />
                          Adresse de livraison
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setEditingShipping(!editingShipping)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          {editingShipping ? 'Fermer' : 'Modifier'}
                        </Button>
                      </div>

                      {!editingShipping ? (
                        <div className="text-sm">
                          {shippingAddress.address_line1 && (
                            <p>{shippingAddress.address_line1}</p>
                          )}
                          <p>
                            {[shippingAddress.postal_code, shippingAddress.city]
                              .filter(Boolean)
                              .join(' ')}
                            {shippingAddress.country
                              ? `, ${shippingAddress.country}`
                              : ''}
                          </p>
                          {!shippingAddress.city &&
                            !shippingAddress.postal_code && (
                              <p className="text-xs text-muted-foreground italic">
                                Aucune adresse renseignee
                              </p>
                            )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Adresse</Label>
                            <Input
                              value={shippingAddress.address_line1}
                              onChange={e =>
                                setShippingAddress(prev => ({
                                  ...prev,
                                  address_line1: e.target.value,
                                }))
                              }
                              placeholder="Rue, numero..."
                              className="h-8"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Code postal</Label>
                              <Input
                                value={shippingAddress.postal_code}
                                onChange={e =>
                                  setShippingAddress(prev => ({
                                    ...prev,
                                    postal_code: e.target.value,
                                  }))
                                }
                                placeholder="75001"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Ville</Label>
                              <Input
                                value={shippingAddress.city}
                                onChange={e =>
                                  setShippingAddress(prev => ({
                                    ...prev,
                                    city: e.target.value,
                                  }))
                                }
                                placeholder="Paris"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Pays</Label>
                              <Input
                                value={shippingAddress.country}
                                onChange={e =>
                                  setShippingAddress(prev => ({
                                    ...prev,
                                    country: e.target.value,
                                  }))
                                }
                                placeholder="FR"
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Date de facture + Label + Prochain numéro */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Informations facture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Date de facture *</Label>
                      <Input
                        type="date"
                        value={issueDate}
                        onChange={e => setIssueDate(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Label / Titre (optionnel)
                      </Label>
                      <Input
                        value={invoiceLabel}
                        onChange={e => setInvoiceLabel(e.target.value)}
                        placeholder="Ex: Facture mobilier Pokawa"
                        className="h-8"
                      />
                    </div>
                  </div>
                  {/* Prochain numéro de facture (approximatif) */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    <Info className="h-3 w-3 flex-shrink-0" />
                    {loadingNextNumber ? (
                      <span>Chargement du prochain numéro...</span>
                    ) : nextInvoiceNumber ? (
                      <span>
                        Prochain numéro : <strong>{nextInvoiceNumber}</strong>{' '}
                        (approximatif, attribué par Qonto)
                      </span>
                    ) : (
                      <span>
                        Le numéro de facture sera attribué par Qonto à la
                        création
                      </span>
                    )}
                  </div>
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
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
          {status === 'success' ? (
            <Button onClick={handleClose}>Fermer</Button>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {/* SIRET guard banner */}
              {isMissingSiret && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    SIRET ou n° TVA requis pour facturer une organisation
                  </div>
                  <p className="text-xs text-red-600">
                    L&apos;organisation n&apos;a pas de SIRET ni de numéro de
                    TVA. Saisissez-le ci-dessous pour continuer.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={siretInput}
                      onChange={e => setSiretInput(e.target.value)}
                      placeholder="SIRET (14 chiffres) ou n° TVA (ex: FR12345678901)"
                      className="h-8 flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        void handleSaveSiret();
                      }}
                      disabled={savingSiret || !siretInput.trim()}
                    >
                      {savingSiret ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    void handleCreateInvoice();
                  }}
                  disabled={status === 'creating' || isMissingSiret}
                >
                  {status === 'creating' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Créer en brouillon
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
