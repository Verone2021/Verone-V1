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
  Textarea,
  OrganisationNameDisplay,
} from '@verone/ui';
import { ArrowLeft, Loader2, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import type {
  DocumentType,
  IAddress,
  IEditableItem,
  QontoDocument,
  QontoApiResponse,
} from './types';
import { emptyAddress } from './types';
import {
  generateId,
  getDocumentTypeLabel,
  getDocumentNumber,
  getApiEndpoint,
} from './helpers';
import { AddressSection } from './AddressSection';
import { ItemsSection } from './ItemsSection';

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

  const [items, setItems] = useState<IEditableItem[]>([]);
  const [issueDate, setIssueDate] = useState('');
  const [header, setHeader] = useState('');
  const [footer, setFooter] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [reason, setReason] = useState('');
  const [billingAddress, setBillingAddress] = useState<IAddress>({
    ...emptyAddress,
  });
  const [shippingAddress, setShippingAddress] = useState<IAddress>({
    ...emptyAddress,
  });
  const [partnerLegalName, setPartnerLegalName] = useState<string | null>(null);
  const [partnerTradeName, setPartnerTradeName] = useState<string | null>(null);
  const [linkedOrderNumber, setLinkedOrderNumber] = useState<string | null>(
    null
  );
  const [isLinkedToOrder, setIsLinkedToOrder] = useState(false);

  useEffect(() => {
    async function loadDocument() {
      setLoading(true);
      setError(null);
      const typesToTry: DocumentType[] = typeParam
        ? [typeParam]
        : ['invoice', 'quote', 'credit_note'];
      for (const type of typesToTry) {
        try {
          const endpoint = getApiEndpoint(type, id);
          const response = await fetch(endpoint);
          const data = (await response.json()) as QontoApiResponse;
          if (response.ok && data.success) {
            const doc =
              data.invoice ?? data.quote ?? data.credit_note ?? data.creditNote;
            if (doc) {
              if (doc.status !== 'draft') {
                setError(
                  `Ce ${getDocumentTypeLabel(type).toLowerCase()} n'est pas un brouillon et ne peut pas etre modifie.`
                );
                setLoading(false);
                return;
              }
              setDocument(doc);
              setDocumentType(type);
              setItems(
                doc.items && doc.items.length > 0
                  ? doc.items.map(item => ({
                      id: generateId(),
                      title: item.title ?? '',
                      description: item.description ?? '',
                      quantity: item.quantity ?? '1',
                      unit: item.unit ?? 'unit',
                      unitPrice: item.unit_price?.value ?? '0',
                      vatRate: item.vat_rate ?? '0.20',
                    }))
                  : [
                      {
                        id: generateId(),
                        title: '',
                        description: '',
                        quantity: '1',
                        unit: 'unit',
                        unitPrice: '0',
                        vatRate: '0.20',
                      },
                    ]
              );
              setIssueDate(doc.issue_date ?? '');
              setHeader(doc.header ?? '');
              setFooter(doc.footer ?? '');
              setTermsAndConditions(doc.terms_and_conditions ?? '');
              setDueDate(doc.payment_deadline ?? '');
              setExpiryDate(doc.expiry_date ?? '');
              setReason(doc.reason ?? '');
              if (data.localData?.billing_address) {
                setBillingAddress({
                  street: data.localData.billing_address.street ?? '',
                  city: data.localData.billing_address.city ?? '',
                  zip_code: data.localData.billing_address.zip_code ?? '',
                  country: data.localData.billing_address.country ?? '',
                });
              } else if (doc.client?.billing_address) {
                setBillingAddress({
                  street: doc.client.billing_address.street_address ?? '',
                  city: doc.client.billing_address.city ?? '',
                  zip_code: doc.client.billing_address.zip_code ?? '',
                  country: doc.client.billing_address.country_code ?? '',
                });
              }
              if (data.localData?.shipping_address) {
                setShippingAddress({
                  street: data.localData.shipping_address.street ?? '',
                  city: data.localData.shipping_address.city ?? '',
                  zip_code: data.localData.shipping_address.zip_code ?? '',
                  country: data.localData.shipping_address.country ?? '',
                });
              }
              if (data.localData?.partner_legal_name) {
                setPartnerLegalName(data.localData.partner_legal_name);
                setPartnerTradeName(data.localData.partner_trade_name ?? null);
              }
              if (data.localData?.sales_order_id) {
                setIsLinkedToOrder(true);
                setLinkedOrderNumber(data.localData.order_number ?? null);
              }
              setLoading(false);
              return;
            }
          }
        } catch (err: unknown) {
          console.error(
            `[FacturesEdit] Failed to load ${type}:`,
            err instanceof Error ? err.message : 'Unknown error'
          );
        }
      }
      setError('Document non trouve');
      setLoading(false);
    }
    void loadDocument().catch(err => {
      console.error('[FacturesEdit] loadDocument failed:', err);
    });
  }, [id, typeParam]);

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

  const handleSave = async () => {
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
      if (documentType === 'invoice') {
        if (issueDate) body.issueDate = issueDate;
        if (header) body.header = header;
        if (footer) body.footer = footer;
        if (termsAndConditions) body.termsAndConditions = termsAndConditions;
        if (dueDate) body.dueDate = dueDate;
        if (billingAddress.street || billingAddress.city)
          body.billing_address = billingAddress;
        if (shippingAddress.street || shippingAddress.city)
          body.shipping_address = shippingAddress;
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
      const data = (await response.json()) as QontoApiResponse;
      if (!response.ok || !data.success)
        throw new Error(data.error ?? 'Erreur lors de la sauvegarde');
      toast.success('Modifications enregistrees');
      router.push(`/factures/${id}?type=${documentType}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (error)
    return (
      <div className="w-full py-8 px-4">
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

  if (!document) return null;

  return (
    <div className="w-full py-8 px-4">
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void handleSave().catch(err => {
                console.error('[FacturesEdit] handleSave failed:', err);
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
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Client</CardTitle>
          <CardDescription>
            Le client ne peut pas etre modifie apres creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partnerLegalName ? (
            <OrganisationNameDisplay
              legalName={partnerLegalName}
              tradeName={partnerTradeName}
            />
          ) : (
            <p className="font-medium">{document.client?.name ?? 'Client'}</p>
          )}
          {document.client?.email && (
            <p className="text-sm text-muted-foreground">
              {document.client.email}
            </p>
          )}
        </CardContent>
      </Card>

      {documentType === 'invoice' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Adresses</CardTitle>
            <CardDescription>
              Adresses de facturation et de livraison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddressSection
              billingAddress={billingAddress}
              shippingAddress={shippingAddress}
              onBillingChange={update =>
                setBillingAddress(prev => ({ ...prev, ...update }))
              }
              onShippingChange={update =>
                setShippingAddress(prev => ({ ...prev, ...update }))
              }
              onCopyBillingToShipping={() =>
                setShippingAddress({ ...billingAddress })
              }
            />
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lignes</CardTitle>
          <CardDescription>
            {isLinkedToOrder
              ? `Facture liee a la commande ${linkedOrderNumber ?? ''} — seuls les prix sont modifiables`
              : 'Ajoutez ou modifiez les lignes du document'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemsSection
            items={items}
            isLinkedToOrder={isLinkedToOrder}
            linkedOrderNumber={linkedOrderNumber}
            onItemChange={handleItemChange}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations complementaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {documentType === 'invoice' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="issueDate">Date d&apos;emission</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Date d&apos;echeance</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </>
          )}
          {documentType === 'quote' && (
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Date de validite</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
              />
            </div>
          )}
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
          {documentType !== 'credit_note' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="header">En-tete (optionnel)</Label>
                <Textarea
                  id="header"
                  placeholder="Texte d'en-tete..."
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
                <Label htmlFor="terms">Conditions generales (optionnel)</Label>
                <Textarea
                  id="terms"
                  placeholder="Conditions generales..."
                  value={termsAndConditions}
                  onChange={e => setTermsAndConditions(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
