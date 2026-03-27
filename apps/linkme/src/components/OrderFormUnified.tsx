'use client';

/**
 * OrderFormUnified — Formulaire Client
 *
 * Formulaire accessible sans authentification via les pages publiques /s/[id]/catalogue.
 * Scope : enseignes uniquement (orgs independantes = formulaire separe a creer).
 *
 * Question initiale : "Est-ce une ouverture de restaurant ?"
 * - Oui (nouveau) → stepper 6 etapes → RPC create_public_linkme_order → status PENDING_APPROVAL
 *   1. Demandeur, 2. Restaurant, 3. Responsable, 4. Facturation, 5. Livraison, 6. Validation
 * - Non (existant) → stepper 6 etapes → RPC create_affiliate_order + p_linkme_details → status DRAFT
 *   1. Demandeur, 2. Restaurant (select), 3. Responsable (manual), 4. Facturation, 5. Livraison, 6. Validation
 *
 * Soumission : use-submit-unified-order.ts (RPCs create_public_linkme_order / create_affiliate_order)
 *
 * Nomenclature :
 * - "Formulaire client" = ce formulaire (public, sans auth)
 * - "Formulaire utilisateur" = NewOrderForm.tsx (dashboard, avec auth)
 *
 * @see NewOrderForm (formulaire utilisateur) - components/orders/NewOrderForm.tsx
 * @see docs/current/linkme/formulaires-commande-comparaison.md
 * @module OrderFormUnified
 * @since 2026-01-11
 * @updated 2026-03-24 - Split into order-form/ sub-components
 */

import { useState, useMemo, useCallback, useEffect } from 'react';

import { Building2, Store, ChevronLeft } from 'lucide-react';

import {
  REQUESTER_CACHE_KEY,
  CACHE_TTL_DAYS,
  OPENING_STEPS,
  EXISTING_STEPS,
  INITIAL_DATA,
} from './order-form/constants';

import { CartSummary } from './order-form/CartSummary';
import { Header } from './order-form/Header';
import { Footer } from './order-form/Footer';
import { InlineConfirmation } from './order-form/InlineConfirmation';
import { OpeningStep1Requester } from './order-form/RequesterStep';
import {
  OpeningStep2Restaurant,
  ExistingStep2Restaurant,
} from './order-form/RestaurantStep';
import {
  OpeningStep3Responsable,
  ExistingStep3Responsable,
} from './order-form/ResponsableStep';
import { OpeningStep4Billing } from './order-form/BillingStep';
import { OpeningStep5Delivery } from './order-form/DeliveryStep';
import { OpeningStep6Validation } from './order-form/ValidationStep';

import type {
  OrderFormUnifiedData,
  OrderFormUnifiedProps,
  RequesterCache,
} from './order-form/types';

// Re-export types for backward compatibility
export type { CartItem, OrderFormUnifiedData } from './order-form/types';

// =====================================================================
// COMPOSANT PRINCIPAL (ORCHESTRATEUR)
// =====================================================================

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

  // NOTE: Pas de pré-remplissage depuis les contacts DB pour le formulaire public.
  // Les contacts sont saisis manuellement et vérifiés par le staff lors de l'approbation.

  // Charger depuis localStorage au montage (seulement pour utilisateurs publics sans org existante)
  useEffect(() => {
    // Ne charger que si :
    // 1. Premier montage (data.isNewRestaurant === null)
    // 2. Pas d'organisation existante sélectionnée
    if (data.isNewRestaurant === null && !data.existingOrganisationId) {
      try {
        const cached = localStorage.getItem(REQUESTER_CACHE_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached) as RequesterCache;

          // Vérifier si le cache n'est pas expiré
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
            // Cache expiré, le supprimer
            localStorage.removeItem(REQUESTER_CACHE_KEY);
          }
        }
      } catch (error) {
        console.error('Erreur chargement cache localStorage:', error);
        // En cas d'erreur, supprimer le cache corrompu
        localStorage.removeItem(REQUESTER_CACHE_KEY);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Exécuter uniquement au montage (mount only). Les valeurs data.isNewRestaurant et data.existingOrganisationId sont vérifiées dans le if pour éviter de charger le cache inutilement, mais on ne veut PAS relancer ce useEffect si elles changent.
  }, []); // Exécuter uniquement au montage

  // Mise à jour des données
  const updateData = useCallback((updates: Partial<OrderFormUnifiedData>) => {
    setData(prev => ({ ...prev, ...updates }));
    // Clear related errors
    const keys = Object.keys(updates);
    setErrors(prev => {
      const next = { ...prev };
      keys.forEach(k => delete next[k]);
      return next;
    });
  }, []);

  // Format prix
  const formatPrice = useCallback(
    (price: number) =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(price),
    []
  );

  // ============================================
  // VALIDATION
  // ============================================

  // Validation Step 1 : Demandeur
  const validateStep1 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.requester.name.trim()) {
      newErrors['requester.name'] = 'Le nom est requis';
    }
    if (!data.requester.email.trim()) {
      newErrors['requester.email'] = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.requester.email)) {
      newErrors['requester.email'] = 'Email invalide';
    }
    if (!data.requester.phone.trim()) {
      newErrors['requester.phone'] = 'Le téléphone est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.requester]);

  // Validation Step 2 : Restaurant
  const validateStep2 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (data.isNewRestaurant === false) {
      // Restaurant existant : doit avoir sélectionné un restaurant
      if (!data.existingOrganisationId) {
        newErrors['existingOrganisationId'] =
          'Veuillez sélectionner un restaurant';
      }
    } else if (data.isNewRestaurant === true) {
      // Nouveau restaurant : validation formulaire complet
      if (!data.newRestaurant.tradeName.trim()) {
        newErrors['newRestaurant.tradeName'] = 'Le nom commercial est requis';
      }
      if (!data.newRestaurant.ownershipType) {
        newErrors['newRestaurant.ownershipType'] =
          'Veuillez choisir le type de restaurant';
      }
      if (!data.newRestaurant.address.trim()) {
        newErrors['newRestaurant.address'] = "L'adresse est requise";
      }
      if (!data.newRestaurant.city.trim()) {
        newErrors['newRestaurant.city'] = 'La ville est requise';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.isNewRestaurant, data.existingOrganisationId, data.newRestaurant]);

  // Validation Step 3 : Responsable
  const validateStep3 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (data.isNewRestaurant === false) {
      // Restaurant existant (public) : saisie manuelle uniquement, pas de contacts DB
      if (!data.responsable.name.trim()) {
        newErrors['responsable.name'] = 'Le nom du responsable est requis';
      }
      if (!data.responsable.email.trim()) {
        newErrors['responsable.email'] = "L'email est requis";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.responsable.email)) {
        newErrors['responsable.email'] = 'Email invalide';
      }
      if (!data.responsable.phone.trim()) {
        newErrors['responsable.phone'] = 'Le téléphone est requis';
      }
    } else if (data.isNewRestaurant === true) {
      // Nouveau restaurant : formulaire obligatoire
      if (!data.responsable.name.trim()) {
        newErrors['responsable.name'] = 'Le nom du responsable est requis';
      }
      if (!data.responsable.email.trim()) {
        newErrors['responsable.email'] = "L'email est requis";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.responsable.email)) {
        newErrors['responsable.email'] = 'Email invalide';
      }
      if (!data.responsable.phone.trim()) {
        newErrors['responsable.phone'] = 'Le téléphone est requis';
      }

      // Raison sociale et SIRET sont facultatifs pour tous les types (propre et franchise)
      // Ils seront demandes plus tard via le formulaire complete-info si necessaire
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.isNewRestaurant, data.responsable]);

  // Validation Step 4 : Facturation
  const validateStep4 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Si n'utilise pas l'org mère, valider formulaire
    if (!data.billing.useParentOrganisation) {
      // Contact facturation
      if (data.billing.contactSource === 'custom') {
        if (!data.billing.name.trim()) {
          newErrors['billing.name'] = 'Le nom est requis';
        }
        if (!data.billing.email.trim()) {
          newErrors['billing.email'] = "L'email est requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.billing.email)) {
          newErrors['billing.email'] = 'Email invalide';
        }
      }

      // Adresse de facturation
      if (!data.billing.address.trim()) {
        newErrors['billing.address'] = "L'adresse est requise";
      }
      if (!data.billing.postalCode.trim()) {
        newErrors['billing.postalCode'] = 'Le code postal est requis';
      }
      if (!data.billing.city.trim()) {
        newErrors['billing.city'] = 'La ville est requise';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.billing]);

  // Validation Step 5 : Livraison
  const validateStep5 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Contact livraison (si pas le responsable)
    if (!data.delivery.useResponsableContact) {
      if (!data.delivery.contactName.trim()) {
        newErrors['delivery.contactName'] = 'Le nom est requis';
      }
      if (!data.delivery.contactEmail.trim()) {
        newErrors['delivery.contactEmail'] = "L'email est requis";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.delivery.contactEmail)
      ) {
        newErrors['delivery.contactEmail'] = 'Email invalide';
      }
      if (!data.delivery.contactPhone.trim()) {
        newErrors['delivery.contactPhone'] = 'Le téléphone est requis';
      }
    }

    // Adresse livraison
    if (!data.delivery.address.trim()) {
      newErrors['delivery.address'] = "L'adresse de livraison est requise";
    }
    if (!data.delivery.deliveryDate && !data.delivery.deliveryAsap) {
      newErrors['delivery.deliveryDate'] =
        'Indiquez une date ou cochez "Dès que possible"';
    }

    // Si centre commercial
    if (data.delivery.isMallDelivery && !data.delivery.mallEmail.trim()) {
      newErrors['delivery.mallEmail'] =
        "L'email du centre commercial est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.delivery]);

  // Validation Step 6 : Validation panier
  const _validateStep6 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (cart.length === 0) {
      newErrors.cart = 'Le panier est vide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [cart.length]);

  // ============================================
  // NAVIGATION
  // ============================================

  const handleNext = useCallback(() => {
    // Validation de chaque étape avant de passer à la suivante (BOTH workflows)
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    if (currentStep === 5 && !validateStep5()) return;
    // Step 6 : le bouton "Valider la commande" gère la confirmation
    if (currentStep === 6) return;

    // Passer à l'étape suivante (max 6)
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
      // Retour à la question initiale
      updateData({ isNewRestaurant: null });
    }
  }, [currentStep, updateData]);

  const handleSubmit = useCallback(async () => {
    try {
      await onSubmit(data, cart);

      // Sauvegarder dans localStorage pour pré-remplissage futur (utilisateurs publics uniquement)
      // Seulement si c'est un nouveau restaurant (pas une org existante)
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
            expiresAt: Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000, // 7 jours
          };
          localStorage.setItem(REQUESTER_CACHE_KEY, JSON.stringify(cache));
        } catch (storageError) {
          // Erreur localStorage non bloquante
          console.error('Impossible de sauvegarder le cache:', storageError);
        }
      }
    } catch (_error) {
      setErrors({ submit: 'Erreur lors de la soumission' });
    }
  }, [data, cart, onSubmit]);

  const handleOpenConfirmation = useCallback(() => {
    if (!validateStep4()) return;
    // Mettre à jour deliveryTermsAccepted via le modal
    setShowConfirmation(true);
  }, [validateStep4]);

  const handleConfirmOrder = useCallback(async () => {
    // Le modal gère l'acceptation des conditions
    updateData({ deliveryTermsAccepted: true });
    await handleSubmit();
  }, [handleSubmit, updateData]);

  // handleSubmitExisting removed — existing restaurant now uses the same 6-step stepper

  // ============================================
  // RENDER
  // ============================================

  // Question initiale non répondue
  if (data.isNewRestaurant === null) {
    return (
      <div className="flex h-full bg-white">
        {/* LEFT: Panier */}
        <CartSummary
          cart={cart}
          cartTotals={cartTotals}
          formatPrice={formatPrice}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
        />

        {/* RIGHT: Question */}
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

  // Restaurant existant - Stepper 6 étapes (identique au nouveau restaurant)
  if (!data.isNewRestaurant) {
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
            title={
              showConfirmation
                ? 'Confirmer votre commande'
                : `${currentStep}. ${EXISTING_STEPS[currentStep - 1].title}`
            }
            subtitle={
              showConfirmation
                ? undefined
                : `Étape ${currentStep}/${EXISTING_STEPS.length}`
            }
            steps={showConfirmation ? undefined : EXISTING_STEPS}
            currentStep={showConfirmation ? undefined : currentStep}
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto p-6">
            {showConfirmation ? (
              <InlineConfirmation
                onBack={() => setShowConfirmation(false)}
                onConfirm={() => void handleConfirmOrder()}
                isSubmitting={isSubmitting}
                termsAccepted={confirmTermsAccepted}
                onTermsChange={setConfirmTermsAccepted}
                requesterName={data.requester.name}
                requesterEmail={data.requester.email}
                restaurantName={
                  organisations.find(o => o.id === data.existingOrganisationId)
                    ?.trade_name ?? 'Restaurant existant'
                }
                isNewRestaurant={false}
                responsableName={data.responsable.name}
                cart={cart}
                itemsCount={cartTotals.totalItems}
                totalHT={cartTotals.totalHt}
                totalTVA={cartTotals.totalTva}
                totalTTC={cartTotals.totalTtc}
                hasDeliveryDate={!!data.delivery.deliveryDate}
                deliveryAsap={data.delivery.deliveryAsap}
                deliveryAddress={
                  data.delivery.address
                    ? `${data.delivery.address}, ${data.delivery.postalCode} ${data.delivery.city}`
                    : ''
                }
                selectionName={selectionName}
                faqUrl={selectionSlug ? `/s/${selectionSlug}/faq` : '#'}
              />
            ) : (
              <>
                {currentStep === 1 && (
                  <OpeningStep1Requester
                    data={data}
                    errors={errors}
                    updateData={updateData}
                    affiliateId={affiliateId}
                  />
                )}
                {currentStep === 2 && (
                  <ExistingStep2Restaurant
                    data={data}
                    errors={errors}
                    updateData={updateData}
                    organisations={organisations}
                    isLoadingOrganisations={isLoadingOrganisations}
                  />
                )}
                {currentStep === 3 && (
                  <ExistingStep3Responsable
                    data={data}
                    errors={errors}
                    updateData={updateData}
                  />
                )}
                {currentStep === 4 && (
                  <OpeningStep4Billing
                    data={data}
                    errors={errors}
                    updateData={updateData}
                    affiliateId={affiliateId}
                  />
                )}
                {currentStep === 5 && (
                  <OpeningStep5Delivery
                    data={data}
                    errors={errors}
                    updateData={updateData}
                    affiliateId={affiliateId}
                  />
                )}
                {currentStep === 6 && (
                  <OpeningStep6Validation
                    data={data}
                    errors={errors}
                    updateData={updateData}
                    affiliateId={affiliateId}
                    cart={cart}
                    cartTotals={cartTotals}
                    formatPrice={formatPrice}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                    onOpenConfirmation={handleOpenConfirmation}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer - masqué en step 6 et confirmation */}
          {!showConfirmation && currentStep < 6 && (
            <Footer
              onBack={handleBack}
              onNext={handleNext}
              nextLabel="Suivant"
              isSubmitting={isSubmitting}
              cartTotals={cartTotals}
              formatPrice={formatPrice}
              showBackButton
            />
          )}
        </div>
      </div>
    );
  }

  // Nouveau restaurant - Stepper
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
          title={
            showConfirmation
              ? 'Confirmer votre commande'
              : `${currentStep}. ${OPENING_STEPS[currentStep - 1].title}`
          }
          subtitle={
            showConfirmation
              ? undefined
              : `Étape ${currentStep}/${OPENING_STEPS.length}`
          }
          steps={showConfirmation ? undefined : OPENING_STEPS}
          currentStep={showConfirmation ? undefined : currentStep}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {showConfirmation ? (
            <InlineConfirmation
              onBack={() => setShowConfirmation(false)}
              onConfirm={() => void handleConfirmOrder()}
              isSubmitting={isSubmitting}
              termsAccepted={confirmTermsAccepted}
              onTermsChange={setConfirmTermsAccepted}
              requesterName={data.requester.name}
              requesterEmail={data.requester.email}
              restaurantName={
                data.newRestaurant.tradeName || 'Nouveau restaurant'
              }
              isNewRestaurant
              responsableName={data.responsable.name}
              cart={cart}
              itemsCount={cartTotals.totalItems}
              totalHT={cartTotals.totalHt}
              totalTVA={cartTotals.totalTva}
              totalTTC={cartTotals.totalTtc}
              hasDeliveryDate={!!data.delivery.deliveryDate}
              deliveryAsap={data.delivery.deliveryAsap}
              deliveryAddress={
                data.delivery.address
                  ? `${data.delivery.address}, ${data.delivery.postalCode} ${data.delivery.city}`
                  : ''
              }
              selectionName={selectionName}
              faqUrl={selectionSlug ? `/s/${selectionSlug}/faq` : '#'}
            />
          ) : (
            <>
              {currentStep === 1 && (
                <OpeningStep1Requester
                  data={data}
                  errors={errors}
                  updateData={updateData}
                  affiliateId={affiliateId}
                />
              )}
              {currentStep === 2 && (
                <OpeningStep2Restaurant
                  data={data}
                  errors={errors}
                  updateData={updateData}
                  affiliateId={affiliateId}
                />
              )}
              {currentStep === 3 && (
                <OpeningStep3Responsable
                  data={data}
                  errors={errors}
                  updateData={updateData}
                  affiliateId={affiliateId}
                />
              )}
              {currentStep === 4 && (
                <OpeningStep4Billing
                  data={data}
                  errors={errors}
                  updateData={updateData}
                  affiliateId={affiliateId}
                />
              )}
              {currentStep === 5 && (
                <OpeningStep5Delivery
                  data={data}
                  errors={errors}
                  updateData={updateData}
                  affiliateId={affiliateId}
                />
              )}
              {currentStep === 6 && (
                <OpeningStep6Validation
                  data={data}
                  errors={errors}
                  updateData={updateData}
                  affiliateId={affiliateId}
                  cart={cart}
                  cartTotals={cartTotals}
                  formatPrice={formatPrice}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                  onOpenConfirmation={handleOpenConfirmation}
                />
              )}
            </>
          )}
        </div>

        {/* Footer - masqué en step 6 et confirmation */}
        {!showConfirmation && currentStep < 6 && (
          <Footer
            onBack={handleBack}
            onNext={handleNext}
            nextLabel="Suivant"
            isSubmitting={isSubmitting}
            cartTotals={cartTotals}
            formatPrice={formatPrice}
            showBackButton
          />
        )}

        {/* Footer simplifié pour step 4 - uniquement retour */}
        {!showConfirmation && currentStep === 4 && (
          <div className="flex-shrink-0 border-t bg-gray-50 px-4 py-3">
            <button
              type="button"
              onClick={handleBack}
              className="py-2 px-4 border border-gray-300 rounded font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderFormUnified;
