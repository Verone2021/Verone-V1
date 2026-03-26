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

import { useRouter } from 'next/navigation';

import { Accordion, Badge } from '@verone/ui';
import { LINKME_CONSTANTS } from '@verone/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { useOrganisationContacts } from '../../../../../lib/hooks/use-organisation-contacts';
import type { OrganisationContact } from '../../../../../lib/hooks/use-organisation-contacts';
import { useEntityAddresses } from '../../../../../lib/hooks/use-entity-addresses';
import type { Address } from '../../../../../lib/hooks/use-entity-addresses';
import { useEnseigneId } from '../../../../../lib/hooks/use-enseigne-id';
import { usePermissions } from '../../../../../hooks/use-permissions';
import { AddProductDialog } from './AddProductDialog';
import {
  ProductsSection,
  ResponsableSection,
  BillingSection,
  ShippingSection,
  StickyBottomBar,
} from './components';
import type { FullOrderData, OrderItemData } from './page';
import type { EditableItem, ContactFormData } from './types';
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
    original_unit_price_ht: item.unit_price_ht,
    base_price_ht: item.base_price_ht_locked ?? 0,
    margin_rate: item.retrocession_rate ?? 0,
    tax_rate: item.tax_rate ?? 0.2,
    _delete: false,
    _isNew: false,
    is_affiliate_product: !!item.product?.created_by_affiliate,
    affiliate_commission_rate: item.product?.affiliate_commission_rate
      ? item.product.affiliate_commission_rate / 100
      : 0.15,
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
    if (email?.toLowerCase() === c.email.toLowerCase()) return c.id;
    if (name?.toLowerCase() === fullName.toLowerCase()) return c.id;
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
  const { canViewCommissions } = usePermissions();
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
  // Billing contacts: franchise → org contacts only, succursale/propre → enseigne contacts
  const billingContacts = useMemo(
    () => (ownershipType === 'franchise' ? localContacts : allContacts),
    [ownershipType, localContacts, allContacts]
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
  // Initialize with contact IDs from sales_orders (avoids race condition with async contacts)
  const [selectedResponsableId, setSelectedResponsableId] = useState<
    string | null
  >(order.responsable_contact_id ?? null);
  const [showResponsableForm, setShowResponsableForm] = useState(false);
  const [responsableForm, setResponsableForm] =
    useState<ContactFormData>(emptyContactForm);

  // ---- State: Billing contact ----
  const [billingContactMode, setBillingContactMode] = useState<
    'same' | 'existing' | 'new'
  >(() => {
    if (
      order.billing_contact_id &&
      order.billing_contact_id !== order.responsable_contact_id
    ) {
      return 'existing';
    }
    return 'same';
  });
  const [selectedBillingContactId, setSelectedBillingContactId] = useState<
    string | null
  >(() => {
    if (
      order.billing_contact_id &&
      order.billing_contact_id !== order.responsable_contact_id
    ) {
      return order.billing_contact_id;
    }
    return null;
  });
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
  >(order.delivery_contact_id ?? null);
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
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // ---- Pre-selection: match existing data with contacts/addresses ----
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize form from details — use contact IDs first, fallback to name/email matching
  useEffect(() => {
    if (hasInitialized) return;
    if (!details) return;

    // --- Responsable ---
    // Priority 1: Use contact ID directly from sales_orders
    if (order.responsable_contact_id) {
      setSelectedResponsableId(order.responsable_contact_id);
    } else {
      // Priority 2: Match by name/email (legacy orders without contact IDs)
      const respMatch = findContactMatch(
        allContacts,
        details.requester_name,
        details.requester_email
      );
      if (respMatch) {
        setSelectedResponsableId(respMatch);
      } else if (details.requester_name) {
        const nameParts = (details.requester_name ?? '').split(' ');
        setShowResponsableForm(true);
        setResponsableForm({
          firstName: nameParts[0] ?? '',
          lastName: nameParts.slice(1).join(' '),
          email: details.requester_email ?? '',
          phone: details.requester_phone ?? '',
          title: details.requester_position ?? '',
        });
      }
    }

    // --- Billing contact ---
    if (order.billing_contact_id) {
      // Use ID directly — check if same as responsable
      if (order.billing_contact_id === order.responsable_contact_id) {
        setBillingContactMode('same');
      } else {
        setBillingContactMode('existing');
        setSelectedBillingContactId(order.billing_contact_id);
      }
    } else if (details.billing_name) {
      // Fallback: match by name/email
      const billingMatch = findContactMatch(
        allContacts,
        details.billing_name,
        details.billing_email
      );
      if (billingMatch) {
        setBillingContactMode('existing');
        setSelectedBillingContactId(billingMatch);
      } else if (
        details.billing_name === details.requester_name &&
        details.billing_email === details.requester_email
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

    // --- Delivery contact ---
    // Delivery contacts are local to the restaurant (not stored in contacts table for succursales)
    // Use ID if available, otherwise fallback to name/email matching
    if (order.delivery_contact_id) {
      setSelectedDeliveryContactId(order.delivery_contact_id);
    } else if (details.delivery_contact_name) {
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
  }, [
    allContacts,
    localContacts,
    details,
    hasInitialized,
    order.responsable_contact_id,
    order.billing_contact_id,
    order.delivery_contact_id,
  ]);

  // Re-match contacts when they load AFTER initialization
  // (e.g. org has no contacts initially, but they load async later)
  useEffect(() => {
    if (!hasInitialized || !details) return;

    // Re-match responsable: if form is shown (no initial match), try again
    if (showResponsableForm && !selectedResponsableId && allContacts.length) {
      const match = findContactMatch(
        allContacts,
        details.requester_name,
        details.requester_email
      );
      if (match) {
        setSelectedResponsableId(match);
        setShowResponsableForm(false);
      }
    }

    // Re-match billing: if mode is 'new' (no initial match), try again
    if (
      billingContactMode === 'new' &&
      !selectedBillingContactId &&
      allContacts.length
    ) {
      const match = findContactMatch(
        allContacts,
        details.billing_name,
        details.billing_email
      );
      if (match) {
        setBillingContactMode('existing');
        setSelectedBillingContactId(match);
      }
    }

    // Re-match delivery: if form is shown (no initial match), try again
    if (
      showDeliveryContactForm &&
      !selectedDeliveryContactId &&
      localContacts.length
    ) {
      const match = findContactMatch(
        localContacts,
        details.delivery_contact_name,
        details.delivery_contact_email
      );
      if (match) {
        setSelectedDeliveryContactId(match);
        setShowDeliveryContactForm(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally limited deps: only re-run when contacts load
  }, [allContacts, localContacts]);

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
      const c = billingContacts.find(c => c.id === selectedBillingContactId);
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
    billingContacts,
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
        // Commission = unit_price * retrocession_rate * quantity
        // Aligned with DB trigger lock_prices_on_order_validation()
        // margin_rate here is retrocession_rate (decimal, e.g. 0.15 = 15%)
        totalCommission = roundMoney(
          totalCommission +
            item.unit_price_ht * item.margin_rate * item.quantity
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
    const itemsChanged = items.some(
      item =>
        item.quantity !== item.originalQuantity ||
        item.unit_price_ht !== item.original_unit_price_ht ||
        item._delete ||
        item._isNew
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

  // Modifier prix unitaire (produits affiliés uniquement)
  const updateItemPrice = useCallback((itemId: string, newPrice: number) => {
    if (newPrice < 0 || isNaN(newPrice)) return;
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId || (item._isNew && item.product_id === itemId)) {
          return { ...item, unit_price_ht: Math.round(newPrice * 100) / 100 };
        }
        return item;
      })
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
        is_affiliate_product?: boolean;
        affiliate_commission_rate?: number;
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
              original_unit_price_ht: product.unit_price_ht,
              base_price_ht: product.base_price_ht,
              margin_rate: product.margin_rate,
              tax_rate: 0.2,
              _delete: false,
              _isNew: true,
              is_affiliate_product: product.is_affiliate_product ?? false,
              affiliate_commission_rate: product.affiliate_commission_rate ?? 0,
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
        if (item.unit_price_ht !== item.original_unit_price_ht) return true;
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
                  Modifier {order.linkme_display_number ?? order.order_number}
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
          <ProductsSection
            items={items}
            activeItemsCount={activeItemsCount}
            productsHt={totals.productsHt}
            selectionId={selectionId}
            formatPrice={formatPrice}
            updateQuantity={updateQuantity}
            setQuantity={setQuantity}
            toggleDeleteItem={toggleDeleteItem}
            removeNewItem={removeNewItem}
            updateItemPrice={updateItemPrice}
            onAddProductOpen={() => setIsAddProductOpen(true)}
          />

          <ResponsableSection
            resolvedResponsable={resolvedResponsable}
            allContacts={allContacts}
            selectedResponsableId={selectedResponsableId}
            showResponsableForm={showResponsableForm}
            responsableForm={responsableForm}
            onSelectResponsable={handleSelectResponsable}
            onNewResponsable={handleNewResponsable}
            onResponsableFormChange={setResponsableForm}
          />

          <BillingSection
            resolvedBillingContact={resolvedBillingContact}
            allContacts={billingContacts}
            billingContactMode={billingContactMode}
            selectedBillingContactId={selectedBillingContactId}
            billingContactForm={billingContactForm}
            billingAddresses={billingAddresses}
            billingAddressMode={billingAddressMode}
            selectedBillingAddressId={selectedBillingAddressId}
            onBillingSameAsResponsable={handleBillingSameAsResponsable}
            onSelectBillingContact={handleSelectBillingContact}
            onNewBillingContact={handleNewBillingContact}
            onBillingContactFormChange={setBillingContactForm}
            onBillingAddressModeChange={setBillingAddressMode}
            onSelectBillingAddress={addressId => {
              setBillingAddressMode('existing');
              setSelectedBillingAddressId(addressId);
            }}
          />

          <ShippingSection
            resolvedDeliveryAddress={resolvedDeliveryAddress}
            desiredDeliveryDate={desiredDeliveryDate}
            localContacts={localContacts}
            selectedDeliveryContactId={selectedDeliveryContactId}
            showDeliveryContactForm={showDeliveryContactForm}
            deliveryContactForm={deliveryContactForm}
            shippingAddresses={shippingAddresses}
            deliveryAddressMode={deliveryAddressMode}
            selectedDeliveryAddressId={selectedDeliveryAddressId}
            newDeliveryAddress={newDeliveryAddress}
            isMallDelivery={isMallDelivery}
            mallEmail={mallEmail}
            semiTrailerAccessible={semiTrailerAccessible}
            deliveryNotes={deliveryNotes}
            onSelectDeliveryContact={handleSelectDeliveryContact}
            onNewDeliveryContact={handleNewDeliveryContact}
            onDeliveryContactFormChange={setDeliveryContactForm}
            onDeliveryAddressModeChange={setDeliveryAddressMode}
            onSelectDeliveryAddress={addressId => {
              setSelectedDeliveryAddressId(addressId);
            }}
            onNewDeliveryAddressChange={setNewDeliveryAddress}
            onDesiredDeliveryDateChange={setDesiredDeliveryDate}
            onIsMallDeliveryChange={setIsMallDelivery}
            onMallEmailChange={setMallEmail}
            onSemiTrailerAccessibleChange={setSemiTrailerAccessible}
            onDeliveryNotesChange={setDeliveryNotes}
          />
        </Accordion>
      </div>

      <StickyBottomBar
        totals={totals}
        canViewCommissions={canViewCommissions}
        hasChanges={hasChanges}
        isPending={updateOrder.isPending}
        showSaveConfirmation={showSaveConfirmation}
        formatPrice={formatPrice}
        onCancel={() => router.push('/commandes')}
        onSaveClick={() => setShowSaveConfirmation(true)}
        onSaveConfirmationChange={setShowSaveConfirmation}
        onConfirmSave={() => {
          void handleSave().catch(err => {
            console.error('[EditOrderPage] Save failed:', err);
          });
        }}
      />

      {/* Add product dialog */}
      {selectionId && (
        <AddProductDialog
          open={isAddProductOpen}
          onOpenChange={setIsAddProductOpen}
          selectionId={selectionId}
          existingProductIds={existingProductIds}
          canViewCommissions={canViewCommissions}
          onAdd={handleAddProducts}
        />
      )}
    </div>
  );
}

export default EditOrderPage;
