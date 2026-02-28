'use client';

import { useState, useEffect, useCallback, use } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  EditableQuoteItemRow,
  QuoteStatusBadge,
} from '@verone/finance/components';
import {
  useQuotes,
  type Quote,
  type QuoteStatus,
  type UpdateQuoteData,
  type CreateQuoteItemData,
} from '@verone/finance/hooks';
import { AddProductToOrderModal } from '@verone/orders/components/modals/AddProductToOrderModal';
import type { CreateOrderItemData } from '@verone/orders/hooks';
import { useLinkMeSelection, type SelectionItem } from '@verone/orders/hooks';
import { SelectionProductDetailModal } from '../../../canaux-vente/linkme/components/SelectionProductDetailModal';
import type { SelectionItem as BackOfficeSelectionItem } from '../../../canaux-vente/linkme/hooks/use-linkme-selections';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@verone/ui';
import { Money } from '@verone/ui-business';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  Undo2,
  User,
  X,
  Check,
  XCircle,
  ArrowRightLeft,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// =====================================================================
// TYPES
// =====================================================================

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

interface EditableFields {
  notes: string;
  billing_address: Record<string, unknown> | null;
  shipping_address: Record<string, unknown> | null;
  validity_days: number;
  items: EditableItem[];
  reference: string;
  shipping_cost_ht: number;
  handling_cost_ht: number;
  insurance_cost_ht: number;
  fees_vat_rate: number;
}

/** Product info for UI display (never persisted to DB) */
interface EditableItemProduct {
  name: string;
  sku: string | null;
  image_url: string | null;
}

interface EditableItem {
  id: string;
  product_id: string | null;
  product: EditableItemProduct | null;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  discount_percentage: number;
  eco_tax: number;
  // LinkMe metadata (preserved for save)
  linkme_selection_item_id: string | null;
  base_price_ht: number | null;
  retrocession_rate: number | null;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function addressToString(address: Record<string, unknown> | null): string {
  if (!address) return '';
  // Support freeform text format: { address: "multiline text" }
  if (typeof address.address === 'string' && address.address) {
    return address.address;
  }
  const street = (address.street as string) ?? (address.line1 as string) ?? '';
  const zip = (address.zip as string) ?? (address.postal_code as string) ?? '';
  const city = (address.city as string) ?? '';
  const country = (address.country as string) ?? '';
  return [street, [zip, city].filter(Boolean).join(' '), country]
    .filter(Boolean)
    .join('\n');
}

function stringToAddress(text: string): Record<string, unknown> {
  const lines = text.split('\n').map(l => l.trim());
  return {
    street: lines[0] ?? '',
    city: lines[1]?.replace(/^\d+\s*/, '') ?? '',
    zip: lines[1]?.match(/^\d+/)?.[0] ?? '',
    country: lines[2] ?? '',
  };
}

/** Check if a field is editable given the current quote status */
function isFieldEditable(
  field: string,
  status: QuoteStatus,
  hasQonto: boolean
): boolean {
  if (hasQonto) return false;

  const draftOnlyFields = new Set([
    'items',
    'customer',
    'channel',
    'reference',
    'fees',
  ]);
  const draftAndSentFields = new Set([
    'notes',
    'validity_date',
    'billing_address',
    'shipping_address',
  ]);

  if (status === 'draft') return true;
  if (status === 'sent') return draftAndSentFields.has(field);
  return false;
}

// =====================================================================
// STATUS TRANSITION CONFIG
// =====================================================================

interface StatusAction {
  label: string;
  targetStatus: QuoteStatus;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  icon: React.ReactNode;
  confirmTitle: string;
  confirmDescription: string;
  requiresNoQonto?: boolean;
}

function getStatusActions(
  currentStatus: QuoteStatus,
  hasQonto: boolean
): StatusAction[] {
  const actions: StatusAction[] = [];

  if (currentStatus === 'draft') {
    actions.push({
      label: 'Valider et envoyer',
      targetStatus: 'sent',
      variant: 'default',
      icon: <Send className="mr-2 h-4 w-4" />,
      confirmTitle: 'Valider le devis ?',
      confirmDescription:
        'Le devis passera en statut "Envoyé". Les articles et informations principales ne seront plus modifiables.',
    });
  }

  if (currentStatus === 'sent') {
    if (!hasQonto) {
      actions.push({
        label: 'Revenir en brouillon',
        targetStatus: 'draft',
        variant: 'outline',
        icon: <Undo2 className="mr-2 h-4 w-4" />,
        confirmTitle: 'Revenir en brouillon ?',
        confirmDescription:
          'Le devis repassera en brouillon et pourra être entièrement modifié.',
        requiresNoQonto: true,
      });
    }
    actions.push({
      label: 'Marquer accepté',
      targetStatus: 'accepted',
      variant: 'default',
      icon: <Check className="mr-2 h-4 w-4" />,
      confirmTitle: 'Marquer comme accepté ?',
      confirmDescription:
        'Le devis sera marqué comme accepté par le client. Il ne sera plus modifiable.',
    });
    actions.push({
      label: 'Marquer refusé',
      targetStatus: 'declined',
      variant: 'destructive',
      icon: <XCircle className="mr-2 h-4 w-4" />,
      confirmTitle: 'Marquer comme refusé ?',
      confirmDescription:
        'Le devis sera marqué comme refusé. Cette action est irréversible.',
    });
  }

  if (currentStatus === 'accepted') {
    actions.push({
      label: 'Convertir en facture',
      targetStatus: 'converted',
      variant: 'default',
      icon: <ArrowRightLeft className="mr-2 h-4 w-4" />,
      confirmTitle: 'Convertir en facture ?',
      confirmDescription:
        'Le devis sera marqué comme converti. Cette action est irréversible.',
    });
  }

  return actions;
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { fetchQuote, updateQuote, changeQuoteStatus, deleteQuote } =
    useQuotes();

  // State
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<StatusAction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // LinkMe detail modal state
  const [detailModalItem, setDetailModalItem] =
    useState<BackOfficeSelectionItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalSaving, setDetailModalSaving] = useState(false);

  // Editable state
  const [editFields, setEditFields] = useState<EditableFields>({
    notes: '',
    billing_address: null,
    shipping_address: null,
    validity_days: 30,
    items: [],
    reference: '',
    shipping_cost_ht: 0,
    handling_cost_ht: 0,
    insurance_cost_ht: 0,
    fees_vat_rate: 0.2,
  });

  const [updatingOrgAddress, setUpdatingOrgAddress] = useState(false);

  // LinkMe selection details (for editing LinkMe quotes)
  const { data: linkmeSelectionDetails } = useLinkMeSelection(
    quote?.linkme_selection_id ?? null
  );

  // Handler to propagate address changes back to the organisation
  const handleUpdateOrgAddress = useCallback(async () => {
    if (!quote?.partner?.id) return;
    setUpdatingOrgAddress(true);
    try {
      const supabase = createClient();
      const billingText = addressToString(editFields.billing_address);
      const shippingText = addressToString(editFields.shipping_address);

      // Parse the freeform text into structured address fields
      const parseBillingLines = billingText.split('\n').filter(Boolean);
      const parseShippingLines = shippingText.split('\n').filter(Boolean);

      const updateData: Record<string, string | null> = {
        billing_address_line1: parseBillingLines[0] ?? null,
        billing_address_line2:
          parseBillingLines.length > 3 ? parseBillingLines[1] : null,
        billing_city:
          parseBillingLines.length > 2
            ? (parseBillingLines[parseBillingLines.length - 2]?.replace(
                /^\d+\s*/,
                ''
              ) ?? null)
            : null,
        billing_postal_code:
          parseBillingLines.length > 2
            ? (parseBillingLines[parseBillingLines.length - 2]?.match(
                /^\d+/
              )?.[0] ?? null)
            : null,
        billing_country:
          parseBillingLines[parseBillingLines.length - 1] ?? null,
      };

      if (shippingText && shippingText !== billingText) {
        updateData.shipping_address_line1 = parseShippingLines[0] ?? null;
        updateData.shipping_address_line2 =
          parseShippingLines.length > 3 ? parseShippingLines[1] : null;
        updateData.shipping_city =
          parseShippingLines.length > 2
            ? (parseShippingLines[parseShippingLines.length - 2]?.replace(
                /^\d+\s*/,
                ''
              ) ?? null)
            : null;
        updateData.shipping_postal_code =
          parseShippingLines.length > 2
            ? (parseShippingLines[parseShippingLines.length - 2]?.match(
                /^\d+/
              )?.[0] ?? null)
            : null;
        updateData.shipping_country =
          parseShippingLines[parseShippingLines.length - 1] ?? null;
        updateData.has_different_shipping_address = 'true';
      }

      const { error } = await supabase
        .from('organisations')
        .update(updateData)
        .eq('id', quote.partner.id);

      if (error) throw error;
      toast.success("Adresse de l'organisation mise à jour");
    } catch (err) {
      console.error('[QuoteDetail] Update org address error:', err);
      toast.error("Erreur lors de la mise à jour de l'adresse");
    } finally {
      setUpdatingOrgAddress(false);
    }
  }, [
    quote?.partner?.id,
    editFields.billing_address,
    editFields.shipping_address,
  ]);

  // -----------------------------------------------------------------
  // LOAD QUOTE
  // -----------------------------------------------------------------
  const loadQuote = useCallback(async () => {
    setLoading(true);
    const data = await fetchQuote(id);
    if (!data) {
      toast.error('Devis introuvable');
      router.push('/factures');
      return;
    }
    setQuote(data);
    setLoading(false);
  }, [id, fetchQuote, router]);

  useEffect(() => {
    void loadQuote().catch((err: unknown) => {
      console.error('[QuoteDetail] loadQuote error:', err);
    });
  }, [loadQuote]);

  // -----------------------------------------------------------------
  // ENTER EDIT MODE
  // -----------------------------------------------------------------
  const enterEditMode = useCallback(() => {
    if (!quote) return;

    // Compute validity_days from validity_date
    let validityDays = 30;
    if (quote.validity_date) {
      const validityDate = new Date(quote.validity_date);
      const createdDate = new Date(quote.document_date);
      const diffMs = validityDate.getTime() - createdDate.getTime();
      validityDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (validityDays <= 0) validityDays = 30;
    }

    setEditFields({
      notes: quote.notes ?? '',
      billing_address: quote.billing_address,
      shipping_address: quote.shipping_address,
      validity_days: validityDays,
      items: (quote.items ?? []).map(item => {
        // Extract primary image from joined product data
        const productImages = item.product?.product_images ?? [];
        const primaryImage =
          productImages.find(img => img.is_primary)?.public_url ??
          productImages[0]?.public_url ??
          null;

        return {
          id: item.id,
          product_id: item.product_id,
          product: item.product
            ? {
                name: item.product.name,
                sku: item.product.sku,
                image_url: primaryImage,
              }
            : null,
          description: item.description,
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
          tva_rate: item.tva_rate,
          discount_percentage: item.discount_percentage,
          eco_tax: item.eco_tax,
          linkme_selection_item_id: item.linkme_selection_item_id,
          base_price_ht: item.base_price_ht,
          retrocession_rate: item.retrocession_rate,
        };
      }),
      reference: quote.document_number,
      shipping_cost_ht: quote.shipping_cost_ht,
      handling_cost_ht: quote.handling_cost_ht,
      insurance_cost_ht: quote.insurance_cost_ht,
      fees_vat_rate: quote.fees_vat_rate,
    });
    setIsEditing(true);
  }, [quote]);

  // -----------------------------------------------------------------
  // SAVE CHANGES
  // -----------------------------------------------------------------
  const handleSave = useCallback(async () => {
    if (!quote) return;
    setSaving(true);

    const status = quote.quote_status;
    const updateData: UpdateQuoteData = {};

    // Always include notes, addresses, validity
    updateData.notes = editFields.notes;
    updateData.billing_address = editFields.billing_address ?? undefined;
    updateData.shipping_address = editFields.shipping_address ?? undefined;
    updateData.validity_days = editFields.validity_days;

    // Draft-only fields
    if (status === 'draft') {
      updateData.reference = editFields.reference;
      updateData.shipping_cost_ht = editFields.shipping_cost_ht;
      updateData.handling_cost_ht = editFields.handling_cost_ht;
      updateData.insurance_cost_ht = editFields.insurance_cost_ht;
      updateData.fees_vat_rate = editFields.fees_vat_rate;

      // Items
      const items: CreateQuoteItemData[] = editFields.items.map(item => ({
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        tva_rate: item.tva_rate,
        discount_percentage: item.discount_percentage,
        eco_tax: item.eco_tax,
        linkme_selection_item_id: item.linkme_selection_item_id,
        base_price_ht: item.base_price_ht,
        retrocession_rate: item.retrocession_rate,
      }));
      updateData.items = items;
    }

    const success = await updateQuote(quote.id, updateData);
    setSaving(false);

    if (success) {
      setIsEditing(false);
      await loadQuote();
    }
  }, [quote, editFields, updateQuote, loadQuote]);

  // -----------------------------------------------------------------
  // STATUS TRANSITION
  // -----------------------------------------------------------------
  const handleStatusChange = useCallback(
    async (targetStatus: QuoteStatus) => {
      if (!quote) return;
      setSaving(true);
      const success = await changeQuoteStatus(quote.id, targetStatus);
      setSaving(false);
      setConfirmAction(null);
      if (success) {
        await loadQuote();
      }
    },
    [quote, changeQuoteStatus, loadQuote]
  );

  // -----------------------------------------------------------------
  // DELETE
  // -----------------------------------------------------------------
  const handleDelete = useCallback(async () => {
    if (!quote) return;
    const success = await deleteQuote(quote.id);
    setShowDeleteConfirm(false);
    if (success) {
      router.push('/factures');
    }
  }, [quote, deleteQuote, router]);

  // -----------------------------------------------------------------
  // ITEM MANAGEMENT (edit mode, draft only)
  // -----------------------------------------------------------------
  const updateItem = useCallback(
    (itemId: string, field: keyof EditableItem, value: string | number) => {
      setEditFields(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      }));
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    setEditFields(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
  }, []);

  const addManualItem = useCallback(() => {
    setEditFields(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: generateId(),
          product_id: null,
          product: null,
          description: '',
          quantity: 1,
          unit_price_ht: 0,
          tva_rate: 20,
          discount_percentage: 0,
          eco_tax: 0,
          linkme_selection_item_id: null,
          base_price_ht: null,
          retrocession_rate: null,
        },
      ],
    }));
  }, []);

  const handleAddProduct = useCallback((data: CreateOrderItemData) => {
    setEditFields(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: generateId(),
          product_id: data.product_id,
          product: data.product_name
            ? {
                name: data.product_name,
                sku: data.product_sku ?? null,
                image_url: data.product_image_url ?? null,
              }
            : null,
          description:
            data.notes ?? data.product_name ?? `Produit ${data.product_id}`,
          quantity: data.quantity,
          unit_price_ht: data.unit_price_ht,
          tva_rate: data.tax_rate ?? 20,
          discount_percentage: data.discount_percentage ?? 0,
          eco_tax: data.eco_tax ?? 0,
          linkme_selection_item_id: null,
          base_price_ht: null,
          retrocession_rate: null,
        },
      ],
    }));
    setShowAddProduct(false);
  }, []);

  const handleAddLinkMeProduct = useCallback(
    (selItem: SelectionItem) => {
      // Check if already in items → increment quantity
      const existing = editFields.items.find(
        i => i.product_id === selItem.product_id
      );
      if (existing) {
        updateItem(existing.id, 'quantity', existing.quantity + 1);
        return;
      }

      // LinkMe price formula
      const commissionRate = (selItem.commission_rate ?? 0) / 100;
      const marginRate = selItem.margin_rate / 100;
      const sellingPrice =
        Math.round(
          (selItem.base_price_ht / (1 - marginRate)) *
            (1 + commissionRate) *
            100
        ) / 100;

      setEditFields(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            id: generateId(),
            product_id: selItem.product_id,
            product: {
              name: selItem.product?.name ?? '',
              sku: selItem.product?.sku ?? null,
              image_url: selItem.product_image_url ?? null,
            },
            description:
              selItem.custom_description ?? selItem.product?.name ?? '',
            quantity: 1,
            unit_price_ht: sellingPrice,
            tva_rate: 20,
            discount_percentage: 0,
            eco_tax: 0,
            linkme_selection_item_id: selItem.id,
            base_price_ht: selItem.base_price_ht,
            retrocession_rate: marginRate,
          },
        ],
      }));
    },
    [editFields.items, updateItem]
  );

  // Open detail modal for a LinkMe item (from table row margin click)
  const handleEditMarginFromTable = useCallback(
    (editableItemId: string) => {
      const editItem = editFields.items.find(i => i.id === editableItemId);
      if (!editItem?.linkme_selection_item_id || !linkmeSelectionDetails?.items)
        return;

      const selItem = linkmeSelectionDetails.items.find(
        (si: SelectionItem) => si.id === editItem.linkme_selection_item_id
      );
      if (!selItem) return;

      // Map @verone/orders SelectionItem to back-office SelectionItem for the modal
      const modalItem: BackOfficeSelectionItem = {
        ...selItem,
        is_hidden_by_staff: false,
        // Override margin_rate with the current editable value (may have been changed)
        margin_rate:
          editItem.retrocession_rate !== null
            ? editItem.retrocession_rate * 100
            : selItem.margin_rate,
        // Override base_price_ht with current editable value
        base_price_ht: editItem.base_price_ht ?? selItem.base_price_ht,
      };

      setDetailModalItem(modalItem);
      setIsDetailModalOpen(true);
    },
    [editFields.items, linkmeSelectionDetails]
  );

  // Open detail modal from selection panel (view button)
  const handleOpenDetailFromPanel = useCallback((selItem: SelectionItem) => {
    const modalItem: BackOfficeSelectionItem = {
      ...selItem,
      is_hidden_by_staff: false,
    };
    setDetailModalItem(modalItem);
    setIsDetailModalOpen(true);
  }, []);

  // Save margin changes from the detail modal
  const handleDetailModalSave = useCallback(
    async (
      itemId: string,
      updates: { marginRate?: number; customPriceHT?: number }
    ) => {
      setDetailModalSaving(true);
      try {
        // Find the matching editable item by linkme_selection_item_id
        const editItemIndex = editFields.items.findIndex(
          i => i.linkme_selection_item_id === itemId
        );

        if (editItemIndex === -1) {
          // Item not yet added to the quote — nothing to update
          setDetailModalSaving(false);
          return;
        }

        const editItem = editFields.items[editItemIndex];
        const newMarginRate =
          updates.marginRate !== undefined
            ? updates.marginRate / 100 // Convert from % to decimal
            : editItem.retrocession_rate;
        const newBasePriceHT = updates.customPriceHT ?? editItem.base_price_ht;

        // Recalculate selling price with LinkMe formula
        const commissionRate = (detailModalItem?.commission_rate ?? 0) / 100;
        const marginDecimal = newMarginRate ?? 0;
        const base = newBasePriceHT ?? 0;
        const sellingPrice =
          Math.round(
            (base / (1 - marginDecimal)) * (1 + commissionRate) * 100
          ) / 100;

        setEditFields(prev => ({
          ...prev,
          items: prev.items.map((item, idx) =>
            idx === editItemIndex
              ? {
                  ...item,
                  base_price_ht: newBasePriceHT,
                  retrocession_rate: newMarginRate,
                  unit_price_ht: sellingPrice,
                }
              : item
          ),
        }));
      } finally {
        setDetailModalSaving(false);
      }
    },
    [editFields.items, detailModalItem]
  );

  // -----------------------------------------------------------------
  // COMPUTED
  // -----------------------------------------------------------------
  const computedTotals = (() => {
    if (!isEditing || !quote) {
      return {
        items_total_ht: quote?.total_ht ?? 0,
        tva_amount: quote?.tva_amount ?? 0,
        total_ttc: quote?.total_ttc ?? 0,
      };
    }

    let items_total_ht = 0;
    let items_tva = 0;
    for (const item of editFields.items) {
      const discount = 1 - item.discount_percentage / 100;
      const lineHt =
        item.quantity * item.unit_price_ht * discount +
        item.eco_tax * item.quantity;
      const lineTva = lineHt * (item.tva_rate / 100);
      items_total_ht += lineHt;
      items_tva += lineTva;
    }

    const fees_total_ht =
      editFields.shipping_cost_ht +
      editFields.handling_cost_ht +
      editFields.insurance_cost_ht;
    const fees_vat = fees_total_ht * editFields.fees_vat_rate;

    const total_ht = items_total_ht + fees_total_ht;
    const tva_amount = items_tva + fees_vat;
    const total_ttc = total_ht + tva_amount;

    return { items_total_ht: total_ht, tva_amount, total_ttc };
  })();

  // -----------------------------------------------------------------
  // LOADING STATE
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Devis introuvable</p>
        <Button variant="outline" asChild>
          <Link href="/factures">Retour aux factures</Link>
        </Button>
      </div>
    );
  }

  const status = quote.quote_status;
  const hasQonto = !!quote.qonto_invoice_id;
  const canEdit = (status === 'draft' || status === 'sent') && !hasQonto;
  const canDelete = !quote.converted_to_invoice_id;
  const statusActions = getStatusActions(status, hasQonto);
  const isLinkMe = quote.channel?.code === 'linkme';

  const customerName = quote.individual_customer
    ? `${quote.individual_customer.first_name} ${quote.individual_customer.last_name}`
    : (quote.partner?.trade_name ?? quote.partner?.legal_name ?? '-');

  // -----------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ============================================================= */}
      {/* HEADER */}
      {/* ============================================================= */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/factures">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {quote.document_number}
              </h1>
              <QuoteStatusBadge status={status} />
              {hasQonto && (
                <Badge variant="outline" className="text-xs">
                  Qonto
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Créé le {formatDate(quote.created_at)}
              {quote.validity_date &&
                ` — Valide jusqu'au ${formatDate(quote.validity_date)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit / Save / Cancel buttons */}
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button
                onClick={() => {
                  void handleSave().catch((err: unknown) => {
                    console.error('[QuoteDetail] save error:', err);
                  });
                }}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Sauvegarder
              </Button>
            </>
          ) : (
            <>
              {canEdit && (
                <Button variant="outline" onClick={enterEditMode}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              )}

              {/* Status transition actions */}
              {statusActions.map(action => (
                <Button
                  key={action.targetStatus}
                  variant={action.variant}
                  onClick={() => setConfirmAction(action)}
                  disabled={saving}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}

              {/* Qonto links */}
              {hasQonto && quote.qonto_invoice_id && (
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `/api/qonto/quotes/${quote.qonto_invoice_id}/view`,
                      '_blank'
                    )
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  PDF Qonto
                </Button>
              )}

              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* CONTENT GRID */}
      {/* ============================================================= */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* ----- CLIENT INFO ----- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {quote.customer_type === 'individual' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{customerName}</p>
                </div>
                {quote.channel && (
                  <div>
                    <p className="text-sm text-muted-foreground">Canal</p>
                    <p className="font-medium">{quote.channel.name}</p>
                  </div>
                )}
                {quote.individual_customer?.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {quote.individual_customer.email}
                    </p>
                  </div>
                )}
                {quote.sales_order_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Commande liée
                    </p>
                    <Link
                      href={`/commandes/${quote.sales_order_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Voir la commande
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ----- LINKME SELECTION PRODUCTS (edit mode only) ----- */}
          {isEditing &&
            isLinkMe &&
            quote.linkme_selection_id &&
            linkmeSelectionDetails &&
            isFieldEditable('items', status, hasQonto) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Produits de la sélection — {linkmeSelectionDetails.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {(linkmeSelectionDetails.items ?? []).map(
                      (selItem: SelectionItem) => {
                        const commissionRate =
                          (selItem.commission_rate ?? 0) / 100;
                        const marginRate = selItem.margin_rate / 100;
                        const sellingPrice =
                          Math.round(
                            (selItem.base_price_ht / (1 - marginRate)) *
                              (1 + commissionRate) *
                              100
                          ) / 100;
                        const alreadyAdded = editFields.items.some(
                          i => i.product_id === selItem.product_id
                        );

                        return (
                          <div
                            key={selItem.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3">
                              {selItem.product_image_url ? (
                                <img
                                  src={selItem.product_image_url}
                                  alt={selItem.product?.name ?? ''}
                                  className="h-10 w-10 rounded border object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded border bg-gray-100">
                                  <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium line-clamp-1">
                                  {selItem.product?.name ?? 'Produit'}
                                </p>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                  <span>
                                    Base:{' '}
                                    {formatCurrency(selItem.base_price_ht)}
                                  </span>
                                  <span>Marge: {selItem.margin_rate}%</span>
                                  {selItem.commission_rate ? (
                                    <span>Com: {selItem.commission_rate}%</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium">
                                {formatCurrency(sellingPrice)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleOpenDetailFromPanel(selItem)
                                }
                                title="Voir le détail produit"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={alreadyAdded ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => handleAddLinkMeProduct(selItem)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                {alreadyAdded ? '+1' : 'Ajouter'}
                              </Button>
                            </div>
                          </div>
                        );
                      }
                    )}
                    {(linkmeSelectionDetails.items ?? []).length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        Aucun produit dans cette sélection
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* ----- ITEMS TABLE ----- */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Articles</CardTitle>
                {isEditing &&
                  isFieldEditable('items', status, hasQonto) &&
                  !isLinkMe && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddProduct(true)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Catalogue
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addManualItem}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Ligne libre
                      </Button>
                    </div>
                  )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">
                      Produit / Description
                    </TableHead>
                    <TableHead className="text-right">Qté</TableHead>
                    <TableHead className="text-right">Prix unit. HT</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">Remise</TableHead>
                    {isLinkMe && (
                      <>
                        <TableHead className="text-right">
                          Prix base HT
                        </TableHead>
                        <TableHead className="text-right">Marge</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">Total HT</TableHead>
                    {isEditing &&
                      isFieldEditable('items', status, hasQonto) && (
                        <TableHead className="w-10" />
                      )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isEditing && isFieldEditable('items', status, hasQonto)
                    ? /* EDIT MODE ITEMS */
                      editFields.items.map(item => (
                        <EditableQuoteItemRow
                          key={item.id}
                          item={item}
                          isLinkMe={isLinkMe}
                          onUpdate={(itemId, field, value) =>
                            updateItem(
                              itemId,
                              field as keyof EditableItem,
                              value
                            )
                          }
                          onDelete={removeItem}
                          onEditMargin={
                            isLinkMe ? handleEditMarginFromTable : undefined
                          }
                        />
                      ))
                    : /* READ MODE ITEMS */
                      (quote.items ?? [])
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map(item => {
                          const productImages =
                            item.product?.product_images ?? [];
                          const primaryImage =
                            productImages.find(img => img.is_primary)
                              ?.public_url ??
                            productImages[0]?.public_url ??
                            null;

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.product ? (
                                  <div className="flex gap-3 items-center">
                                    <div className="flex-shrink-0">
                                      {primaryImage ? (
                                        <img
                                          src={primaryImage}
                                          alt={item.product.name}
                                          className="w-10 h-10 object-cover rounded border"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center">
                                          <FileText className="h-5 w-5 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm line-clamp-2">
                                        {item.product.name}
                                      </p>
                                      {item.product.sku && (
                                        <p className="text-xs text-muted-foreground">
                                          {item.product.sku}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  item.description
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.unit_price_ht)}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.tva_rate}%
                              </TableCell>
                              <TableCell className="text-right">
                                {item.discount_percentage > 0
                                  ? `${item.discount_percentage}%`
                                  : '-'}
                              </TableCell>
                              {isLinkMe && (
                                <>
                                  <TableCell className="text-right text-sm text-muted-foreground">
                                    {item.base_price_ht !== null
                                      ? formatCurrency(item.base_price_ht)
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-right text-sm text-muted-foreground">
                                    {item.retrocession_rate !== null
                                      ? `${(item.retrocession_rate * 100).toFixed(0)}%`
                                      : '-'}
                                  </TableCell>
                                </>
                              )}
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.total_ht)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                  {(isEditing ? editFields.items : (quote.items ?? []))
                    .length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={isLinkMe ? 8 : 6}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Aucun article
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  {(() => {
                    const baseColSpan = 5;
                    const linkMeExtra = isLinkMe ? 2 : 0;
                    const footerColSpan = baseColSpan + linkMeExtra;
                    return (
                      <>
                        <TableRow>
                          <TableCell
                            colSpan={footerColSpan}
                            className="text-right"
                          >
                            Total HT
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <Money amount={computedTotals.items_total_ht} />
                          </TableCell>
                          {isEditing &&
                            isFieldEditable('items', status, hasQonto) && (
                              <TableCell />
                            )}
                        </TableRow>
                        <TableRow>
                          <TableCell
                            colSpan={footerColSpan}
                            className="text-right"
                          >
                            TVA
                          </TableCell>
                          <TableCell className="text-right">
                            <Money amount={computedTotals.tva_amount} />
                          </TableCell>
                          {isEditing &&
                            isFieldEditable('items', status, hasQonto) && (
                              <TableCell />
                            )}
                        </TableRow>
                        <TableRow className="font-bold">
                          <TableCell
                            colSpan={footerColSpan}
                            className="text-right"
                          >
                            Total TTC
                          </TableCell>
                          <TableCell className="text-right">
                            <Money
                              amount={computedTotals.total_ttc}
                              bold
                              size="lg"
                            />
                          </TableCell>
                          {isEditing &&
                            isFieldEditable('items', status, hasQonto) && (
                              <TableCell />
                            )}
                        </TableRow>
                      </>
                    );
                  })()}
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* ----- NOTES ----- */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && isFieldEditable('notes', status, hasQonto) ? (
                <Textarea
                  value={editFields.notes}
                  onChange={e =>
                    setEditFields(prev => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Notes internes ou message client..."
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm">
                  {quote.notes || (
                    <span className="text-muted-foreground">Aucune note</span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-6">
          {/* ----- METADATA ----- */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Reference */}
              <div>
                <p className="text-sm text-muted-foreground">Référence</p>
                {isEditing && isFieldEditable('reference', status, hasQonto) ? (
                  <Input
                    value={editFields.reference}
                    onChange={e =>
                      setEditFields(prev => ({
                        ...prev,
                        reference: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium">{quote.document_number}</p>
                )}
              </div>

              <Separator />

              {/* Date */}
              <div>
                <p className="text-sm text-muted-foreground">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  Date de création
                </p>
                <p className="font-medium">{formatDate(quote.document_date)}</p>
              </div>

              {/* Validity */}
              <div>
                <p className="text-sm text-muted-foreground">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  Date de validité
                </p>
                {isEditing &&
                isFieldEditable('validity_date', status, hasQonto) ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="number"
                      value={editFields.validity_days}
                      onChange={e =>
                        setEditFields(prev => ({
                          ...prev,
                          validity_days: parseInt(e.target.value, 10) || 30,
                        }))
                      }
                      className="w-20"
                      min={1}
                    />
                    <span className="text-sm text-muted-foreground">jours</span>
                  </div>
                ) : (
                  <p className="font-medium">
                    {formatDate(quote.validity_date)}
                  </p>
                )}
              </div>

              <Separator />

              {/* Fees (draft only) */}
              {(status === 'draft' ||
                quote.shipping_cost_ht > 0 ||
                quote.handling_cost_ht > 0 ||
                quote.insurance_cost_ht > 0) && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Frais</p>
                    {isEditing && isFieldEditable('fees', status, hasQonto) ? (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Port HT</Label>
                          <Input
                            type="number"
                            value={editFields.shipping_cost_ht}
                            onChange={e =>
                              setEditFields(prev => ({
                                ...prev,
                                shipping_cost_ht:
                                  parseFloat(e.target.value) || 0,
                              }))
                            }
                            step={0.01}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Manutention HT</Label>
                          <Input
                            type="number"
                            value={editFields.handling_cost_ht}
                            onChange={e =>
                              setEditFields(prev => ({
                                ...prev,
                                handling_cost_ht:
                                  parseFloat(e.target.value) || 0,
                              }))
                            }
                            step={0.01}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Assurance HT</Label>
                          <Input
                            type="number"
                            value={editFields.insurance_cost_ht}
                            onChange={e =>
                              setEditFields(prev => ({
                                ...prev,
                                insurance_cost_ht:
                                  parseFloat(e.target.value) || 0,
                              }))
                            }
                            step={0.01}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        {quote.shipping_cost_ht > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Port</span>
                            <Money amount={quote.shipping_cost_ht} size="sm" />
                          </div>
                        )}
                        {quote.handling_cost_ht > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Manutention
                            </span>
                            <Money amount={quote.handling_cost_ht} size="sm" />
                          </div>
                        )}
                        {quote.insurance_cost_ht > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Assurance
                            </span>
                            <Money amount={quote.insurance_cost_ht} size="sm" />
                          </div>
                        )}
                        {quote.shipping_cost_ht === 0 &&
                          quote.handling_cost_ht === 0 &&
                          quote.insurance_cost_ht === 0 && (
                            <p className="text-muted-foreground">Aucun frais</p>
                          )}
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Conversion info */}
              {quote.converted_to_invoice_id && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Converti en facture
                  </p>
                  <Link
                    href={`/factures/${quote.converted_to_invoice_id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Voir la facture
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ----- ADDRESSES ----- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Adresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Billing address */}
              <div>
                <p className="mb-1 text-sm font-medium">
                  Adresse de facturation
                </p>
                {isEditing &&
                isFieldEditable('billing_address', status, hasQonto) ? (
                  <Textarea
                    value={addressToString(editFields.billing_address)}
                    onChange={e =>
                      setEditFields(prev => ({
                        ...prev,
                        billing_address: stringToAddress(e.target.value),
                      }))
                    }
                    rows={3}
                    placeholder="Adresse de facturation..."
                  />
                ) : (
                  <AddressDisplay address={quote.billing_address} />
                )}
              </div>

              <Separator />

              {/* Shipping address */}
              <div>
                <p className="mb-1 text-sm font-medium">Adresse de livraison</p>
                {isEditing &&
                isFieldEditable('shipping_address', status, hasQonto) ? (
                  <Textarea
                    value={addressToString(editFields.shipping_address)}
                    onChange={e =>
                      setEditFields(prev => ({
                        ...prev,
                        shipping_address: stringToAddress(e.target.value),
                      }))
                    }
                    rows={3}
                    placeholder="Adresse de livraison..."
                  />
                ) : (
                  <AddressDisplay address={quote.shipping_address} />
                )}
              </div>

              {/* Propagate address to organisation */}
              {isEditing &&
                quote.partner?.id &&
                quote.customer_type === 'organization' && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={updatingOrgAddress}
                      onClick={() => {
                        void handleUpdateOrgAddress().catch((err: unknown) => {
                          console.error(
                            '[QuoteDetail] updateOrgAddress error:',
                            err
                          );
                        });
                      }}
                      className="w-full text-xs"
                    >
                      {updatingOrgAddress ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Mettre à jour l&apos;adresse de l&apos;organisation
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================================= */}
      {/* DIALOGS */}
      {/* ============================================================= */}

      {/* Status transition confirmation */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={open => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  void handleStatusChange(confirmAction.targetStatus).catch(
                    (err: unknown) => {
                      console.error('[QuoteDetail] status change error:', err);
                    }
                  );
                }
              }}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le devis {quote.document_number} sera supprimé. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void handleDelete().catch((err: unknown) => {
                  console.error('[QuoteDetail] delete error:', err);
                });
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add product modal */}
      {showAddProduct && (
        <AddProductToOrderModal
          open={showAddProduct}
          onClose={() => setShowAddProduct(false)}
          onAdd={handleAddProduct}
          orderType="sales"
        />
      )}

      {/* LinkMe product detail modal (margin editing) */}
      {isLinkMe && (
        <SelectionProductDetailModal
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          item={detailModalItem}
          mode={isEditing ? 'edit' : 'view'}
          onSave={handleDetailModalSave}
          isSaving={detailModalSaving}
        />
      )}
    </div>
  );
}

// =====================================================================
// SUB-COMPONENTS
// =====================================================================

function AddressDisplay({
  address,
}: {
  address: Record<string, unknown> | null;
}) {
  if (!address) {
    return <p className="text-sm text-muted-foreground">Non renseignée</p>;
  }

  // Support freeform text format: { address: "multiline text" }
  if (typeof address.address === 'string' && address.address) {
    return (
      <div className="text-sm">
        {address.address.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  }

  const street = (address.street as string) ?? (address.line1 as string) ?? '';
  const city = (address.city as string) ?? '';
  const zip = (address.zip as string) ?? (address.postal_code as string) ?? '';
  const country = (address.country as string) ?? '';

  if (!street && !city && !zip) {
    return <p className="text-sm text-muted-foreground">Non renseignée</p>;
  }

  return (
    <div className="text-sm">
      {street && <p>{street}</p>}
      {(zip || city) && (
        <p>
          {zip} {city}
        </p>
      )}
      {country && <p>{country}</p>}
    </div>
  );
}
