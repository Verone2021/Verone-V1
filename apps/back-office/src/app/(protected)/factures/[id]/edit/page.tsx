'use client';

import { useState, useEffect, useCallback, use } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from '@verone/ui';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// =====================================================================
// TYPES
// =====================================================================

type DocumentType = 'invoice' | 'quote' | 'credit_note';

interface QontoClient {
  id: string;
  name: string;
  email?: string;
}

interface QontoInvoiceItem {
  title: string;
  description?: string;
  quantity: string;
  unit?: string;
  unit_price: { value: string; currency: string };
  vat_rate: string;
}

interface QontoDocument {
  id: string;
  status: string;
  currency: string;
  issue_date: string;
  client_id: string;
  client?: QontoClient;
  items?: QontoInvoiceItem[];
  // Invoice specific
  invoice_number?: string;
  payment_deadline?: string;
  // Quote specific
  quote_number?: string;
  expiry_date?: string;
  // Credit note specific
  credit_note_number?: string;
  reason?: string;
  // Header/footer
  header?: string;
  footer?: string;
  terms_and_conditions?: string;
}

interface IEditableItem {
  id: string;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
}

// =====================================================================
// HELPERS
// =====================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    invoice: 'Facture',
    quote: 'Devis',
    credit_note: 'Avoir',
  };
  return labels[type] || type;
}

function getDocumentNumber(doc: QontoDocument, type: DocumentType): string {
  switch (type) {
    case 'invoice':
      return doc.invoice_number ?? doc.id;
    case 'quote':
      return doc.quote_number ?? doc.id;
    case 'credit_note':
      return doc.credit_note_number ?? doc.id;
    default:
      return doc.id;
  }
}

function getApiEndpoint(type: DocumentType, id: string): string {
  switch (type) {
    case 'invoice':
      return `/api/qonto/invoices/${id}`;
    case 'quote':
      return `/api/qonto/quotes/${id}`;
    case 'credit_note':
      return `/api/qonto/credit-notes/${id}`;
    default:
      return `/api/qonto/invoices/${id}`;
  }
}

// =====================================================================
// COMPOSANTS
// =====================================================================

interface IItemRowProps {
  item: IEditableItem;
  onChange: (id: string, field: keyof IEditableItem, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function ItemRow({ item, onChange, onRemove, canRemove }: IItemRowProps) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start p-3 bg-slate-50 rounded-lg">
      {/* Title & Description */}
      <div className="col-span-4 space-y-1">
        <Input
          placeholder="Titre *"
          value={item.title}
          onChange={e => onChange(item.id, 'title', e.target.value)}
        />
        <Input
          placeholder="Description (optionnel)"
          value={item.description}
          onChange={e => onChange(item.id, 'description', e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Quantity */}
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Qté"
          value={item.quantity}
          onChange={e => onChange(item.id, 'quantity', e.target.value)}
        />
      </div>

      {/* Unit Price */}
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Prix HT"
          value={item.unitPrice}
          onChange={e => onChange(item.id, 'unitPrice', e.target.value)}
        />
      </div>

      {/* VAT Rate */}
      <div className="col-span-2">
        <Select
          value={item.vatRate}
          onValueChange={value => onChange(item.id, 'vatRate', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="TVA" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0%</SelectItem>
            <SelectItem value="0.055">5.5%</SelectItem>
            <SelectItem value="0.10">10%</SelectItem>
            <SelectItem value="0.20">20%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          disabled={!canRemove}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// =====================================================================
// PAGE PRINCIPALE
// =====================================================================

interface IPageProps {
  params: Promise<{ id: string }>;
}

export default function EditDraftPage({ params }: IPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as DocumentType | null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<QontoDocument | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('invoice');

  // Editable fields
  const [items, setItems] = useState<IEditableItem[]>([]);
  const [header, setHeader] = useState('');
  const [footer, setFooter] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [reason, setReason] = useState('');

  // Load document
  useEffect(() => {
    async function loadDocument() {
      setLoading(true);
      setError(null);

      // Determine type from param or try to detect
      const typesToTry: DocumentType[] = typeParam
        ? [typeParam]
        : ['invoice', 'quote', 'credit_note'];

      for (const type of typesToTry) {
        try {
          const endpoint = getApiEndpoint(type, id);
          const response = await fetch(endpoint);
          const data = await response.json();

          if (response.ok && data.success) {
            const doc =
              data.invoice || data.quote || data.credit_note || data.creditNote;

            if (doc) {
              // Check if draft
              if (doc.status !== 'draft') {
                setError(
                  `Ce ${getDocumentTypeLabel(type).toLowerCase()} n'est pas un brouillon et ne peut pas être modifié.`
                );
                setLoading(false);
                return;
              }

              setDocument(doc);
              setDocumentType(type);

              // Initialize form fields
              if (doc.items && doc.items.length > 0) {
                setItems(
                  doc.items.map((item: QontoInvoiceItem) => ({
                    id: generateId(),
                    title: item.title ?? '',
                    description: item.description ?? '',
                    quantity: item.quantity ?? '1',
                    unit: item.unit ?? 'unit',
                    unitPrice: item.unit_price?.value ?? '0',
                    vatRate: item.vat_rate ?? '0.20',
                  }))
                );
              } else {
                // Add one empty item
                setItems([
                  {
                    id: generateId(),
                    title: '',
                    description: '',
                    quantity: '1',
                    unit: 'unit',
                    unitPrice: '0',
                    vatRate: '0.20',
                  },
                ]);
              }

              setHeader(doc.header ?? '');
              setFooter(doc.footer ?? '');
              setTermsAndConditions(doc.terms_and_conditions ?? '');
              setDueDate(doc.payment_deadline ?? '');
              setExpiryDate(doc.expiry_date ?? '');
              setReason(doc.reason ?? '');

              setLoading(false);
              return;
            }
          }
        } catch {
          // Try next type
        }
      }

      setError('Document non trouvé');
      setLoading(false);
    }

    void loadDocument().catch(error => {
      console.error('[FacturesEdit] loadDocument failed:', error);
    });
  }, [id, typeParam]);

  // Item handlers
  const handleItemChange = useCallback(
    (itemId: string, field: keyof IEditableItem, value: string) => {
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const handleAddItem = useCallback(() => {
    setItems(prev => [
      ...prev,
      {
        id: generateId(),
        title: '',
        description: '',
        quantity: '1',
        unit: 'unit',
        unitPrice: '0',
        vatRate: '0.20',
      },
    ]);
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Save handler
  const handleSave = async () => {
    // Validate
    const validItems = items.filter(item => item.title.trim());
    if (validItems.length === 0) {
      toast.error('Veuillez ajouter au moins une ligne avec un titre');
      return;
    }

    setSaving(true);

    try {
      const endpoint = getApiEndpoint(documentType, id);

      const body: Record<string, unknown> = {
        items: validItems.map(item => ({
          title: item.title,

          description: item.description ?? undefined,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: {
            value: item.unitPrice,
            currency: document?.currency ?? 'EUR',
          },
          vatRate: item.vatRate,
        })),
      };

      // Type-specific fields
      if (documentType === 'invoice') {
        if (header) body.header = header;
        if (footer) body.footer = footer;
        if (termsAndConditions) body.termsAndConditions = termsAndConditions;
        if (dueDate) body.dueDate = dueDate;
      } else if (documentType === 'quote') {
        if (header) body.header = header;
        if (footer) body.footer = footer;
        if (termsAndConditions) body.termsAndConditions = termsAndConditions;
        if (expiryDate) body.expiryDate = expiryDate;
      } else if (documentType === 'credit_note') {
        if (reason) body.reason = reason;
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur lors de la sauvegarde');
      }

      toast.success('Modifications enregistrées');
      router.push(`/factures/${id}?type=${documentType}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalVat = 0;

    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const vatRate = parseFloat(item.vatRate) || 0;

      const itemTotal = qty * price;
      const itemVat = itemTotal * vatRate;

      subtotal += itemTotal;
      totalVat += itemVat;
    });

    return {
      subtotal,
      totalVat,
      total: subtotal + totalVat,
    };
  };

  const totals = calculateTotals();

  // =====================================================================
  // RENDER
  // =====================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800">{error}</p>
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Modifier {getDocumentTypeLabel(documentType).toLowerCase()}
            </h1>
            <p className="text-sm text-muted-foreground">
              {getDocumentNumber(document, documentType)} (Brouillon)
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            void handleSave().catch(error => {
              console.error('[FacturesEdit] handleSave failed:', error);
            });
          }}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      {/* Client Info (read-only) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Client</CardTitle>
          <CardDescription>
            Le client ne peut pas être modifié après création
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{document.client?.name ?? 'Client'}</p>
          {document.client?.email && (
            <p className="text-sm text-muted-foreground">
              {document.client.email}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lignes</CardTitle>
          <CardDescription>
            Ajoutez ou modifiez les lignes du document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-3 text-sm font-medium text-muted-foreground">
            <div className="col-span-4">Désignation</div>
            <div className="col-span-2">Quantité</div>
            <div className="col-span-2">Prix HT</div>
            <div className="col-span-2">TVA</div>
            <div className="col-span-2" />
          </div>

          {/* Items */}
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onChange={handleItemChange}
              onRemove={handleRemoveItem}
              canRemove={items.length > 1}
            />
          ))}

          {/* Add button */}
          <Button
            variant="outline"
            onClick={handleAddItem}
            className="w-full mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </Button>

          <Separator className="my-4" />

          {/* Totals */}
          <div className="space-y-2 text-right">
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">Sous-total HT</span>
              <span className="font-medium w-24">
                {totals.subtotal.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">TVA</span>
              <span className="font-medium w-24">
                {totals.totalVat.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-end gap-8 text-lg">
              <span className="font-medium">Total TTC</span>
              <span className="font-bold w-24">
                {totals.total.toFixed(2)} €
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type-specific fields */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations complémentaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invoice specific */}
          {documentType === 'invoice' && (
            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d&apos;échéance</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          )}

          {/* Quote specific */}
          {documentType === 'quote' && (
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Date de validité</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
              />
            </div>
          )}

          {/* Credit note specific */}
          {documentType === 'credit_note' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Motif de l&apos;avoir</Label>
              <Textarea
                id="reason"
                placeholder="Motif de l'avoir..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Header/footer for invoices and quotes */}
          {documentType !== 'credit_note' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="header">En-tête (optionnel)</Label>
                <Textarea
                  id="header"
                  placeholder="Texte d'en-tête..."
                  value={header}
                  onChange={e => setHeader(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer">Pied de page (optionnel)</Label>
                <Textarea
                  id="footer"
                  placeholder="Texte de pied de page..."
                  value={footer}
                  onChange={e => setFooter(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Conditions générales (optionnel)</Label>
                <Textarea
                  id="terms"
                  placeholder="Conditions générales..."
                  value={termsAndConditions}
                  onChange={e => setTermsAndConditions(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button
          onClick={() => {
            void handleSave().catch(error => {
              console.error('[FacturesEdit] handleSave failed:', error);
            });
          }}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
