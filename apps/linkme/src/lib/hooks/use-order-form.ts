'use client';

/**
 * Hook: use-order-form
 * Gestion de l'état du formulaire de commande multi-étapes
 *
 * Features:
 * - État centralisé pour les 7 étapes
 * - Navigation entre étapes avec validation
 * - Persistence locale (optionnelle)
 * - Soumission de la commande via RPC
 *
 * @module use-order-form
 * @since 2026-01-20
 */

import { useState, useCallback, useMemo } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { calculateCartTotals, type CartItemForCalculation } from '@verone/utils';
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

// ============================================================================
// HELPERS TVA
// ============================================================================

/**
 * Détermine le taux TVA selon le code pays
 * - France (FR) = 20%
 * - Autres pays (export) = 0%
 *
 * @param countryCode - Code ISO du pays (FR, LU, BE, etc.)
 * @returns Taux TVA (0.20 ou 0.00)
 */
function getTaxRateFromCountry(countryCode: string | undefined | null): number {
  // France = 20%, autres pays = 0% (export)
  return countryCode === 'FR' || !countryCode ? 0.20 : 0.00;
}
import {
  defaultOrderFormData,
  validateStep,
  getStepErrors,
} from '../../components/orders/schemas/order-form.schema';
import { useUserAffiliate } from './use-user-selection';

// ============================================================================
// TYPES
// ============================================================================

export interface UseOrderFormReturn {
  // État
  formData: OrderFormData;
  currentStep: number;
  completedSteps: number[];
  isSubmitting: boolean;
  errors: string[];

  // Navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;

  // Updates par étape
  updateRestaurant: (data: Partial<RestaurantStepData>) => void;
  updateSelection: (data: Partial<SelectionStepData>) => void;
  updateCart: (data: Partial<CartStepData>) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (selectionItemId: string) => void;
  updateCartQuantity: (selectionItemId: string, quantity: number) => void;
  clearCart: () => void;
  updateContacts: (data: Partial<ContactsStepData>) => void;
  updateDelivery: (data: Partial<DeliveryStepData>) => void;

  // Calculs
  cartTotals: {
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    totalCommission: number;
    itemsCount: number;
    effectiveTaxRate: number;
  };

  // Actions
  resetForm: () => void;
  validateCurrentStep: () => boolean;
  submit: () => Promise<string | null>; // Retourne order_id ou null si erreur
}

// ============================================================================
// HOOK
// ============================================================================

export function useOrderForm(): UseOrderFormReturn {
  // Hooks externes
  const { data: affiliate } = useUserAffiliate();
  const queryClient = useQueryClient();

  // État principal
  const [formData, setFormData] = useState<OrderFormData>(defaultOrderFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // ============================================
  // NAVIGATION
  // ============================================

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
    if (step >= 1 && step <= 7) {
      setCurrentStep(step);
      setErrors([]);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (validateCurrentStep() && currentStep < 7) {
      // Marquer l'étape courante comme complétée
      setCompletedSteps((prev) =>
        prev.includes(currentStep) ? prev : [...prev, currentStep]
      );
      setCurrentStep((prev) => prev + 1);
      setErrors([]);
    }
  }, [currentStep, validateCurrentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setErrors([]);
    }
  }, [currentStep]);

  const canGoNext = useMemo(() => {
    return currentStep < 7 && validateStep(currentStep, formData);
  }, [currentStep, formData]);

  const canGoPrev = currentStep > 1;

  // ============================================
  // UPDATES PAR ÉTAPE
  // ============================================

  const updateRestaurant = useCallback((data: Partial<RestaurantStepData>) => {
    setFormData((prev) => ({
      ...prev,
      restaurant: { ...prev.restaurant, ...data },
    }));
  }, []);

  const updateSelection = useCallback((data: Partial<SelectionStepData>) => {
    setFormData((prev) => ({
      ...prev,
      selection: { ...prev.selection, ...data },
    }));
  }, []);

  const updateCart = useCallback((data: Partial<CartStepData>) => {
    setFormData((prev) => ({
      ...prev,
      cart: { ...prev.cart, ...data },
    }));
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setFormData((prev) => {
      // Vérifier si le produit existe déjà
      const existingIndex = prev.cart.items.findIndex(
        (i) => i.selectionItemId === item.selectionItemId
      );

      if (existingIndex >= 0) {
        // Mettre à jour la quantité
        const newItems = [...prev.cart.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + item.quantity,
        };
        return { ...prev, cart: { items: newItems } };
      }

      // Ajouter le nouvel item
      return {
        ...prev,
        cart: { items: [...prev.cart.items, item] },
      };
    });
  }, []);

  const removeFromCart = useCallback((selectionItemId: string) => {
    setFormData((prev) => ({
      ...prev,
      cart: {
        items: prev.cart.items.filter((i) => i.selectionItemId !== selectionItemId),
      },
    }));
  }, []);

  const updateCartQuantity = useCallback(
    (selectionItemId: string, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(selectionItemId);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        cart: {
          items: prev.cart.items.map((i) =>
            i.selectionItemId === selectionItemId ? { ...i, quantity } : i
          ),
        },
      }));
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      cart: { items: [] },
    }));
  }, []);

  const updateContacts = useCallback((data: Partial<ContactsStepData>) => {
    setFormData((prev) => {
      // Deep merge for billing and delivery sections
      const newContacts = { ...prev.contacts };

      // Handle responsable
      if (data.responsable !== undefined) {
        newContacts.responsable = data.responsable;
      }
      if (data.existingResponsableId !== undefined) {
        newContacts.existingResponsableId = data.existingResponsableId;
      }

      // Handle billing (deep merge)
      if (data.billing !== undefined) {
        newContacts.billing = {
          ...prev.contacts.billing,
          ...data.billing,
        };
      }

      // Handle delivery (deep merge)
      if (data.delivery !== undefined) {
        newContacts.delivery = {
          ...prev.contacts.delivery,
          ...data.delivery,
        };
      }

      return {
        ...prev,
        contacts: newContacts,
      };
    });
  }, []);

  const updateDelivery = useCallback((data: Partial<DeliveryStepData>) => {
    setFormData((prev) => ({
      ...prev,
      delivery: { ...prev.delivery, ...data },
    }));
  }, []);

  // ============================================
  // CALCULS - SSOT via @verone/utils/linkme/margin-calculation
  // ============================================

  const cartTotals = useMemo(() => {
    const items = formData.cart.items;

    // Déterminer le taux TVA selon le pays du restaurant
    let taxRate = 0.20; // Défaut France

    if (formData.restaurant.mode === 'new') {
      // Nouveau restaurant : utiliser le pays saisi
      taxRate = getTaxRateFromCountry(formData.restaurant.newRestaurant?.country);
    } else {
      // Restaurant existant : utiliser le pays de l'organisation
      taxRate = getTaxRateFromCountry(formData.restaurant.existingCountry);
    }

    // Convertir les items du panier au format attendu par calculateCartTotals
    const itemsForCalculation: CartItemForCalculation[] = items.map((item) => ({
      basePriceHt: item.basePriceHt,
      marginRate: item.marginRate,
      quantity: item.quantity,
      isAffiliateProduct: item.isAffiliateProduct,
      affiliateCommissionRate: item.affiliateCommissionRate,
    }));

    // Utiliser le calcul centralisé (SSOT) avec le taux TVA dynamique
    return calculateCartTotals(itemsForCalculation, taxRate);
  }, [formData.cart.items, formData.restaurant.mode, formData.restaurant.newRestaurant?.country, formData.restaurant.existingCountry]);

  // ============================================
  // ACTIONS
  // ============================================

  const resetForm = useCallback(() => {
    setFormData(defaultOrderFormData);
    setCurrentStep(1);
    setCompletedSteps([]);
    setErrors([]);
  }, []);

  const submit = useCallback(async (): Promise<string | null> => {
    // Valider toutes les étapes
    if (!validateStep(7, formData)) {
      setErrors(getStepErrors(7, formData));
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
      let customerId: string;

      // Étape 1: Créer ou récupérer le customer (organisation)
      if (formData.restaurant.mode === 'new' && formData.restaurant.newRestaurant) {
        // Créer une nouvelle organisation
        const newResto = formData.restaurant.newRestaurant;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: orgId, error: orgError } = await (supabase.rpc as any)(
          'create_customer_organisation_for_affiliate',
          {
            p_affiliate_id: affiliate.id,
            p_legal_name: newResto.tradeName,
            p_trade_name: newResto.tradeName,
            p_email: formData.contacts.responsable.email || null,
            p_phone: formData.contacts.responsable.phone || null,
            p_address: newResto.address || formData.delivery.address || null,
            p_postal_code: newResto.postalCode || formData.delivery.postalCode || null,
            p_city: newResto.city || null,
            // Données géolocalisation pour TVA dynamique
            p_country: newResto.country || 'FR',
            p_latitude: newResto.latitude || null,
            p_longitude: newResto.longitude || null,
          }
        );

        if (orgError) {
          console.error('Erreur création organisation:', orgError);
          throw new Error(orgError.message || 'Erreur lors de la création du restaurant');
        }

        customerId = orgId as string;
      } else {
        // Utiliser l'organisation existante
        customerId = formData.restaurant.existingId!;
      }

      // Étape 2: Préparer les items pour la commande
      const orderItems = formData.cart.items.map((item) => ({
        selection_item_id: item.selectionItemId,
        quantity: item.quantity,
      }));

      // Étape 3: Créer la commande via RPC
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: orderId, error: orderError } = await (supabase.rpc as any)(
        'create_affiliate_order',
        {
          p_affiliate_id: affiliate.id,
          p_customer_id: customerId,
          p_customer_type: 'organization',
          p_selection_id: formData.selection.selectionId,
          p_items: orderItems,
          p_notes: formData.delivery.notes || null,
        }
      );

      if (orderError) {
        console.error('Erreur création commande:', orderError);
        throw new Error(orderError.message || 'Erreur lors de la création de la commande');
      }

      // Étape 4: Mettre à jour les infos de livraison sur la commande
      // (les contacts et détails livraison seront stockés sur la commande)
      if (orderId) {
        const deliveryUpdate: Record<string, unknown> = {
          shipping_address_line1: formData.delivery.address,
          shipping_postal_code: formData.delivery.postalCode,
          shipping_city: formData.delivery.city,
          notes: formData.delivery.notes || null,
        };

        if (formData.delivery.desiredDate) {
          deliveryUpdate.requested_delivery_date = formData.delivery.desiredDate;
        }

        // Ajouter les infos de livraison supplémentaires si centre commercial
        if (formData.delivery.isMallDelivery && formData.delivery.mallEmail) {
          const existingNotes = deliveryUpdate.notes || '';
          deliveryUpdate.notes = `${existingNotes}\n[Centre commercial: ${formData.delivery.mallEmail}]`.trim();
        }

        const { error: updateError } = await supabase
          .from('sales_orders')
          .update(deliveryUpdate)
          .eq('id', orderId);

        if (updateError) {
          console.warn('Warning: Could not update delivery info:', updateError);
          // Ne pas bloquer la création, juste logger
        }
      }

      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      queryClient.invalidateQueries({
        queryKey: ['linkme-orders', affiliate.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['affiliate-orders', affiliate.id],
      });

      // Réinitialiser le formulaire après succès
      resetForm();

      return orderId as string;
    } catch (error) {
      console.error('Error submitting order:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la création de la commande';
      setErrors([message]);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, resetForm, affiliate, queryClient]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // État
    formData,
    currentStep,
    completedSteps,
    isSubmitting,
    errors,

    // Navigation
    goToStep,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev,

    // Updates
    updateRestaurant,
    updateSelection,
    updateCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    updateContacts,
    updateDelivery,

    // Calculs
    cartTotals,

    // Actions
    resetForm,
    validateCurrentStep,
    submit,
  };
}

export default useOrderForm;
