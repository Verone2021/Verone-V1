'use client';

/**
 * Hook: use-order-form
 * Gestion de l'état du formulaire de commande multi-étapes
 *
 * Features:
 * - État centralisé pour les 8 étapes
 * - Navigation entre étapes avec validation
 * - Persistence locale (optionnelle)
 * - Soumission de la commande via RPC
 *
 * @module use-order-form
 * @since 2026-01-20
 * @updated 2026-01-24 - Refonte 7→8 étapes
 */

import { useState, useCallback, useMemo } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import {
  calculateCartTotals,
  type CartItemForCalculation,
} from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';

import type {
  OrderFormData,
  RestaurantStepData,
  SelectionStepData,
  CartStepData,
  CartItem,
  ContactsStepData,
  DeliveryStepData,
} from '../../components/orders/schemas/order-form.schema';
import {
  defaultOrderFormData,
  validateStep,
  getStepErrors,
} from '../../components/orders/schemas/order-form.schema';
import { useUserAffiliate } from './use-user-selection';
import { buildLinkmeDetails, uploadKbisFile } from './submit-build-details';
import { createOrderContacts } from './submit-create-contacts';
import { createOrderCustomer } from './submit-create-customer';
import { getTaxRateFromCountry, mergeContacts } from './use-order-form-helpers';
import type { UseOrderFormReturn } from './use-order-form.types';

export type { UseOrderFormReturn };

export function useOrderForm(): UseOrderFormReturn {
  const { data: affiliate } = useUserAffiliate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<OrderFormData>(defaultOrderFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // --- Navigation ---

  const validateCurrentStep = useCallback(() => {
    const isValid = validateStep(currentStep, formData);
    if (!isValid) {
      setErrors(getStepErrors(currentStep, formData));
    } else {
      setErrors([]);
    }
    return isValid;
  }, [currentStep, formData]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 8) {
      setCurrentStep(step);
      setErrors([]);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (validateCurrentStep() && currentStep < 8) {
      setCompletedSteps(prev =>
        prev.includes(currentStep) ? prev : [...prev, currentStep]
      );
      setCurrentStep(prev => prev + 1);
      setErrors([]);
    }
  }, [currentStep, validateCurrentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors([]);
    }
  }, [currentStep]);

  const canGoNext = useMemo(() => {
    return currentStep < 8 && validateStep(currentStep, formData);
  }, [currentStep, formData]);

  const canGoPrev = currentStep > 1;

  // --- Updates par étape ---

  const updateRestaurant = useCallback((data: Partial<RestaurantStepData>) => {
    setFormData(prev => ({
      ...prev,
      restaurant: { ...prev.restaurant, ...data },
    }));
  }, []);

  const updateSelection = useCallback((data: Partial<SelectionStepData>) => {
    setFormData(prev => ({
      ...prev,
      selection: { ...prev.selection, ...data },
    }));
  }, []);

  const updateCart = useCallback((data: Partial<CartStepData>) => {
    setFormData(prev => ({
      ...prev,
      cart: { ...prev.cart, ...data },
    }));
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setFormData(prev => {
      const existingIndex = prev.cart.items.findIndex(
        i => i.selectionItemId === item.selectionItemId
      );

      if (existingIndex >= 0) {
        const newItems = [...prev.cart.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + item.quantity,
        };
        return { ...prev, cart: { items: newItems } };
      }

      return {
        ...prev,
        cart: { items: [...prev.cart.items, item] },
      };
    });
  }, []);

  const removeFromCart = useCallback((selectionItemId: string) => {
    setFormData(prev => ({
      ...prev,
      cart: {
        items: prev.cart.items.filter(
          i => i.selectionItemId !== selectionItemId
        ),
      },
    }));
  }, []);

  const updateCartQuantity = useCallback(
    (selectionItemId: string, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(selectionItemId);
        return;
      }

      setFormData(prev => ({
        ...prev,
        cart: {
          items: prev.cart.items.map(i =>
            i.selectionItemId === selectionItemId ? { ...i, quantity } : i
          ),
        },
      }));
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      cart: { items: [] },
    }));
  }, []);

  const updateContacts = useCallback((data: Partial<ContactsStepData>) => {
    setFormData(prev => ({
      ...prev,
      contacts: mergeContacts(prev.contacts, data),
    }));
  }, []);

  const updateDelivery = useCallback((data: Partial<DeliveryStepData>) => {
    setFormData(prev => ({
      ...prev,
      delivery: { ...prev.delivery, ...data },
    }));
  }, []);

  // --- Calculs (SSOT via @verone/utils) ---

  const cartTotals = useMemo(() => {
    const items = formData.cart.items;

    let taxRate = 0.2;
    if (formData.restaurant.mode === 'new') {
      taxRate = getTaxRateFromCountry(
        formData.restaurant.newRestaurant?.country
      );
    } else {
      taxRate = getTaxRateFromCountry(formData.restaurant.existingCountry);
    }

    const itemsForCalculation: CartItemForCalculation[] = items.map(item => ({
      basePriceHt: item.basePriceHt,
      marginRate: item.marginRate,
      quantity: item.quantity,
      isAffiliateProduct: item.isAffiliateProduct,
      affiliateCommissionRate: item.affiliateCommissionRate,
    }));

    return calculateCartTotals(itemsForCalculation, taxRate);
  }, [
    formData.cart.items,
    formData.restaurant.mode,
    formData.restaurant.newRestaurant?.country,
    formData.restaurant.existingCountry,
  ]);

  // --- Actions ---

  const resetForm = useCallback(() => {
    setFormData(defaultOrderFormData);
    setCurrentStep(1);
    setCompletedSteps([]);
    setErrors([]);
  }, []);

  const submit = useCallback(async (): Promise<{
    orderId: string;
    orderNumber: string;
  } | null> => {
    if (!validateStep(8, formData)) {
      setErrors(getStepErrors(8, formData));
      return null;
    }

    if (!affiliate) {
      setErrors(['Aucun compte affilié trouvé']);
      return null;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const supabase = createClient();

      // Étape 1: Créer ou récupérer le customer
      const customerId = await createOrderCustomer(
        supabase,
        formData,
        affiliate,
        formData.contacts.responsable.email,
        formData.contacts.responsable.phone
      );

      // Étape 2: Préparer les items
      const orderItems = formData.cart.items.map(item => ({
        selection_item_id: item.selectionItemId,
        quantity: item.quantity,
      }));

      // Étape 2.5: Déterminer ownership type
      const ownerType =
        formData.restaurant.mode === 'new'
          ? formData.restaurant.newRestaurant?.ownershipType
          : formData.restaurant.existingOwnershipType;

      // Étape 2.6: Créer les contacts
      const { responsableContactId, billingContactId, deliveryContactId } =
        await createOrderContacts(
          supabase,
          formData,
          customerId,
          affiliate,
          ownerType
        );

      // Étape 3: Construire linkme_details + upload Kbis
      const linkmeDetails = buildLinkmeDetails(formData, ownerType);
      const kbisUrl = await uploadKbisFile(supabase, formData);
      if (kbisUrl) linkmeDetails.kbis_url = kbisUrl;

      // Étape 4: Créer la commande via RPC
      const { data: rpcResult, error: orderError } = await supabase.rpc(
        'create_affiliate_order',
        {
          p_affiliate_id: affiliate.id,
          p_customer_id: customerId,
          p_customer_type: 'organization' as const,
          p_selection_id: formData.selection.selectionId,
          p_items: orderItems,
          p_notes: formData.delivery.notes ?? undefined,
          p_responsable_contact_id: responsableContactId ?? undefined,
          p_billing_contact_id: billingContactId ?? undefined,
          p_delivery_contact_id: deliveryContactId ?? undefined,
          p_linkme_details: linkmeDetails,
        }
      );

      if (orderError) {
        console.error('Erreur création commande:', orderError);
        const typedError = orderError as { message?: string };
        throw new Error(
          typedError.message ?? 'Erreur lors de la création de la commande'
        );
      }

      const rpcData = rpcResult as unknown as {
        order_id: string;
        order_number: string;
      };
      const orderId = rpcData?.order_id;
      const orderNumber = rpcData?.order_number ?? orderId;

      // Invalider les caches
      await queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      await queryClient.invalidateQueries({
        queryKey: ['linkme-orders', affiliate.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ['affiliate-orders', affiliate.id],
      });

      // Email de confirmation (non-bloquant)
      try {
        await fetch('/api/emails/order-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber,
            requesterName: `${formData.contacts.responsable.firstName} ${formData.contacts.responsable.lastName}`,
            requesterEmail: formData.contacts.responsable.email,
            restaurantName:
              formData.restaurant.existingName ??
              formData.restaurant.newRestaurant?.tradeName ??
              'N/A',
            selectionName: formData.selection.selectionName,
            itemsCount: cartTotals.itemsCount,
            totalHT: cartTotals.totalHT,
            totalTTC: cartTotals.totalTTC,
          }),
        });
      } catch (emailError) {
        console.error('[useOrderForm] Email confirmation error:', emailError);
      }

      resetForm();
      return { orderId, orderNumber };
    } catch (error) {
      console.error('Error submitting order:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la création de la commande';
      setErrors([message]);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, resetForm, affiliate, queryClient, cartTotals]);

  // --- Return ---

  return {
    formData,
    currentStep,
    completedSteps,
    isSubmitting,
    errors,
    goToStep,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev,
    updateRestaurant,
    updateSelection,
    updateCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    updateContacts,
    updateDelivery,
    cartTotals,
    resetForm,
    validateCurrentStep,
    submit,
  };
}
