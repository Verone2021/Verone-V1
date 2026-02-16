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
  return countryCode === 'FR' || !countryCode ? 0.2 : 0.0;
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
    if (step >= 1 && step <= 8) {
      setCurrentStep(step);
      setErrors([]);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (validateCurrentStep() && currentStep < 8) {
      // Marquer l'étape courante comme complétée
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

  // ============================================
  // UPDATES PAR ÉTAPE
  // ============================================

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
      // Vérifier si le produit existe déjà
      const existingIndex = prev.cart.items.findIndex(
        i => i.selectionItemId === item.selectionItemId
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
    setFormData(prev => {
      // Deep merge for billing and delivery sections
      const newContacts = { ...prev.contacts };

      // Handle responsable
      if (data.responsable !== undefined) {
        newContacts.responsable = data.responsable;
      }
      if (data.existingResponsableId !== undefined) {
        newContacts.existingResponsableId = data.existingResponsableId;
      }

      // Handle billing (deep merge) - LEGACY
      if (data.billing !== undefined) {
        newContacts.billing = {
          ...prev.contacts.billing,
          ...data.billing,
        };
      }

      // Handle billingContact (deep merge) - V2
      if (data.billingContact !== undefined) {
        newContacts.billingContact = {
          ...prev.contacts.billingContact,
          ...data.billingContact,
        };
      }

      // Handle billingAddress (deep merge) - V2
      if (data.billingAddress !== undefined) {
        newContacts.billingAddress = {
          ...prev.contacts.billingAddress,
          ...data.billingAddress,
        };
      }

      // Handle billingOrg (deep merge) - V2
      if (data.billingOrg !== undefined) {
        newContacts.billingOrg = {
          ...prev.contacts.billingOrg,
          ...data.billingOrg,
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
    setFormData(prev => ({
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
    let taxRate = 0.2; // Défaut France

    if (formData.restaurant.mode === 'new') {
      // Nouveau restaurant : utiliser le pays saisi
      taxRate = getTaxRateFromCountry(
        formData.restaurant.newRestaurant?.country
      );
    } else {
      // Restaurant existant : utiliser le pays de l'organisation
      taxRate = getTaxRateFromCountry(formData.restaurant.existingCountry);
    }

    // Convertir les items du panier au format attendu par calculateCartTotals
    const itemsForCalculation: CartItemForCalculation[] = items.map(item => ({
      basePriceHt: item.basePriceHt,
      marginRate: item.marginRate,
      quantity: item.quantity,
      isAffiliateProduct: item.isAffiliateProduct,
      affiliateCommissionRate: item.affiliateCommissionRate,
    }));

    // Utiliser le calcul centralisé (SSOT) avec le taux TVA dynamique
    return calculateCartTotals(itemsForCalculation, taxRate);
  }, [
    formData.cart.items,
    formData.restaurant.mode,
    formData.restaurant.newRestaurant?.country,
    formData.restaurant.existingCountry,
  ]);

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
      let customerId: string;

      // Étape 1: Créer ou récupérer le customer (organisation)
      if (
        formData.restaurant.mode === 'new' &&
        formData.restaurant.newRestaurant
      ) {
        // Créer une nouvelle organisation
        const newResto = formData.restaurant.newRestaurant;

        const { data: orgId, error: orgError } = await supabase.rpc(
          'create_customer_organisation_for_affiliate',
          {
            p_affiliate_id: affiliate.id,
            p_legal_name: newResto.tradeName,
            p_trade_name: newResto.tradeName,
            p_email: formData.contacts.responsable.email ?? undefined,
            p_phone: formData.contacts.responsable.phone ?? undefined,
            p_address:
              newResto.address ?? formData.delivery.address ?? undefined,
            p_postal_code:
              newResto.postalCode ?? formData.delivery.postalCode ?? undefined,
            p_city: newResto.city ?? undefined,
            // Données géolocalisation pour TVA dynamique
            p_country: newResto.country ?? 'FR',
            p_latitude: newResto.latitude ?? undefined,
            p_longitude: newResto.longitude ?? undefined,
            // Enseigne + ownership type (Correction 1)
            p_enseigne_id: affiliate.enseigne_id ?? undefined,
            p_ownership_type: newResto.ownershipType ?? undefined,
          }
        );

        if (orgError) {
          console.error('Erreur création organisation:', orgError);
          const typedError = orgError as { message?: string };
          throw new Error(
            typedError.message ?? 'Erreur lors de la création du restaurant'
          );
        }

        customerId = orgId;
      } else {
        // Utiliser l'organisation existante
        customerId = formData.restaurant.existingId!;
      }

      // Étape 2: Préparer les items pour la commande
      const orderItems = formData.cart.items.map(item => ({
        selection_item_id: item.selectionItemId,
        quantity: item.quantity,
      }));

      // Étape 2.5: Déterminer ownership type pour les contacts
      const ownerType =
        formData.restaurant.mode === 'new'
          ? formData.restaurant.newRestaurant?.ownershipType
          : formData.restaurant.existingOwnershipType;
      const enseigneId = affiliate.enseigne_id;

      // Étape 2.6: Créer les contacts "nouveaux" en BD avant la commande
      // Règle métier contacts selon ownership_type :
      //   Succursale (propre) :
      //     - responsable → enseigne (enseigne_id only, owner_type='enseigne')
      //     - facturation → enseigne (enseigne_id only, owner_type='enseigne')
      //     - livraison   → organisation (organisation_id only, owner_type='organisation')
      //   Franchise :
      //     - tous les contacts → organisation (organisation_id only, owner_type='organisation')
      const isSuccursale = ownerType === 'succursale';

      // FK pour responsable et facturation
      const responsableBillingFk = isSuccursale
        ? {
            organisation_id: null,
            enseigne_id: enseigneId,
            owner_type: 'enseigne' as const,
          }
        : {
            organisation_id: customerId,
            enseigne_id: null,
            owner_type: 'organisation' as const,
          };

      // FK pour livraison (toujours lié à l'organisation)
      const deliveryFk = {
        organisation_id: customerId,
        enseigne_id: null,
        owner_type: 'organisation' as const,
      };

      // Responsable : créer si pas d'ID existant
      let responsableContactId =
        formData.contacts.existingResponsableId ?? null;

      if (!responsableContactId && formData.contacts.responsable.firstName) {
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            ...responsableBillingFk,
            first_name: formData.contacts.responsable.firstName,
            last_name: formData.contacts.responsable.lastName,
            email: formData.contacts.responsable.email,
            phone: formData.contacts.responsable.phone ?? null,
            title: formData.contacts.responsable.position ?? null,
            is_primary_contact: true,
            is_active: true,
          })
          .select('id')
          .single();

        if (contactError) {
          console.error('Erreur création contact responsable:', contactError);
          throw new Error('Erreur lors de la création du contact responsable');
        }
        responsableContactId = newContact.id;
      }

      // Billing contact : créer si mode = 'new'
      let billingContactId: string | null = null;
      if (formData.contacts.billingContact.mode === 'same_as_responsable') {
        billingContactId = responsableContactId;
      } else if (formData.contacts.billingContact.mode === 'existing') {
        billingContactId =
          formData.contacts.billingContact.existingContactId ?? null;
      } else if (
        formData.contacts.billingContact.mode === 'new' &&
        formData.contacts.billingContact.contact
      ) {
        const bc = formData.contacts.billingContact.contact;
        const { data: newBilling, error: billingError } = await supabase
          .from('contacts')
          .insert({
            ...responsableBillingFk,
            first_name: bc.firstName,
            last_name: bc.lastName,
            email: bc.email,
            phone: bc.phone ?? null,
            title: bc.position ?? null,
            is_billing_contact: true,
            is_active: true,
          })
          .select('id')
          .single();

        if (billingError) {
          console.error('Erreur création contact facturation:', billingError);
          throw new Error('Erreur lors de la création du contact facturation');
        }
        billingContactId = newBilling.id;
      }

      // Delivery contact : créer si nouveau
      let deliveryContactId: string | null = null;
      if (formData.contacts.delivery.sameAsResponsable) {
        deliveryContactId = responsableContactId;
      } else if (formData.contacts.delivery.existingContactId) {
        deliveryContactId = formData.contacts.delivery.existingContactId;
      } else if (formData.contacts.delivery.contact) {
        const dc = formData.contacts.delivery.contact;
        const { data: newDelivery, error: deliveryError } = await supabase
          .from('contacts')
          .insert({
            ...deliveryFk,
            first_name: dc.firstName,
            last_name: dc.lastName,
            email: dc.email,
            phone: dc.phone ?? null,
            title: dc.position ?? null,
            is_active: true,
          })
          .select('id')
          .single();

        if (deliveryError) {
          console.error('Erreur création contact livraison:', deliveryError);
          throw new Error('Erreur lors de la création du contact livraison');
        }
        deliveryContactId = newDelivery.id;
      }

      // Étape 3: Construire p_linkme_details (toutes les données workflow)
      // ownerType already computed above (step 2.5)

      // Résoudre le contact de facturation (nom/email/phone)
      let billingName = '';
      let billingEmail = '';
      let billingPhone = '';
      if (formData.contacts.billingContact.mode === 'same_as_responsable') {
        billingName =
          `${formData.contacts.responsable.firstName} ${formData.contacts.responsable.lastName}`.trim();
        billingEmail = formData.contacts.responsable.email;
        billingPhone = formData.contacts.responsable.phone ?? '';
      } else if (formData.contacts.billingContact.contact) {
        const bc = formData.contacts.billingContact.contact;
        billingName = `${bc.firstName} ${bc.lastName}`.trim();
        billingEmail = bc.email;
        billingPhone = bc.phone ?? '';
      }

      // Résoudre le contact de livraison
      let deliveryContactName = '';
      let deliveryContactEmail = '';
      let deliveryContactPhone = '';
      if (formData.contacts.delivery.sameAsResponsable) {
        deliveryContactName =
          `${formData.contacts.responsable.firstName} ${formData.contacts.responsable.lastName}`.trim();
        deliveryContactEmail = formData.contacts.responsable.email;
        deliveryContactPhone = formData.contacts.responsable.phone ?? '';
      } else if (formData.contacts.delivery.contact) {
        const dc = formData.contacts.delivery.contact;
        deliveryContactName = `${dc.firstName} ${dc.lastName}`.trim();
        deliveryContactEmail = dc.email;
        deliveryContactPhone = dc.phone ?? '';
      }

      // Helper: empty string → null
      const emptyToNull = (v: string | null | undefined): string | null =>
        v && v.trim().length > 0 ? v.trim() : null;

      const requesterName =
        `${formData.contacts.responsable.firstName} ${formData.contacts.responsable.lastName}`.trim();

      const linkmeDetails: Record<string, string | number | boolean | null> = {
        // Step 5: Requester (responsable) — optionnel
        requester_type: formData.contacts.existingResponsableId
          ? 'existing_contact'
          : requesterName
            ? 'manual_entry'
            : null,
        requester_name: emptyToNull(requesterName),
        requester_email: emptyToNull(formData.contacts.responsable.email),
        requester_phone: emptyToNull(formData.contacts.responsable.phone),
        requester_position: emptyToNull(formData.contacts.responsable.position),
        is_new_restaurant: formData.restaurant.mode === 'new',
        // Step 6: Owner type
        owner_type: ownerType ?? null,
        // Step 6: Billing
        billing_contact_source: formData.contacts.billingContact.mode,
        billing_name: emptyToNull(billingName),
        billing_email: emptyToNull(billingEmail),
        billing_phone: emptyToNull(billingPhone),
        // Step 7: Delivery contact
        delivery_contact_name: emptyToNull(deliveryContactName),
        delivery_contact_email: emptyToNull(deliveryContactEmail),
        delivery_contact_phone: emptyToNull(deliveryContactPhone),
        // Step 7: Delivery address
        delivery_address: emptyToNull(formData.delivery.address),
        delivery_postal_code: emptyToNull(formData.delivery.postalCode),
        delivery_city: emptyToNull(formData.delivery.city),
        // Step 7: Delivery options
        desired_delivery_date: formData.delivery.desiredDate
          ? formData.delivery.desiredDate.toISOString().split('T')[0]
          : null,
        is_mall_delivery: formData.delivery.isMallDelivery,
        mall_email: formData.delivery.mallEmail ?? null,
        semi_trailer_accessible: formData.delivery.semiTrailerAccessible,
        access_form_url: formData.delivery.accessFormUrl ?? null,
        delivery_notes: formData.delivery.notes ?? null,
        // Terms
        delivery_terms_accepted: true,
      };

      // Étape 4: Créer la commande via RPC (atomique, avec linkme_details)
      const { data: orderId, error: orderError } = await supabase.rpc(
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

      // Invalider les caches
      await queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      await queryClient.invalidateQueries({
        queryKey: ['linkme-orders', affiliate.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ['affiliate-orders', affiliate.id],
      });

      // Réinitialiser le formulaire après succès
      resetForm();

      return orderId;
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
