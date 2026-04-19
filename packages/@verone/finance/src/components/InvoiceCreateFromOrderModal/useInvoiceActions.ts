'use client';

import { useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import type {
  IDocumentAddress,
  ICustomLine,
  IOrderForDocument,
} from '../OrderSelectModal';
import type {
  CreateStatus,
  ICreatedInvoice,
  IInvoiceApiResponse,
  IInvoiceListApiResponse,
} from './types';

interface IInvoiceActionsParams {
  order: IOrderForDocument | null;
  issueDate: string;
  invoiceLabel: string;
  billingAddress: IDocumentAddress;
  hasDifferentShipping: boolean;
  shippingAddress: IDocumentAddress;
  shippingCostHt: number;
  handlingCostHt: number;
  insuranceCostHt: number;
  feesVatRate: number;
  customLines: ICustomLine[];
  /** ID de l'org de facturation choisie (null = org commande) */
  billingOrgId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (invoiceId: string, invoiceNumber: string) => void;
  setStatus: (status: CreateStatus) => void;
  setCreatedInvoice: (invoice: ICreatedInvoice | null) => void;
  setSiretInput: (v: string) => void;
  setSiretSaved: (v: boolean) => void;
  setIssueDate: (v: string) => void;
  setInvoiceLabel: (v: string) => void;
  setSavingSiret: (v: boolean) => void;
  siretInput: string;
}

export function useInvoiceActions(params: IInvoiceActionsParams) {
  const { toast } = useToast();
  const supabaseClient = createClient();

  const {
    order,
    issueDate,
    invoiceLabel,
    billingAddress,
    hasDifferentShipping,
    shippingAddress,
    shippingCostHt,
    handlingCostHt,
    insuranceCostHt,
    feesVatRate,
    customLines,
    billingOrgId,
    onOpenChange,
    onSuccess,
    setStatus,
    setCreatedInvoice,
    setSiretInput,
    setSiretSaved,
    setIssueDate,
    setInvoiceLabel,
    setSavingSiret,
    siretInput,
  } = params;

  const resetState = useCallback((): void => {
    setStatus('idle');
    setCreatedInvoice(null);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setInvoiceLabel('');
    setSiretInput('');
    setSiretSaved(false);
  }, [
    setStatus,
    setCreatedInvoice,
    setIssueDate,
    setInvoiceLabel,
    setSiretInput,
    setSiretSaved,
  ]);

  const handleClose = useCallback((): void => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

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
          // Org de facturation si différente de l'org commande
          billingOrgId: billingOrgId ?? undefined,
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

      const data = (await response.json()) as IInvoiceApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to create invoice');
      }

      // Fallback: use order total (API may not return total_amount for drafts)
      setCreatedInvoice({
        ...data.invoice,
        total_amount: data.invoice.total_amount ?? order.total_ttc ?? 0,
        invoice_number: data.invoice.invoice_number ?? 'Brouillon',
      });
      setStatus('success');
      toast({
        title: 'Facture créée',
        description: `Facture ${data.invoice.invoice_number ?? 'Brouillon'} créée en brouillon`,
      });
      onSuccess?.(data.invoice.id, data.invoice.invoice_number ?? 'Brouillon');
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

  return { resetState, handleClose, handleSaveSiret, handleCreateInvoice };
}

export type { IInvoiceListApiResponse };
