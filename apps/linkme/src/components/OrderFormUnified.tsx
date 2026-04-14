'use client';

/**
 * OrderFormUnified — Formulaire Client
 *
 * Formulaire accessible sans authentification via les pages publiques /s/[id]/catalogue.
 *
 * Question initiale : "Est-ce une ouverture de restaurant ?"
 * - Oui (nouveau) → stepper 6 etapes → RPC create_public_linkme_order → PENDING_APPROVAL
 * - Non (existant) → stepper 6 etapes → RPC create_affiliate_order → DRAFT
 *
 * @module OrderFormUnified
 * @since 2026-01-11
 * @updated 2026-04-14 - Refactoring: extraction validation + stepper
 */

import { useState, useMemo, useCallback, useEffect } from 'react';

import { Building2, Store } from 'lucide-react';

import {
  REQUESTER_CACHE_KEY,
  CACHE_TTL_DAYS,
  OPENING_STEPS,
  EXISTING_STEPS,
  INITIAL_DATA,
} from './order-form/constants';

import { CartSummary } from './order-form/CartSummary';
import { Header } from './order-form/Header';
import { OrderFormStepper } from './order-form/OrderFormStepper';
import { useOrderFormValidation } from './order-form/use-order-form-validation';

import type {
  OrderFormUnifiedData,
  OrderFormUnifiedProps,
  RequesterCache,
} from './order-form/types';

// Re-export types for backward compatibility
export type { CartItem, OrderFormUnifiedData } from './order-form/types';

export function OrderFormUnified({
  affiliateId,
  selectionId: _selectionId,
  selectionName = '',
  selectionSlug,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  organisations,
  isLoadingOrganisations = false,
  onClose,
  onSubmit,
  isSubmitting = false,
}: OrderFormUnifiedProps) {
  const [data, setData] = useState<OrderFormUnifiedData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmTermsAccepted, setConfirmTermsAccepted] = useState(false);

  // Calculs des totaux
  const cartTotals = useMemo(() => {
    const totalHt = cart.reduce(
      (sum, item) => sum + item.selling_price_ht * item.quantity,
      0
    );
    const totalTtc = cart.reduce(
      (sum, item) => sum + item.selling_price_ttc * item.quantity,
      0
    );
    const totalTva = totalTtc - totalHt;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { totalHt, totalTtc, totalTva, totalItems };
  }, [cart]);

  // Charger depuis localStorage au montage
  useEffect(() => {
    if (data.isNewRestaurant === null && !data.existingOrganisationId) {
      try {
        const cached = localStorage.getItem(REQUESTER_CACHE_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached) as RequesterCache;
          if (parsedCache.expiresAt > Date.now()) {
            setData(prev => ({
              ...prev,
              responsable: {
                ...prev.responsable,
                name: parsedCache.name,
                email: parsedCache.email,
                phone: parsedCache.phone,
              },
              billing: {
                ...prev.billing,
                name: parsedCache.name,
                email: parsedCache.email,
                phone: parsedCache.phone,
              },
            }));
          } else {
            localStorage.removeItem(REQUESTER_CACHE_KEY);
          }
        }
      } catch (error) {
        console.error('Erreur chargement cache localStorage:', error);
        localStorage.removeItem(REQUESTER_CACHE_KEY);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const updateData = useCallback((updates: Partial<OrderFormUnifiedData>) => {
    setData(prev => ({ ...prev, ...updates }));
    const keys = Object.keys(updates);
    setErrors(prev => {
      const next = { ...prev };
      keys.forEach(k => delete next[k]);
      return next;
    });
  }, []);

  const formatPrice = useCallback(
    (price: number) =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(price),
    []
  );

  // Validation
  const {
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
  } = useOrderFormValidation(data, cart, errors => setErrors(errors));

  // Navigation
  const handleNext = useCallback(() => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    if (currentStep === 5 && !validateStep5()) return;
    if (currentStep === 6) return;
    setCurrentStep(prev => Math.min(prev + 1, 6));
  }, [
    currentStep,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
  ]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      updateData({ isNewRestaurant: null });
    }
  }, [currentStep, updateData]);

  const handleSubmit = useCallback(async () => {
    try {
      await onSubmit(data, cart);
      if (
        data.isNewRestaurant &&
        data.responsable.name &&
        data.responsable.email
      ) {
        try {
          const cache: RequesterCache = {
            name: data.responsable.name,
            email: data.responsable.email,
            phone: data.responsable.phone,
            expiresAt: Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000,
          };
          localStorage.setItem(REQUESTER_CACHE_KEY, JSON.stringify(cache));
        } catch (storageError) {
          console.error('Impossible de sauvegarder le cache:', storageError);
        }
      }
    } catch (_error) {
      setErrors({ submit: 'Erreur lors de la soumission' });
    }
  }, [data, cart, onSubmit]);

  const handleOpenConfirmation = useCallback(() => {
    if (!validateStep4()) return;
    setShowConfirmation(true);
  }, [validateStep4]);

  const handleConfirmOrder = useCallback(async () => {
    updateData({ deliveryTermsAccepted: true });
    await handleSubmit();
  }, [handleSubmit, updateData]);

  // ============================================
  // RENDER
  // ============================================

  // Question initiale
  if (data.isNewRestaurant === null) {
    return (
      <div className="flex h-full bg-white">
        <CartSummary
          cart={cart}
          cartTotals={cartTotals}
          formatPrice={formatPrice}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            title="Nouvelle commande"
            subtitle="Commencez par nous indiquer le type de commande"
            onClose={onClose}
          />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Est-ce une ouverture de restaurant ?
                </h3>
                <p className="text-gray-500 text-sm">
                  Cette question détermine le workflow de votre commande
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => updateData({ isNewRestaurant: false })}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <Store className="h-10 w-10 text-blue-600" />
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Non</p>
                    <p className="text-xs text-gray-500">Restaurant existant</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateData({ isNewRestaurant: true })}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-amber-500 hover:bg-amber-50 transition-all"
                >
                  <Building2 className="h-10 w-10 text-amber-600" />
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Oui</p>
                    <p className="text-xs text-gray-500">Nouveau restaurant</p>
                  </div>
                </button>
              </div>
              <p className="text-center text-xs text-gray-400">
                Une ouverture nécessite une validation préalable
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stepper (existant ou nouveau)
  return (
    <div className="flex h-full bg-white">
      <CartSummary
        cart={cart}
        cartTotals={cartTotals}
        formatPrice={formatPrice}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
      />
      <OrderFormStepper
        isNewRestaurant={data.isNewRestaurant}
        data={data}
        errors={errors}
        updateData={updateData}
        affiliateId={affiliateId}
        steps={data.isNewRestaurant ? OPENING_STEPS : EXISTING_STEPS}
        currentStep={currentStep}
        showConfirmation={showConfirmation}
        confirmTermsAccepted={confirmTermsAccepted}
        isSubmitting={isSubmitting}
        cart={cart}
        cartTotals={cartTotals}
        formatPrice={formatPrice}
        organisations={organisations}
        isLoadingOrganisations={isLoadingOrganisations}
        selectionName={selectionName}
        selectionSlug={selectionSlug}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
        onBack={handleBack}
        onNext={handleNext}
        onClose={onClose}
        onSetShowConfirmation={setShowConfirmation}
        onSetConfirmTermsAccepted={setConfirmTermsAccepted}
        onOpenConfirmation={handleOpenConfirmation}
        onConfirmOrder={handleConfirmOrder}
      />
    </div>
  );
}

export default OrderFormUnified;
