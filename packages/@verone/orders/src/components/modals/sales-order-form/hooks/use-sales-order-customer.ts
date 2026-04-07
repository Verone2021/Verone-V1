'use client';

import type { Database } from '@verone/types';

import type { UnifiedCustomer } from '../../../modals/customer-selector';

interface UseSalesOrderCustomerOptions {
  setSelectedCustomer: (c: UnifiedCustomer | null) => void;
  setPaymentTermsType: (
    t: Database['public']['Enums']['payment_terms_type'] | null
  ) => void;
  setPaymentTermsNotes: (n: string) => void;
  setChannelId: (id: string | null) => void;
  setShippingAddress: (a: string) => void;
  setBillingAddress: (a: string) => void;
}

export function useSalesOrderCustomer({
  setSelectedCustomer,
  setPaymentTermsType,
  setPaymentTermsNotes,
  setChannelId,
  setShippingAddress,
  setBillingAddress,
}: UseSalesOrderCustomerOptions) {
  const handleCustomerChange = (customer: UnifiedCustomer | null) => {
    setSelectedCustomer(customer);

    // Pré-remplir automatiquement les conditions de paiement
    if (customer) {
      if (customer.type === 'individual') {
        setPaymentTermsType('IMMEDIATE');
        setPaymentTermsNotes('Client particulier - Paiement immédiat requis');
      } else if (customer.payment_terms_type) {
        setPaymentTermsType(
          customer.payment_terms_type as Database['public']['Enums']['payment_terms_type']
        );
        setPaymentTermsNotes(customer.payment_terms_notes ?? '');
      } else {
        if (customer.prepayment_required) {
          setPaymentTermsType('IMMEDIATE');
          setPaymentTermsNotes(
            customer.payment_terms
              ? `Prépaiement requis + ${customer.payment_terms} jours`
              : 'Prépaiement requis'
          );
        } else {
          setPaymentTermsType('NET_30');
          setPaymentTermsNotes('');
        }
      }

      if (customer.default_channel_id) {
        setChannelId(customer.default_channel_id);
      }
    } else {
      setPaymentTermsType(null);
      setPaymentTermsNotes('');
      setChannelId(null);
    }

    // Pré-remplir automatiquement les adresses quand un client est sélectionné
    if (customer) {
      if (customer.type === 'professional') {
        const useShipping =
          (customer.shipping_address_line1 != null &&
            customer.shipping_address_line1 !== '') ||
          (customer.shipping_city != null && customer.shipping_city !== '');
        const shippingParts = [
          customer.name,
          useShipping
            ? customer.shipping_address_line1
            : customer.billing_address_line1,
          useShipping
            ? customer.shipping_address_line2
            : customer.billing_address_line2,
          useShipping
            ? [customer.shipping_postal_code, customer.shipping_city]
                .filter(Boolean)
                .join(' ')
            : [customer.billing_postal_code, customer.billing_city]
                .filter(Boolean)
                .join(' '),
          useShipping ? customer.shipping_region : customer.billing_region,
          useShipping ? customer.shipping_country : customer.billing_country,
        ]
          .filter(Boolean)
          .join('\n');
        setShippingAddress(shippingParts);

        const billingParts = [
          customer.name,
          customer.billing_address_line1,
          customer.billing_address_line2,
          [customer.billing_postal_code, customer.billing_city]
            .filter(Boolean)
            .join(' '),
          customer.billing_region,
          customer.billing_country,
        ]
          .filter(Boolean)
          .join('\n');
        setBillingAddress(billingParts);
      } else {
        const shippingParts = [
          customer.name,
          customer.address_line1,
          customer.address_line2,
          [customer.postal_code, customer.city].filter(Boolean).join(' '),
          customer.region,
          customer.country,
        ]
          .filter(Boolean)
          .join('\n');
        setShippingAddress(shippingParts);

        const useSpecificBilling =
          (customer.billing_address_line1_individual != null &&
            customer.billing_address_line1_individual !== '') ||
          (customer.billing_city_individual != null &&
            customer.billing_city_individual !== '');
        const billingParts = [
          customer.name,
          useSpecificBilling
            ? customer.billing_address_line1_individual
            : customer.address_line1,
          useSpecificBilling
            ? customer.billing_address_line2_individual
            : customer.address_line2,
          useSpecificBilling
            ? [
                customer.billing_postal_code_individual,
                customer.billing_city_individual,
              ]
                .filter(Boolean)
                .join(' ')
            : [customer.postal_code, customer.city].filter(Boolean).join(' '),
          useSpecificBilling
            ? customer.billing_region_individual
            : customer.region,
          useSpecificBilling
            ? customer.billing_country_individual
            : customer.country,
        ]
          .filter(Boolean)
          .join('\n');
        setBillingAddress(billingParts);
      }
    } else {
      setShippingAddress('');
      setBillingAddress('');
    }
  };

  return { handleCustomerChange };
}
