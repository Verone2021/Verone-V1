'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import type { AddressResult } from '@verone/ui';

import { useCart } from '../../../components/cart/CartProvider';
import type { LinkMeOrderData } from '../../../lib/revolut';

import { COUNTRY_CODES } from './constants';
import type { CheckoutFormData, RevolutCheckoutInstance } from './types';

const INITIAL_FORM_DATA: CheckoutFormData = {
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  company: '',
  address: '',
  addressComplement: '',
  postalCode: '',
  city: '',
  country: 'France',
  countryCode: 'FR',
  useSameForBilling: true,
  billingFirstName: '',
  billingLastName: '',
  billingCompany: '',
  billingAddress: '',
  billingAddressComplement: '',
  billingPostalCode: '',
  billingCity: '',
  billingCountry: 'France',
  billingCountryCode: 'FR',
};

export function useCheckout() {
  const router = useRouter();
  const {
    items,
    affiliateId,
    selectionId,
    totalHT,
    totalTVA,
    totalTTC,
    itemCount,
    clearCart,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [revolutLoaded, setRevolutLoaded] = useState(false);
  const revolutInstanceRef = useRef<RevolutCheckoutInstance | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM_DATA);

  const shippingCost = 0;
  const finalTotal = totalTTC + shippingCost;

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.RevolutCheckout) {
      const script = document.createElement('script');
      script.src = 'https://merchant.revolut.com/embed.js';
      script.async = true;
      script.onload = () => {
        setRevolutLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Revolut SDK');
        setPaymentError('Impossible de charger le module de paiement');
      };
      document.head.appendChild(script);
    } else if (window.RevolutCheckout) {
      setRevolutLoaded(true);
    }

    return () => {
      if (revolutInstanceRef.current) {
        revolutInstanceRef.current.destroy();
      }
    };
  }, []);

  const updateFormData = useCallback(
    (field: keyof CheckoutFormData, value: string | boolean) => {
      setFormData(prev => {
        const updated = { ...prev, [field]: value };
        if (field === 'country' && typeof value === 'string') {
          updated.countryCode = COUNTRY_CODES[value] || 'FR';
        }
        if (field === 'billingCountry' && typeof value === 'string') {
          updated.billingCountryCode = COUNTRY_CODES[value] || 'FR';
        }
        return updated;
      });
    },
    []
  );

  const handleShippingAddressSelect = useCallback((address: AddressResult) => {
    setFormData(prev => ({
      ...prev,
      address: address.streetAddress,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country || 'France',
      countryCode: address.countryCode || 'FR',
    }));
  }, []);

  const handleBillingAddressSelect = useCallback((address: AddressResult) => {
    setFormData(prev => ({
      ...prev,
      billingAddress: address.streetAddress,
      billingCity: address.city,
      billingPostalCode: address.postalCode,
      billingCountry: address.country || 'France',
      billingCountryCode: address.countryCode || 'FR',
    }));
  }, []);

  const validateForm = (): boolean => {
    if (!formData.email || !formData.phone) {
      setPaymentError('Veuillez remplir vos informations de contact');
      return false;
    }
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.address ||
      !formData.postalCode ||
      !formData.city
    ) {
      setPaymentError('Veuillez remplir votre adresse de livraison');
      return false;
    }
    if (!formData.useSameForBilling) {
      if (
        !formData.billingFirstName ||
        !formData.billingLastName ||
        !formData.billingAddress ||
        !formData.billingPostalCode ||
        !formData.billingCity
      ) {
        setPaymentError('Veuillez remplir votre adresse de facturation');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!validateForm()) return;

    if (!revolutLoaded || !window.RevolutCheckout) {
      setPaymentError(
        "Le module de paiement n'est pas encore chargé. Veuillez réessayer."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData: LinkMeOrderData = {
        customer: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: {
            streetLine1: formData.address,
            streetLine2: formData.addressComplement || undefined,
            city: formData.city,
            postcode: formData.postalCode,
            countryCode: formData.countryCode,
          },
        },
        items: items.map(item => ({
          product_id: item.product_id,
          selection_item_id: item.selection_item_id,
          name: item.name,
          quantity: item.quantity,
          unit_price_ht: item.selling_price_ht,
          total_price_ht: item.selling_price_ht * item.quantity,
        })),
        affiliate_id: affiliateId ?? '',
        selection_id: selectionId ?? '',
        total_ht: totalHT,
        total_ttc: totalTTC,
        total_tva: totalTVA,
      };

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = (await response.json()) as {
        success: boolean;
        token?: string;
        order_ref?: string;
        error?: string;
      };

      if (!result.success || !result.token) {
        throw new Error(result.error ?? 'Échec de création de la commande');
      }

      const mode =
        process.env.NEXT_PUBLIC_REVOLUT_ENVIRONMENT === 'prod'
          ? 'prod'
          : 'sandbox';

      const instance = await window.RevolutCheckout(result.token, mode);
      revolutInstanceRef.current = instance;

      const billingAddress = formData.useSameForBilling
        ? {
            countryCode: formData.countryCode,
            postcode: formData.postalCode,
            city: formData.city,
            streetLine1: formData.address,
            streetLine2: formData.addressComplement || undefined,
          }
        : {
            countryCode: formData.billingCountryCode,
            postcode: formData.billingPostalCode,
            city: formData.billingCity,
            streetLine1: formData.billingAddress,
            streetLine2: formData.billingAddressComplement || undefined,
          };

      instance.payWithPopup({
        locale: 'fr',
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        billingAddress,
        onSuccess: () => {
          clearCart();
          router.push(`/confirmation?order=${result.order_ref}`);
        },
        onError: error => {
          console.error('Payment error:', error);
          setPaymentError(
            error.message || 'Le paiement a échoué. Veuillez réessayer.'
          );
          setIsSubmitting(false);
        },
        onCancel: () => {
          setIsSubmitting(false);
        },
      });
    } catch (error) {
      console.error('Checkout error:', error);
      setPaymentError(
        error instanceof Error ? error.message : 'Une erreur est survenue'
      );
      setIsSubmitting(false);
    }
  };

  return {
    items,
    itemCount,
    totalHT,
    totalTVA,
    totalTTC,
    finalTotal,
    formData,
    isSubmitting,
    paymentError,
    revolutLoaded,
    updateFormData,
    handleShippingAddressSelect,
    handleBillingAddressSelect,
    handleSubmit,
  };
}
