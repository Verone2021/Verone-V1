'use client';

/**
 * @deprecated Utilisez OrderFormUnified.tsx à la place.
 * Ce composant est remplacé par le formulaire unifié qui intègre
 * la question "Est-ce une ouverture ?" comme première étape.
 *
 * @see @/components/OrderFormUnified.tsx
 * @deprecated 2026-01-11
 */

import { useState } from 'react';

import Image from 'next/image';

import {
  User,
  Building2,
  Store,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  Package,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';

import { useEnseigneOrganisations } from '@/lib/hooks/use-enseigne-organisations';
import { useSubmitEnseigneOrder } from '@/lib/hooks/use-submit-enseigne-order';

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
  quantity: number;
}

export interface EnseigneStepperData {
  // Etape 1 - Demandeur + Restaurant
  requesterType: 'responsable_enseigne' | 'architecte' | 'franchisee';
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  requesterPosition: string;
  isNewRestaurant: boolean;
  existingOrganisationId: string | null;
  newOrganisation: {
    legalName: string;
    tradeName: string;
    address: string;
    postalCode: string;
    city: string;
    siret: string;
  };

  // Etape 2 - Proprietaire (optionnel)
  ownerType: 'succursale' | 'franchise' | null;
  ownerContactSameAsRequester: boolean;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCompanyLegalName: string;
  ownerCompanyTradeName: string;
  ownerKbisUrl: string | null;

  // Etape 3 - Facturation + Livraison
  billingContactSource: 'step1' | 'step2' | 'custom';
  billingName: string;
  billingEmail: string;
  billingPhone: string;
  deliveryTermsAccepted: boolean;
  desiredDeliveryDate: string;
  mallFormRequired: boolean;
  mallFormEmail: string;
}

interface EnseigneStepperProps {
  affiliateId: string;
  selectionId: string;
  cart: CartItem[];
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
}

const INITIAL_DATA: EnseigneStepperData = {
  requesterType: 'responsable_enseigne',
  requesterName: '',
  requesterEmail: '',
  requesterPhone: '',
  requesterPosition: '',
  isNewRestaurant: false,
  existingOrganisationId: null,
  newOrganisation: {
    legalName: '',
    tradeName: '',
    address: '',
    postalCode: '',
    city: '',
    siret: '',
  },
  ownerType: null,
  ownerContactSameAsRequester: false,
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerCompanyLegalName: '',
  ownerCompanyTradeName: '',
  ownerKbisUrl: null,
  billingContactSource: 'step1',
  billingName: '',
  billingEmail: '',
  billingPhone: '',
  deliveryTermsAccepted: false,
  desiredDeliveryDate: '',
  mallFormRequired: false,
  mallFormEmail: '',
};

const STEPS = [
  { id: 1, title: 'Demandeur', icon: User },
  { id: 2, title: 'Proprietaire', icon: Building2 },
  { id: 3, title: 'Facturation', icon: FileText },
];

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function EnseigneStepper({
  affiliateId,
  selectionId,
  cart,
  onClose,
  onSuccess,
  onUpdateQuantity,
  onRemoveItem,
}: EnseigneStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<EnseigneStepperData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hook de soumission
  const { submitOrder, isSubmitting } = useSubmitEnseigneOrder();

  // Hook pour charger les organisations de l'enseigne
  const { data: organisations = [], isLoading: isLoadingOrganisations } =
    useEnseigneOrganisations(affiliateId);

  // Calcul du total
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.selling_price_ttc * item.quantity,
    0
  );

  // Mise a jour des donnees
  const updateData = (updates: Partial<EnseigneStepperData>) => {
    setData(prev => ({ ...prev, ...updates }));
    // Clear related errors
    const keys = Object.keys(updates);
    setErrors(prev => {
      const next = { ...prev };
      keys.forEach(k => delete next[k]);
      return next;
    });
  };

  // Validation etape 1
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.requesterName.trim()) {
      newErrors.requesterName = 'Le nom est requis';
    }
    if (!data.requesterEmail.trim()) {
      newErrors.requesterEmail = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.requesterEmail)) {
      newErrors.requesterEmail = 'Email invalide';
    }

    if (data.isNewRestaurant) {
      if (!data.newOrganisation.tradeName.trim()) {
        newErrors['newOrganisation.tradeName'] = 'Le nom commercial est requis';
      }
      if (!data.newOrganisation.city.trim()) {
        newErrors['newOrganisation.city'] = 'La ville est requise';
      }
    } else {
      if (!data.existingOrganisationId) {
        newErrors.existingOrganisationId =
          'Veuillez selectionner un restaurant';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation etape 3
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.deliveryTermsAccepted) {
      newErrors.deliveryTermsAccepted =
        'Vous devez accepter les modalites de livraison';
    }

    if (data.billingContactSource === 'custom') {
      if (!data.billingName.trim()) {
        newErrors.billingName = 'Le nom de facturation est requis';
      }
      if (!data.billingEmail.trim()) {
        newErrors.billingEmail = "L'email de facturation est requis";
      }
    }

    if (data.mallFormRequired && !data.mallFormEmail.trim()) {
      newErrors.mallFormEmail = "L'email du centre commercial est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 3) {
      if (!validateStep3()) return;
      void handleSubmit().catch(error => {
        console.error('[EnseigneStepper] Submit failed:', error);
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Soumission
  const handleSubmit = async () => {
    const result = await submitOrder({
      affiliateId,
      selectionId,
      cart,
      data,
    });

    if (result.success && result.orderNumber) {
      onSuccess(result.orderNumber);
    } else {
      setErrors({ submit: result.error || 'Erreur lors de la soumission' });
    }
  };

  // Format prix
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);

  // Calculs des totaux
  const totalHT = cart.reduce(
    (sum, item) => sum + item.selling_price_ht * item.quantity,
    0
  );
  const totalTVA = cartTotal - totalHT;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-full bg-white">
      {/* LEFT: Order Summary (50% - Desktop only) */}
      <div className="hidden md:flex w-1/2 bg-gray-50 border-r flex-col">
        {/* Header compact */}
        <div className="flex-shrink-0 px-4 py-3 border-b bg-white flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Récapitulatif</h3>
            <p className="text-xs text-gray-500">
              {totalItems} article{totalItems > 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total TTC</p>
            <p className="font-bold text-gray-900">{formatPrice(cartTotal)}</p>
          </div>
        </div>

        {/* Product list - compact table style */}
        <div className="flex-1 overflow-y-auto">
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
                          title="Diminuer la quantité"
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
                          title="Augmenter la quantité"
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
                        title="Supprimer l'article"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total section - compact */}
        <div className="flex-shrink-0 px-4 py-3 border-t bg-white">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>HT: {formatPrice(totalHT)}</span>
            <span>TVA: {formatPrice(totalTVA)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900">
            <span>Total TTC</span>
            <span className="text-lg">{formatPrice(cartTotal)}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Form (50%) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header compact */}
        <div className="flex-shrink-0 border-b bg-white px-4 py-3">
          {/* Titre + fermer + progress sur une ligne */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-900">
                {currentStep}. {STEPS[currentStep - 1].title}
              </h2>
              <span className="text-xs text-gray-400">
                ({currentStep}/{STEPS.length})
              </span>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1">
              {STEPS.map(step => {
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

            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenu de l'etape */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentStep === 1 && (
            <Step1Demandeur
              data={data}
              errors={errors}
              updateData={updateData}
              affiliateId={affiliateId}
              organisations={organisations}
              isLoadingOrganisations={isLoadingOrganisations}
            />
          )}
          {currentStep === 2 && (
            <Step2Proprietaire data={data} updateData={updateData} />
          )}
          {currentStep === 3 && (
            <Step3Facturation
              data={data}
              errors={errors}
              updateData={updateData}
            />
          )}
        </div>

        {/* Footer compact */}
        <div className="flex-shrink-0 border-t bg-gray-50 px-4 py-3">
          {errors.submit && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {errors.submit}
            </div>
          )}

          {/* Mobile only: show cart summary */}
          <div className="md:hidden flex items-center justify-between mb-3 pb-3 border-b border-gray-200 text-sm">
            <span className="text-gray-600">
              {totalItems} art. | HT: {formatPrice(totalHT)}
            </span>
            <span className="font-bold text-gray-900">
              TTC: {formatPrice(cartTotal)}
            </span>
          </div>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 border border-gray-300 rounded font-medium text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex-1 py-2 px-3 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : currentStep === 3 ? (
                'Confirmer'
              ) : (
                <>
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// ETAPE 1 - DEMANDEUR + RESTAURANT
// =====================================================================

interface Step1Props {
  data: EnseigneStepperData;
  errors: Record<string, string>;
  updateData: (updates: Partial<EnseigneStepperData>) => void;
  affiliateId: string;
  organisations: Array<{
    id: string;
    legal_name: string;
    trade_name: string | null;
    city: string | null;
  }>;
  isLoadingOrganisations: boolean;
}

function Step1Demandeur({
  data,
  errors,
  updateData,
  organisations,
  isLoadingOrganisations,
}: Step1Props) {
  return (
    <div className="space-y-6">
      {/* Type de demandeur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vous etes
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'responsable_enseigne', label: 'Responsable enseigne' },
            { value: 'architecte', label: 'Architecte' },
            { value: 'franchisee', label: 'Franchise' },
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                updateData({
                  requesterType:
                    option.value as EnseigneStepperData['requesterType'],
                })
              }
              className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
                data.requesterType === option.value
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coordonnees demandeur */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet *
          </label>
          <input
            type="text"
            value={data.requesterName}
            onChange={e => updateData({ requesterName: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.requesterName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Jean Dupont"
          />
          {errors.requesterName && (
            <p className="mt-1 text-xs text-red-600">{errors.requesterName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Poste
          </label>
          <input
            type="text"
            value={data.requesterPosition}
            onChange={e => updateData({ requesterPosition: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Directeur regional"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={data.requesterEmail}
            onChange={e => updateData({ requesterEmail: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.requesterEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="jean@entreprise.com"
          />
          {errors.requesterEmail && (
            <p className="mt-1 text-xs text-red-600">{errors.requesterEmail}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telephone
          </label>
          <input
            type="tel"
            value={data.requesterPhone}
            onChange={e => updateData({ requesterPhone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="06 12 34 56 78"
          />
        </div>
      </div>

      {/* Type de restaurant */}
      <div className="pt-4 border-t">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Restaurant
        </label>
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => updateData({ isNewRestaurant: false })}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors flex items-center gap-2 ${
              !data.isNewRestaurant
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Store className="h-5 w-5" />
            Restaurant existant
          </button>
          <button
            type="button"
            onClick={() => updateData({ isNewRestaurant: true })}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors flex items-center gap-2 ${
              data.isNewRestaurant
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Building2 className="h-5 w-5" />
            Nouveau restaurant
          </button>
        </div>

        {data.isNewRestaurant ? (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Un nouveau restaurant necessite une validation prealable.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom commercial *
                </label>
                <input
                  type="text"
                  value={data.newOrganisation.tradeName}
                  onChange={e =>
                    updateData({
                      newOrganisation: {
                        ...data.newOrganisation,
                        tradeName: e.target.value,
                      },
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors['newOrganisation.tradeName']
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Restaurant Exemple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville *
                </label>
                <input
                  type="text"
                  value={data.newOrganisation.city}
                  onChange={e =>
                    updateData({
                      newOrganisation: {
                        ...data.newOrganisation,
                        city: e.target.value,
                      },
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors['newOrganisation.city']
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Paris"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={data.newOrganisation.address}
                onChange={e =>
                  updateData({
                    newOrganisation: {
                      ...data.newOrganisation,
                      address: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="123 rue de la Paix"
              />
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selectionner un restaurant
            </label>
            {isLoadingOrganisations ? (
              <div className="flex items-center gap-2 py-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Chargement des restaurants...</span>
              </div>
            ) : organisations.length === 0 ? (
              <p className="text-sm text-amber-600 py-2">
                Aucun restaurant disponible. Veuillez creer un nouveau
                restaurant.
              </p>
            ) : (
              <select
                value={data.existingOrganisationId || ''}
                onChange={e =>
                  updateData({ existingOrganisationId: e.target.value || null })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
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
        )}
      </div>
    </div>
  );
}

// =====================================================================
// ETAPE 2 - PROPRIETAIRE (OPTIONNEL)
// =====================================================================

interface Step2Props {
  data: EnseigneStepperData;
  updateData: (updates: Partial<EnseigneStepperData>) => void;
}

function Step2Proprietaire({ data, updateData }: Step2Props) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Optionnel</strong> - Ces informations peuvent etre completees
          ulterieurement. Elles sont requises pour la validation finale de la
          commande.
        </p>
      </div>

      {/* Type de proprietaire */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de restaurant
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateData({ ownerType: 'succursale' })}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
              data.ownerType === 'succursale'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Restaurant propre
          </button>
          <button
            type="button"
            onClick={() => updateData({ ownerType: 'franchise' })}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
              data.ownerType === 'franchise'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Franchise
          </button>
        </div>
      </div>

      {data.ownerType && (
        <>
          {/* Contact proprietaire */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sameAsRequester"
                checked={data.ownerContactSameAsRequester}
                onChange={e =>
                  updateData({ ownerContactSameAsRequester: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label
                htmlFor="sameAsRequester"
                className="text-sm text-gray-700"
              >
                Meme contact que le demandeur
              </label>
            </div>

            {!data.ownerContactSameAsRequester && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du responsable
                  </label>
                  <input
                    type="text"
                    value={data.ownerName}
                    onChange={e => updateData({ ownerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={data.ownerEmail}
                    onChange={e => updateData({ ownerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telephone
                  </label>
                  <input
                    type="tel"
                    value={data.ownerPhone}
                    onChange={e => updateData({ ownerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Si franchise, infos societe */}
          {data.ownerType === 'franchise' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Societe franchisee</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raison sociale
                  </label>
                  <input
                    type="text"
                    value={data.ownerCompanyLegalName}
                    onChange={e =>
                      updateData({ ownerCompanyLegalName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom commercial
                  </label>
                  <input
                    type="text"
                    value={data.ownerCompanyTradeName}
                    onChange={e =>
                      updateData({ ownerCompanyTradeName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  KBis (URL ou upload)
                </label>
                <input
                  type="text"
                  value={data.ownerKbisUrl || ''}
                  onChange={e =>
                    updateData({ ownerKbisUrl: e.target.value || null })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Collez un lien vers le document ou uploadez-le
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =====================================================================
// ETAPE 3 - FACTURATION + LIVRAISON
// =====================================================================

interface Step3Props {
  data: EnseigneStepperData;
  errors: Record<string, string>;
  updateData: (updates: Partial<EnseigneStepperData>) => void;
}

function Step3Facturation({ data, errors, updateData }: Step3Props) {
  return (
    <div className="space-y-6">
      {/* Source du contact facturation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact de facturation
        </label>
        <div className="space-y-2">
          {[
            { value: 'step1', label: 'Meme que le demandeur (Etape 1)' },
            { value: 'step2', label: 'Meme que le proprietaire (Etape 2)' },
            { value: 'custom', label: 'Autre contact' },
          ].map(option => (
            <label
              key={option.value}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name="billingSource"
                value={option.value}
                checked={data.billingContactSource === option.value}
                onChange={() =>
                  updateData({
                    billingContactSource:
                      option.value as EnseigneStepperData['billingContactSource'],
                  })
                }
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Si contact personnalise */}
      {data.billingContactSource === 'custom' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={data.billingName}
                onChange={e => updateData({ billingName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.billingName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={data.billingEmail}
                onChange={e => updateData({ billingEmail: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.billingEmail ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telephone
            </label>
            <input
              type="tel"
              value={data.billingPhone}
              onChange={e => updateData({ billingPhone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Date souhaitee */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date de livraison souhaitee (indicative)
        </label>
        <input
          type="date"
          value={data.desiredDeliveryDate}
          onChange={e => updateData({ desiredDeliveryDate: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Centre commercial */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="mallForm"
            checked={data.mallFormRequired}
            onChange={e => updateData({ mallFormRequired: e.target.checked })}
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
          <label htmlFor="mallForm" className="text-sm text-gray-700">
            Formulaire centre commercial requis
          </label>
        </div>
        {data.mallFormRequired && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email du centre commercial *
            </label>
            <input
              type="email"
              value={data.mallFormEmail}
              onChange={e => updateData({ mallFormEmail: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.mallFormEmail ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="logistique@centre-commercial.fr"
            />
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
            onChange={e =>
              updateData({ deliveryTermsAccepted: e.target.checked })
            }
            className={`h-4 w-4 text-blue-600 rounded mt-0.5 ${
              errors.deliveryTermsAccepted
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          />
          <label htmlFor="deliveryTerms" className="text-sm text-gray-700">
            J'accepte les{' '}
            <a href="#" className="text-blue-600 hover:underline">
              modalites de livraison
            </a>{' '}
            et confirme que les informations fournies sont exactes. La commande
            sera traitee apres validation par l'equipe Verone.
          </label>
        </div>
        {errors.deliveryTermsAccepted && (
          <p className="mt-2 text-xs text-red-600">
            {errors.deliveryTermsAccepted}
          </p>
        )}
      </div>
    </div>
  );
}

export default EnseigneStepper;
