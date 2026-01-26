'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Separator,
  Input,
  Label,
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
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Download,
  Edit,
  ExternalLink,
  FileSignature,
  FileText,
  FileX,
  Loader2,
  MapPin,
  Plus,
  Save,
  Send,
  Trash2,
  Truck,
  X,
} from 'lucide-react';

import {
  CreditNoteCreateModal,
  IInvoiceForCreditNote,
} from './CreditNoteCreateModal';

// Types pour l'API
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  product_id: string | null;
  product?: {
    name: string;
  } | null;
}

interface InvoicePartner {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  email: string | null;
  phone: string | null;
  siret: string | null;
  vat_number: string | null;
  billing_address: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  } | null;
}

interface AddressData {
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

// Document lie (avoir ou devis)
interface RelatedCreditNote {
  id: string;
  credit_note_number: string;
  status: string;
  total_ttc: number;
}

interface RelatedQuote {
  id: string;
  quote_number: string;
  status: string;
}

interface InvoiceDetail {
  id: string;
  document_number: string;
  document_type: string;
  document_date: string;
  due_date: string | null;
  workflow_status:
    | 'synchronized'
    | 'draft_validated'
    | 'finalized'
    | 'sent'
    | 'paid';
  status: string;
  total_ht: number;
  total_ttc: number;
  tva_amount: number;
  amount_paid: number;
  description: string | null;
  notes: string | null;
  payment_terms: string | null;
  qonto_invoice_id: string | null;
  qonto_pdf_url: string | null;
  qonto_public_url: string | null;
  synchronized_at: string | null;
  validated_to_draft_at: string | null;
  finalized_at: string | null;
  sent_at: string | null;
  partner: InvoicePartner | null;
  items: InvoiceItem[];
  sales_order_id: string | null;
  billing_address?: AddressData | null;
  shipping_address?: AddressData | null;
  shipping_cost_ht?: number;
  handling_cost_ht?: number;
  insurance_cost_ht?: number;
  fees_vat_rate?: number;
  sales_order?: {
    order_number: string;
    shipping_address: AddressData | null;
  } | null;
  // Documents lies
  related_credit_notes?: RelatedCreditNote[];
  source_quote?: RelatedQuote | null;
}

interface InvoiceDetailsResponse {
  success: boolean;
  invoice?: InvoiceDetail;
  error?: string;
}

interface IInvoiceDetailModalProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValidateToDraft?: (invoiceId: string) => void;
  onFinalize?: (invoiceId: string) => void;
  isActionLoading?: boolean;
}

// Type pour les items editables
interface EditableItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  product_id: string | null;
}

// Type pour l'etat d'edition
interface EditState {
  due_date: string;
  notes: string;
  billing_address: AddressData;
  shipping_address: AddressData;
  shipping_cost_ht: number;
  handling_cost_ht: number;
  insurance_cost_ht: number;
  fees_vat_rate: number;
  items: EditableItem[];
}

const WORKFLOW_STATUS_CONFIG: Record<
  InvoiceDetail['workflow_status'],
  { label: string; color: string; description: string }
> = {
  synchronized: {
    label: 'Synchronise',
    color: 'bg-blue-100 text-blue-700',
    description: 'Brouillon cree, en attente de validation',
  },
  draft_validated: {
    label: 'Brouillon',
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Valide, pret a etre finalise',
  },
  finalized: {
    label: 'Definitif',
    color: 'bg-green-100 text-green-700',
    description: 'Facture finalisee avec PDF',
  },
  sent: {
    label: 'Envoye',
    color: 'bg-purple-100 text-purple-700',
    description: 'Facture envoyee au client',
  },
  paid: {
    label: 'Paye',
    color: 'bg-emerald-100 text-emerald-700',
    description: 'Facture entierement reglee',
  },
};

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatAddress(address: AddressData | null): string {
  if (!address) return 'Adresse non renseignee';
  const parts = [
    address.street,
    `${address.postal_code || ''} ${address.city || ''}`.trim(),
    address.country,
  ].filter(Boolean);
  return parts.join(', ') || 'Adresse non renseignee';
}

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function InvoiceDetailModal({
  invoiceId,
  open,
  onOpenChange,
  onValidateToDraft,
  onFinalize,
  isActionLoading = false,
}: IInvoiceDetailModalProps): React.ReactNode {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  // Etats pour le devis
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [quoteData, setQuoteData] = useState<{
    id: string;
    quote_number: string;
    pdf_url: string | null;
  } | null>(null);
  // Etat pour le modal d'avoir
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);

  // Fetch invoice details
  const { data, isLoading, error, refetch } = useQuery<InvoiceDetailsResponse>({
    queryKey: ['invoice-details', invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error('No invoice ID');
      const res = await fetch(`/api/qonto/invoices/${invoiceId}/details`);
      if (!res.ok) throw new Error('Failed to fetch invoice details');
      return res.json();
    },
    enabled: open && !!invoiceId,
  });

  const invoice = data?.invoice;
  const statusConfig = invoice
    ? WORKFLOW_STATUS_CONFIG[invoice.workflow_status]
    : null;
  const isEditable =
    invoice &&
    ['synchronized', 'draft_validated'].includes(invoice.workflow_status);

  // Initialiser l'etat d'edition quand on entre en mode edition
  const initEditState = useCallback(() => {
    if (!invoice) return;

    setEditState({
      due_date: invoice.due_date || '',
      notes: invoice.notes || '',
      billing_address: invoice.billing_address ||
        invoice.partner?.billing_address || {
          street: '',
          city: '',
          postal_code: '',
          country: 'FR',
        },
      shipping_address: invoice.shipping_address ||
        invoice.sales_order?.shipping_address || {
          street: '',
          city: '',
          postal_code: '',
          country: 'FR',
        },
      shipping_cost_ht: invoice.shipping_cost_ht || 0,
      handling_cost_ht: invoice.handling_cost_ht || 0,
      insurance_cost_ht: invoice.insurance_cost_ht || 0,
      fees_vat_rate: invoice.fees_vat_rate || 0.2,
      items: invoice.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        tva_rate: item.tva_rate,
        product_id: item.product_id,
      })),
    });
  }, [invoice]);

  // Reset l'etat d'edition quand on ferme le modal
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setEditState(null);
      setQuoteData(null);
      setShowCreditNoteModal(false);
    }
  }, [open]);

  // Calculer les totaux en mode edition
  const calculateTotals = useCallback(() => {
    if (!editState) return { totalHt: 0, totalVat: 0, totalTtc: 0 };

    let totalHt = 0;
    let totalVat = 0;

    // Lignes produits
    for (const item of editState.items) {
      const lineHt = item.unit_price_ht * item.quantity;
      const lineVat = lineHt * (item.tva_rate / 100);
      totalHt += lineHt;
      totalVat += lineVat;
    }

    // Frais
    const feesHt =
      editState.shipping_cost_ht +
      editState.handling_cost_ht +
      editState.insurance_cost_ht;
    const feesVat = feesHt * editState.fees_vat_rate;
    totalHt += feesHt;
    totalVat += feesVat;

    return {
      totalHt,
      totalVat,
      totalTtc: totalHt + totalVat,
    };
  }, [editState]);

  // Calculate VAT breakdown by rate
  const vatBreakdown = invoice?.items.reduce(
    (acc, item) => {
      const rate = item.tva_rate;
      if (!acc[rate]) {
        acc[rate] = { totalHt: 0, totalVat: 0 };
      }
      acc[rate].totalHt += item.total_ht;
      acc[rate].totalVat += item.tva_amount;
      return acc;
    },
    {} as Record<number, { totalHt: number; totalVat: number }>
  );

  const handleClose = (): void => {
    if (isEditing) {
      // Confirmer avant de fermer si en mode edition
      if (confirm('Voulez-vous vraiment fermer sans sauvegarder ?')) {
        setIsEditing(false);
        setEditState(null);
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleStartEdit = (): void => {
    initEditState();
    setIsEditing(true);
  };

  const handleCancelEdit = (): void => {
    setIsEditing(false);
    setEditState(null);
  };

  const handleSave = async (): Promise<void> => {
    if (!editState || !invoice) return;

    setIsSaving(true);
    try {
      // Construire les items Qonto
      const qontoItems = editState.items.map(item => ({
        title: item.description,
        quantity: String(item.quantity),
        unit: 'piece',
        unitPrice: { value: String(item.unit_price_ht), currency: 'EUR' },
        vatRate: String(item.tva_rate / 100), // Qonto attend un decimal (0.2 pour 20%)
      }));

      // Ajouter les frais comme lignes Qonto
      if (editState.shipping_cost_ht > 0) {
        qontoItems.push({
          title: 'Frais de livraison',
          quantity: '1',
          unit: 'forfait',
          unitPrice: {
            value: String(editState.shipping_cost_ht),
            currency: 'EUR',
          },
          vatRate: String(editState.fees_vat_rate),
        });
      }
      if (editState.handling_cost_ht > 0) {
        qontoItems.push({
          title: 'Frais de manutention',
          quantity: '1',
          unit: 'forfait',
          unitPrice: {
            value: String(editState.handling_cost_ht),
            currency: 'EUR',
          },
          vatRate: String(editState.fees_vat_rate),
        });
      }
      if (editState.insurance_cost_ht > 0) {
        qontoItems.push({
          title: "Frais d'assurance",
          quantity: '1',
          unit: 'forfait',
          unitPrice: {
            value: String(editState.insurance_cost_ht),
            currency: 'EUR',
          },
          vatRate: String(editState.fees_vat_rate),
        });
      }

      const response = await fetch(
        `/api/qonto/invoices/${invoice.qonto_invoice_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dueDate: editState.due_date || undefined,
            items: qontoItems,
            // Donnees locales
            notes: editState.notes,
            billing_address: editState.billing_address,
            shipping_address: editState.shipping_address,
            shipping_cost_ht: editState.shipping_cost_ht,
            handling_cost_ht: editState.handling_cost_ht,
            insurance_cost_ht: editState.insurance_cost_ht,
            fees_vat_rate: editState.fees_vat_rate,
            localItems: editState.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unit_price_ht: item.unit_price_ht,
              tva_rate: item.tva_rate,
              product_id: item.product_id,
            })),
            syncToOrder: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      // Rafraichir les donnees
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });

      setIsEditing(false);
      setEditState(null);
    } catch (error) {
      console.error('Save error:', error);
      alert(
        error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = (): void => {
    if (!invoice?.id) return;
    window.open(`/api/qonto/invoices/${invoice.id}/pdf`, '_blank');
  };

  const handleOpenQonto = (): void => {
    if (!invoice?.qonto_public_url) return;
    window.open(invoice.qonto_public_url, '_blank');
  };

  // Convertir les donnees de la facture pour le modal d'avoir
  const invoiceForCreditNote: IInvoiceForCreditNote | null = invoice
    ? {
        id: invoice.id,
        invoice_number: invoice.document_number,
        status: invoice.workflow_status,
        total_amount: invoice.total_ttc,
        total_vat_amount: invoice.tva_amount,
        subtotal_amount: invoice.total_ht,
        currency: 'EUR',
        client_id: invoice.partner?.id || '',
        client: invoice.partner
          ? {
              name:
                invoice.partner.trade_name ||
                invoice.partner.legal_name ||
                'Client',
              email: invoice.partner.email,
            }
          : null,
        items: invoice.items.map(item => ({
          id: item.id,
          title: item.product?.name || item.description,
          description: item.description,
          quantity: item.quantity,
          unit: 'piece',
          unit_price: item.unit_price_ht,
          vat_rate: item.tva_rate / 100, // Conversion en decimal
        })),
      }
    : null;

  // Callback apres creation d'avoir
  const handleCreditNoteSuccess = async (): Promise<void> => {
    setShowCreditNoteModal(false);
    // Rafraichir les donnees pour afficher le lien vers l'avoir
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ['invoices'] });
  };

  // Handler pour creer un devis depuis la facture
  const handleCreateQuote = async (): Promise<void> => {
    if (!invoice?.id) return;

    setIsCreatingQuote(true);
    setQuoteData(null);
    try {
      const response = await fetch(
        `/api/qonto/quotes/from-invoice/${invoice.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la creation du devis');
      }

      setQuoteData(data.quote);

      // Ouvrir le PDF automatiquement si disponible
      if (data.pdf_url) {
        window.open(data.pdf_url, '_blank');
      }
    } catch (error) {
      console.error('Create quote error:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la creation du devis'
      );
    } finally {
      setIsCreatingQuote(false);
    }
  };

  // Handlers pour les items
  const handleItemChange = (
    index: number,
    field: keyof EditableItem,
    value: string | number
  ): void => {
    if (!editState) return;
    const newItems = [...editState.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditState({ ...editState, items: newItems });
  };

  const handleAddItem = (): void => {
    if (!editState) return;
    const newItem: EditableItem = {
      id: generateTempId(),
      description: 'Nouvel article',
      quantity: 1,
      unit_price_ht: 0,
      tva_rate: 20,
      product_id: null,
    };
    setEditState({ ...editState, items: [...editState.items, newItem] });
  };

  const handleRemoveItem = (index: number): void => {
    if (!editState || editState.items.length <= 1) return;
    const newItems = editState.items.filter((_, i) => i !== index);
    setEditState({ ...editState, items: newItems });
  };

  // Handlers pour les adresses
  const handleAddressChange = (
    type: 'billing' | 'shipping',
    field: keyof AddressData,
    value: string
  ): void => {
    if (!editState) return;
    const addressKey =
      type === 'billing' ? 'billing_address' : 'shipping_address';
    setEditState({
      ...editState,
      [addressKey]: { ...editState[addressKey], [field]: value },
    });
  };

  const editTotals = isEditing ? calculateTotals() : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {invoice
              ? `Facture ${invoice.document_number}`
              : 'Detail de la facture'}
            {isEditing && (
              <Badge variant="outline" className="ml-2">
                Mode edition
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {invoice && statusConfig && (
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {statusConfig.description}
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-destructive">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>Erreur lors du chargement de la facture</p>
          </div>
        )}

        {invoice && !isEditing && (
          <div className="space-y-4">
            {/* Dates et informations generales */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date de facture</p>
                    <p className="font-medium">
                      {formatDate(invoice.document_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date d echeance</p>
                    <p className="font-medium">
                      {formatDate(invoice.due_date)}
                    </p>
                  </div>
                  {invoice.payment_terms && (
                    <div>
                      <p className="text-muted-foreground">
                        Conditions de paiement
                      </p>
                      <p className="font-medium">{invoice.payment_terms}</p>
                    </div>
                  )}
                  {invoice.sales_order && (
                    <div>
                      <p className="text-muted-foreground">Commande liee</p>
                      <p className="font-medium">
                        {invoice.sales_order.order_number}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoice.partner ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-base">
                        {invoice.partner.trade_name ||
                          invoice.partner.legal_name ||
                          'Client sans nom'}
                      </p>
                      {invoice.partner.trade_name &&
                        invoice.partner.legal_name && (
                          <p className="text-sm text-muted-foreground">
                            {invoice.partner.legal_name}
                          </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {invoice.partner.siret && (
                        <div>
                          <p className="text-muted-foreground">SIRET</p>
                          <p className="font-mono">{invoice.partner.siret}</p>
                        </div>
                      )}
                      {invoice.partner.vat_number && (
                        <div>
                          <p className="text-muted-foreground">N TVA</p>
                          <p className="font-mono">
                            {invoice.partner.vat_number}
                          </p>
                        </div>
                      )}
                      {invoice.partner.email && (
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p>{invoice.partner.email}</p>
                        </div>
                      )}
                      {invoice.partner.phone && (
                        <div>
                          <p className="text-muted-foreground">Telephone</p>
                          <p>{invoice.partner.phone}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2 pt-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Adresse de facturation
                        </p>
                        <p className="text-sm">
                          {formatAddress(
                            invoice.billing_address ||
                              invoice.partner.billing_address
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun client associe</p>
                )}
              </CardContent>
            </Card>

            {/* Adresse de livraison (si differente) */}
            {(invoice.shipping_address ||
              invoice.sales_order?.shipping_address) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Adresse de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {formatAddress(
                      invoice.shipping_address ||
                        invoice.sales_order?.shipping_address ||
                        null
                    )}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Lignes de facture */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Lignes de facture</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {invoice.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right w-20">Qte</TableHead>
                        <TableHead className="text-right w-28">PU HT</TableHead>
                        <TableHead className="text-right w-20">TVA</TableHead>
                        <TableHead className="text-right w-28">
                          Total TTC
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {item.product?.name || item.description}
                              </p>
                              {item.product?.name &&
                                item.description !== item.product.name && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.description}
                                  </p>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatAmount(item.unit_price_ht)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {Math.round(item.tva_rate)}%
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatAmount(item.total_ttc)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    <p>Aucune ligne de facture</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Totaux */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex justify-end">
                  <div className="w-72 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total HT</span>
                      <span className="font-medium">
                        {formatAmount(invoice.total_ht)}
                      </span>
                    </div>

                    {vatBreakdown &&
                      Object.entries(vatBreakdown)
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .map(([rate, { totalVat }]) => (
                          <div key={rate} className="flex justify-between">
                            <span className="text-muted-foreground">
                              TVA {Math.round(Number(rate))}%
                            </span>
                            <span>{formatAmount(totalVat)}</span>
                          </div>
                        ))}

                    <Separator />

                    <div className="flex justify-between text-base font-bold">
                      <span>Total TTC</span>
                      <span>{formatAmount(invoice.total_ttc)}</span>
                    </div>

                    {invoice.amount_paid > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Deja paye</span>
                          <span>- {formatAmount(invoice.amount_paid)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Reste a payer</span>
                          <span>
                            {formatAmount(
                              invoice.total_ttc - invoice.amount_paid
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {(invoice.description || invoice.notes) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoice.description && (
                    <p className="text-sm mb-2">{invoice.description}</p>
                  )}
                  {invoice.notes && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documents lies */}
            {((invoice.related_credit_notes &&
              invoice.related_credit_notes.length > 0) ||
              invoice.source_quote ||
              invoice.sales_order) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents lies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Devis source */}
                  {invoice.source_quote && (
                    <div className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4 text-blue-500" />
                        <span>Creee depuis devis</span>
                        <span className="font-medium">
                          {invoice.source_quote.quote_number}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          window.open(
                            `/devis/${invoice.source_quote!.id}`,
                            '_blank'
                          )
                        }
                      >
                        Voir le devis
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Commande liee */}
                  {invoice.sales_order && (
                    <div className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-green-500" />
                        <span>Commande liee</span>
                        <span className="font-medium">
                          {invoice.sales_order.order_number}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          window.open(
                            `/commandes/clients/${invoice.sales_order_id}`,
                            '_blank'
                          )
                        }
                      >
                        Voir la commande
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Avoirs lies */}
                  {invoice.related_credit_notes?.map(creditNote => (
                    <div
                      key={creditNote.id}
                      className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <FileX className="h-4 w-4 text-red-500" />
                        <span>Avoir</span>
                        <span className="font-medium">
                          {creditNote.credit_note_number}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatAmount(creditNote.total_ttc)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          window.open(`/avoirs/${creditNote.id}`, '_blank')
                        }
                      >
                        Voir l avoir
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* MODE EDITION */}
        {invoice && isEditing && editState && (
          <div className="space-y-4">
            {/* Informations generales */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="due_date">Date d echeance</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={editState.due_date}
                      onChange={e =>
                        setEditState({ ...editState, due_date: e.target.value })
                      }
                    />
                  </div>
                  {invoice.sales_order && (
                    <div>
                      <Label>Commande liee</Label>
                      <p className="text-sm font-medium mt-2">
                        {invoice.sales_order.order_number}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Adresse de facturation */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse de facturation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="billing_street">Rue</Label>
                    <Input
                      id="billing_street"
                      value={editState.billing_address.street || ''}
                      onChange={e =>
                        handleAddressChange('billing', 'street', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_postal_code">Code postal</Label>
                    <Input
                      id="billing_postal_code"
                      value={editState.billing_address.postal_code || ''}
                      onChange={e =>
                        handleAddressChange(
                          'billing',
                          'postal_code',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_city">Ville</Label>
                    <Input
                      id="billing_city"
                      value={editState.billing_address.city || ''}
                      onChange={e =>
                        handleAddressChange('billing', 'city', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_country">Pays</Label>
                    <Input
                      id="billing_country"
                      value={editState.billing_address.country || 'FR'}
                      onChange={e =>
                        handleAddressChange(
                          'billing',
                          'country',
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adresse de livraison */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="shipping_street">Rue</Label>
                    <Input
                      id="shipping_street"
                      value={editState.shipping_address.street || ''}
                      onChange={e =>
                        handleAddressChange(
                          'shipping',
                          'street',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_postal_code">Code postal</Label>
                    <Input
                      id="shipping_postal_code"
                      value={editState.shipping_address.postal_code || ''}
                      onChange={e =>
                        handleAddressChange(
                          'shipping',
                          'postal_code',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_city">Ville</Label>
                    <Input
                      id="shipping_city"
                      value={editState.shipping_address.city || ''}
                      onChange={e =>
                        handleAddressChange('shipping', 'city', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_country">Pays</Label>
                    <Input
                      id="shipping_country"
                      value={editState.shipping_address.country || 'FR'}
                      onChange={e =>
                        handleAddressChange(
                          'shipping',
                          'country',
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lignes de facture */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Lignes de facture</CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="text-right w-20">Qte</TableHead>
                      <TableHead className="text-right w-28">PU HT</TableHead>
                      <TableHead className="text-right w-20">TVA %</TableHead>
                      <TableHead className="text-right w-28">
                        Total HT
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editState.items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={e =>
                              handleItemChange(
                                index,
                                'description',
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            className="text-right"
                            value={item.quantity}
                            onChange={e =>
                              handleItemChange(
                                index,
                                'quantity',
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="text-right"
                            value={item.unit_price_ht}
                            onChange={e =>
                              handleItemChange(
                                index,
                                'unit_price_ht',
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            className="text-right"
                            value={item.tva_rate}
                            onChange={e =>
                              handleItemChange(
                                index,
                                'tva_rate',
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(item.unit_price_ht * item.quantity)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(index)}
                            disabled={editState.items.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
                <CardTitle className="text-sm">Frais de service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="shipping_cost">Livraison HT</Label>
                    <Input
                      id="shipping_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editState.shipping_cost_ht}
                      onChange={e =>
                        setEditState({
                          ...editState,
                          shipping_cost_ht: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="handling_cost">Manutention HT</Label>
                    <Input
                      id="handling_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editState.handling_cost_ht}
                      onChange={e =>
                        setEditState({
                          ...editState,
                          handling_cost_ht: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurance_cost">Assurance HT</Label>
                    <Input
                      id="insurance_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editState.insurance_cost_ht}
                      onChange={e =>
                        setEditState({
                          ...editState,
                          insurance_cost_ht: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="fees_vat">TVA frais (%)</Label>
                    <Input
                      id="fees_vat"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={editState.fees_vat_rate}
                      onChange={e =>
                        setEditState({
                          ...editState,
                          fees_vat_rate: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Totaux calcules */}
            {editTotals && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex justify-end">
                    <div className="w-72 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total HT</span>
                        <span className="font-medium">
                          {formatAmount(editTotals.totalHt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total TVA</span>
                        <span>{formatAmount(editTotals.totalVat)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-bold">
                        <span>Total TTC</span>
                        <span>{formatAmount(editTotals.totalTtc)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editState.notes}
                  onChange={e =>
                    setEditState({ ...editState, notes: e.target.value })
                  }
                  placeholder="Notes internes..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          {/* Mode affichage */}
          {invoice && !isEditing && (
            <>
              {/* Bouton Modifier - visible si editable */}
              {isEditable && (
                <Button variant="outline" onClick={handleStartEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              )}

              {/* Bouton Valider brouillon - visible si synchronized */}
              {invoice.workflow_status === 'synchronized' &&
                onValidateToDraft && (
                  <Button
                    onClick={() => onValidateToDraft(invoice.id)}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Valider brouillon
                  </Button>
                )}

              {/* Bouton Finaliser - visible si draft_validated */}
              {invoice.workflow_status === 'draft_validated' && onFinalize && (
                <Button
                  onClick={() => onFinalize(invoice.id)}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Finaliser (PDF)
                </Button>
              )}

              {/* Bouton Creer devis - visible si draft_validated */}
              {invoice.workflow_status === 'draft_validated' && (
                <Button
                  variant="outline"
                  onClick={handleCreateQuote}
                  disabled={isCreatingQuote}
                >
                  {isCreatingQuote ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSignature className="mr-2 h-4 w-4" />
                  )}
                  Creer un devis
                </Button>
              )}

              {/* Afficher les actions du devis si cree */}
              {quoteData && quoteData.pdf_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(quoteData.pdf_url!, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Telecharger devis ({quoteData.quote_number})
                </Button>
              )}

              {/* Bouton Creer un avoir - visible si finalisee/envoyee/payee */}
              {['finalized', 'sent', 'paid'].includes(
                invoice.workflow_status
              ) && (
                <Button
                  variant="outline"
                  onClick={() => setShowCreditNoteModal(true)}
                >
                  <FileX className="mr-2 h-4 w-4" />
                  Creer un avoir
                </Button>
              )}

              {/* Bouton Telecharger PDF - visible si finalise */}
              {['finalized', 'sent', 'paid'].includes(
                invoice.workflow_status
              ) &&
                invoice.qonto_pdf_url && (
                  <Button variant="outline" onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4" />
                    Telecharger PDF
                  </Button>
                )}

              {/* Bouton Voir sur Qonto - visible si finalise et URL publique */}
              {invoice.qonto_public_url && (
                <Button variant="outline" onClick={handleOpenQonto}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Voir sur Qonto
                </Button>
              )}
            </>
          )}

          {/* Mode edition */}
          {isEditing && (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Sauvegarder et synchroniser
              </Button>
            </>
          )}

          {!isEditing && (
            <Button variant="outline" onClick={handleClose}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Modal de creation d'avoir */}
      <CreditNoteCreateModal
        invoice={invoiceForCreditNote}
        open={showCreditNoteModal}
        onOpenChange={setShowCreditNoteModal}
        onSuccess={handleCreditNoteSuccess}
      />
    </Dialog>
  );
}
