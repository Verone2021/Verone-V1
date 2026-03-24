'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, DialogDescription } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';

import type { IInvoiceForCreditNote } from './CreditNoteCreateModal';
import { CreditNoteCreateModal } from './CreditNoteCreateModal';
import type {
  IInvoiceDetailModalProps,
  InvoiceDetailsResponse,
  EditState,
} from './invoice-detail/types';
import { InvoiceInfoCard } from './invoice-detail/InvoiceInfoCard';
import { InvoiceClientCard } from './invoice-detail/InvoiceClientCard';
import { InvoiceShippingCard } from './invoice-detail/InvoiceShippingCard';
import { InvoiceItemsTable } from './invoice-detail/InvoiceItemsTable';
import { InvoiceTotalsCard } from './invoice-detail/InvoiceTotalsCard';
import { InvoiceNotesCard } from './invoice-detail/InvoiceNotesCard';
import { InvoiceRelatedDocs } from './invoice-detail/InvoiceRelatedDocs';
import { InvoiceEditForm } from './invoice-detail/InvoiceEditForm';
import { InvoiceFooterActions } from './invoice-detail/InvoiceFooterActions';

export function InvoiceDetailModal({
  invoiceId,
  open,
  onOpenChange,
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
      return res.json() as Promise<InvoiceDetailsResponse>;
    },
    enabled: open && !!invoiceId,
  });

  const invoice = data?.invoice;
  const isEditable = invoice?.status === 'draft';

  // Initialiser l'etat d'edition quand on entre en mode edition
  const initEditState = useCallback(() => {
    if (!invoice) return;

    setEditState({
      due_date: invoice.due_date ?? '',
      notes: invoice.notes ?? '',
      billing_address: invoice.billing_address ??
        invoice.partner?.billing_address ?? {
          street: '',
          city: '',
          postal_code: '',
          country: 'FR',
        },
      shipping_address: invoice.shipping_address ??
        invoice.sales_order?.shipping_address ?? {
          street: '',
          city: '',
          postal_code: '',
          country: 'FR',
        },
      shipping_cost_ht: invoice.shipping_cost_ht ?? 0,
      handling_cost_ht: invoice.handling_cost_ht ?? 0,
      insurance_cost_ht: invoice.insurance_cost_ht ?? 0,
      fees_vat_rate: invoice.fees_vat_rate ?? 0.2,
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
            dueDate: editState.due_date ?? undefined,
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
        const errorData: { error?: string } =
          await (response.json() as Promise<{ error?: string }>);
        throw new Error(errorData.error ?? 'Erreur lors de la sauvegarde');
      }

      // Rafraichir les donnees
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });

      setIsEditing(false);
      setEditState(null);
    } catch (err) {
      console.error('Save error:', err);
      alert(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
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
        status: invoice.status,
        total_amount: invoice.total_ttc,
        total_vat_amount: invoice.tva_amount,
        subtotal_amount: invoice.total_ht,
        currency: 'EUR',
        client_id: invoice.partner?.id ?? '',
        client: invoice.partner
          ? {
              name:
                invoice.partner.legal_name ??
                invoice.partner.trade_name ??
                'Client',
              email: invoice.partner.email,
            }
          : null,
        items: invoice.items.map(item => ({
          id: item.id,
          title: item.product?.name ?? item.description,
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

      const responseData = (await response.json()) as {
        success?: boolean;
        error?: string;
        quote?: { id: string; quote_number: string; pdf_url: string | null };
        pdf_url?: string;
      };

      if (!response.ok || !responseData.success) {
        throw new Error(
          responseData.error ?? 'Erreur lors de la creation du devis'
        );
      }

      setQuoteData(responseData.quote ?? null);

      // Ouvrir le PDF automatiquement si disponible
      if (responseData.pdf_url) {
        window.open(responseData.pdf_url, '_blank');
      }
    } catch (err) {
      console.error('Create quote error:', err);
      alert(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la creation du devis'
      );
    } finally {
      setIsCreatingQuote(false);
    }
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
            {invoice && (
              <span className="text-sm text-muted-foreground">
                Statut : {invoice.status}
              </span>
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
            <InvoiceInfoCard invoice={invoice} />
            <InvoiceClientCard invoice={invoice} />
            <InvoiceShippingCard invoice={invoice} />
            <InvoiceItemsTable items={invoice.items} />
            <InvoiceTotalsCard invoice={invoice} />
            <InvoiceNotesCard invoice={invoice} />
            <InvoiceRelatedDocs invoice={invoice} />
          </div>
        )}

        {/* MODE EDITION */}
        {invoice && isEditing && editState && editTotals && (
          <InvoiceEditForm
            invoice={invoice}
            editState={editState}
            onEditStateChange={setEditState}
            editTotals={editTotals}
          />
        )}

        <DialogFooter className="flex-wrap gap-2">
          {invoice && (
            <InvoiceFooterActions
              invoice={invoice}
              isEditing={isEditing}
              isEditable={isEditable ?? false}
              isSaving={isSaving}
              isActionLoading={isActionLoading}
              isCreatingQuote={isCreatingQuote}
              quoteData={quoteData}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSave={() => void handleSave()}
              onClose={handleClose}
              onFinalize={onFinalize}
              onCreateQuote={() => void handleCreateQuote()}
              onDownloadPdf={handleDownloadPdf}
              onOpenQonto={handleOpenQonto}
              onCreateCreditNote={() => setShowCreditNoteModal(true)}
            />
          )}
        </DialogFooter>
      </DialogContent>

      {/* Modal de creation d'avoir */}
      <CreditNoteCreateModal
        invoice={invoiceForCreditNote}
        open={showCreditNoteModal}
        onOpenChange={setShowCreditNoteModal}
        onSuccess={() => void handleCreditNoteSuccess()}
      />
    </Dialog>
  );
}
