'use client';

import { useState, useEffect, useMemo } from 'react';

import {
  useLinkMeAffiliates,
  useLinkMeSelectionsByAffiliate,
  type AffiliateType,
} from './use-linkme-affiliates';
import {
  useLinkMeAffiliateCustomers,
  useCreateEnseigneOrganisation,
  useCreateEnseigneIndividualCustomer,
} from './use-linkme-enseigne-customers';
import { useCreateLinkMeOrder } from './use-linkme-orders';
import {
  useLinkMeSelection,
  type SelectionItem,
} from './use-linkme-selections';
import type { ContactsAddressesData } from '../components/contacts';
import {
  computeCartTotals,
  buildOrderInput,
  type CustomerType,
  type AffiliateSelection,
  type CartItem,
} from './create-order-form-helpers';
import { useNewCustomerForm } from './use-new-customer-form';
import { buildCartHandlers } from './use-linkme-cart-handlers';

export type { CustomerType, AffiliateSelection, CartItem };

// ---- Hook ----

interface UseCreateLinkMeOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAffiliateId?: string;
}

export function useCreateLinkMeOrderForm({
  isOpen,
  onClose,
  preselectedAffiliateId,
}: UseCreateLinkMeOrderFormProps) {
  const createOrder = useCreateLinkMeOrder();

  const [affiliateType, setAffiliateType] = useState<AffiliateType | null>(
    null
  );
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>(
    preselectedAffiliateId ?? ''
  );
  const [selectedSelectionId, setSelectedSelectionId] = useState<string>('');
  const [customerType, setCustomerType] =
    useState<CustomerType>('organization');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingCostHt, setShippingCostHt] = useState<number>(0);
  const [handlingCostHt, setHandlingCostHt] = useState<number>(0);
  const [insuranceCostHt, setInsuranceCostHt] = useState<number>(0);
  const [fraisTaxRate, setFraisTaxRate] = useState<number>(0.2);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    string | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [internalNotes, setInternalNotes] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [previewSelectionId, setPreviewSelectionId] = useState<string | null>(
    null
  );

  const {
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
    resetNewCustomerForm,
  } = useNewCustomerForm();

  const [contactsAddressesData, setContactsAddressesData] =
    useState<ContactsAddressesData>({
      billingContact: null,
      billingAddress: null,
      deliveryContact: null,
      deliverySameAsBillingContact: false,
      deliveryAddress: null,
      deliverySameAsBillingAddress: false,
    });

  // ---- Data hooks ----
  const { data: affiliates, isLoading: affiliatesLoading } =
    useLinkMeAffiliates(affiliateType ?? undefined);
  const { data: selections, isLoading: selectionsLoading } =
    useLinkMeSelectionsByAffiliate(selectedAffiliateId ?? null);
  const { data: selectionDetails, isLoading: selectionDetailsLoading } =
    useLinkMeSelection(selectedSelectionId ?? null);
  const { data: previewSelection, isLoading: previewLoading } =
    useLinkMeSelection(previewSelectionId);

  const selectedAffiliate = useMemo(
    () => affiliates?.find(a => a.id === selectedAffiliateId),
    [affiliates, selectedAffiliateId]
  );

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

  const createOrganisation = useCreateEnseigneOrganisation();
  const createIndividualCustomer = useCreateEnseigneIndividualCustomer();

  // ---- Effects (cascade resets) ----
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
      resetNewCustomerForm();
      setContactsAddressesData({
        billingContact: null,
        billingAddress: null,
        deliveryContact: null,
        deliverySameAsBillingContact: false,
        deliveryAddress: null,
        deliverySameAsBillingAddress: false,
      });
    }
  }, [isOpen, preselectedAffiliateId, resetNewCustomerForm]);

  useEffect(() => {
    setSelectedAffiliateId('');
    setSelectedSelectionId('');
    setSelectedCustomerId('');
    setCart([]);
  }, [affiliateType]);

  useEffect(() => {
    setSelectedSelectionId('');
    setSelectedCustomerId('');
    setCart([]);
  }, [selectedAffiliateId]);

  useEffect(() => {
    setCart([]);
  }, [selectedSelectionId]);

  useEffect(() => {
    setContactsAddressesData({
      billingContact: null,
      billingAddress: null,
      deliveryContact: null,
      deliverySameAsBillingContact: false,
      deliveryAddress: null,
      deliverySameAsBillingAddress: false,
    });
  }, [selectedCustomerId]);

  // ---- Memos ----
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    if (customerType === 'organization') {
      return customers.organisations.find(o => o.id === selectedCustomerId);
    }
    return customers.individuals.find(i => i.id === selectedCustomerId);
  }, [customerType, selectedCustomerId, customers]);

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

  const filteredSelectionItems = useMemo(() => {
    if (!selectionDetails?.items) return [];
    return selectionDetails.items.filter((item: SelectionItem) => {
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

  const cartTotals = useMemo(
    () =>
      computeCartTotals(
        cart,
        shippingCostHt,
        handlingCostHt,
        insuranceCostHt,
        fraisTaxRate
      ),
    [cart, shippingCostHt, handlingCostHt, insuranceCostHt, fraisTaxRate]
  );

  // ---- Cart handlers (extracted) ----
  const cartHandlers = buildCartHandlers(setCart);

  // ---- Customer create handler ----
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
      resetNewCustomerForm();
    } catch (error) {
      console.error('Erreur creation client:', error);
    }
  };

  const canSubmit =
    !!selectedAffiliateId &&
    !!selectedSelectionId &&
    !!selectedCustomerId &&
    cart.length > 0 &&
    !!contactsAddressesData.billingAddress;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const input = buildOrderInput({
        customerType,
        selectedCustomerId,
        selectedAffiliateId,
        cart,
        orderDate,
        internalNotes,
        shippingCostHt,
        handlingCostHt,
        insuranceCostHt,
        fraisTaxRate,
        selectedSelectionId,
        contactsAddressesData,
      });
      await createOrder.mutateAsync(input);
      onClose();
    } catch (error) {
      console.error('Erreur creation commande:', error);
    }
  };

  return {
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
    productSearchQuery,
    setProductSearchQuery,
    selectedSubcategoryId,
    setSelectedSubcategoryId,
    searchQuery,
    setSearchQuery,
    orderDate,
    setOrderDate,
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
    // Data
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
    createOrganisation,
    createIndividualCustomer,
    selectedCustomer,
    filteredOrganisations,
    filteredIndividuals,
    filteredSelectionItems,
    cartTotals,
    // Handlers
    handleCreateCustomer,
    ...cartHandlers,
    canSubmit,
    handleSubmit,
    createOrder,
  };
}
