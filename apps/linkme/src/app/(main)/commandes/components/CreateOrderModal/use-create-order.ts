'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { calculateMargin } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';

import {
  useCreateAffiliateOrder,
  useAffiliateCustomers,
  useSelectionProducts,
  type SelectionProduct,
} from '../../../../../lib/hooks/use-affiliate-orders';
import {
  useOrganisationContacts,
  useUpdateOrganisationContacts,
  type ContactFormData,
} from '../../../../../lib/hooks/use-organisation-contacts';
import {
  useUserSelections,
  useUserAffiliate,
} from '../../../../../lib/hooks/use-user-selection';

import {
  type CartItem,
  type NewRestaurantFormState,
  type UserMetadata,
  type SelectionDataWithAffiliate,
  initialNewRestaurantForm,
} from './types';

const PRODUCTS_PER_PAGE = 12;

export function useCreateOrder(onClose: () => void) {
  // ============================================
  // STATE - Question initiale
  // ============================================
  const [isNewRestaurant, setIsNewRestaurant] = useState<boolean | null>(null);
  const [contactsComplete, setContactsComplete] = useState(false);
  const [pendingContacts, setPendingContacts] = useState<{
    primaryContact: ContactFormData;
    billingContact: ContactFormData | null;
  } | null>(null);

  const [newRestaurantStep, setNewRestaurantStep] = useState(1);
  const [newRestaurantForm, setNewRestaurantForm] =
    useState<NewRestaurantFormState>(initialNewRestaurantForm);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmExistingModal, setShowConfirmExistingModal] =
    useState(false);

  // ============================================
  // STATE - Formulaire commande
  // ============================================
  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(
    null
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [selectedCustomerType, setSelectedCustomerType] = useState<
    'organization' | 'individual'
  >('organization');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [requester, setRequester] = useState({
    type: 'responsable_enseigne',
    name: '',
    email: '',
    phone: '',
    position: null as string | null,
  });

  // ============================================
  // HOOKS
  // ============================================
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();
  const { data: customers, isLoading: customersLoading } =
    useAffiliateCustomers(affiliate?.id ?? null);
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useSelectionProducts(selectedSelectionId);

  const createOrder = useCreateAffiliateOrder();
  const updateContacts = useUpdateOrganisationContacts();

  const { data: selectedCustomerContacts } = useOrganisationContacts(
    selectedCustomerId && selectedCustomerType === 'organization'
      ? selectedCustomerId
      : null
  );

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata as UserMetadata | undefined;
      setRequester({
        type: 'responsable_enseigne',
        name: metadata?.full_name ?? user.email ?? '',
        email: user.email ?? '',
        phone: metadata?.phone ?? '',
        position: metadata?.position ?? null,
      });
    }
  }, [user]);

  useEffect(() => {
    if (
      selectedCustomerContacts?.contacts &&
      selectedCustomerContacts.contacts.length > 0 &&
      isNewRestaurant === true
    ) {
      const primaryContact = selectedCustomerContacts.primaryContact;
      if (primaryContact) {
        setNewRestaurantForm(prev => ({
          ...prev,
          ownerFirstName: primaryContact.firstName ?? '',
          ownerLastName: primaryContact.lastName ?? '',
          ownerEmail: primaryContact.email ?? '',
          ownerPhone: primaryContact.phone ?? '',
        }));
      }
    }
  }, [selectedCustomerContacts, isNewRestaurant]);

  useEffect(() => {
    if (selectedCustomerContacts?.primaryContact && isNewRestaurant === false) {
      const primary = selectedCustomerContacts.primaryContact;
      setNewRestaurantForm(prev => ({
        ...prev,
        ownerFirstName: primary.firstName ?? '',
        ownerLastName: primary.lastName ?? '',
        ownerEmail: primary.email ?? '',
        ownerPhone: primary.phone ?? primary.mobile ?? '',
      }));
    }
  }, [selectedCustomerContacts, isNewRestaurant]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // ============================================
  // COMPUTED
  // ============================================
  const selectedSelection = useMemo(
    () => selections?.find(s => s.id === selectedSelectionId),
    [selections, selectedSelectionId]
  );

  const _selectedCustomer = useMemo(
    () => customers?.find(c => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const categories = useMemo(() => {
    if (!products) return [];
    const categoryMap = new Map<string, { count: number }>();
    for (const product of products) {
      const cat = product.category ?? 'Autres';
      const existing = categoryMap.get(cat);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(cat, { count: 1 });
      }
    }
    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = products;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p: SelectionProduct) =>
          p.productName.toLowerCase().includes(query) ||
          p.productSku.toLowerCase().includes(query)
      );
    }
    if (selectedCategory) {
      const categoryName = categories.find(
        c => c.id === selectedCategory
      )?.name;
      if (categoryName) {
        filtered = filtered.filter(
          (p: SelectionProduct) => (p.category ?? 'Autres') === categoryName
        );
      }
    }
    return filtered;
  }, [products, searchQuery, selectedCategory, categories]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  const cartTotals = useMemo(() => {
    let totalHt = 0;
    let totalMargin = 0;
    const tvaByRate = new Map<number, number>();
    cart.forEach(item => {
      const lineHt = item.unitPriceHt * item.quantity;
      totalHt += lineHt;
      const { gainEuros } = calculateMargin({
        basePriceHt: item.basePriceHt,
        marginRate: item.marginRate,
      });
      totalMargin += gainEuros * item.quantity;
      const tvaAmount = lineHt * item.taxRate;
      tvaByRate.set(
        item.taxRate,
        (tvaByRate.get(item.taxRate) ?? 0) + tvaAmount
      );
    });
    const tvaDetails = Array.from(tvaByRate.entries())
      .map(([rate, amount]) => ({ rate, amount }))
      .sort((a, b) => a.rate - b.rate);
    const totalTva = tvaDetails.reduce((sum, t) => sum + t.amount, 0);
    const totalTtc = totalHt + totalTva;
    return { totalHt, totalTtc, totalMargin, totalTva, tvaDetails };
  }, [cart]);

  const canSubmitExisting = useMemo(() => {
    return (
      !!selectedSelectionId &&
      !!selectedCustomerId &&
      cart.length > 0 &&
      contactsComplete
    );
  }, [selectedSelectionId, selectedCustomerId, cart, contactsComplete]);

  const canSubmitNew = useMemo(() => {
    const form = newRestaurantForm;
    const restaurantValid = form.tradeName.trim() && form.city.trim();
    const ownerValid =
      form.ownerType &&
      form.ownerFirstName.trim() &&
      form.ownerLastName.trim() &&
      form.ownerEmail.trim();
    const billingValid =
      form.billingSameAsOwner ||
      (form.billingFirstName.trim() &&
        form.billingLastName.trim() &&
        form.billingEmail.trim());
    return (
      !!selectedSelectionId &&
      cart.length > 0 &&
      restaurantValid &&
      ownerValid &&
      billingValid
    );
  }, [selectedSelectionId, cart, newRestaurantForm]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleClose = useCallback(() => {
    setIsNewRestaurant(null);
    setContactsComplete(false);
    setPendingContacts(null);
    setNewRestaurantStep(1);
    setNewRestaurantForm(initialNewRestaurantForm);
    setSelectedSelectionId(null);
    setSelectedCustomerId(null);
    setCart([]);
    setNotes('');
    setSearchQuery('');
    onClose();
  }, [onClose]);

  const handleSelectionChange = useCallback((selectionId: string) => {
    setSelectedSelectionId(selectionId);
    setCart([]);
    setSearchQuery('');
  }, []);

  const handleCustomerSelect = useCallback(
    (customerId: string, customerType: 'organization' | 'individual') => {
      setSelectedCustomerId(customerId);
      setSelectedCustomerType(customerType);
      setContactsComplete(false);
    },
    []
  );

  const handleAddToCart = useCallback((product: SelectionProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.selectionItemId === product.id);
      if (existing) {
        return prev.map(item =>
          item.selectionItemId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          selectionItemId: product.id,
          productId: product.productId,
          productName: product.productName,
          productSku: product.productSku,
          quantity: 1,
          unitPriceHt: product.sellingPriceHt,
          marginRate: product.marginRate,
          basePriceHt: product.basePriceHt,
          taxRate: product.taxRate,
        },
      ];
    });
  }, []);

  const handleUpdateQuantity = useCallback(
    (selectionItemId: string, delta: number) => {
      setCart(prev =>
        prev
          .map(item =>
            item.selectionItemId === selectionItemId
              ? { ...item, quantity: Math.max(0, item.quantity + delta) }
              : item
          )
          .filter(item => item.quantity > 0)
      );
    },
    []
  );

  const handleRemoveFromCart = useCallback((selectionItemId: string) => {
    setCart(prev =>
      prev.filter(item => item.selectionItemId !== selectionItemId)
    );
  }, []);

  const handleSubmitExisting = async () => {
    if (
      !affiliate?.id ||
      !selectedCustomerId ||
      !selectedSelectionId ||
      cart.length === 0
    ) {
      return;
    }
    try {
      if (pendingContacts) {
        await updateContacts.mutateAsync({
          organisationId: selectedCustomerId,
          primaryContact: pendingContacts.primaryContact,
          billingContact: pendingContacts.billingContact,
        });
      }
      await createOrder.mutateAsync({
        affiliateId: affiliate.id,
        customerId: selectedCustomerId,
        customerType: selectedCustomerType,
        selectionId: selectedSelectionId,
        items: cart.map(item => ({
          selection_item_id: item.selectionItemId,
          quantity: item.quantity,
        })),
        notes: notes || undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Erreur création commande:', error);
    }
  };

  const handleSubmitNew = async () => {
    if (!affiliate?.id || !selectedSelectionId || cart.length === 0) {
      return;
    }
    const supabase = createClient();
    try {
      const p_cart = cart.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        selling_price_ttc: item.unitPriceHt * (1 + item.taxRate),
        id: item.selectionItemId,
      }));
      const p_requester = requester;
      const p_organisation = {
        is_new: true,
        trade_name: newRestaurantForm.tradeName,
        legal_name:
          newRestaurantForm.ownerType === 'franchise'
            ? newRestaurantForm.billingCompanyName ||
              newRestaurantForm.ownerCompanyName
            : newRestaurantForm.tradeName,
        city: newRestaurantForm.city,
        postal_code: newRestaurantForm.postalCode || null,
        address: newRestaurantForm.address || null,
        siret: newRestaurantForm.billingSiret || null,
      };
      const p_owner = {
        type: newRestaurantForm.ownerType,
        same_as_requester: false,
        name: `${newRestaurantForm.ownerFirstName} ${newRestaurantForm.ownerLastName}`,
        email: newRestaurantForm.ownerEmail,
        phone: newRestaurantForm.ownerPhone || null,
      };
      const billingName = newRestaurantForm.billingSameAsOwner
        ? `${newRestaurantForm.ownerFirstName} ${newRestaurantForm.ownerLastName}`
        : `${newRestaurantForm.billingFirstName} ${newRestaurantForm.billingLastName}`;
      const billingEmail = newRestaurantForm.billingSameAsOwner
        ? newRestaurantForm.ownerEmail
        : newRestaurantForm.billingEmail;
      const billingPhone = newRestaurantForm.billingSameAsOwner
        ? newRestaurantForm.ownerPhone
        : newRestaurantForm.billingPhone;
      const billingAddress = newRestaurantForm.billingUseSameAddress
        ? newRestaurantForm.address
        : newRestaurantForm.billingAddress;
      const billingPostalCode = newRestaurantForm.billingUseSameAddress
        ? newRestaurantForm.postalCode
        : newRestaurantForm.billingPostalCode;
      const billingCity = newRestaurantForm.billingUseSameAddress
        ? newRestaurantForm.city
        : newRestaurantForm.billingCity;
      const p_billing = {
        contact_source: newRestaurantForm.billingSameAsOwner
          ? 'step2'
          : 'custom',
        name: billingName,
        email: billingEmail,
        phone: billingPhone || null,
        address: billingAddress || null,
        postal_code: billingPostalCode || null,
        city: billingCity || null,
        delivery_date: null,
        mall_form_required: false,
      };
      const { data: result, error: rpcError } = (await supabase.rpc(
        'create_public_linkme_order',
        {
          p_affiliate_id: affiliate.id,
          p_selection_id: selectedSelectionId,
          p_cart: p_cart,
          p_requester: p_requester,
          p_organisation: p_organisation,
          p_owner: p_owner,
          p_billing: p_billing,
          p_delivery: {},
        }
      )) as {
        data: import('./types').CreatePublicLinkmeOrderResult | null;
        error: Error | null;
      };

      if (rpcError) {
        throw new Error(`Erreur création commande: ${rpcError.message}`);
      }
      const rpcResult = result;
      if (!rpcResult?.success) {
        throw new Error(
          rpcResult?.error ?? 'Erreur inconnue lors de la création'
        );
      }
      const orderId = rpcResult.order_id;
      const orderNumber = rpcResult.order_number;
      const totalTtc = rpcResult.total_ttc;
      try {
        const { data: selectionData } = (await supabase
          .from('linkme_selections')
          .select('name, linkme_affiliates(name)')
          .eq('id', selectedSelectionId)
          .single()) as { data: SelectionDataWithAffiliate | null };
        await fetch('/api/emails/notify-enseigne-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber,
            orderId,
            requesterName: p_requester.name,
            requesterEmail: p_requester.email,
            requesterType: 'responsable_enseigne',
            organisationName: newRestaurantForm.tradeName,
            isNewRestaurant: true,
            totalTtc: totalTtc,
            source: 'create_order_modal',
            affiliateName: selectionData?.linkme_affiliates?.name,
            selectionName: selectionData?.name,
            notes: notes || null,
          }),
        });
      } catch (emailError) {
        console.error('Erreur envoi notification email:', emailError);
      }
      await queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      await queryClient.invalidateQueries({
        queryKey: ['affiliate-orders', affiliate.id],
      });
      toast.success('Demande envoyée !', {
        description: `Commande ${orderNumber} en attente de validation.`,
      });
      handleClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur', {
        description: errorMessage,
      });
    }
  };

  return {
    // state
    isNewRestaurant,
    setIsNewRestaurant,
    contactsComplete,
    setContactsComplete,
    pendingContacts,
    setPendingContacts,
    newRestaurantStep,
    setNewRestaurantStep,
    newRestaurantForm,
    setNewRestaurantForm,
    showConfirmModal,
    setShowConfirmModal,
    showConfirmExistingModal,
    setShowConfirmExistingModal,
    selectedSelectionId,
    selectedCustomerId,
    cart,
    notes,
    setNotes,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    currentPage,
    setCurrentPage,
    requester,
    // hooks data
    affiliate,
    affiliateLoading,
    selections,
    selectionsLoading,
    customers,
    customersLoading,
    products,
    productsLoading,
    productsError,
    selectedCustomerContacts,
    createOrder,
    updateContacts,
    // computed
    selectedSelection,
    _selectedCustomer,
    categories,
    filteredProducts,
    totalPages,
    paginatedProducts,
    cartTotals,
    canSubmitExisting,
    canSubmitNew,
    // handlers
    handleClose,
    handleSelectionChange,
    handleCustomerSelect,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleSubmitExisting,
    handleSubmitNew,
  };
}
