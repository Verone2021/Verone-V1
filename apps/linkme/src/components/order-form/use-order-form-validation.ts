/**
 * use-order-form-validation - Fonctions de validation par étape
 *
 * @module use-order-form-validation
 * @since 2026-04-14
 */

import { useCallback } from 'react';

import type { OrderFormUnifiedData } from './types';

interface ValidationResult {
  validateStep1: () => boolean;
  validateStep2: () => boolean;
  validateStep3: () => boolean;
  validateStep4: () => boolean;
  validateStep5: () => boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useOrderFormValidation(
  data: OrderFormUnifiedData,
  cart: { id: string }[],
  setErrors: (errors: Record<string, string>) => void
): ValidationResult {
  const validateStep1 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.requester.name.trim())
      newErrors['requester.name'] = 'Le nom est requis';
    if (!data.requester.email.trim())
      newErrors['requester.email'] = "L'email est requis";
    else if (!EMAIL_REGEX.test(data.requester.email))
      newErrors['requester.email'] = 'Email invalide';
    if (!data.requester.phone.trim())
      newErrors['requester.phone'] = 'Le téléphone est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.requester, setErrors]);

  const validateStep2 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (data.isNewRestaurant === false) {
      if (!data.existingOrganisationId)
        newErrors['existingOrganisationId'] =
          'Veuillez sélectionner un restaurant';
    } else if (data.isNewRestaurant === true) {
      if (!data.newRestaurant.tradeName.trim())
        newErrors['newRestaurant.tradeName'] = 'Le nom commercial est requis';
      if (!data.newRestaurant.ownershipType)
        newErrors['newRestaurant.ownershipType'] =
          'Veuillez choisir le type de restaurant';
      if (!data.newRestaurant.address.trim())
        newErrors['newRestaurant.address'] = "L'adresse est requise";
      if (!data.newRestaurant.city.trim())
        newErrors['newRestaurant.city'] = 'La ville est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    data.isNewRestaurant,
    data.existingOrganisationId,
    data.newRestaurant,
    setErrors,
  ]);

  const validateStep3 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.responsable.name.trim())
      newErrors['responsable.name'] = 'Le nom du responsable est requis';
    if (!data.responsable.email.trim())
      newErrors['responsable.email'] = "L'email est requis";
    else if (!EMAIL_REGEX.test(data.responsable.email))
      newErrors['responsable.email'] = 'Email invalide';
    if (!data.responsable.phone.trim())
      newErrors['responsable.phone'] = 'Le téléphone est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.responsable, setErrors]);

  const validateStep4 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.billing.useParentOrganisation) {
      if (data.billing.contactSource === 'custom') {
        if (!data.billing.name.trim())
          newErrors['billing.name'] = 'Le nom est requis';
        if (!data.billing.email.trim())
          newErrors['billing.email'] = "L'email est requis";
        else if (!EMAIL_REGEX.test(data.billing.email))
          newErrors['billing.email'] = 'Email invalide';
      }
      if (!data.billing.address.trim())
        newErrors['billing.address'] = "L'adresse est requise";
      if (!data.billing.postalCode.trim())
        newErrors['billing.postalCode'] = 'Le code postal est requis';
      if (!data.billing.city.trim())
        newErrors['billing.city'] = 'La ville est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.billing, setErrors]);

  const validateStep5 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.delivery.useResponsableContact) {
      if (!data.delivery.contactName.trim())
        newErrors['delivery.contactName'] = 'Le nom est requis';
      if (!data.delivery.contactEmail.trim())
        newErrors['delivery.contactEmail'] = "L'email est requis";
      else if (!EMAIL_REGEX.test(data.delivery.contactEmail))
        newErrors['delivery.contactEmail'] = 'Email invalide';
      if (!data.delivery.contactPhone.trim())
        newErrors['delivery.contactPhone'] = 'Le téléphone est requis';
    }

    if (!data.delivery.address.trim())
      newErrors['delivery.address'] = "L'adresse de livraison est requise";
    if (!data.delivery.deliveryDate && !data.delivery.deliveryAsap)
      newErrors['delivery.deliveryDate'] =
        'Indiquez une date ou cochez "Dès que possible"';

    if (data.delivery.isMallDelivery && !data.delivery.mallEmail.trim())
      newErrors['delivery.mallEmail'] =
        "L'email du centre commercial est requis";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.delivery, setErrors]);

  // Prevent "unused variable" warning — cart is required for potential step 6 validation
  void cart;

  return {
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
  };
}
