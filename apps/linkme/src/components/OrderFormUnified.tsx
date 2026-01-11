'use client';

/**
 * OrderFormUnified - Formulaire unifié pour les commandes LinkMe
 *
 * Ce composant remplace CreateOrderModal et EnseigneStepper.
 * Il unifie les deux workflows en un seul avec la question
 * "Est-ce une ouverture de restaurant ?" comme point de départ.
 *
 * Workflow:
 * - Restaurant existant → formulaire simple → BROUILLON
 * - Nouveau restaurant → stepper 3 étapes → APPROBATION
 *
 * @module OrderFormUnified
 * @since 2026-01-11
 */

import { useState, useMemo, useCallback } from 'react';

import Image from 'next/image';

import {
  X,
  Loader2,
  Package,
  ShoppingCart,
  Plus,
  Minus,
  Building2,
  Store,
  User,
  FileText,
  AlertCircle,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image?: string | null;
  selling_price_ht: number;
  selling_price_ttc: number;
  margin_rate: number;
  quantity: number;
}

export interface OrderFormUnifiedData {
  // QUESTION 1 - Obligatoire
  isNewRestaurant: boolean | null;

  // SI RESTAURANT EXISTANT
  existingOrganisationId: string | null;

  // SI NOUVEAU RESTAURANT - STEP 1
  newRestaurant: {
    tradeName: string;
    city: string;
    address: string;
    postalCode: string;
  };

  // SI NOUVEAU RESTAURANT - STEP 2: Propriétaire
  owner: {
    type: 'succursale' | 'franchise' | null;
    contactSameAsRequester: boolean;
    name: string;
    email: string;
    phone: string;
    companyLegalName: string;
    companyTradeName: string;
    siret: string;
    kbisUrl: string | null;
  };

  // SI NOUVEAU RESTAURANT - STEP 3: Facturation
  billing: {
    contactSource: 'owner' | 'custom';
    name: string;
    email: string;
    phone: string;
    // Adresse de facturation
    address: string;
    postalCode: string;
    city: string;
    companyLegalName: string;
    siret: string;
  };
  deliveryTermsAccepted: boolean;

  // NOTES - Optionnel
  notes: string;
}

interface Organisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  city: string | null;
}

interface OrderFormUnifiedProps {
  // Context
  affiliateId: string;
  selectionId: string;

  // Cart
  cart: CartItem[];
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;

  // Organisations disponibles
  organisations: Organisation[];
  isLoadingOrganisations?: boolean;

  // Actions
  onClose: () => void;
  onSubmit: (data: OrderFormUnifiedData, cart: CartItem[]) => Promise<void>;
  isSubmitting?: boolean;
}

const INITIAL_DATA: OrderFormUnifiedData = {
  isNewRestaurant: null,
  existingOrganisationId: null,
  newRestaurant: {
    tradeName: '',
    city: '',
    address: '',
    postalCode: '',
  },
  owner: {
    type: null,
    contactSameAsRequester: false,
    name: '',
    email: '',
    phone: '',
    companyLegalName: '',
    companyTradeName: '',
    siret: '',
    kbisUrl: null,
  },
  billing: {
    contactSource: 'owner',
    name: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    companyLegalName: '',
    siret: '',
  },
  deliveryTermsAccepted: false,
  notes: '',
};

const OPENING_STEPS = [
  { id: 1, title: 'Restaurant', icon: Store },
  { id: 2, title: 'Propriétaire', icon: Building2 },
  { id: 3, title: 'Facturation', icon: FileText },
  { id: 4, title: 'Validation', icon: ShoppingCart },
];

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function OrderFormUnified({
  affiliateId,
  selectionId,
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

  const validateExistingRestaurant = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.existingOrganisationId) {
      newErrors.existingOrganisationId = 'Veuillez sélectionner un restaurant';
    }
    if (cart.length === 0) {
      newErrors.cart = 'Le panier est vide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.existingOrganisationId, cart.length]);

  const validateStep1 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.newRestaurant.tradeName.trim()) {
      newErrors['newRestaurant.tradeName'] = 'Le nom commercial est requis';
    }
    if (!data.newRestaurant.city.trim()) {
      newErrors['newRestaurant.city'] = 'La ville est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.newRestaurant]);

  const validateStep2 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.owner.type) {
      newErrors['owner.type'] = 'Veuillez choisir le type de restaurant';
    }
    if (!data.owner.name.trim()) {
      newErrors['owner.name'] = 'Le nom du propriétaire est requis';
    }
    if (!data.owner.email.trim()) {
      newErrors['owner.email'] = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.owner.email)) {
      newErrors['owner.email'] = 'Email invalide';
    }

    if (
      data.owner.type === 'franchise' &&
      !data.owner.companyLegalName.trim()
    ) {
      newErrors['owner.companyLegalName'] = 'La raison sociale est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.owner]);

  const validateStep3 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (data.billing.contactSource === 'custom') {
      if (!data.billing.name.trim()) {
        newErrors['billing.name'] = 'Le nom est requis';
      }
      if (!data.billing.email.trim()) {
        newErrors['billing.email'] = "L'email est requis";
      }
    }

    // Validation adresse de facturation
    if (!data.billing.address.trim()) {
      newErrors['billing.address'] = "L'adresse est requise";
    }
    if (!data.billing.postalCode.trim()) {
      newErrors['billing.postalCode'] = 'Le code postal est requis';
    }
    if (!data.billing.city.trim()) {
      newErrors['billing.city'] = 'La ville est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.billing]);

  const validateStep4 = useCallback((): boolean => {
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
    if (data.isNewRestaurant) {
      if (currentStep === 1 && !validateStep1()) return;
      if (currentStep === 2 && !validateStep2()) return;
      if (currentStep === 3 && !validateStep3()) return;
      // Step 4 : le bouton "Valider le panier" gère la confirmation
      if (currentStep === 4) return;
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  }, [
    currentStep,
    data.isNewRestaurant,
    validateStep1,
    validateStep2,
    validateStep3,
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
    } catch (error) {
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

  const handleSubmitExisting = useCallback(async () => {
    if (!validateExistingRestaurant()) return;
    await handleSubmit();
  }, [validateExistingRestaurant, handleSubmit]);

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

  // Restaurant existant - Formulaire simple
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
            title="Commande restaurant existant"
            subtitle="Sélectionnez le restaurant et validez"
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-lg space-y-6">
              {/* Sélection restaurant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant *
                </label>
                {isLoadingOrganisations ? (
                  <div className="flex items-center gap-2 py-3 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Chargement...</span>
                  </div>
                ) : organisations.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      Aucun restaurant disponible.{' '}
                      <button
                        type="button"
                        onClick={() => updateData({ isNewRestaurant: true })}
                        className="underline font-medium"
                      >
                        Créer un nouveau restaurant
                      </button>
                    </p>
                  </div>
                ) : (
                  <select
                    value={data.existingOrganisationId || ''}
                    onChange={e =>
                      updateData({
                        existingOrganisationId: e.target.value || null,
                      })
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.existingOrganisationId
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Choisir un restaurant --</option>
                    {organisations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.trade_name || org.legal_name}
                        {org.city ? ` (${org.city})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {errors.existingOrganisationId && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.existingOrganisationId}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={data.notes}
                  onChange={e => updateData({ notes: e.target.value })}
                  placeholder="Instructions spéciales, commentaires..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Info */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Brouillon</p>
                  <p className="text-sm text-blue-700 mt-0.5">
                    Cette commande sera créée en brouillon et pourra être
                    modifiée avant validation.
                  </p>
                </div>
              </div>

              {errors.cart && (
                <p className="text-sm text-red-600">{errors.cart}</p>
              )}
              {errors.submit && (
                <p className="text-sm text-red-600">{errors.submit}</p>
              )}
            </div>
          </div>

          <Footer
            onBack={() => updateData({ isNewRestaurant: null })}
            onNext={handleSubmitExisting}
            nextLabel="Créer le brouillon"
            isSubmitting={isSubmitting}
            cartTotals={cartTotals}
            formatPrice={formatPrice}
          />
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
          title={`${currentStep}. ${OPENING_STEPS[currentStep - 1].title}`}
          subtitle={`Étape ${currentStep}/${OPENING_STEPS.length}`}
          steps={OPENING_STEPS}
          currentStep={currentStep}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <OpeningStep1 data={data} errors={errors} updateData={updateData} />
          )}
          {currentStep === 2 && (
            <OpeningStep2 data={data} errors={errors} updateData={updateData} />
          )}
          {currentStep === 3 && (
            <OpeningStep3 data={data} errors={errors} updateData={updateData} />
          )}
          {currentStep === 4 && (
            <OpeningStep4
              data={data}
              errors={errors}
              updateData={updateData}
              cart={cart}
              cartTotals={cartTotals}
              formatPrice={formatPrice}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              onOpenConfirmation={handleOpenConfirmation}
            />
          )}
        </div>

        {/* Footer - masqué en step 4 car le bouton est dans OpeningStep4 */}
        {currentStep < 4 && (
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
        {currentStep === 4 && (
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

      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmOrder}
        isSubmitting={isSubmitting}
        data={data}
        cart={cart}
        cartTotals={cartTotals}
        formatPrice={formatPrice}
      />
    </div>
  );
}

// =====================================================================
// SOUS-COMPOSANTS
// =====================================================================

interface CartSummaryProps {
  cart: CartItem[];
  cartTotals: {
    totalHt: number;
    totalTtc: number;
    totalTva: number;
    totalItems: number;
  };
  formatPrice: (price: number) => string;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
}

function CartSummary({
  cart,
  cartTotals,
  formatPrice,
  onUpdateQuantity,
  onRemoveItem,
}: CartSummaryProps) {
  return (
    <div className="hidden md:flex w-1/2 bg-gray-50 border-r flex-col">
      <div className="flex-shrink-0 px-4 py-3 border-b bg-white flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Récapitulatif</h3>
          <p className="text-xs text-gray-500">
            {cartTotals.totalItems} article
            {cartTotals.totalItems > 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total TTC</p>
          <p className="font-bold text-gray-900">
            {formatPrice(cartTotals.totalTtc)}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ShoppingCart className="h-12 w-12 mb-2" />
            <p className="text-sm">Panier vide</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-3 py-2 text-left font-medium">Produit</th>
                <th className="px-2 py-2 text-center font-medium w-24">Qté</th>
                <th className="px-3 py-2 text-right font-medium w-24">
                  Prix HT
                </th>
                <th className="px-3 py-2 text-right font-medium w-24">Total</th>
                {onRemoveItem && <th className="px-2 py-2 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cart.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate text-xs">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.product_sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    {onUpdateQuantity ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-3 w-3 text-gray-600" />
                        </button>
                        <span className="w-6 text-center text-gray-600">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-600">
                        {item.quantity}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {formatPrice(item.selling_price_ht)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">
                    {formatPrice(item.selling_price_ttc * item.quantity)}
                  </td>
                  {onRemoveItem && (
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 rounded hover:bg-red-100 transition-colors text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex-shrink-0 px-4 py-3 border-t bg-white">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>HT: {formatPrice(cartTotals.totalHt)}</span>
          <span>TVA: {formatPrice(cartTotals.totalTva)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900">
          <span>Total TTC</span>
          <span className="text-lg">{formatPrice(cartTotals.totalTtc)}</span>
        </div>
      </div>
    </div>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  steps?: typeof OPENING_STEPS;
  currentStep?: number;
  onClose: () => void;
}

function Header({ title, subtitle, steps, currentStep, onClose }: HeaderProps) {
  return (
    <div className="flex-shrink-0 border-b bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <span className="text-xs text-gray-400">({subtitle})</span>
          )}
        </div>

        {steps && currentStep && (
          <div className="flex items-center gap-1">
            {steps.map(step => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    isCompleted
                      ? 'bg-green-500'
                      : isActive
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                  }`}
                />
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

interface FooterProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  isSubmitting: boolean;
  cartTotals: {
    totalHt: number;
    totalTtc: number;
    totalTva: number;
    totalItems: number;
  };
  formatPrice: (price: number) => string;
  showBackButton?: boolean;
}

function Footer({
  onBack,
  onNext,
  nextLabel,
  isSubmitting,
  cartTotals,
  formatPrice,
  showBackButton = true,
}: FooterProps) {
  return (
    <div className="flex-shrink-0 border-t bg-gray-50 px-4 py-3">
      {/* Mobile: show cart summary */}
      <div className="md:hidden flex items-center justify-between mb-3 pb-3 border-b border-gray-200 text-sm">
        <span className="text-gray-600">
          {cartTotals.totalItems} art. | HT: {formatPrice(cartTotals.totalHt)}
        </span>
        <span className="font-bold text-gray-900">
          TTC: {formatPrice(cartTotals.totalTtc)}
        </span>
      </div>

      <div className="flex gap-2">
        {showBackButton && onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 py-2 px-3 border border-gray-300 rounded font-medium text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="flex-1 py-2 px-3 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi...
            </>
          ) : (
            <>
              {nextLabel}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// ÉTAPES OUVERTURE
// =====================================================================

interface StepProps {
  data: OrderFormUnifiedData;
  errors: Record<string, string>;
  updateData: (updates: Partial<OrderFormUnifiedData>) => void;
}

function OpeningStep1({ data, errors, updateData }: StepProps) {
  return (
    <div className="max-w-lg space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Un nouveau restaurant nécessite une validation préalable par notre
            équipe avant traitement de la commande.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom commercial *
          </label>
          <input
            type="text"
            value={data.newRestaurant.tradeName}
            onChange={e =>
              updateData({
                newRestaurant: {
                  ...data.newRestaurant,
                  tradeName: e.target.value,
                },
              })
            }
            className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors['newRestaurant.tradeName']
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
            placeholder="Restaurant Exemple"
          />
          {errors['newRestaurant.tradeName'] && (
            <p className="mt-1 text-xs text-red-600">
              {errors['newRestaurant.tradeName']}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville *
          </label>
          <input
            type="text"
            value={data.newRestaurant.city}
            onChange={e =>
              updateData({
                newRestaurant: {
                  ...data.newRestaurant,
                  city: e.target.value,
                },
              })
            }
            className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors['newRestaurant.city']
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
            placeholder="Paris"
          />
          {errors['newRestaurant.city'] && (
            <p className="mt-1 text-xs text-red-600">
              {errors['newRestaurant.city']}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse
        </label>
        <input
          type="text"
          value={data.newRestaurant.address}
          onChange={e =>
            updateData({
              newRestaurant: {
                ...data.newRestaurant,
                address: e.target.value,
              },
            })
          }
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="123 rue de la Paix"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Code postal
        </label>
        <input
          type="text"
          value={data.newRestaurant.postalCode}
          onChange={e =>
            updateData({
              newRestaurant: {
                ...data.newRestaurant,
                postalCode: e.target.value,
              },
            })
          }
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="75001"
        />
      </div>
    </div>
  );
}

function OpeningStep2({ data, errors, updateData }: StepProps) {
  return (
    <div className="max-w-lg space-y-6">
      {/* Type de restaurant */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de restaurant *
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              updateData({ owner: { ...data.owner, type: 'succursale' } })
            }
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
              data.owner.type === 'succursale'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Restaurant propre
          </button>
          <button
            type="button"
            onClick={() =>
              updateData({ owner: { ...data.owner, type: 'franchise' } })
            }
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
              data.owner.type === 'franchise'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Franchise
          </button>
        </div>
        {errors['owner.type'] && (
          <p className="mt-1 text-xs text-red-600">{errors['owner.type']}</p>
        )}
      </div>

      {/* Contact propriétaire */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du propriétaire *
          </label>
          <input
            type="text"
            value={data.owner.name}
            onChange={e =>
              updateData({ owner: { ...data.owner, name: e.target.value } })
            }
            className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors['owner.name'] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Jean Dupont"
          />
          {errors['owner.name'] && (
            <p className="mt-1 text-xs text-red-600">{errors['owner.name']}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={data.owner.email}
            onChange={e =>
              updateData({ owner: { ...data.owner, email: e.target.value } })
            }
            className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors['owner.email'] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="jean@exemple.com"
          />
          {errors['owner.email'] && (
            <p className="mt-1 text-xs text-red-600">{errors['owner.email']}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Téléphone
        </label>
        <input
          type="tel"
          value={data.owner.phone}
          onChange={e =>
            updateData({ owner: { ...data.owner, phone: e.target.value } })
          }
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="06 12 34 56 78"
        />
      </div>

      {/* Si franchise */}
      {data.owner.type === 'franchise' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Société franchisée</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raison sociale *
              </label>
              <input
                type="text"
                value={data.owner.companyLegalName}
                onChange={e =>
                  updateData({
                    owner: { ...data.owner, companyLegalName: e.target.value },
                  })
                }
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors['owner.companyLegalName']
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              />
              {errors['owner.companyLegalName'] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors['owner.companyLegalName']}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom commercial
              </label>
              <input
                type="text"
                value={data.owner.companyTradeName}
                onChange={e =>
                  updateData({
                    owner: { ...data.owner, companyTradeName: e.target.value },
                  })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SIRET *
            </label>
            <input
              type="text"
              value={data.owner.siret}
              onChange={e =>
                updateData({
                  owner: {
                    ...data.owner,
                    siret: e.target.value.replace(/\D/g, '').slice(0, 14),
                  },
                })
              }
              placeholder="12345678901234"
              maxLength={14}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors['owner.siret'] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors['owner.siret'] && (
              <p className="mt-1 text-xs text-red-600">
                {errors['owner.siret']}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">14 chiffres</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              KBis (URL)
            </label>
            <input
              type="text"
              value={data.owner.kbisUrl || ''}
              onChange={e =>
                updateData({
                  owner: { ...data.owner, kbisUrl: e.target.value || null },
                })
              }
              placeholder="https://..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function OpeningStep3({ data, errors, updateData }: StepProps) {
  return (
    <div className="max-w-lg space-y-6">
      {/* Contact de facturation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact de facturation
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="billingSource"
              checked={data.billing.contactSource === 'owner'}
              onChange={() =>
                updateData({
                  billing: { ...data.billing, contactSource: 'owner' },
                })
              }
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              Même que le propriétaire (Étape 2)
            </span>
          </label>
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="billingSource"
              checked={data.billing.contactSource === 'custom'}
              onChange={() =>
                updateData({
                  billing: { ...data.billing, contactSource: 'custom' },
                })
              }
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">Autre contact</span>
          </label>
        </div>
      </div>

      {/* Si contact personnalisé */}
      {data.billing.contactSource === 'custom' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Contact de facturation</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={data.billing.name}
                onChange={e =>
                  updateData({
                    billing: { ...data.billing, name: e.target.value },
                  })
                }
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors['billing.name'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors['billing.name'] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors['billing.name']}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={data.billing.email}
                onChange={e =>
                  updateData({
                    billing: { ...data.billing, email: e.target.value },
                  })
                }
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors['billing.email'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors['billing.email'] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors['billing.email']}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={data.billing.phone}
              onChange={e =>
                updateData({
                  billing: { ...data.billing, phone: e.target.value },
                })
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Adresse de facturation */}
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-gray-900">Adresse de facturation</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raison sociale
            </label>
            <input
              type="text"
              value={data.billing.companyLegalName}
              onChange={e =>
                updateData({
                  billing: {
                    ...data.billing,
                    companyLegalName: e.target.value,
                  },
                })
              }
              placeholder="Société Example SAS"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SIRET
            </label>
            <input
              type="text"
              value={data.billing.siret}
              onChange={e =>
                updateData({
                  billing: {
                    ...data.billing,
                    siret: e.target.value.replace(/\D/g, '').slice(0, 14),
                  },
                })
              }
              placeholder="12345678901234"
              maxLength={14}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">14 chiffres</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse *
          </label>
          <input
            type="text"
            value={data.billing.address}
            onChange={e =>
              updateData({
                billing: { ...data.billing, address: e.target.value },
              })
            }
            placeholder="123 rue de la Facturation"
            className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors['billing.address'] ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors['billing.address'] && (
            <p className="mt-1 text-xs text-red-600">
              {errors['billing.address']}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code postal *
            </label>
            <input
              type="text"
              value={data.billing.postalCode}
              onChange={e =>
                updateData({
                  billing: { ...data.billing, postalCode: e.target.value },
                })
              }
              placeholder="75001"
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors['billing.postalCode']
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
            />
            {errors['billing.postalCode'] && (
              <p className="mt-1 text-xs text-red-600">
                {errors['billing.postalCode']}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville *
            </label>
            <input
              type="text"
              value={data.billing.city}
              onChange={e =>
                updateData({
                  billing: { ...data.billing, city: e.target.value },
                })
              }
              placeholder="Paris"
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors['billing.city'] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors['billing.city'] && (
              <p className="mt-1 text-xs text-red-600">
                {errors['billing.city']}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optionnel)
        </label>
        <textarea
          value={data.notes}
          onChange={e => updateData({ notes: e.target.value })}
          placeholder="Instructions spéciales, commentaires..."
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

// =====================================================================
// ÉTAPE 4 - VALIDATION PANIER
// =====================================================================

interface Step4Props extends StepProps {
  cart: CartItem[];
  cartTotals: {
    totalHt: number;
    totalTtc: number;
    totalTva: number;
    totalItems: number;
  };
  formatPrice: (price: number) => string;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onOpenConfirmation: () => void;
}

function OpeningStep4({
  data,
  errors,
  cart,
  cartTotals,
  formatPrice,
  onUpdateQuantity,
  onRemoveItem,
  onOpenConfirmation,
}: Step4Props) {
  return (
    <div className="space-y-6">
      {/* Récapitulatif panier */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Récapitulatif de votre commande
        </h3>

        {cart.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
            <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Votre panier est vide</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-medium">Produit</th>
                  <th className="px-4 py-3 text-center font-medium w-32">
                    Quantité
                  </th>
                  <th className="px-4 py-3 text-right font-medium w-28">
                    Prix unit. HT
                  </th>
                  <th className="px-4 py-3 text-right font-medium w-28">
                    Total TTC
                  </th>
                  {onRemoveItem && <th className="px-4 py-3 w-12" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.product_image ? (
                            <Image
                              src={item.product_image}
                              alt={item.product_name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.product_sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {onUpdateQuantity ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            className="p-1.5 rounded-lg border hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="w-8 text-center font-medium text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1.5 rounded-lg border hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center font-medium text-gray-900">
                          {item.quantity}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatPrice(item.selling_price_ht)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatPrice(item.selling_price_ttc * item.quantity)}
                    </td>
                    {onRemoveItem && (
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right text-sm text-gray-500"
                  >
                    Sous-total HT
                  </td>
                  <td
                    colSpan={onRemoveItem ? 3 : 2}
                    className="px-4 py-3 text-right font-medium"
                  >
                    {formatPrice(cartTotals.totalHt)}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-2 text-right text-sm text-gray-500"
                  >
                    TVA
                  </td>
                  <td
                    colSpan={onRemoveItem ? 3 : 2}
                    className="px-4 py-2 text-right font-medium"
                  >
                    {formatPrice(cartTotals.totalTva)}
                  </td>
                </tr>
                <tr className="text-lg">
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right font-semibold text-gray-900"
                  >
                    Total TTC
                  </td>
                  <td
                    colSpan={onRemoveItem ? 3 : 2}
                    className="px-4 py-3 text-right font-bold text-blue-600"
                  >
                    {formatPrice(cartTotals.totalTtc)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Conditions */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="deliveryTerms"
            checked={data.deliveryTermsAccepted}
            className={`h-4 w-4 text-blue-600 rounded mt-0.5 ${
              errors.deliveryTermsAccepted
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
            readOnly
          />
          <label htmlFor="deliveryTerms" className="text-sm text-gray-700">
            J'accepte les{' '}
            <a href="#" className="text-blue-600 hover:underline">
              modalités de livraison
            </a>{' '}
            et confirme que les informations fournies sont exactes. La commande
            sera traitée après validation par l'équipe Verone.
          </label>
        </div>
        {errors.deliveryTermsAccepted && (
          <p className="mt-2 text-xs text-red-600">
            {errors.deliveryTermsAccepted}
          </p>
        )}
      </div>

      {errors.cart && <p className="text-sm text-red-600">{errors.cart}</p>}
      {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

      {/* Info validation */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Validation requise</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Cette commande sera envoyée à l'équipe pour validation avant
            traitement. Vous recevrez un email pour compléter les informations
            de livraison.
          </p>
        </div>
      </div>

      {/* Bouton valider */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={onOpenConfirmation}
          disabled={cart.length === 0}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Check className="h-5 w-5" />
          Valider le panier
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// MODAL DE CONFIRMATION
// =====================================================================

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  data: OrderFormUnifiedData;
  cart: CartItem[];
  cartTotals: {
    totalHt: number;
    totalTtc: number;
    totalTva: number;
    totalItems: number;
  };
  formatPrice: (price: number) => string;
}

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  data,
  cart,
  cartTotals,
  formatPrice,
}: ConfirmationModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Confirmer la commande</h2>
                <p className="text-blue-100 text-sm">
                  Vérifiez les informations avant validation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Restaurant */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Store className="h-4 w-4 text-blue-600" />
              Restaurant
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Nom :</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {data.newRestaurant.tradeName}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Ville :</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {data.newRestaurant.city}
                </span>
              </div>
              {data.newRestaurant.address && (
                <div className="col-span-2">
                  <span className="text-gray-500">Adresse :</span>
                  <span className="ml-2 text-gray-900">
                    {data.newRestaurant.address}
                    {data.newRestaurant.postalCode &&
                      `, ${data.newRestaurant.postalCode}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Propriétaire */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Propriétaire
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Type :</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {data.owner.type === 'franchise'
                    ? 'Franchise'
                    : 'Restaurant propre'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Nom :</span>
                <span className="ml-2 text-gray-900">{data.owner.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Email :</span>
                <span className="ml-2 text-gray-900">{data.owner.email}</span>
              </div>
              {data.owner.phone && (
                <div>
                  <span className="text-gray-500">Tél :</span>
                  <span className="ml-2 text-gray-900">{data.owner.phone}</span>
                </div>
              )}
              {data.owner.type === 'franchise' && (
                <>
                  <div className="col-span-2">
                    <span className="text-gray-500">Société :</span>
                    <span className="ml-2 text-gray-900">
                      {data.owner.companyLegalName}
                    </span>
                  </div>
                  {data.owner.siret && (
                    <div>
                      <span className="text-gray-500">SIRET :</span>
                      <span className="ml-2 text-gray-900 font-mono">
                        {data.owner.siret}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Facturation */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Facturation
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {data.billing.contactSource === 'custom' ? (
                <>
                  <div>
                    <span className="text-gray-500">Contact :</span>
                    <span className="ml-2 text-gray-900">
                      {data.billing.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email :</span>
                    <span className="ml-2 text-gray-900">
                      {data.billing.email}
                    </span>
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <span className="text-gray-500">Contact :</span>
                  <span className="ml-2 text-gray-900">
                    Identique au propriétaire
                  </span>
                </div>
              )}
              {data.billing.address && (
                <div className="col-span-2">
                  <span className="text-gray-500">Adresse :</span>
                  <span className="ml-2 text-gray-900">
                    {data.billing.address}, {data.billing.postalCode}{' '}
                    {data.billing.city}
                  </span>
                </div>
              )}
              {data.billing.companyLegalName && (
                <div>
                  <span className="text-gray-500">Raison sociale :</span>
                  <span className="ml-2 text-gray-900">
                    {data.billing.companyLegalName}
                  </span>
                </div>
              )}
              {data.billing.siret && (
                <div>
                  <span className="text-gray-500">SIRET :</span>
                  <span className="ml-2 text-gray-900 font-mono">
                    {data.billing.siret}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Panier */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              Panier ({cartTotals.totalItems} article
              {cartTotals.totalItems > 1 ? 's' : ''})
            </h3>
            <div className="space-y-2 mb-3">
              {cart.map(item => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm bg-white p-2 rounded"
                >
                  <span className="text-gray-900">
                    {item.product_name}{' '}
                    <span className="text-gray-500">x{item.quantity}</span>
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.selling_price_ttc * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 border-t border-blue-200">
              <span className="font-semibold text-gray-900">Total TTC</span>
              <span className="font-bold text-lg text-blue-600">
                {formatPrice(cartTotals.totalTtc)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{data.notes}</p>
            </div>
          )}

          {/* Conditions */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded mt-0.5"
              />
              <span className="text-sm text-amber-800">
                Je confirme que les informations ci-dessus sont exactes et
                j'accepte les{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  conditions générales de vente
                </a>{' '}
                ainsi que les{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  modalités de livraison
                </a>
                . Je comprends que cette commande nécessite une validation par
                l'équipe Verone.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Retour
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || !termsAccepted}
            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Confirmer la commande
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderFormUnified;
