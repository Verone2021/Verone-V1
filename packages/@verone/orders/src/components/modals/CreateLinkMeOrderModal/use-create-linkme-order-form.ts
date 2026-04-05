'use client';

import { useState, useEffect, useMemo } from 'react';

import {
  useLinkMeAffiliates,
  useLinkMeSelectionsByAffiliate,
  type AffiliateType,
} from '../../../hooks/linkme/use-linkme-affiliates';
import {
  useLinkMeAffiliateCustomers,
  useCreateEnseigneOrganisation,
  useCreateEnseigneIndividualCustomer,
} from '../../../hooks/linkme/use-linkme-enseigne-customers';
import {
  useCreateLinkMeOrder,
  type CreateLinkMeOrderInput,
  type LinkMeDetailsInput,
} from '../../../hooks/linkme/use-linkme-orders';
import {
  useLinkMeSelection,
  type SelectionItem,
} from '../../../hooks/linkme/use-linkme-selections';
import type { ContactsAddressesData } from '../../linkme-contacts';
import {
  type CartItem,
  type CustomerType,
  EMPTY_CONTACTS_ADDRESSES_DATA,
  roundMoney,
} from './types';

/**
 * Transforme les données contacts/adresses du formulaire en format DB linkme_details
 */
function buildLinkMeDetails(data: ContactsAddressesData) {
  const deliveryContact = data.deliverySameAsBillingContact
    ? data.billingContact
    : data.deliveryContact;
  const deliveryAddr = data.deliverySameAsBillingAddress
    ? data.billingAddress
    : data.deliveryAddress;

  const hasAnyData =
    deliveryContact ??
    deliveryAddr ??
    data.billingContact ??
    data.billingAddress;

  if (!hasAnyData) return null;

  return {
    requester_phone: data.billingContact?.phone ?? null,
    delivery_contact_name: deliveryContact
      ? `${deliveryContact.firstName} ${deliveryContact.lastName}`.trim()
      : null,
    delivery_contact_email: deliveryContact?.email ?? null,
    delivery_contact_phone: deliveryContact?.phone ?? null,
    delivery_address: deliveryAddr?.customAddress?.addressLine1 ?? null,
    delivery_postal_code: deliveryAddr?.customAddress?.postalCode ?? null,
    delivery_city: deliveryAddr?.customAddress?.city ?? null,
    billing_name: data.billingContact
      ? `${data.billingContact.firstName} ${data.billingContact.lastName}`.trim()
      : null,
    billing_email: data.billingContact?.email ?? null,
    billing_phone: data.billingContact?.phone ?? null,
  };
}

export function useCreateLinkMeOrderForm(
  isOpen: boolean,
  onClose: () => void,
  preselectedAffiliateId?: string
) {
  const createOrder = useCreateLinkMeOrder();

  // Type d'affilié sélectionné
  const [affiliateType, setAffiliateType] = useState<AffiliateType | null>(
    null
  );
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>(
    preselectedAffiliateId ?? ''
  );
  const [selectedSelectionId, setSelectedSelectionId] = useState<string>('');

  // Client
  const [customerType, setCustomerType] =
    useState<CustomerType>('organization');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Panier
  const [cart, setCart] = useState<CartItem[]>([]);

  // Frais additionnels
  const [shippingCostHt, setShippingCostHt] = useState<number>(0);
  const [handlingCostHt, setHandlingCostHt] = useState<number>(0);
  const [insuranceCostHt, setInsuranceCostHt] = useState<number>(0);
  const [fraisTaxRate, setFraisTaxRate] = useState<number>(0.2);

  // Date de commande (défaut: aujourd'hui)
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Options de livraison
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [isShoppingCenterDelivery, setIsShoppingCenterDelivery] =
    useState(false);
  const [acceptsSemiTruck, setAcceptsSemiTruck] = useState(true);

  // Recherche produits
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    string | undefined
  >(undefined);

  // Recherche clients et formulaire création
  const [searchQuery, setSearchQuery] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Preview sélection
  const [previewSelectionId, setPreviewSelectionId] = useState<string | null>(
    null
  );

  // Formulaire nouveau client
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
  const [newCustomerLastName, setNewCustomerLastName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newOrgOwnershipType, setNewOrgOwnershipType] = useState<
    'succursale' | 'franchise' | null
  >(null);
  const [newOrgAddress, setNewOrgAddress] = useState('');
  const [newOrgPostalCode, setNewOrgPostalCode] = useState('');
  const [newOrgCity, setNewOrgCity] = useState('');

  // Contacts & Addresses
  const [contactsAddressesData, setContactsAddressesData] =
    useState<ContactsAddressesData>(EMPTY_CONTACTS_ADDRESSES_DATA);

  // Hooks data
  const { data: affiliates, isLoading: affiliatesLoading } =
    useLinkMeAffiliates(affiliateType ?? undefined);
  const { data: selections, isLoading: selectionsLoading } =
    useLinkMeSelectionsByAffiliate(selectedAffiliateId ?? null);
  const { data: selectionDetails, isLoading: selectionDetailsLoading } =
    useLinkMeSelection(selectedSelectionId ?? null);

  // Preview sélection
  const { data: previewSelection, isLoading: previewLoading } =
    useLinkMeSelection(previewSelectionId);

  // Récupérer l'enseigne_id de l'affilié sélectionné pour les clients
  const selectedAffiliate = useMemo(() => {
    return affiliates?.find(a => a.id === selectedAffiliateId);
  }, [affiliates, selectedAffiliateId]);

  // Clients selon le type d'affilié (enseigne ou org_independante)
  const customers = useLinkMeAffiliateCustomers(
    selectedAffiliate
      ? {
          id: selectedAffiliate.id,
          enseigne_id: selectedAffiliate.enseigne_id,
          organisation_id: selectedAffiliate.organisation_id,
          affiliate_type: selectedAffiliate.type,
        }
      : null
  );

  // Mutations création client
  const createOrganisation = useCreateEnseigneOrganisation();
  const createIndividualCustomer = useCreateEnseigneIndividualCustomer();

  // Reset à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setAffiliateType(null);
      setSelectedAffiliateId(preselectedAffiliateId ?? '');
      setSelectedSelectionId('');
      setCustomerType('organization');
      setSelectedCustomerId('');
      setCart([]);
      setSearchQuery('');
      setInternalNotes('');
      setShowCreateForm(false);
      setNewCustomerName('');
      setNewCustomerFirstName('');
      setNewCustomerLastName('');
      setNewCustomerEmail('');
      setNewCustomerPhone('');
      setNewOrgOwnershipType(null);
      setNewOrgAddress('');
      setNewOrgPostalCode('');
      setNewOrgCity('');
      setContactsAddressesData(EMPTY_CONTACTS_ADDRESSES_DATA);
      setExpectedDeliveryDate('');
      setIsShoppingCenterDelivery(false);
      setAcceptsSemiTruck(true);
    }
  }, [isOpen, preselectedAffiliateId]);

  // Reset affilié quand type change
  useEffect(() => {
    setSelectedAffiliateId('');
    setSelectedSelectionId('');
    setSelectedCustomerId('');
    setCart([]);
  }, [affiliateType]);

  // Reset sélection et panier quand affilié change
  useEffect(() => {
    setSelectedSelectionId('');
    setSelectedCustomerId('');
    setCart([]);
  }, [selectedAffiliateId]);

  // Reset panier quand sélection change
  useEffect(() => {
    setCart([]);
  }, [selectedSelectionId]);

  // Reset contacts & addresses quand le client change
  useEffect(() => {
    setContactsAddressesData(EMPTY_CONTACTS_ADDRESSES_DATA);
  }, [selectedCustomerId]);

  // Client sélectionné
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    if (customerType === 'organization') {
      return customers.organisations.find(o => o.id === selectedCustomerId);
    }
    return customers.individuals.find(i => i.id === selectedCustomerId);
  }, [customerType, selectedCustomerId, customers]);

  // Filtrage clients
  const filteredOrganisations = useMemo(() => {
    if (!searchQuery.trim()) return customers.organisations;
    const q = searchQuery.toLowerCase();
    return customers.organisations.filter(
      o =>
        o.name.toLowerCase().includes(q) ||
        o.legal_name.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q)
    );
  }, [customers.organisations, searchQuery]);

  const filteredIndividuals = useMemo(() => {
    if (!searchQuery.trim()) return customers.individuals;
    const q = searchQuery.toLowerCase();
    return customers.individuals.filter(
      i =>
        i.full_name.toLowerCase().includes(q) ||
        i.email?.toLowerCase().includes(q)
    );
  }, [customers.individuals, searchQuery]);

  // Filtrage produits de la sélection (texte + catégorie)
  const filteredSelectionItems = useMemo(() => {
    if (!selectionDetails?.items) return [];

    return selectionDetails.items.filter(item => {
      const matchesSearch =
        productSearchQuery.trim() === '' ||
        (item.product?.name
          ?.toLowerCase()
          .includes(productSearchQuery.toLowerCase()) ??
          false) ||
        (item.product?.sku
          ?.toLowerCase()
          .includes(productSearchQuery.toLowerCase()) ??
          false);

      const matchesCategory =
        !selectedSubcategoryId ||
        item.product?.subcategory_id === selectedSubcategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [selectionDetails?.items, productSearchQuery, selectedSubcategoryId]);

  // Création client
  const handleCreateCustomer = async () => {
    const hasEnseigne = !!selectedAffiliate?.enseigne_id;
    const hasOrganisation = !!selectedAffiliate?.organisation_id;

    if (!hasEnseigne && !hasOrganisation) {
      console.error('Ni enseigne_id ni organisation_id disponible');
      return;
    }

    try {
      if (customerType === 'organization') {
        if (!newCustomerName.trim()) return;
        const result = await createOrganisation.mutateAsync({
          enseigne_id: selectedAffiliate.enseigne_id ?? '',
          legal_name: newCustomerName.trim(),
          email: newCustomerEmail.trim() ?? undefined,
          phone: newCustomerPhone.trim() ?? undefined,
          logo_url: selectedAffiliate.logo_url ?? null,
          ownership_type: newOrgOwnershipType,
          address_line1: newOrgAddress.trim() || undefined,
          postal_code: newOrgPostalCode.trim() || undefined,
          city: newOrgCity.trim() || undefined,
          source_type: 'linkme',
          source_affiliate_id: selectedAffiliateId ?? undefined,
        });
        setSelectedCustomerId(result.id);
        customers.refetch();
      } else {
        if (!newCustomerFirstName.trim() || !newCustomerLastName.trim()) return;
        const result = await createIndividualCustomer.mutateAsync({
          enseigne_id: selectedAffiliate.enseigne_id ?? null,
          organisation_id: hasEnseigne
            ? null
            : selectedAffiliate.organisation_id,
          first_name: newCustomerFirstName.trim(),
          last_name: newCustomerLastName.trim(),
          email: newCustomerEmail.trim() ?? undefined,
          phone: newCustomerPhone.trim() ?? undefined,
          source_type: 'linkme',
          source_affiliate_id: selectedAffiliateId ?? undefined,
        });
        setSelectedCustomerId(result.id);
        customers.refetch();
      }
      setShowCreateForm(false);
      setNewCustomerName('');
      setNewCustomerFirstName('');
      setNewCustomerLastName('');
      setNewCustomerEmail('');
      setNewCustomerPhone('');
      setNewOrgOwnershipType(null);
      setNewOrgAddress('');
      setNewOrgPostalCode('');
      setNewOrgCity('');
    } catch (error) {
      console.error('Erreur création client:', error);
    }
  };

  // Totaux panier avec TVA par ligne
  const cartTotals = useMemo(() => {
    let productsHt = 0;
    let totalTva = 0;
    let totalRetrocession = 0;

    for (const item of cart) {
      const lineHt = roundMoney(item.quantity * item.unit_price_ht);
      const lineTva = roundMoney(lineHt * (item.tax_rate ?? 0.2));
      productsHt = roundMoney(productsHt + lineHt);
      totalTva = roundMoney(totalTva + lineTva);
      totalRetrocession = roundMoney(
        totalRetrocession +
          (item.unit_price_ht - item.base_price_ht) * item.quantity
      );
    }

    const totalFrais = roundMoney(
      shippingCostHt + handlingCostHt + insuranceCostHt
    );
    const totalHt = roundMoney(productsHt + totalFrais);
    const totalTvaFrais = roundMoney(totalFrais * fraisTaxRate);
    const totalTtc = roundMoney(totalHt + totalTva + totalTvaFrais);

    return {
      productsHt,
      totalFrais,
      totalHt,
      totalTva: roundMoney(totalTva + totalTvaFrais),
      totalTtc,
      totalRetrocession,
    };
  }, [cart, shippingCostHt, handlingCostHt, insuranceCostHt, fraisTaxRate]);

  // Ajouter produit au panier
  const addProductFromSelection = (item: SelectionItem) => {
    const existing = cart.find(c => c.product_id === item.product_id);
    if (existing) {
      setCart(
        cart.map(c =>
          c.product_id === item.product_id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
      return;
    }

    const marginRate = item.margin_rate / 100;
    const sellingPrice = roundMoney(
      item.selling_price_ht ?? item.base_price_ht * (1 + item.margin_rate / 100)
    );
    const retrocessionRate = marginRate;

    const newItem: CartItem = {
      id: `${item.product_id}-${Date.now()}`,
      product_id: item.product_id,
      product_name: item.product?.name ?? 'Produit inconnu',
      sku: item.product?.sku ?? '',
      quantity: 1,
      unit_price_ht: sellingPrice,
      tax_rate: 0.2,
      base_price_ht: item.base_price_ht,
      retrocession_rate: retrocessionRate,
      linkme_selection_item_id: item.id,
    };
    setCart([...cart, newItem]);
  };

  // Modifier quantité
  const updateQuantity = (itemId: string, delta: number) => {
    setCart(
      cart
        .map(item => {
          if (item.id === itemId) {
            const newQty = Math.max(0, item.quantity + delta);
            return newQty === 0 ? null : { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Supprimer du panier
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Modifier prix de vente HT
  const updateUnitPrice = (itemId: string, newPrice: number) => {
    if (newPrice < 0 || isNaN(newPrice)) return;
    setCart(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, unit_price_ht: Math.round(newPrice * 100) / 100 }
          : item
      )
    );
  };

  // Modifier taux de commission
  const updateRetrocessionRate = (itemId: string, newRatePercent: number) => {
    if (newRatePercent < 0 || newRatePercent > 100 || isNaN(newRatePercent))
      return;
    const newRate = newRatePercent / 100;
    setCart(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, retrocession_rate: newRate } : item
      )
    );
  };

  // Validation formulaire
  const canSubmit =
    selectedAffiliateId &&
    selectedSelectionId &&
    selectedCustomerId &&
    cart.length > 0 &&
    !!contactsAddressesData.billingAddress;

  // Soumettre commande
  const handleSubmit = async () => {
    if (!canSubmit) return;

    const input: CreateLinkMeOrderInput = {
      customer_type: customerType,
      customer_organisation_id:
        customerType === 'organization' ? selectedCustomerId : null,
      individual_customer_id:
        customerType === 'individual' ? selectedCustomerId : null,
      affiliate_id: selectedAffiliateId,
      items: cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        tax_rate: item.tax_rate ?? 0.2,
        base_price_ht: item.base_price_ht,
        retrocession_rate: item.retrocession_rate,
        linkme_selection_item_id: item.linkme_selection_item_id,
      })),
      order_date: orderDate,
      internal_notes: internalNotes ?? undefined,
      shipping_cost_ht: shippingCostHt ?? 0,
      handling_cost_ht: handlingCostHt ?? 0,
      insurance_cost_ht: insuranceCostHt ?? 0,
      frais_tax_rate: fraisTaxRate,
      expected_delivery_date: expectedDeliveryDate || null,
      is_shopping_center_delivery: isShoppingCenterDelivery,
      accepts_semi_truck: acceptsSemiTruck,
      linkme_selection_id: selectedSelectionId || null,
      responsable_contact_id: contactsAddressesData.billingContact?.id ?? null,
      billing_contact_id: contactsAddressesData.billingContact?.id ?? null,
      delivery_contact_id: contactsAddressesData.deliverySameAsBillingContact
        ? (contactsAddressesData.billingContact?.id ?? null)
        : (contactsAddressesData.deliveryContact?.id ?? null),
      billing_address: contactsAddressesData.billingAddress?.customAddress
        ? {
            address_line1:
              contactsAddressesData.billingAddress.customAddress.addressLine1,
            city: contactsAddressesData.billingAddress.customAddress.city,
            postal_code:
              contactsAddressesData.billingAddress.customAddress.postalCode,
            country:
              contactsAddressesData.billingAddress.customAddress.country ??
              'FR',
          }
        : undefined,
      shipping_address: (() => {
        const deliveryAddr = contactsAddressesData.deliverySameAsBillingAddress
          ? contactsAddressesData.billingAddress
          : contactsAddressesData.deliveryAddress;
        if (!deliveryAddr?.customAddress) return undefined;
        return {
          address_line1: deliveryAddr.customAddress.addressLine1,
          city: deliveryAddr.customAddress.city,
          postal_code: deliveryAddr.customAddress.postalCode,
          country: deliveryAddr.customAddress.country ?? 'FR',
        };
      })(),
      linkme_details: (() => {
        const contactDetails = buildLinkMeDetails(contactsAddressesData);
        if (!contactDetails) return null;
        const details: LinkMeDetailsInput = {
          ...contactDetails,
          is_mall_delivery: isShoppingCenterDelivery,
          semi_trailer_accessible: acceptsSemiTruck,
          desired_delivery_date: expectedDeliveryDate || null,
        };
        return details;
      })(),
    };

    try {
      await createOrder.mutateAsync(input);
      onClose();
    } catch (error) {
      console.error('Erreur création commande:', error);
    }
  };

  return {
    // State
    affiliateType,
    setAffiliateType,
    selectedAffiliateId,
    setSelectedAffiliateId,
    selectedSelectionId,
    setSelectedSelectionId,
    customerType,
    setCustomerType,
    selectedCustomerId,
    setSelectedCustomerId,
    cart,
    shippingCostHt,
    setShippingCostHt,
    handlingCostHt,
    setHandlingCostHt,
    insuranceCostHt,
    setInsuranceCostHt,
    fraisTaxRate,
    setFraisTaxRate,
    orderDate,
    setOrderDate,
    expectedDeliveryDate,
    setExpectedDeliveryDate,
    isShoppingCenterDelivery,
    setIsShoppingCenterDelivery,
    acceptsSemiTruck,
    setAcceptsSemiTruck,
    productSearchQuery,
    setProductSearchQuery,
    selectedSubcategoryId,
    setSelectedSubcategoryId,
    searchQuery,
    setSearchQuery,
    internalNotes,
    setInternalNotes,
    showCreateForm,
    setShowCreateForm,
    previewSelectionId,
    setPreviewSelectionId,
    newCustomerName,
    setNewCustomerName,
    newCustomerFirstName,
    setNewCustomerFirstName,
    newCustomerLastName,
    setNewCustomerLastName,
    newCustomerEmail,
    setNewCustomerEmail,
    newCustomerPhone,
    setNewCustomerPhone,
    newOrgOwnershipType,
    setNewOrgOwnershipType,
    newOrgAddress,
    setNewOrgAddress,
    newOrgPostalCode,
    setNewOrgPostalCode,
    newOrgCity,
    setNewOrgCity,
    contactsAddressesData,
    setContactsAddressesData,
    // Derived data
    affiliates,
    affiliatesLoading,
    selections,
    selectionsLoading,
    selectionDetails,
    selectionDetailsLoading,
    previewSelection,
    previewLoading,
    selectedAffiliate,
    customers,
    selectedCustomer,
    filteredOrganisations,
    filteredIndividuals,
    filteredSelectionItems,
    cartTotals,
    canSubmit,
    // Mutations
    createOrder,
    createOrganisation,
    createIndividualCustomer,
    // Handlers
    handleCreateCustomer,
    handleSubmit,
    addProductFromSelection,
    updateQuantity,
    removeFromCart,
    updateUnitPrice,
    updateRetrocessionRate,
  };
}
