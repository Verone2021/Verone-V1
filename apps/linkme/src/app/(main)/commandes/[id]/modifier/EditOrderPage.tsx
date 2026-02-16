'use client';

/**
 * EditOrderPage - Page complete d'edition de commande brouillon
 *
 * Sections accordion:
 * 1. Produits (ouverte par defaut) - modifier qte, supprimer, ajouter
 * 2. Contact responsable - modifier/changer
 * 3. Facturation - contact + adresse
 * 4. Livraison - contact + adresse + options
 * 5. Resume sticky bottom - totaux + boutons
 *
 * @module EditOrderPage
 * @since 2026-02-16
 */

import { useState, useMemo, useCallback } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Input,
  Label,
  Separator,
  Textarea,
  Switch,
} from '@verone/ui';
import { calculateMargin, LINKME_CONSTANTS } from '@verone/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Loader2,
  Minus,
  Package,
  Plus,
  Save,
  ShoppingBag,
  Trash2,
  User,
  FileText,
  Truck,
  ImageIcon,
  CalendarIcon,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { AddProductDialog } from './AddProductDialog';
import type { FullOrderData, OrderItemData, LinkmeDetailsData } from './page';
import {
  useUpdateDraftOrder,
  type UpdateDraftOrderItemInput,
} from '../../../../../lib/hooks/use-update-draft-order';

// ============================================================================
// TYPES
// ============================================================================

interface EditOrderPageProps {
  data: FullOrderData;
}

interface EditableItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  product_image_url: string | null;
  quantity: number;
  originalQuantity: number;
  unit_price_ht: number;
  base_price_ht: number;
  margin_rate: number;
  tax_rate: number;
  _delete: boolean;
  _isNew: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function mapOrderItemToEditable(item: OrderItemData): EditableItem {
  return {
    id: item.id,
    product_id: item.product_id,
    product_name: item.product?.name ?? 'Produit inconnu',
    product_sku: item.product?.sku ?? null,
    product_image_url: null, // Images in separate table, placeholder used
    quantity: item.quantity,
    originalQuantity: item.quantity,
    unit_price_ht: item.unit_price_ht,
    base_price_ht: item.base_price_ht_locked ?? 0,
    margin_rate: item.retrocession_rate ?? 0,
    tax_rate: item.tax_rate ?? 0.2,
    _delete: false,
    _isNew: false,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EditOrderPage({ data }: EditOrderPageProps) {
  const router = useRouter();
  const updateOrder = useUpdateDraftOrder();

  const { order, details, selectionId } = data;

  // ---- State: Items ----
  const [items, setItems] = useState<EditableItem[]>(() =>
    order.sales_order_items.map(mapOrderItemToEditable)
  );

  // ---- State: Contact responsable ----
  const [requesterName, setRequesterName] = useState(
    details?.requester_name ?? ''
  );
  const [requesterEmail, setRequesterEmail] = useState(
    details?.requester_email ?? ''
  );
  const [requesterPhone, setRequesterPhone] = useState(
    details?.requester_phone ?? ''
  );

  // ---- State: Facturation ----
  const [billingName, setBillingName] = useState(details?.billing_name ?? '');
  const [billingEmail, setBillingEmail] = useState(
    details?.billing_email ?? ''
  );
  const [billingPhone, setBillingPhone] = useState(
    details?.billing_phone ?? ''
  );

  // ---- State: Livraison ----
  const [deliveryContactName, setDeliveryContactName] = useState(
    details?.delivery_contact_name ?? ''
  );
  const [deliveryContactEmail, setDeliveryContactEmail] = useState(
    details?.delivery_contact_email ?? ''
  );
  const [deliveryContactPhone, setDeliveryContactPhone] = useState(
    details?.delivery_contact_phone ?? ''
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    details?.delivery_address ?? ''
  );
  const [deliveryPostalCode, setDeliveryPostalCode] = useState(
    details?.delivery_postal_code ?? ''
  );
  const [deliveryCity, setDeliveryCity] = useState(
    details?.delivery_city ?? ''
  );
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState(
    details?.desired_delivery_date ?? ''
  );
  const [isMallDelivery, setIsMallDelivery] = useState(
    details?.is_mall_delivery ?? false
  );
  const [mallEmail, setMallEmail] = useState(details?.mall_email ?? '');
  const [semiTrailerAccessible, setSemiTrailerAccessible] = useState(
    details?.semi_trailer_accessible ?? true
  );
  const [deliveryNotes, setDeliveryNotes] = useState(
    details?.delivery_notes ?? ''
  );

  // ---- State: Add product dialog ----
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // ---- Computed: Totals ----
  const totals = useMemo(() => {
    const roundMoney = (value: number): number => Math.round(value * 100) / 100;

    let productsHt = 0;
    let totalCommission = 0;

    for (const item of items) {
      if (!item._delete) {
        productsHt = roundMoney(
          productsHt + item.quantity * item.unit_price_ht
        );
        const { gainEuros } = calculateMargin({
          basePriceHt: item.base_price_ht,
          marginRate: item.margin_rate,
        });
        totalCommission = roundMoney(
          totalCommission + gainEuros * item.quantity
        );
      }
    }

    const shippingHt = order.shipping_cost_ht ?? 0;
    const totalHt = roundMoney(productsHt + shippingHt);
    const totalTtc = roundMoney(
      totalHt * (1 + LINKME_CONSTANTS.DEFAULT_TAX_RATE)
    );

    return { productsHt, shippingHt, totalHt, totalTtc, totalCommission };
  }, [items, order.shipping_cost_ht]);

  // ---- Computed: Active items count ----
  const activeItemsCount = useMemo(
    () => items.filter(i => !i._delete).length,
    [items]
  );

  // ---- Computed: Has changes ----
  const hasChanges = useMemo(() => {
    // Check items changes
    const itemsChanged = items.some(
      item =>
        item.quantity !== item.originalQuantity || item._delete || item._isNew
    );

    // Check details changes
    const d = details;
    const detailsChanged =
      requesterName !== (d?.requester_name ?? '') ||
      requesterEmail !== (d?.requester_email ?? '') ||
      requesterPhone !== (d?.requester_phone ?? '') ||
      billingName !== (d?.billing_name ?? '') ||
      billingEmail !== (d?.billing_email ?? '') ||
      billingPhone !== (d?.billing_phone ?? '') ||
      deliveryContactName !== (d?.delivery_contact_name ?? '') ||
      deliveryContactEmail !== (d?.delivery_contact_email ?? '') ||
      deliveryContactPhone !== (d?.delivery_contact_phone ?? '') ||
      deliveryAddress !== (d?.delivery_address ?? '') ||
      deliveryPostalCode !== (d?.delivery_postal_code ?? '') ||
      deliveryCity !== (d?.delivery_city ?? '') ||
      desiredDeliveryDate !== (d?.desired_delivery_date ?? '') ||
      isMallDelivery !== (d?.is_mall_delivery ?? false) ||
      mallEmail !== (d?.mall_email ?? '') ||
      semiTrailerAccessible !== (d?.semi_trailer_accessible ?? true) ||
      deliveryNotes !== (d?.delivery_notes ?? '');

    return itemsChanged || detailsChanged;
  }, [
    items,
    details,
    requesterName,
    requesterEmail,
    requesterPhone,
    billingName,
    billingEmail,
    billingPhone,
    deliveryContactName,
    deliveryContactEmail,
    deliveryContactPhone,
    deliveryAddress,
    deliveryPostalCode,
    deliveryCity,
    desiredDeliveryDate,
    isMallDelivery,
    mallEmail,
    semiTrailerAccessible,
    deliveryNotes,
  ]);

  // ---- Handlers: Items ----
  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId || (item._isNew && item.product_id === itemId)) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId || (item._isNew && item.product_id === itemId)) {
          return { ...item, quantity: Math.max(1, quantity) };
        }
        return item;
      })
    );
  }, []);

  const toggleDeleteItem = useCallback((itemId: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return { ...item, _delete: !item._delete };
        }
        return item;
      })
    );
  }, []);

  const removeNewItem = useCallback((productId: string) => {
    setItems(prev =>
      prev.filter(i => !(i._isNew && i.product_id === productId))
    );
  }, []);

  const handleAddProducts = useCallback(
    (
      newProducts: Array<{
        product_id: string;
        product_name: string;
        product_sku: string | null;
        product_image_url: string | null;
        unit_price_ht: number;
        base_price_ht: number;
        margin_rate: number;
        quantity: number;
      }>
    ) => {
      setItems(prev => {
        const updated = [...prev];
        for (const product of newProducts) {
          // Check if product already exists (including deleted ones - undelete)
          const existingIdx = updated.findIndex(
            i => i.product_id === product.product_id
          );
          if (existingIdx >= 0) {
            const existing = updated[existingIdx];
            updated[existingIdx] = {
              ...existing,
              quantity: existing._delete
                ? product.quantity
                : existing.quantity + product.quantity,
              _delete: false,
            };
          } else {
            // New product
            updated.push({
              id: `new-${product.product_id}`,
              product_id: product.product_id,
              product_name: product.product_name,
              product_sku: product.product_sku,
              product_image_url: product.product_image_url,
              quantity: product.quantity,
              originalQuantity: 0,
              unit_price_ht: product.unit_price_ht,
              base_price_ht: product.base_price_ht,
              margin_rate: product.margin_rate,
              tax_rate: 0.2,
              _delete: false,
              _isNew: true,
            });
          }
        }
        return updated;
      });
    },
    []
  );

  // ---- Handler: Save ----
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    // Prepare items input
    const itemsInput: UpdateDraftOrderItemInput[] = items
      .filter(item => {
        // Include: modified existing, deleted, or new
        if (item._isNew) return true;
        if (item._delete) return true;
        if (item.quantity !== item.originalQuantity) return true;
        return false;
      })
      .map(item => ({
        id: item._isNew ? undefined : item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        _delete: item._delete,
      }));

    // If no items changed, still include all to keep totals correct
    const finalItems =
      itemsInput.length > 0
        ? itemsInput
        : items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            _delete: item._delete,
          }));

    try {
      const result = await updateOrder.mutateAsync({
        orderId: order.id,
        items: finalItems,
        desiredDeliveryDate: desiredDeliveryDate || undefined,
        requesterInfo: {
          name: requesterName,
          email: requesterEmail,
          phone: requesterPhone || undefined,
        },
      });

      if (result.success) {
        // Also update linkme_details for billing/delivery contacts
        const supabase = (
          await import('@verone/utils/supabase/client')
        ).createClient();
        const { error: detailsError } = await supabase
          .from('sales_order_linkme_details')
          .update({
            billing_name: billingName || null,
            billing_email: billingEmail || null,
            billing_phone: billingPhone || null,
            delivery_contact_name: deliveryContactName || null,
            delivery_contact_email: deliveryContactEmail || null,
            delivery_contact_phone: deliveryContactPhone || null,
            delivery_address: deliveryAddress || null,
            delivery_postal_code: deliveryPostalCode || null,
            delivery_city: deliveryCity || null,
            is_mall_delivery: isMallDelivery,
            mall_email: mallEmail || null,
            semi_trailer_accessible: semiTrailerAccessible,
            delivery_notes: deliveryNotes || null,
          })
          .eq('sales_order_id', order.id);

        if (detailsError) {
          console.error(
            '[EditOrderPage] Error updating linkme details:',
            detailsError
          );
        }

        toast.success('Commande mise a jour avec succes');
        router.push('/commandes');
      } else {
        toast.error(result.error ?? 'Erreur lors de la mise a jour');
      }
    } catch (err) {
      console.error('[EditOrderPage] Save error:', err);
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [
    hasChanges,
    items,
    order.id,
    desiredDeliveryDate,
    requesterName,
    requesterEmail,
    requesterPhone,
    billingName,
    billingEmail,
    billingPhone,
    deliveryContactName,
    deliveryContactEmail,
    deliveryContactPhone,
    deliveryAddress,
    deliveryPostalCode,
    deliveryCity,
    isMallDelivery,
    mallEmail,
    semiTrailerAccessible,
    deliveryNotes,
    updateOrder,
    router,
  ]);

  // ---- Existing product IDs (for dialog filter) ----
  const existingProductIds = useMemo(
    () => new Set(items.filter(i => !i._delete).map(i => i.product_id)),
    [items]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/commandes')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-[#183559]">
                  Modifier {order.order_number}
                </h1>
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800 border-amber-200"
                >
                  Brouillon
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Client:{' '}
                {order.customer?.trade_name ??
                  order.customer?.legal_name ??
                  'Inconnu'}{' '}
                | Cree le{' '}
                {format(new Date(order.created_at), 'dd MMMM yyyy', {
                  locale: fr,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 pb-32">
        <Accordion
          type="multiple"
          defaultValue={['products']}
          className="space-y-4"
        >
          {/* ============================================================ */}
          {/* SECTION 1: PRODUITS */}
          {/* ============================================================ */}
          <AccordionItem
            value="products"
            className="bg-white rounded-xl border shadow-sm"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#5DBEBB]/10 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-[#5DBEBB]" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-semibold text-[#183559]">
                    Produits
                  </h2>
                  <p className="text-sm text-gray-500">
                    {activeItemsCount} article{activeItemsCount > 1 ? 's' : ''}{' '}
                    | {formatPrice(totals.productsHt)} HT
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-3">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      item._delete
                        ? 'bg-red-50 border-red-200 opacity-60'
                        : item._isNew
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {/* Image */}
                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                      {item.product_image_url ? (
                        <Image
                          src={item.product_image_url}
                          alt={item.product_name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-medium text-sm truncate ${
                            item._delete
                              ? 'line-through text-gray-400'
                              : 'text-[#183559]'
                          }`}
                        >
                          {item.product_name}
                        </p>
                        {item._isNew && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-300 text-xs"
                          >
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {item.product_sku && `${item.product_sku} | `}
                        {formatPrice(item.unit_price_ht)} HT x {item.quantity} ={' '}
                        <span className="font-medium">
                          {formatPrice(item.unit_price_ht * item.quantity)} HT
                        </span>
                      </p>
                    </div>

                    {/* Quantity controls */}
                    {!item._delete && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item._isNew ? item.product_id : item.id,
                              -1
                            )
                          }
                          disabled={item.quantity <= 1}
                          className="p-1.5 hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={e =>
                            setQuantity(
                              item._isNew ? item.product_id : item.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-12 text-center text-sm font-semibold text-[#183559] border rounded py-1 focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item._isNew ? item.product_id : item.id,
                              1
                            )
                          }
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Modified indicator */}
                    {item.quantity !== item.originalQuantity &&
                      !item._delete &&
                      !item._isNew && (
                        <span className="text-xs text-[#5DBEBB] font-medium whitespace-nowrap">
                          (etait {item.originalQuantity})
                        </span>
                      )}

                    {/* Delete/restore button */}
                    {item._isNew ? (
                      <button
                        type="button"
                        onClick={() => removeNewItem(item.product_id)}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        title="Retirer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleDeleteItem(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item._delete
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            : 'text-red-500 hover:bg-red-100'
                        }`}
                        title={
                          item._delete ? 'Annuler la suppression' : 'Supprimer'
                        }
                      >
                        {item._delete ? (
                          <Plus className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add product button */}
              {selectionId && (
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#5DBEBB]/40 rounded-lg text-[#5DBEBB] hover:bg-[#5DBEBB]/5 transition-colors font-medium text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un produit depuis la selection
                </button>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ============================================================ */}
          {/* SECTION 2: CONTACT RESPONSABLE */}
          {/* ============================================================ */}
          <AccordionItem
            value="responsable"
            className="bg-white rounded-xl border shadow-sm"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-semibold text-[#183559]">
                    Contact responsable
                  </h2>
                  <p className="text-sm text-gray-500">
                    {requesterName || 'Non renseigne'}
                    {requesterEmail ? ` | ${requesterEmail}` : ''}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requester-name">
                    Nom complet <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="requester-name"
                    value={requesterName}
                    onChange={e => setRequesterName(e.target.value)}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requester-email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="requester-email"
                    type="email"
                    value={requesterEmail}
                    onChange={e => setRequesterEmail(e.target.value)}
                    placeholder="jean@restaurant.fr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requester-phone">Telephone</Label>
                  <Input
                    id="requester-phone"
                    type="tel"
                    value={requesterPhone}
                    onChange={e => setRequesterPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ============================================================ */}
          {/* SECTION 3: FACTURATION */}
          {/* ============================================================ */}
          <AccordionItem
            value="billing"
            className="bg-white rounded-xl border shadow-sm"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-semibold text-[#183559]">
                    Facturation
                  </h2>
                  <p className="text-sm text-gray-500">
                    {billingName || 'Non renseigne'}
                    {billingEmail ? ` | ${billingEmail}` : ''}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Contact facturation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing-name">Nom</Label>
                    <Input
                      id="billing-name"
                      value={billingName}
                      onChange={e => setBillingName(e.target.value)}
                      placeholder="Service comptabilite"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-email">Email</Label>
                    <Input
                      id="billing-email"
                      type="email"
                      value={billingEmail}
                      onChange={e => setBillingEmail(e.target.value)}
                      placeholder="compta@restaurant.fr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-phone">Telephone</Label>
                    <Input
                      id="billing-phone"
                      type="tel"
                      value={billingPhone}
                      onChange={e => setBillingPhone(e.target.value)}
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ============================================================ */}
          {/* SECTION 4: LIVRAISON */}
          {/* ============================================================ */}
          <AccordionItem
            value="shipping"
            className="bg-white rounded-xl border shadow-sm"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-semibold text-[#183559]">
                    Livraison
                  </h2>
                  <p className="text-sm text-gray-500">
                    {deliveryAddress
                      ? `${deliveryAddress}, ${deliveryPostalCode} ${deliveryCity}`
                      : 'Non renseignee'}
                    {desiredDeliveryDate
                      ? ` | ${format(new Date(desiredDeliveryDate), 'dd/MM/yyyy')}`
                      : ''}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                {/* Contact livraison */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Contact livraison
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery-contact-name">Nom</Label>
                      <Input
                        id="delivery-contact-name"
                        value={deliveryContactName}
                        onChange={e => setDeliveryContactName(e.target.value)}
                        placeholder="Nom du destinataire"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery-contact-email">Email</Label>
                      <Input
                        id="delivery-contact-email"
                        type="email"
                        value={deliveryContactEmail}
                        onChange={e => setDeliveryContactEmail(e.target.value)}
                        placeholder="livraison@restaurant.fr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery-contact-phone">Telephone</Label>
                      <Input
                        id="delivery-contact-phone"
                        type="tel"
                        value={deliveryContactPhone}
                        onChange={e => setDeliveryContactPhone(e.target.value)}
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Adresse livraison */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Adresse de livraison
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery-address">Adresse</Label>
                      <Input
                        id="delivery-address"
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        placeholder="12 rue de la Paix"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="delivery-postal-code">
                          Code postal
                        </Label>
                        <Input
                          id="delivery-postal-code"
                          value={deliveryPostalCode}
                          onChange={e => setDeliveryPostalCode(e.target.value)}
                          placeholder="75001"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="delivery-city">Ville</Label>
                        <Input
                          id="delivery-city"
                          value={deliveryCity}
                          onChange={e => setDeliveryCity(e.target.value)}
                          placeholder="Paris"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Date souhaitee */}
                <div className="space-y-2">
                  <Label
                    htmlFor="desired-date"
                    className="flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    Date de livraison souhaitee
                  </Label>
                  <Input
                    id="desired-date"
                    type="date"
                    value={
                      desiredDeliveryDate
                        ? desiredDeliveryDate.split('T')[0]
                        : ''
                    }
                    onChange={e => setDesiredDeliveryDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="max-w-xs"
                  />
                </div>

                <Separator />

                {/* Options livraison */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Options
                  </h3>

                  {/* Centre commercial */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Centre commercial
                      </p>
                      <p className="text-xs text-gray-500">
                        Livraison en centre commercial (formulaire d&apos;acces
                        requis)
                      </p>
                    </div>
                    <Switch
                      checked={isMallDelivery}
                      onCheckedChange={setIsMallDelivery}
                    />
                  </div>

                  {isMallDelivery && (
                    <div className="space-y-2 pl-4">
                      <Label htmlFor="mall-email">
                        Email du centre commercial{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="mall-email"
                        type="email"
                        value={mallEmail}
                        onChange={e => setMallEmail(e.target.value)}
                        placeholder="technique@centrecommercial.fr"
                      />
                    </div>
                  )}

                  {/* Semi-remorque */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Acces semi-remorque
                      </p>
                      <p className="text-xs text-gray-500">
                        Le lieu de livraison est-il accessible en semi-remorque
                        ?
                      </p>
                    </div>
                    <Switch
                      checked={semiTrailerAccessible}
                      onCheckedChange={setSemiTrailerAccessible}
                    />
                  </div>

                  {!semiTrailerAccessible && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-700">
                        Des frais supplementaires peuvent s&apos;appliquer pour
                        une livraison sans acces semi-remorque.
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="delivery-notes">Notes de livraison</Label>
                  <Textarea
                    id="delivery-notes"
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                    placeholder="Instructions speciales, code d'acces, horaires..."
                    rows={3}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Totaux */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500">Total HT</p>
                <p className="text-lg font-semibold text-[#183559]">
                  {formatPrice(totals.totalHt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total TTC</p>
                <p className="text-lg font-bold text-[#183559]">
                  {formatPrice(totals.totalTtc)}
                </p>
              </div>
              {totals.totalCommission > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Commission</p>
                  <p className="text-lg font-bold text-emerald-600">
                    +
                    {formatPrice(
                      totals.totalCommission *
                        (1 + LINKME_CONSTANTS.DEFAULT_TAX_RATE)
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Warning + Buttons */}
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-sm text-amber-600 font-medium">
                  Modifications non enregistrees
                </span>
              )}
              <Button
                variant="outline"
                onClick={() => router.push('/commandes')}
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  void handleSave().catch(err => {
                    console.error('[EditOrderPage] Save failed:', err);
                  });
                }}
                disabled={!hasChanges || updateOrder.isPending}
                className="bg-[#5DBEBB] hover:bg-[#4DAEAB] text-white"
              >
                {updateOrder.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add product dialog */}
      {selectionId && (
        <AddProductDialog
          open={isAddProductOpen}
          onOpenChange={setIsAddProductOpen}
          selectionId={selectionId}
          existingProductIds={existingProductIds}
          onAdd={handleAddProducts}
        />
      )}
    </div>
  );
}

export default EditOrderPage;
