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

import { useState, useMemo, useCallback, useEffect } from 'react';

import Image from 'next/image';

import {
  AddressAutocomplete,
  type AddressResult,
  Card,
  CardContent,
  Badge,
  RadioGroup,
  RadioGroupItem,
  Label,
  Separator,
  Input,
  Checkbox,
  Textarea,
  cn,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
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
  UserCircle,
  FileText,
  Truck,
  AlertCircle,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useEnseigneIdFromAffiliate } from '../lib/hooks/use-enseigne-id-from-affiliate';
import { useEnseigneOrganisations } from '../lib/hooks/use-enseigne-organisations';
import { useEnseigneParentOrganisation } from '../lib/hooks/use-enseigne-parent-organisation';
import { useOrganisationContacts } from '../lib/hooks/use-organisation-contacts';

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
  // QUESTION INITIALE - Obligatoire
  isNewRestaurant: boolean | null;

  // ========================================
  // ÉTAPE 1 : DEMANDEUR
  // ========================================
  requester: {
    name: string;
    email: string;
    phone: string;
    position: string; // Rôle/Fonction
    notes: string; // Notes optionnelles
  };

  // ========================================
  // ÉTAPE 2 : RESTAURANT
  // ========================================
  // Si restaurant existant
  existingOrganisationId: string | null;

  // Si nouveau restaurant
  newRestaurant: {
    ownershipType: 'succursale' | 'franchise' | null; // DÉPLACÉ ICI (était en étape 3)
    tradeName: string;
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    optionalContactName: string; // Contact responsable optionnel (créé automatiquement)
  };

  // ========================================
  // ÉTAPE 3 : RESPONSABLE (ex "Responsable")
  // ========================================
  // Sélection contact existant (si restaurant existant)
  existingContact: {
    selectedContactId: string | null; // ID du contact sélectionné OU 'new'
    isNewContact: boolean; // true si on crée un nouveau contact
  };

  // Contact responsable (nouveau ou data à créer)
  responsable: {
    type: 'succursale' | 'franchise' | null; // Redondant avec newRestaurant.ownershipType mais gardé pour compatibilité code
    name: string;
    email: string;
    phone: string;
    // Si franchisé uniquement
    companyLegalName: string;
    companyTradeName: string;
    siret: string;
    kbisFile: File | null; // Upload KBis
    kbisUrl: string | null; // URL KBis (legacy)
  };

  // ========================================
  // ÉTAPE 4 : FACTURATION
  // ========================================
  billing: {
    useParentOrganisation: boolean; // NOUVEAU : utiliser organisation mère (propre uniquement)
    contactSource: 'responsable' | 'custom'; // Renommé de 'owner'
    // Si custom
    name: string;
    email: string;
    phone: string; // OPTIONNEL pour facturation
    // Adresse facturation
    companyLegalName: string;
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    siret: string;
  };

  // ========================================
  // ÉTAPE 5 : LIVRAISON (NOUVEAU)
  // ========================================
  delivery: {
    useResponsableContact: boolean; // Contact livraison = responsable
    // Si non coché
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    // Adresse
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    deliveryDate: string; // Format ISO
    // Centre commercial
    isMallDelivery: boolean;
    mallEmail: string;
    accessFormRequired: boolean;
    accessFormUrl: string | null; // URL Supabase Storage
    // Semi-remorque
    semiTrailerAccessible: boolean;
    // Notes
    notes: string;
  };

  // ========================================
  // ÉTAPE 6 : VALIDATION
  // ========================================
  deliveryTermsAccepted: boolean;
  finalNotes: string; // Renommé de 'notes'
}

interface Organisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  city: string | null;
}

// Interface pour le cache localStorage des utilisateurs publics
interface RequesterCache {
  name: string;
  email: string;
  phone: string;
  expiresAt: number; // Timestamp d'expiration (7 jours)
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

// Clé pour le cache localStorage des utilisateurs publics (TTL 7 jours)
const REQUESTER_CACHE_KEY = 'linkme_requester_cache';
const CACHE_TTL_DAYS = 7;

const INITIAL_DATA: OrderFormUnifiedData = {
  isNewRestaurant: null,

  // Étape 1 : Demandeur
  requester: {
    name: '',
    email: '',
    phone: '',
    position: '',
    notes: '',
  },

  // Étape 2 : Restaurant
  existingOrganisationId: null,
  newRestaurant: {
    ownershipType: null,
    tradeName: '',
    address: '',
    postalCode: '',
    city: '',
    latitude: null,
    longitude: null,
    optionalContactName: '',
  },

  // Étape 3 : Responsable
  existingContact: {
    selectedContactId: null,
    isNewContact: false,
  },
  responsable: {
    type: null,
    name: '',
    email: '',
    phone: '',
    companyLegalName: '',
    companyTradeName: '',
    siret: '',
    kbisFile: null,
    kbisUrl: null,
  },

  // Étape 4 : Facturation
  billing: {
    useParentOrganisation: true, // Pré-coché par défaut si propre
    contactSource: 'responsable',
    name: '',
    email: '',
    phone: '',
    companyLegalName: '',
    address: '',
    postalCode: '',
    city: '',
    latitude: null,
    longitude: null,
    siret: '',
  },

  // Étape 5 : Livraison
  delivery: {
    useResponsableContact: true, // Pré-coché par défaut
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    postalCode: '',
    city: '',
    latitude: null,
    longitude: null,
    deliveryDate: '',
    isMallDelivery: false,
    mallEmail: '',
    accessFormRequired: false,
    accessFormUrl: null,
    semiTrailerAccessible: true,
    notes: '',
  },

  // Étape 6 : Validation
  deliveryTermsAccepted: false,
  finalNotes: '',
};

const OPENING_STEPS = [
  { id: 1, title: 'Demandeur', icon: User },
  { id: 2, title: 'Restaurant', icon: Store },
  { id: 3, title: 'Responsable', icon: UserCircle },
  { id: 4, title: 'Facturation', icon: FileText },
  { id: 5, title: 'Livraison', icon: Truck },
  { id: 6, title: 'Validation', icon: ShoppingCart },
];

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function OrderFormUnified({
  affiliateId,
  selectionId: _selectionId,
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

  // Hook pour charger les contacts de l'organisation sélectionnée
  const { data: organisationContacts } = useOrganisationContacts(
    data.existingOrganisationId
  );

  // Pré-remplir quand organisation existante sélectionnée
  useEffect(() => {
    if (data.existingOrganisationId && organisationContacts?.primaryContact) {
      const primary = organisationContacts.primaryContact;

      setData(prev => ({
        ...prev,
        responsable: {
          ...prev.responsable,
          name: `${primary.firstName} ${primary.lastName}`,
          email: primary.email ?? '',
          phone: primary.phone ?? primary.mobile ?? '',
        },
        billing: {
          ...prev.billing,
          contactSource: 'responsable',
          name: `${primary.firstName} ${primary.lastName}`,
          email: primary.email ?? '',
          phone: primary.phone ?? primary.mobile ?? '',
        },
      }));
    }
  }, [data.existingOrganisationId, organisationContacts]);

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
      // Restaurant existant : doit avoir sélectionné un contact OU rempli formulaire nouveau
      if (
        !data.existingContact.selectedContactId ||
        data.existingContact.selectedContactId === ''
      ) {
        newErrors['existingContact.selectedContactId'] =
          'Veuillez sélectionner un contact';
      }
      // Si "nouveau" sélectionné, valider le formulaire
      if (data.existingContact.isNewContact) {
        if (!data.responsable.name.trim()) {
          newErrors['responsable.name'] = 'Le nom est requis';
        }
        if (!data.responsable.email.trim()) {
          newErrors['responsable.email'] = "L'email est requis";
        }
        if (!data.responsable.phone.trim()) {
          newErrors['responsable.phone'] = 'Le téléphone est requis';
        }
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

      // Si franchise : valider société
      if (
        data.newRestaurant.ownershipType === 'franchise' &&
        !data.responsable.companyLegalName.trim()
      ) {
        newErrors['responsable.companyLegalName'] =
          'La raison sociale est requise';
      }
      if (
        data.newRestaurant.ownershipType === 'franchise' &&
        !data.responsable.siret.trim()
      ) {
        newErrors['responsable.siret'] = 'Le SIRET est requis';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    data.isNewRestaurant,
    data.existingContact,
    data.responsable,
    data.newRestaurant.ownershipType,
  ]);

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
    if (!data.delivery.deliveryDate) {
      newErrors['delivery.deliveryDate'] = 'La date de livraison est requise';
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
    if (data.isNewRestaurant) {
      // Validation de chaque étape avant de passer à la suivante
      if (currentStep === 1 && !validateStep1()) return;
      if (currentStep === 2 && !validateStep2()) return;
      if (currentStep === 3 && !validateStep3()) return;
      if (currentStep === 4 && !validateStep4()) return;
      if (currentStep === 5 && !validateStep5()) return;
      // Step 6 : le bouton "Valider la commande" gère la confirmation
      if (currentStep === 6) return;

      // Passer à l'étape suivante (max 6)
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  }, [
    currentStep,
    data.isNewRestaurant,
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
                    value={data.existingOrganisationId ?? ''}
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
                        {org.trade_name ?? org.legal_name}
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
                  value={data.finalNotes}
                  onChange={e => updateData({ finalNotes: e.target.value })}
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
            onNext={() => void handleSubmitExisting()}
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
        </div>

        {/* Footer - masqué en step 6 car le bouton est dans OpeningStep6Validation */}
        {currentStep < 6 && (
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
        onConfirm={() => void handleConfirmOrder()}
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
  affiliateId: string;
}

/**
 * ÉTAPE 1 : DEMANDEUR
 * Collecte les informations de la personne qui passe la commande
 */
function OpeningStep1Requester({ data, errors, updateData }: StepProps) {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Personne qui passe la commande
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Vos coordonnées en tant que demandeur
        </p>
      </div>

      {/* Nom complet */}
      <div>
        <label
          htmlFor="requesterName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nom complet <span className="text-red-500">*</span>
        </label>
        <input
          id="requesterName"
          type="text"
          value={data.requester.name}
          onChange={e =>
            updateData({
              requester: { ...data.requester, name: e.target.value },
            })
          }
          placeholder="Jean Dupont"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors['requester.name'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['requester.name']}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="requesterEmail"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="requesterEmail"
          type="email"
          value={data.requester.email}
          onChange={e =>
            updateData({
              requester: { ...data.requester, email: e.target.value },
            })
          }
          placeholder="jean.dupont@pokawa.fr"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors['requester.email'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['requester.email']}
          </p>
        )}
      </div>

      {/* Téléphone */}
      <div>
        <label
          htmlFor="requesterPhone"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Téléphone <span className="text-red-500">*</span>
        </label>
        <input
          id="requesterPhone"
          type="tel"
          value={data.requester.phone}
          onChange={e =>
            updateData({
              requester: { ...data.requester, phone: e.target.value },
            })
          }
          placeholder="06 12 34 56 78"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors['requester.phone'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['requester.phone']}
          </p>
        )}
      </div>

      {/* Rôle/Fonction */}
      <div>
        <label
          htmlFor="requesterPosition"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Rôle/Fonction
        </label>
        <input
          id="requesterPosition"
          type="text"
          value={data.requester.position}
          onChange={e =>
            updateData({
              requester: { ...data.requester, position: e.target.value },
            })
          }
          placeholder="Directeur régional"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="requesterNotes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notes (optionnel)
        </label>
        <textarea
          id="requesterNotes"
          value={data.requester.notes}
          onChange={e =>
            updateData({
              requester: { ...data.requester, notes: e.target.value },
            })
          }
          placeholder="Ex: Architecte pour le projet de rénovation..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Informations complémentaires pertinentes
        </p>
      </div>
    </div>
  );
}

/**
 * ÉTAPE 2 : RESTAURANT
 * Sélection restaurant existant OU création nouveau restaurant
 */
function OpeningStep2Restaurant({
  data,
  errors,
  updateData,
  affiliateId,
}: StepProps) {
  const { data: organisations } = useEnseigneOrganisations(affiliateId);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer organisations par recherche
  const filteredOrgs = organisations?.filter(
    org =>
      (org.trade_name?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false) ||
      (org.legal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false) ||
      (org.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  if (data.isNewRestaurant === false) {
    // ========================================
    // RESTAURANT EXISTANT : Recherche + Cartes
    // ========================================
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Sélection du restaurant
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Recherchez et sélectionnez le restaurant concerné
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Rechercher par nom, ville..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste cartes restaurants */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredOrgs?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Store className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun restaurant trouvé</p>
            </div>
          ) : (
            filteredOrgs?.map(org => (
              <Card
                key={org.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  data.existingOrganisationId === org.id &&
                    'ring-2 ring-blue-500 bg-blue-50'
                )}
                onClick={() => updateData({ existingOrganisationId: org.id })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {org.trade_name ?? org.legal_name}
                        </h4>
                        {org.ownership_type && (
                          <Badge
                            variant={
                              org.ownership_type === 'succursale'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {org.ownership_type === 'succursale'
                              ? 'Propre'
                              : 'Franchisé'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {org.shipping_address_line1 ?? 'Adresse non renseignée'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {org.postal_code} {org.city}
                      </p>
                    </div>
                    {data.existingOrganisationId === org.id && (
                      <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {errors['existingOrganisationId'] && (
          <p className="text-sm text-red-600">
            {errors['existingOrganisationId']}
          </p>
        )}
      </div>
    );
  }

  // ========================================
  // NOUVEAU RESTAURANT : Formulaire complet
  // ========================================
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Informations du restaurant
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Création d'un nouveau restaurant
        </p>
      </div>

      {/* Type de restaurant - DÉPLACÉ ICI (étape 2 au lieu de 3) */}
      <div>
        <Label>
          Type de restaurant <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={data.newRestaurant.ownershipType ?? ''}
          onValueChange={(value: 'succursale' | 'franchise') =>
            updateData({
              newRestaurant: {
                ...data.newRestaurant,
                ownershipType: value,
              },
            })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="succursale" id="type-propre" />
            <Label htmlFor="type-propre" className="cursor-pointer font-normal">
              Restaurant propre (succursale)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="franchise" id="type-franchise" />
            <Label
              htmlFor="type-franchise"
              className="cursor-pointer font-normal"
            >
              Restaurant franchisé
            </Label>
          </div>
        </RadioGroup>
        {errors['newRestaurant.ownershipType'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['newRestaurant.ownershipType']}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Cette information détermine les champs requis aux étapes suivantes
        </p>
      </div>

      <Separator />

      {/* Nom commercial */}
      <div>
        <Label htmlFor="tradeName">
          Nom commercial <span className="text-red-500">*</span>
        </Label>
        <Input
          id="tradeName"
          value={data.newRestaurant.tradeName}
          onChange={e =>
            updateData({
              newRestaurant: {
                ...data.newRestaurant,
                tradeName: e.target.value,
              },
            })
          }
          placeholder="Pokawa Paris Rivoli"
        />
        {errors['newRestaurant.tradeName'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['newRestaurant.tradeName']}
          </p>
        )}
      </div>

      {/* Adresse autocomplete */}
      <div>
        <Label>
          Adresse du restaurant <span className="text-red-500">*</span>
        </Label>
        <AddressAutocomplete
          value={
            data.newRestaurant.address
              ? `${data.newRestaurant.address}, ${data.newRestaurant.postalCode} ${data.newRestaurant.city}`
              : ''
          }
          onSelect={(address: AddressResult) =>
            updateData({
              newRestaurant: {
                ...data.newRestaurant,
                address: address.streetAddress,
                postalCode: address.postalCode,
                city: address.city,
                latitude: address.latitude,
                longitude: address.longitude,
              },
            })
          }
          placeholder="123 Rue de Rivoli, 75001 Paris"
        />
        {errors['newRestaurant.address'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['newRestaurant.address']}
          </p>
        )}
      </div>

      <Separator />

      {/* Contact responsable optionnel */}
      <div>
        <h4 className="font-medium text-sm mb-3">
          Contact responsable (optionnel)
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Vous pouvez ajouter dès maintenant un contact responsable. Sinon, vous
          pourrez le faire à l'étape suivante.
        </p>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="optionalContactName">Nom complet</Label>
            <Input
              id="optionalContactName"
              value={data.newRestaurant.optionalContactName}
              onChange={e =>
                updateData({
                  newRestaurant: {
                    ...data.newRestaurant,
                    optionalContactName: e.target.value,
                  },
                })
              }
              placeholder="Sophie Martin"
            />
          </div>

          <p className="text-xs text-gray-400">
            Ce contact sera automatiquement créé et associé au restaurant
          </p>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// SOUS-COMPOSANTS STEP 3
// =====================================================================

interface ResponsableContactFormProps {
  data: OrderFormUnifiedData;
  errors: Record<string, string>;
  updateData: (updates: Partial<OrderFormUnifiedData>) => void;
}

function ResponsableContactForm({
  data,
  errors,
  updateData,
}: ResponsableContactFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="responsableName">
          Nom complet <span className="text-red-500">*</span>
        </Label>
        <Input
          id="responsableName"
          value={data.responsable.name}
          onChange={e =>
            updateData({
              responsable: { ...data.responsable, name: e.target.value },
            })
          }
          placeholder="Sophie Martin"
        />
        {errors['responsable.name'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['responsable.name']}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="responsableEmail">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="responsableEmail"
          type="email"
          value={data.responsable.email}
          onChange={e =>
            updateData({
              responsable: { ...data.responsable, email: e.target.value },
            })
          }
          placeholder="sophie.martin@restaurant.fr"
        />
        {errors['responsable.email'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['responsable.email']}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="responsablePhone">
          Téléphone <span className="text-red-500">*</span>
        </Label>
        <Input
          id="responsablePhone"
          type="tel"
          value={data.responsable.phone}
          onChange={e =>
            updateData({
              responsable: { ...data.responsable, phone: e.target.value },
            })
          }
          placeholder="06 12 34 56 78"
        />
        {errors['responsable.phone'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['responsable.phone']}
          </p>
        )}
      </div>
    </div>
  );
}

interface CompanyFieldsProps {
  data: OrderFormUnifiedData;
  errors: Record<string, string>;
  updateData: (updates: Partial<OrderFormUnifiedData>) => void;
}

function CompanyFields({ data, errors, updateData }: CompanyFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="companyLegalName">
          Raison sociale <span className="text-red-500">*</span>
        </Label>
        <Input
          id="companyLegalName"
          value={data.responsable.companyLegalName}
          onChange={e =>
            updateData({
              responsable: {
                ...data.responsable,
                companyLegalName: e.target.value,
              },
            })
          }
          placeholder="SARL Restaurant Martin"
        />
        {errors['responsable.companyLegalName'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['responsable.companyLegalName']}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="companyTradeName">Nom commercial (optionnel)</Label>
        <Input
          id="companyTradeName"
          value={data.responsable.companyTradeName}
          onChange={e =>
            updateData({
              responsable: {
                ...data.responsable,
                companyTradeName: e.target.value,
              },
            })
          }
          placeholder="Chez Sophie"
        />
      </div>

      <div>
        <Label htmlFor="siret">
          SIRET <span className="text-red-500">*</span>
        </Label>
        <Input
          id="siret"
          value={data.responsable.siret}
          onChange={e =>
            updateData({
              responsable: { ...data.responsable, siret: e.target.value },
            })
          }
          placeholder="123 456 789 00012"
          maxLength={17}
        />
        {errors['responsable.siret'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['responsable.siret']}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          14 chiffres (espaces autorisés)
        </p>
      </div>

      <div>
        <Label htmlFor="kbisFile">Extrait K-BIS (optionnel)</Label>
        <Input
          id="kbisFile"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={e => {
            const file = e.target.files?.[0] ?? null;
            updateData({
              responsable: { ...data.responsable, kbisFile: file },
            });
          }}
        />
        <p className="text-xs text-gray-500 mt-1">PDF, JPG ou PNG - Max 5 MB</p>
      </div>
    </div>
  );
}

// =====================================================================
// STEP 3 : RESPONSABLE
// =====================================================================

function OpeningStep3Responsable({ data, errors, updateData }: StepProps) {
  const { data: contacts } = useOrganisationContacts(
    data.existingOrganisationId
  );

  const isExisting = data.isNewRestaurant === false;
  const isFranchise = data.newRestaurant.ownershipType === 'franchise';

  // ========================================
  // RESTAURANT EXISTANT : Sélection contact OU nouveau
  // ========================================
  if (isExisting) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h3 className="text-lg font-medium">Responsable du restaurant</h3>
          <p className="text-sm text-gray-500 mt-1">
            Sélectionnez un contact existant ou créez-en un nouveau
          </p>
        </div>

        {contacts?.allContacts && contacts.allContacts.length > 0 ? (
          <>
            <RadioGroup
              value={data.existingContact.selectedContactId ?? ''}
              onValueChange={value =>
                updateData({
                  existingContact: {
                    ...data.existingContact,
                    selectedContactId: value,
                    isNewContact: value === 'new',
                  },
                })
              }
            >
              {/* Contacts existants */}
              {contacts.allContacts.map(contact => (
                <Card
                  key={contact.id}
                  className={cn(
                    'cursor-pointer transition-all',
                    data.existingContact.selectedContactId === contact.id &&
                      'ring-2 ring-blue-500 bg-blue-50'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value={contact.id}
                        id={`contact-${contact.id}`}
                      />
                      <Label
                        htmlFor={`contact-${contact.id}`}
                        className="cursor-pointer flex-1"
                      >
                        <div>
                          <p className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {contact.email}
                          </p>
                          {contact.phone && (
                            <p className="text-sm text-gray-500">
                              {contact.phone}
                            </p>
                          )}
                          {contact.isPrimaryContact && (
                            <Badge variant="outline" className="mt-2">
                              Contact principal
                            </Badge>
                          )}
                        </div>
                      </Label>
                      {data.existingContact.selectedContactId ===
                        contact.id && (
                        <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Option : Nouveau contact */}
              <Card
                className={cn(
                  'cursor-pointer transition-all border-dashed',
                  data.existingContact.selectedContactId === 'new' &&
                    'ring-2 ring-blue-500 bg-blue-50'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="new" id="contact-new" />
                    <Label
                      htmlFor="contact-new"
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter un nouveau contact</span>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>

            {/* Si "nouveau" sélectionné, afficher formulaire */}
            {data.existingContact.selectedContactId === 'new' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg mt-4">
                <h4 className="font-medium text-gray-900">Nouveau contact</h4>
                <ResponsableContactForm
                  data={data}
                  errors={errors}
                  updateData={updateData}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Aucun contact enregistré
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Veuillez ajouter un contact pour ce restaurant.
                </p>
              </div>
            </div>
            <ResponsableContactForm
              data={data}
              errors={errors}
              updateData={updateData}
            />
          </>
        )}

        {errors['existingContact.selectedContactId'] && (
          <p className="text-sm text-red-600">
            {errors['existingContact.selectedContactId']}
          </p>
        )}
      </div>
    );
  }

  // ========================================
  // RESTAURANT NOUVEAU : Formulaire direct
  // ========================================
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-lg font-medium">Responsable du restaurant</h3>
        <p className="text-sm text-gray-500 mt-1">
          Coordonnées du responsable du restaurant
        </p>
      </div>

      <ResponsableContactForm
        data={data}
        errors={errors}
        updateData={updateData}
      />

      {/* Si franchise : champs société */}
      {isFranchise && (
        <>
          <Separator />
          <div>
            <h4 className="font-medium mb-4">Informations de la société</h4>
            <CompanyFields
              data={data}
              errors={errors}
              updateData={updateData}
            />
          </div>
        </>
      )}
    </div>
  );
}

// =====================================================================
// STEP 5 : LIVRAISON
// =====================================================================

function OpeningStep5Delivery({ data, errors, updateData }: StepProps) {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload vers Supabase Storage
    const supabase = createClient();
    const fileName = `${Date.now()}_${file.name}`;

    const { data: _uploadData, error } = await supabase.storage
      .from('linkme-delivery-forms')
      .upload(fileName, file);

    if (error) {
      toast.error("Erreur lors de l'upload du fichier");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('linkme-delivery-forms').getPublicUrl(fileName);

    updateData({
      delivery: { ...data.delivery, accessFormUrl: publicUrl },
    });

    toast.success('Fichier uploadé avec succès');
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-lg font-medium">Livraison</h3>
        <p className="text-sm text-gray-500 mt-1">
          Adresse et modalités de livraison
        </p>
      </div>

      {/* Contact livraison */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="useResponsableContact"
              checked={data.delivery.useResponsableContact}
              onCheckedChange={checked =>
                updateData({
                  delivery: {
                    ...data.delivery,
                    useResponsableContact: !!checked,
                  },
                })
              }
            />
            <div className="flex-1">
              <Label
                htmlFor="useResponsableContact"
                className="cursor-pointer font-medium"
              >
                Le contact de livraison est le responsable du restaurant
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Les coordonnées du responsable seront utilisées pour la
                livraison
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Si décoché : formulaire contact */}
      {!data.delivery.useResponsableContact && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="deliveryContactName">
              Nom complet <span className="text-red-500">*</span>
            </Label>
            <Input
              id="deliveryContactName"
              value={data.delivery.contactName}
              onChange={e =>
                updateData({
                  delivery: { ...data.delivery, contactName: e.target.value },
                })
              }
              placeholder="Paul Leclerc"
            />
            {errors['delivery.contactName'] && (
              <p className="text-sm text-red-600 mt-1">
                {errors['delivery.contactName']}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="deliveryContactEmail">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="deliveryContactEmail"
              type="email"
              value={data.delivery.contactEmail}
              onChange={e =>
                updateData({
                  delivery: {
                    ...data.delivery,
                    contactEmail: e.target.value,
                  },
                })
              }
              placeholder="paul.leclerc@restaurant.fr"
            />
            {errors['delivery.contactEmail'] && (
              <p className="text-sm text-red-600 mt-1">
                {errors['delivery.contactEmail']}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="deliveryContactPhone">
              Téléphone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="deliveryContactPhone"
              type="tel"
              value={data.delivery.contactPhone}
              onChange={e =>
                updateData({
                  delivery: {
                    ...data.delivery,
                    contactPhone: e.target.value,
                  },
                })
              }
              placeholder="06 98 76 54 32"
            />
            {errors['delivery.contactPhone'] && (
              <p className="text-sm text-red-600 mt-1">
                {errors['delivery.contactPhone']}
              </p>
            )}
          </div>
        </div>
      )}

      <Separator />

      {/* Adresse livraison */}
      <div>
        <Label>
          Adresse de livraison <span className="text-red-500">*</span>
        </Label>
        <AddressAutocomplete
          value={
            data.delivery.address
              ? `${data.delivery.address}, ${data.delivery.postalCode} ${data.delivery.city}`
              : ''
          }
          onSelect={address =>
            updateData({
              delivery: {
                ...data.delivery,
                address: address.streetAddress,
                postalCode: address.postalCode,
                city: address.city,
                latitude: address.latitude,
                longitude: address.longitude,
              },
            })
          }
          placeholder="123 Rue de Rivoli, 75001 Paris"
        />
        {errors['delivery.address'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['delivery.address']}
          </p>
        )}
      </div>

      {/* Date livraison */}
      <div>
        <Label htmlFor="deliveryDate">
          Date de livraison souhaitée <span className="text-red-500">*</span>
        </Label>
        <Input
          id="deliveryDate"
          type="date"
          value={data.delivery.deliveryDate}
          onChange={e =>
            updateData({
              delivery: { ...data.delivery, deliveryDate: e.target.value },
            })
          }
          min={new Date().toISOString().split('T')[0]}
        />
        {errors['delivery.deliveryDate'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['delivery.deliveryDate']}
          </p>
        )}
      </div>

      <Separator />

      {/* Centre commercial */}
      <div>
        <Label>Livraison dans un centre commercial ?</Label>
        <RadioGroup
          value={data.delivery.isMallDelivery ? 'yes' : 'no'}
          onValueChange={value =>
            updateData({
              delivery: { ...data.delivery, isMallDelivery: value === 'yes' },
            })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="mall-yes" />
            <Label htmlFor="mall-yes" className="cursor-pointer font-normal">
              Oui
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="mall-no" />
            <Label htmlFor="mall-no" className="cursor-pointer font-normal">
              Non
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Si centre commercial */}
      {data.delivery.isMallDelivery && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="mallEmail">
              Email du centre commercial <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mallEmail"
              type="email"
              value={data.delivery.mallEmail}
              onChange={e =>
                updateData({
                  delivery: { ...data.delivery, mallEmail: e.target.value },
                })
              }
              placeholder="accueil@centrecommercial.fr"
            />
            {errors['delivery.mallEmail'] && (
              <p className="text-sm text-red-600 mt-1">
                {errors['delivery.mallEmail']}
              </p>
            )}
          </div>

          <div>
            <Label>Formulaire d'accès requis ?</Label>
            <RadioGroup
              value={data.delivery.accessFormRequired ? 'yes' : 'no'}
              onValueChange={value =>
                updateData({
                  delivery: {
                    ...data.delivery,
                    accessFormRequired: value === 'yes',
                  },
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="form-yes" />
                <Label
                  htmlFor="form-yes"
                  className="cursor-pointer font-normal"
                >
                  Oui
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="form-no" />
                <Label htmlFor="form-no" className="cursor-pointer font-normal">
                  Non
                </Label>
              </div>
            </RadioGroup>
          </div>

          {data.delivery.accessFormRequired && (
            <div>
              <Label htmlFor="accessFormUpload">
                Télécharger le formulaire d'accès
              </Label>
              <Input
                id="accessFormUpload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => {
                  void handleFileUpload(e).catch(error => {
                    console.error('[OrderForm] File upload failed:', error);
                  });
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Formats acceptés : PDF, PNG, JPG (max 5 MB)
              </p>
              {data.delivery.accessFormUrl && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Fichier uploadé avec succès</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Semi-remorque */}
      <div>
        <Label>Accessible par semi-remorque ?</Label>
        <RadioGroup
          value={data.delivery.semiTrailerAccessible ? 'yes' : 'no'}
          onValueChange={value =>
            updateData({
              delivery: {
                ...data.delivery,
                semiTrailerAccessible: value === 'yes',
              },
            })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="semi-yes" />
            <Label htmlFor="semi-yes" className="cursor-pointer font-normal">
              Oui (par défaut)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="semi-no" />
            <Label htmlFor="semi-no" className="cursor-pointer font-normal">
              Non
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Notes livraison */}
      <div>
        <Label htmlFor="deliveryNotes">Notes livraison (optionnel)</Label>
        <Textarea
          id="deliveryNotes"
          value={data.delivery.notes}
          onChange={e =>
            updateData({
              delivery: { ...data.delivery, notes: e.target.value },
            })
          }
          placeholder="Instructions spéciales pour la livraison..."
          rows={4}
        />
      </div>
    </div>
  );
}

// =====================================================================
// STEP 4 : FACTURATION
// =====================================================================

function OpeningStep4Billing({
  data,
  errors,
  updateData,
  affiliateId,
}: StepProps) {
  const { data: enseigneId } = useEnseigneIdFromAffiliate(affiliateId);
  const { data: parentOrg } = useEnseigneParentOrganisation(enseigneId ?? null);
  const isPropre =
    !data.isNewRestaurant || data.newRestaurant.ownershipType === 'succursale';

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-lg font-medium">Facturation</h3>
        <p className="text-sm text-gray-500 mt-1">
          Adresse et contact de facturation
        </p>
      </div>

      {/* Option organisation mère (uniquement si propre ET org mère existe) */}
      {isPropre && parentOrg && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="useParentOrg"
                checked={data.billing.useParentOrganisation}
                onCheckedChange={checked =>
                  updateData({
                    billing: {
                      ...data.billing,
                      useParentOrganisation: !!checked,
                    },
                  })
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor="useParentOrg"
                  className="cursor-pointer font-medium"
                >
                  Utiliser l'organisation mère de l'enseigne
                </Label>
                <div className="mt-2 text-sm text-gray-700">
                  <p className="font-medium">
                    {parentOrg.trade_name ?? parentOrg.legal_name}
                  </p>
                  <p className="text-gray-600">{parentOrg.address_line1}</p>
                  <p className="text-gray-600">
                    {parentOrg.postal_code} {parentOrg.city}
                  </p>
                  {parentOrg.siret && (
                    <p className="text-xs text-gray-500 mt-1">
                      SIRET : {parentOrg.siret}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  L'adresse de facturation sera celle de l'organisation mère
                </p>
              </div>
              {data.billing.useParentOrganisation && (
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire custom (si case non cochée OU franchise) */}
      {(!data.billing.useParentOrganisation || !isPropre) && (
        <>
          {/* Contact de facturation */}
          <div>
            <Label>Contact de facturation</Label>
            <div className="space-y-2 mt-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="billingSource"
                  checked={data.billing.contactSource === 'responsable'}
                  onChange={() =>
                    updateData({
                      billing: {
                        ...data.billing,
                        contactSource: 'responsable',
                      },
                    })
                  }
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  Même que le responsable (Étape 2)
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
              <h4 className="font-medium text-gray-900">
                Contact de facturation
              </h4>
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
                      errors['billing.name']
                        ? 'border-red-500'
                        : 'border-gray-300'
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
                      errors['billing.email']
                        ? 'border-red-500'
                        : 'border-gray-300'
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
            <h4 className="font-medium text-gray-900">
              Adresse de facturation
            </h4>
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
              <AddressAutocomplete
                label="Adresse de facturation *"
                placeholder="Rechercher une adresse..."
                value={
                  data.billing.address
                    ? `${data.billing.address}, ${data.billing.postalCode} ${data.billing.city}`
                    : ''
                }
                onChange={value => {
                  if (!value) {
                    updateData({
                      billing: {
                        ...data.billing,
                        address: '',
                        city: '',
                        postalCode: '',
                        latitude: null,
                        longitude: null,
                      },
                    });
                  }
                }}
                onSelect={(address: AddressResult) => {
                  updateData({
                    billing: {
                      ...data.billing,
                      address: address.streetAddress,
                      city: address.city,
                      postalCode: address.postalCode,
                      latitude: address.latitude,
                      longitude: address.longitude,
                    },
                  });
                }}
              />
              {errors['billing.address'] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors['billing.address']}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Notes (optionnel) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optionnel)
        </label>
        <textarea
          value={data.finalNotes}
          onChange={e => updateData({ finalNotes: e.target.value })}
          placeholder="Instructions spéciales, commentaires..."
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

// =====================================================================
// STEP 6 : VALIDATION & PANIER
// =====================================================================

interface Step6Props extends StepProps {
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

function OpeningStep6Validation({
  data,
  errors,
  cart,
  cartTotals,
  formatPrice,
  onUpdateQuantity,
  onRemoveItem,
  onOpenConfirmation,
}: Step6Props) {
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
          {/* Demandeur */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Demandeur
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Nom :</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {data.requester.name}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Email :</span>
                <span className="ml-2 text-gray-900">
                  {data.requester.email}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Téléphone :</span>
                <span className="ml-2 text-gray-900">
                  {data.requester.phone}
                </span>
              </div>
              {data.requester.position && (
                <div>
                  <span className="text-gray-500">Fonction :</span>
                  <span className="ml-2 text-gray-900">
                    {data.requester.position}
                  </span>
                </div>
              )}
              {data.requester.notes && (
                <div className="col-span-2">
                  <span className="text-gray-500">Notes :</span>
                  <span className="ml-2 text-gray-900">
                    {data.requester.notes}
                  </span>
                </div>
              )}
            </div>
          </div>

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
              {data.newRestaurant.ownershipType && (
                <div>
                  <span className="text-gray-500">Type :</span>
                  <span className="ml-2 text-gray-900">
                    {data.newRestaurant.ownershipType === 'franchise'
                      ? 'Franchise'
                      : 'Restaurant propre'}
                  </span>
                </div>
              )}
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

          {/* Responsable */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-blue-600" />
              Responsable
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Nom :</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {data.responsable.name}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Email :</span>
                <span className="ml-2 text-gray-900">
                  {data.responsable.email}
                </span>
              </div>
              {data.responsable.phone && (
                <div>
                  <span className="text-gray-500">Tél :</span>
                  <span className="ml-2 text-gray-900">
                    {data.responsable.phone}
                  </span>
                </div>
              )}
              {data.responsable.type === 'franchise' && (
                <>
                  <div className="col-span-2">
                    <span className="text-gray-500">Société :</span>
                    <span className="ml-2 text-gray-900">
                      {data.responsable.companyLegalName}
                    </span>
                  </div>
                  {data.responsable.siret && (
                    <div>
                      <span className="text-gray-500">SIRET :</span>
                      <span className="ml-2 text-gray-900 font-mono">
                        {data.responsable.siret}
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
                    Identique au responsable
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

          {/* Livraison */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              Livraison
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {/* Contact livraison */}
              {data.delivery.useResponsableContact ? (
                <div className="col-span-2">
                  <span className="text-gray-500">Contact :</span>
                  <span className="ml-2 text-gray-900">
                    Identique au responsable
                  </span>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-gray-500">Contact :</span>
                    <span className="ml-2 text-gray-900">
                      {data.delivery.contactName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email :</span>
                    <span className="ml-2 text-gray-900">
                      {data.delivery.contactEmail}
                    </span>
                  </div>
                  {data.delivery.contactPhone && (
                    <div>
                      <span className="text-gray-500">Tél :</span>
                      <span className="ml-2 text-gray-900">
                        {data.delivery.contactPhone}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Adresse livraison */}
              {data.delivery.address && (
                <div className="col-span-2">
                  <span className="text-gray-500">Adresse :</span>
                  <span className="ml-2 text-gray-900">
                    {data.delivery.address}, {data.delivery.postalCode}{' '}
                    {data.delivery.city}
                  </span>
                </div>
              )}

              {/* Date livraison */}
              {data.delivery.deliveryDate && (
                <div>
                  <span className="text-gray-500">Date souhaitée :</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(data.delivery.deliveryDate).toLocaleDateString(
                      'fr-FR'
                    )}
                  </span>
                </div>
              )}

              {/* Centre commercial */}
              {data.delivery.isMallDelivery && (
                <>
                  <div className="col-span-2">
                    <span className="text-gray-500">Centre commercial :</span>
                    <span className="ml-2 text-gray-900">Oui</span>
                  </div>
                  {data.delivery.mallEmail && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Email CC :</span>
                      <span className="ml-2 text-gray-900">
                        {data.delivery.mallEmail}
                      </span>
                    </div>
                  )}
                  {data.delivery.accessFormRequired && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Formulaire accès :</span>
                      <span className="ml-2 text-gray-900">
                        {data.delivery.accessFormUrl ? 'Fourni' : 'Requis'}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Semi-remorque */}
              <div>
                <span className="text-gray-500">Semi-remorque :</span>
                <span className="ml-2 text-gray-900">
                  {data.delivery.semiTrailerAccessible
                    ? 'Accessible'
                    : 'Non accessible'}
                </span>
              </div>

              {/* Notes livraison */}
              {data.delivery.notes && (
                <div className="col-span-2">
                  <span className="text-gray-500">Notes :</span>
                  <span className="ml-2 text-gray-900">
                    {data.delivery.notes}
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
          {data.finalNotes && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{data.finalNotes}</p>
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
