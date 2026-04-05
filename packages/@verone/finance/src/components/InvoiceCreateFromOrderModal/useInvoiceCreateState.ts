'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
  IDocumentAddress,
  ICustomLine,
  IOrderForDocument,
} from '../OrderSelectModal';
import type { CreateStatus, ICreatedInvoice } from './types';
import { normalizeCountryCode } from './utils';

export interface IInvoiceCreateState {
  status: CreateStatus;
  setStatus: (status: CreateStatus) => void;
  createdInvoice: ICreatedInvoice | null;
  setCreatedInvoice: (invoice: ICreatedInvoice | null) => void;
  siretInput: string;
  setSiretInput: (v: string) => void;
  savingSiret: boolean;
  setSavingSiret: (v: boolean) => void;
  siretSaved: boolean;
  setSiretSaved: (v: boolean) => void;
  issueDate: string;
  setIssueDate: (v: string) => void;
  invoiceLabel: string;
  setInvoiceLabel: (v: string) => void;
  nextInvoiceNumber: string | null;
  setNextInvoiceNumber: (v: string | null) => void;
  loadingNextNumber: boolean;
  setLoadingNextNumber: (v: boolean) => void;
  shippingCostHt: number;
  setShippingCostHt: (v: number) => void;
  handlingCostHt: number;
  setHandlingCostHt: (v: number) => void;
  insuranceCostHt: number;
  setInsuranceCostHt: (v: number) => void;
  feesVatRate: number;
  setFeesVatRate: (v: number) => void;
  customLines: ICustomLine[];
  setCustomLines: (lines: ICustomLine[]) => void;
  showAddLine: boolean;
  setShowAddLine: (v: boolean) => void;
  newLineTitle: string;
  setNewLineTitle: (v: string) => void;
  newLineQty: number;
  setNewLineQty: (v: number) => void;
  newLinePriceHt: number;
  setNewLinePriceHt: (v: number) => void;
  newLineVatRate: number;
  setNewLineVatRate: (v: number) => void;
  billingAddress: IDocumentAddress;
  setBillingAddress: (
    v: IDocumentAddress | ((prev: IDocumentAddress) => IDocumentAddress)
  ) => void;
  hasDifferentShipping: boolean;
  setHasDifferentShipping: (v: boolean) => void;
  shippingAddress: IDocumentAddress;
  setShippingAddress: (
    v: IDocumentAddress | ((prev: IDocumentAddress) => IDocumentAddress)
  ) => void;
  editingBilling: boolean;
  setEditingBilling: (v: boolean) => void;
  editingShipping: boolean;
  setEditingShipping: (v: boolean) => void;
  isMissingSiret: boolean;
  resolveBillingAddress: () => IDocumentAddress;
  resolveShippingAddress: () => IDocumentAddress | null;
}

export function useInvoiceCreateState(
  order: IOrderForDocument | null
): IInvoiceCreateState {
  const [status, setStatus] = useState<CreateStatus>('idle');
  const [createdInvoice, setCreatedInvoice] = useState<ICreatedInvoice | null>(
    null
  );

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
  useEffect(() => {
    if (order) {
      setShippingCostHt(order.shipping_cost_ht ?? 0);
      setHandlingCostHt(order.handling_cost_ht ?? 0);
      setInsuranceCostHt(order.insurance_cost_ht ?? 0);
      setFeesVatRate(order.fees_vat_rate ?? 0.2);
    }
  }, [order]);

  // Résoudre l'adresse de facturation avec fallback
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
        address_line1: order.billing_address.address_line1 ?? '',
        address_line2: order.billing_address.address_line2 ?? '',
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
        address_line1: org.billing_address_line1 ?? '',
        postal_code: org.billing_postal_code,
        city: org.billing_city,
        country: normalizeCountryCode(org.billing_country),
      };
    }

    // Priority 3: org main address
    if (org.city && org.postal_code) {
      return {
        address_line1: org.address_line1 ?? '',
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
        address_line1: order.shipping_address.address_line1 ?? '',
        address_line2: order.shipping_address.address_line2 ?? '',
        postal_code: order.shipping_address.postal_code,
        city: order.shipping_address.city,
        country: normalizeCountryCode(order.shipping_address.country),
      };
    }

    const org = order.organisations;
    if (!org?.has_different_shipping_address) return null;

    // Org shipping columns
    if (org.shipping_city && org.shipping_postal_code) {
      return {
        address_line1: org.shipping_address_line1 ?? '',
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

  // SIRET guard
  const isMissingSiret =
    order?.customer_type === 'organization' &&
    !order.organisations?.siret &&
    !order.organisations?.vat_number &&
    !siretSaved;

  return {
    status,
    setStatus,
    createdInvoice,
    setCreatedInvoice,
    siretInput,
    setSiretInput,
    savingSiret,
    setSavingSiret,
    siretSaved,
    setSiretSaved,
    issueDate,
    setIssueDate,
    invoiceLabel,
    setInvoiceLabel,
    nextInvoiceNumber,
    setNextInvoiceNumber,
    loadingNextNumber,
    setLoadingNextNumber,
    shippingCostHt,
    setShippingCostHt,
    handlingCostHt,
    setHandlingCostHt,
    insuranceCostHt,
    setInsuranceCostHt,
    feesVatRate,
    setFeesVatRate,
    customLines,
    setCustomLines,
    showAddLine,
    setShowAddLine,
    newLineTitle,
    setNewLineTitle,
    newLineQty,
    setNewLineQty,
    newLinePriceHt,
    setNewLinePriceHt,
    newLineVatRate,
    setNewLineVatRate,
    billingAddress,
    setBillingAddress,
    hasDifferentShipping,
    setHasDifferentShipping,
    shippingAddress,
    setShippingAddress,
    editingBilling,
    setEditingBilling,
    editingShipping,
    setEditingShipping,
    isMissingSiret,
    resolveBillingAddress,
    resolveShippingAddress,
  };
}
