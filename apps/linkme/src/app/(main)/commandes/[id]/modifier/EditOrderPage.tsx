'use client';

/**
 * EditOrderPage - Page complete d'edition de commande brouillon
 *
 * Sections accordion:
 * 1. Produits (ouverte par defaut) - modifier qte, supprimer, ajouter
 * 2. Contact responsable - selection vignettes ContactCard
 * 3. Facturation - ContactCard + AddressCard
 * 4. Livraison - ContactCard + AddressCard + options
 * 5. Resume sticky bottom - totaux + boutons
 *
 * @module EditOrderPage
 * @since 2026-02-16
 */

import { useState, useMemo, useCallback, useEffect } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  Input,
  Label,
  Separator,
  Textarea,
  Switch,
  cn,
} from '@verone/ui';
import { calculateMargin, LINKME_CONSTANTS } from '@verone/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Loader2,
  Minus,
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
  CheckCircle,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

import { ContactCard } from '../../../../../components/orders/steps/contacts/ContactCard';
import { AddressCard } from '../../../../../components/orders/steps/contacts/AddressCard';
import { useOrganisationContacts } from '../../../../../lib/hooks/use-organisation-contacts';
import type { OrganisationContact } from '../../../../../lib/hooks/use-organisation-contacts';
import { useEntityAddresses } from '../../../../../lib/hooks/use-entity-addresses';
import type { Address } from '../../../../../lib/hooks/use-entity-addresses';
import { useEnseigneId } from '../../../../../lib/hooks/use-enseigne-id';
import { AddProductDialog } from './AddProductDialog';
import type { FullOrderData, OrderItemData } from './page';
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

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
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
    product_image_url: null,
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

const emptyContactForm: ContactFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  title: '',
};

/** Match a contact by name/email against stored details */
function findContactMatch(
  contacts: OrganisationContact[],
  name: string | null | undefined,
  email: string | null | undefined
): string | null {
  if (!name && !email) return null;
  for (const c of contacts) {
    const fullName = `${c.firstName} ${c.lastName}`.trim();
    if (email && c.email.toLowerCase() === email.toLowerCase()) return c.id;
    if (name && fullName.toLowerCase() === name.toLowerCase()) return c.id;
  }
  return null;
}

/** Match an address by line1/postalCode/city */
function findAddressMatch(
  addresses: Address[],
  line1: string | null | undefined,
  postalCode: string | null | undefined,
  city: string | null | undefined
): string | null {
  if (!line1) return null;
  for (const a of addresses) {
    if (
      a.addressLine1.toLowerCase() === line1.toLowerCase() &&
      a.postalCode === postalCode &&
      a.city.toLowerCase() === (city ?? '').toLowerCase()
    ) {
      return a.id;
    }
  }
  return null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EditOrderPage({ data }: EditOrderPageProps) {
  const router = useRouter();
  const updateOrder = useUpdateDraftOrder();

  const { order, details, selectionId } = data;

  // ---- Hooks: contacts & addresses ----
  const organisationId = order.customer_id;
  const enseigneId = useEnseigneId();
  const ownershipType =
    (order.customer?.ownership_type as
      | 'propre'
      | 'succursale'
      | 'franchise'
      | null) ?? null;

  // Contacts with enseigne (responsable + billing)
  const { data: contactsWithEnseigne } = useOrganisationContacts(
    organisationId,
    enseigneId,
    ownershipType,
    true
  );
  // Contacts local only (shipping)
  const { data: contactsLocalOnly } = useOrganisationContacts(
    organisationId,
    enseigneId,
    ownershipType,
    false
  );
  // Billing addresses
  const { data: billingAddressesData } = useEntityAddresses(
    'organisation',
    organisationId,
    'billing'
  );
  // Shipping addresses
  const { data: shippingAddressesData } = useEntityAddresses(
    'organisation',
    organisationId,
    'shipping'
  );

  const allContacts = useMemo(
    () => contactsWithEnseigne?.contacts ?? [],
    [contactsWithEnseigne]
  );
  const localContacts = useMemo(
    () => contactsLocalOnly?.contacts ?? [],
    [contactsLocalOnly]
  );
  const billingAddresses = useMemo(
    () => billingAddressesData?.all ?? [],
    [billingAddressesData]
  );
  const shippingAddresses = useMemo(
    () => shippingAddressesData?.all ?? [],
    [shippingAddressesData]
  );

  // ---- State: Items ----
  const [items, setItems] = useState<EditableItem[]>(() =>
    order.sales_order_items.map(mapOrderItemToEditable)
  );

  // ---- State: Responsable ----
  const [selectedResponsableId, setSelectedResponsableId] = useState<
    string | null
  >(null);
  const [showResponsableForm, setShowResponsableForm] = useState(false);
  const [responsableForm, setResponsableForm] =
    useState<ContactFormData>(emptyContactForm);

  // ---- State: Billing contact ----
  const [billingContactMode, setBillingContactMode] = useState<
    'same' | 'existing' | 'new'
  >('same');
  const [selectedBillingContactId, setSelectedBillingContactId] = useState<
    string | null
  >(null);
  const [billingContactForm, setBillingContactForm] =
    useState<ContactFormData>(emptyContactForm);

  // ---- State: Billing address ----
  const [billingAddressMode, setBillingAddressMode] = useState<
    'restaurant' | 'existing' | 'new'
  >('restaurant');
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<
    string | null
  >(null);

  // ---- State: Delivery contact ----
  const [selectedDeliveryContactId, setSelectedDeliveryContactId] = useState<
    string | null
  >(null);
  const [showDeliveryContactForm, setShowDeliveryContactForm] = useState(false);
  const [deliveryContactForm, setDeliveryContactForm] =
    useState<ContactFormData>(emptyContactForm);

  // ---- State: Delivery address ----
  const [deliveryAddressMode, setDeliveryAddressMode] = useState<
    'restaurant' | 'existing' | 'new'
  >('restaurant');
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<
    string | null
  >(null);
  const [newDeliveryAddress, setNewDeliveryAddress] = useState({
    address: '',
    postalCode: '',
    city: '',
  });

  // ---- State: Delivery options (kept as-is) ----
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

  // ---- Pre-selection: match existing data with contacts/addresses ----
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (hasInitialized) return;
    if (!allContacts.length && !localContacts.length) return;

    // Match responsable
    const respMatch = findContactMatch(
      allContacts,
      details?.requester_name,
      details?.requester_email
    );
    if (respMatch) {
      setSelectedResponsableId(respMatch);
    } else if (details?.requester_name) {
      // No match found - pre-fill the form with existing data
      const nameParts = (details.requester_name ?? '').split(' ');
      setShowResponsableForm(true);
      setResponsableForm({
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' '),
        email: details?.requester_email ?? '',
        phone: details?.requester_phone ?? '',
        title: details?.requester_position ?? '',
      });
    }

    // Match billing contact
    if (details?.billing_name) {
      const billingMatch = findContactMatch(
        allContacts,
        details.billing_name,
        details.billing_email
      );
      if (billingMatch) {
        setBillingContactMode('existing');
        setSelectedBillingContactId(billingMatch);
      } else if (
        details.billing_name === details?.requester_name &&
        details.billing_email === details?.requester_email
      ) {
        setBillingContactMode('same');
      } else {
        setBillingContactMode('new');
        const nameParts = (details.billing_name ?? '').split(' ');
        setBillingContactForm({
          firstName: nameParts[0] ?? '',
          lastName: nameParts.slice(1).join(' '),
          email: details.billing_email ?? '',
          phone: details.billing_phone ?? '',
          title: '',
        });
      }
    }

    // Match delivery contact
    if (details?.delivery_contact_name) {
      const delMatch = findContactMatch(
        localContacts,
        details.delivery_contact_name,
        details.delivery_contact_email
      );
      if (delMatch) {
        setSelectedDeliveryContactId(delMatch);
      } else {
        setShowDeliveryContactForm(true);
        const nameParts = (details.delivery_contact_name ?? '').split(' ');
        setDeliveryContactForm({
          firstName: nameParts[0] ?? '',
          lastName: nameParts.slice(1).join(' '),
          email: details.delivery_contact_email ?? '',
          phone: details.delivery_contact_phone ?? '',
          title: '',
        });
      }
    }

    setHasInitialized(true);
  }, [allContacts, localContacts, details, hasInitialized]);

  // Match addresses after they load
  useEffect(() => {
    if (!billingAddresses.length && !shippingAddresses.length) return;

    // Match billing address from order.billing_address
    const ba = order.billing_address;
    if (ba && billingAddresses.length) {
      const match = findAddressMatch(
        billingAddresses,
        ba.address_line_1 ?? ba.addressLine1,
        ba.postal_code ?? ba.postalCode,
        ba.city
      );
      if (match) {
        setBillingAddressMode('existing');
        setSelectedBillingAddressId(match);
      }
    }

    // Match delivery address
    if (details?.delivery_address && shippingAddresses.length) {
      const match = findAddressMatch(
        shippingAddresses,
        details.delivery_address,
        details.delivery_postal_code,
        details.delivery_city
      );
      if (match) {
        setDeliveryAddressMode('existing');
        setSelectedDeliveryAddressId(match);
      } else {
        setDeliveryAddressMode('new');
        setNewDeliveryAddress({
          address: details.delivery_address ?? '',
          postalCode: details.delivery_postal_code ?? '',
          city: details.delivery_city ?? '',
        });
      }
    }
  }, [billingAddresses, shippingAddresses, order.billing_address, details]);

  // ---- Computed: Resolve selected contacts/addresses to values ----
  const resolvedResponsable = useMemo(() => {
    if (selectedResponsableId) {
      const c = allContacts.find(c => c.id === selectedResponsableId);
      if (c)
        return {
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.phone ?? c.mobile ?? '',
        };
    }
    if (showResponsableForm) {
      return {
        name: `${responsableForm.firstName} ${responsableForm.lastName}`.trim(),
        email: responsableForm.email,
        phone: responsableForm.phone,
      };
    }
    return { name: '', email: '', phone: '' };
  }, [
    selectedResponsableId,
    allContacts,
    showResponsableForm,
    responsableForm,
  ]);

  const resolvedBillingContact = useMemo(() => {
    if (billingContactMode === 'same') return resolvedResponsable;
    if (billingContactMode === 'existing' && selectedBillingContactId) {
      const c = allContacts.find(c => c.id === selectedBillingContactId);
      if (c)
        return {
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.phone ?? c.mobile ?? '',
        };
    }
    if (billingContactMode === 'new') {
      return {
        name: `${billingContactForm.firstName} ${billingContactForm.lastName}`.trim(),
        email: billingContactForm.email,
        phone: billingContactForm.phone,
      };
    }
    return { name: '', email: '', phone: '' };
  }, [
    billingContactMode,
    selectedBillingContactId,
    allContacts,
    billingContactForm,
    resolvedResponsable,
  ]);

  const resolvedDeliveryContact = useMemo(() => {
    if (selectedDeliveryContactId) {
      const c = localContacts.find(c => c.id === selectedDeliveryContactId);
      if (c)
        return {
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.phone ?? c.mobile ?? '',
        };
    }
    if (showDeliveryContactForm) {
      return {
        name: `${deliveryContactForm.firstName} ${deliveryContactForm.lastName}`.trim(),
        email: deliveryContactForm.email,
        phone: deliveryContactForm.phone,
      };
    }
    return { name: '', email: '', phone: '' };
  }, [
    selectedDeliveryContactId,
    localContacts,
    showDeliveryContactForm,
    deliveryContactForm,
  ]);

  const resolvedDeliveryAddress = useMemo(() => {
    if (deliveryAddressMode === 'existing' && selectedDeliveryAddressId) {
      const a = shippingAddresses.find(a => a.id === selectedDeliveryAddressId);
      if (a)
        return {
          address: a.addressLine1,
          postalCode: a.postalCode,
          city: a.city,
        };
    }
    if (deliveryAddressMode === 'new') {
      return newDeliveryAddress;
    }
    // restaurant mode: use first shipping address or billing address
    const defaultAddr =
      shippingAddresses.find(a => a.isDefault) ?? shippingAddresses[0];
    if (defaultAddr)
      return {
        address: defaultAddr.addressLine1,
        postalCode: defaultAddr.postalCode,
        city: defaultAddr.city,
      };
    return { address: '', postalCode: '', city: '' };
  }, [
    deliveryAddressMode,
    selectedDeliveryAddressId,
    shippingAddresses,
    newDeliveryAddress,
  ]);

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

  // ---- Computed: Has changes (simplified - always true since we switched to cards) ----
  const hasChanges = useMemo(() => {
    const itemsChanged = items.some(
      item =>
        item.quantity !== item.originalQuantity || item._delete || item._isNew
    );

    // For contacts/addresses, compare resolved values against original details
    const d = details;
    const detailsChanged =
      resolvedResponsable.name !== (d?.requester_name ?? '') ||
      resolvedResponsable.email !== (d?.requester_email ?? '') ||
      resolvedResponsable.phone !== (d?.requester_phone ?? '') ||
      resolvedBillingContact.name !== (d?.billing_name ?? '') ||
      resolvedBillingContact.email !== (d?.billing_email ?? '') ||
      resolvedBillingContact.phone !== (d?.billing_phone ?? '') ||
      resolvedDeliveryContact.name !== (d?.delivery_contact_name ?? '') ||
      resolvedDeliveryContact.email !== (d?.delivery_contact_email ?? '') ||
      resolvedDeliveryContact.phone !== (d?.delivery_contact_phone ?? '') ||
      resolvedDeliveryAddress.address !== (d?.delivery_address ?? '') ||
      resolvedDeliveryAddress.postalCode !== (d?.delivery_postal_code ?? '') ||
      resolvedDeliveryAddress.city !== (d?.delivery_city ?? '') ||
      desiredDeliveryDate !== (d?.desired_delivery_date ?? '') ||
      isMallDelivery !== (d?.is_mall_delivery ?? false) ||
      mallEmail !== (d?.mall_email ?? '') ||
      semiTrailerAccessible !== (d?.semi_trailer_accessible ?? true) ||
      deliveryNotes !== (d?.delivery_notes ?? '');

    return itemsChanged || detailsChanged;
  }, [
    items,
    details,
    resolvedResponsable,
    resolvedBillingContact,
    resolvedDeliveryContact,
    resolvedDeliveryAddress,
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

  // ---- Handlers: Contact selection ----
  const handleSelectResponsable = useCallback((contactId: string) => {
    setSelectedResponsableId(contactId);
    setShowResponsableForm(false);
    setResponsableForm(emptyContactForm);
  }, []);

  const handleNewResponsable = useCallback(() => {
    setSelectedResponsableId(null);
    setShowResponsableForm(true);
  }, []);

  const handleSelectBillingContact = useCallback((contactId: string) => {
    setBillingContactMode('existing');
    setSelectedBillingContactId(contactId);
    setBillingContactForm(emptyContactForm);
  }, []);

  const handleBillingSameAsResponsable = useCallback(() => {
    setBillingContactMode('same');
    setSelectedBillingContactId(null);
    setBillingContactForm(emptyContactForm);
  }, []);

  const handleNewBillingContact = useCallback(() => {
    setBillingContactMode('new');
    setSelectedBillingContactId(null);
  }, []);

  const handleSelectDeliveryContact = useCallback((contactId: string) => {
    setSelectedDeliveryContactId(contactId);
    setShowDeliveryContactForm(false);
    setDeliveryContactForm(emptyContactForm);
  }, []);

  const handleNewDeliveryContact = useCallback(() => {
    setSelectedDeliveryContactId(null);
    setShowDeliveryContactForm(true);
  }, []);

  // ---- Handler: Save ----
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    const itemsInput: UpdateDraftOrderItemInput[] = items
      .filter(item => {
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
          name: resolvedResponsable.name,
          email: resolvedResponsable.email,
          phone: resolvedResponsable.phone || undefined,
        },
      });

      if (result.success) {
        const supabase = (
          await import('@verone/utils/supabase/client')
        ).createClient();
        const { error: detailsError } = await supabase
          .from('sales_order_linkme_details')
          .update({
            billing_name: resolvedBillingContact.name || null,
            billing_email: resolvedBillingContact.email || null,
            billing_phone: resolvedBillingContact.phone || null,
            delivery_contact_name: resolvedDeliveryContact.name || null,
            delivery_contact_email: resolvedDeliveryContact.email || null,
            delivery_contact_phone: resolvedDeliveryContact.phone || null,
            delivery_address: resolvedDeliveryAddress.address || null,
            delivery_postal_code: resolvedDeliveryAddress.postalCode || null,
            delivery_city: resolvedDeliveryAddress.city || null,
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
    resolvedResponsable,
    resolvedBillingContact,
    resolvedDeliveryContact,
    resolvedDeliveryAddress,
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
                    {resolvedResponsable.name || 'Non renseigne'}
                    {resolvedResponsable.email
                      ? ` | ${resolvedResponsable.email}`
                      : ''}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                {/* Contact cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allContacts.map(contact => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      isSelected={selectedResponsableId === contact.id}
                      onClick={() => handleSelectResponsable(contact.id)}
                    />
                  ))}

                  {/* Create new card */}
                  <Card
                    className={cn(
                      'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
                      showResponsableForm
                        ? 'border-2 border-blue-500 bg-blue-50/50'
                        : 'hover:border-gray-400'
                    )}
                    onClick={handleNewResponsable}
                  >
                    <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
                      <Plus
                        className={cn(
                          'h-5 w-5',
                          showResponsableForm
                            ? 'text-blue-500'
                            : 'text-gray-400'
                        )}
                      />
                      <span
                        className={cn(
                          'font-medium text-sm',
                          showResponsableForm
                            ? 'text-blue-600'
                            : 'text-gray-600'
                        )}
                      >
                        Nouveau contact
                      </span>
                    </div>
                  </Card>
                </div>

                {/* Inline form for new contact */}
                {showResponsableForm && (
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Prenom *</Label>
                        <Input
                          value={responsableForm.firstName}
                          onChange={e =>
                            setResponsableForm(prev => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                          placeholder="Jean"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nom *</Label>
                        <Input
                          value={responsableForm.lastName}
                          onChange={e =>
                            setResponsableForm(prev => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                          placeholder="Dupont"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Email *</Label>
                        <Input
                          type="email"
                          value={responsableForm.email}
                          onChange={e =>
                            setResponsableForm(prev => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          placeholder="jean@restaurant.fr"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Telephone</Label>
                        <Input
                          type="tel"
                          value={responsableForm.phone}
                          onChange={e =>
                            setResponsableForm(prev => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="06 12 34 56 78"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Poste</Label>
                        <Input
                          value={responsableForm.title}
                          onChange={e =>
                            setResponsableForm(prev => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Gerant"
                          className="h-9"
                        />
                      </div>
                    </div>
                  </Card>
                )}
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
                    {resolvedBillingContact.name || 'Non renseigne'}
                    {resolvedBillingContact.email
                      ? ` | ${resolvedBillingContact.email}`
                      : ''}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                {/* Contact facturation */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Contact facturation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Same as responsable card */}
                    <Card
                      className={cn(
                        'p-3 cursor-pointer transition-all hover:shadow-md',
                        billingContactMode === 'same'
                          ? 'border-2 border-green-500 bg-green-50/50'
                          : 'hover:border-gray-300'
                      )}
                      onClick={handleBillingSameAsResponsable}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            billingContactMode === 'same'
                              ? 'bg-green-100'
                              : 'bg-gray-100'
                          )}
                        >
                          <User
                            className={cn(
                              'h-4 w-4',
                              billingContactMode === 'same'
                                ? 'text-green-600'
                                : 'text-gray-500'
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                              Meme que responsable
                            </h3>
                            {billingContactMode === 'same' && (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Utiliser le contact responsable
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Existing contacts */}
                    {allContacts.map(contact => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        isSelected={
                          billingContactMode === 'existing' &&
                          selectedBillingContactId === contact.id
                        }
                        onClick={() => handleSelectBillingContact(contact.id)}
                      />
                    ))}

                    {/* Create new */}
                    <Card
                      className={cn(
                        'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
                        billingContactMode === 'new'
                          ? 'border-2 border-blue-500 bg-blue-50/50'
                          : 'hover:border-gray-400'
                      )}
                      onClick={handleNewBillingContact}
                    >
                      <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
                        <Plus
                          className={cn(
                            'h-5 w-5',
                            billingContactMode === 'new'
                              ? 'text-blue-500'
                              : 'text-gray-400'
                          )}
                        />
                        <span
                          className={cn(
                            'font-medium text-sm',
                            billingContactMode === 'new'
                              ? 'text-blue-600'
                              : 'text-gray-600'
                          )}
                        >
                          Nouveau contact
                        </span>
                      </div>
                    </Card>
                  </div>

                  {/* New billing contact form */}
                  {billingContactMode === 'new' && (
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Prenom</Label>
                          <Input
                            value={billingContactForm.firstName}
                            onChange={e =>
                              setBillingContactForm(prev => ({
                                ...prev,
                                firstName: e.target.value,
                              }))
                            }
                            placeholder="Service"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nom</Label>
                          <Input
                            value={billingContactForm.lastName}
                            onChange={e =>
                              setBillingContactForm(prev => ({
                                ...prev,
                                lastName: e.target.value,
                              }))
                            }
                            placeholder="Comptabilite"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Email</Label>
                          <Input
                            type="email"
                            value={billingContactForm.email}
                            onChange={e =>
                              setBillingContactForm(prev => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="compta@restaurant.fr"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Telephone</Label>
                          <Input
                            type="tel"
                            value={billingContactForm.phone}
                            onChange={e =>
                              setBillingContactForm(prev => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="01 23 45 67 89"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Adresse facturation */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Adresse de facturation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Existing billing addresses */}
                    {billingAddresses.map(address => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        isSelected={
                          billingAddressMode === 'existing' &&
                          selectedBillingAddressId === address.id
                        }
                        onClick={() => {
                          setBillingAddressMode('existing');
                          setSelectedBillingAddressId(address.id);
                        }}
                        badge={address.isDefault ? 'Defaut' : undefined}
                      />
                    ))}

                    {billingAddresses.length === 0 && (
                      <p className="text-sm text-gray-400 col-span-full py-4 text-center">
                        Aucune adresse de facturation enregistree
                      </p>
                    )}
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
                    {resolvedDeliveryAddress.address
                      ? `${resolvedDeliveryAddress.address}, ${resolvedDeliveryAddress.postalCode} ${resolvedDeliveryAddress.city}`
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
                {/* Contact livraison (local contacts only) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Contact livraison
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {localContacts.map(contact => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        isSelected={selectedDeliveryContactId === contact.id}
                        onClick={() => handleSelectDeliveryContact(contact.id)}
                      />
                    ))}

                    {/* Create new */}
                    <Card
                      className={cn(
                        'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
                        showDeliveryContactForm
                          ? 'border-2 border-blue-500 bg-blue-50/50'
                          : 'hover:border-gray-400'
                      )}
                      onClick={handleNewDeliveryContact}
                    >
                      <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
                        <Plus
                          className={cn(
                            'h-5 w-5',
                            showDeliveryContactForm
                              ? 'text-blue-500'
                              : 'text-gray-400'
                          )}
                        />
                        <span
                          className={cn(
                            'font-medium text-sm',
                            showDeliveryContactForm
                              ? 'text-blue-600'
                              : 'text-gray-600'
                          )}
                        >
                          Nouveau contact
                        </span>
                      </div>
                    </Card>
                  </div>

                  {/* New delivery contact form */}
                  {showDeliveryContactForm && (
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Prenom</Label>
                          <Input
                            value={deliveryContactForm.firstName}
                            onChange={e =>
                              setDeliveryContactForm(prev => ({
                                ...prev,
                                firstName: e.target.value,
                              }))
                            }
                            placeholder="Prenom"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nom</Label>
                          <Input
                            value={deliveryContactForm.lastName}
                            onChange={e =>
                              setDeliveryContactForm(prev => ({
                                ...prev,
                                lastName: e.target.value,
                              }))
                            }
                            placeholder="Nom"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Email</Label>
                          <Input
                            type="email"
                            value={deliveryContactForm.email}
                            onChange={e =>
                              setDeliveryContactForm(prev => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="livraison@restaurant.fr"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Telephone</Label>
                          <Input
                            type="tel"
                            value={deliveryContactForm.phone}
                            onChange={e =>
                              setDeliveryContactForm(prev => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="06 12 34 56 78"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Adresse livraison */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Adresse de livraison
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Existing shipping addresses */}
                    {shippingAddresses.map(address => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        isSelected={
                          deliveryAddressMode === 'existing' &&
                          selectedDeliveryAddressId === address.id
                        }
                        onClick={() => {
                          setDeliveryAddressMode('existing');
                          setSelectedDeliveryAddressId(address.id);
                        }}
                        badge={address.isDefault ? 'Defaut' : undefined}
                      />
                    ))}

                    {/* New address card */}
                    <Card
                      className={cn(
                        'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
                        deliveryAddressMode === 'new'
                          ? 'border-2 border-blue-500 bg-blue-50/50'
                          : 'hover:border-gray-400'
                      )}
                      onClick={() => setDeliveryAddressMode('new')}
                    >
                      <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
                        <MapPin
                          className={cn(
                            'h-5 w-5',
                            deliveryAddressMode === 'new'
                              ? 'text-blue-500'
                              : 'text-gray-400'
                          )}
                        />
                        <span
                          className={cn(
                            'font-medium text-sm',
                            deliveryAddressMode === 'new'
                              ? 'text-blue-600'
                              : 'text-gray-600'
                          )}
                        >
                          Nouvelle adresse
                        </span>
                      </div>
                    </Card>
                  </div>

                  {/* New delivery address form */}
                  {deliveryAddressMode === 'new' && (
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Adresse</Label>
                          <Input
                            value={newDeliveryAddress.address}
                            onChange={e =>
                              setNewDeliveryAddress(prev => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            placeholder="12 rue de la Paix"
                            className="h-9"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Code postal</Label>
                            <Input
                              value={newDeliveryAddress.postalCode}
                              onChange={e =>
                                setNewDeliveryAddress(prev => ({
                                  ...prev,
                                  postalCode: e.target.value,
                                }))
                              }
                              placeholder="75001"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs">Ville</Label>
                            <Input
                              value={newDeliveryAddress.city}
                              onChange={e =>
                                setNewDeliveryAddress(prev => ({
                                  ...prev,
                                  city: e.target.value,
                                }))
                              }
                              placeholder="Paris"
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
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
