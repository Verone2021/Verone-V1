import { useState, useMemo, useEffect } from 'react';

import type { Address } from '../../../../../../lib/hooks/use-entity-addresses';
import type { FullOrderData } from '../page';
import { findAddressMatch } from '../helpers';

// ============================================================================
// TYPES
// ============================================================================

interface UseEditOrderAddressesParams {
  order: FullOrderData['order'];
  details: FullOrderData['details'];
  billingAddresses: Address[];
  shippingAddresses: Address[];
}

// ============================================================================
// HOOK
// ============================================================================

export function useEditOrderAddresses({
  order,
  details,
  billingAddresses,
  shippingAddresses,
}: UseEditOrderAddressesParams) {
  // ---- State: Billing address ----
  const [billingAddressMode, setBillingAddressMode] = useState<
    'restaurant' | 'existing' | 'new'
  >('restaurant');
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<
    string | null
  >(null);

  // ---- State: Delivery address ----
  const [deliveryAddressMode, setDeliveryAddressMode] = useState<
    'restaurant' | 'existing' | 'new'
  >('restaurant');
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<
    string | null
  >(null);
  const [newDeliveryAddress, setNewDeliveryAddress] = useState({
    address: '',
    postalCode: '',
    city: '',
  });

  // Match addresses after they load
  useEffect(() => {
    if (!billingAddresses.length && !shippingAddresses.length) return;

    // Match billing address from order.billing_address
    const ba = order.billing_address;
    if (ba && billingAddresses.length) {
      const match = findAddressMatch(
        billingAddresses,
        ba.address_line_1 ?? ba.addressLine1,
        ba.postal_code ?? ba.postalCode,
        ba.city
      );
      if (match) {
        setBillingAddressMode('existing');
        setSelectedBillingAddressId(match);
      }
    }

    // Match delivery address
    if (details?.delivery_address && shippingAddresses.length) {
      const match = findAddressMatch(
        shippingAddresses,
        details.delivery_address,
        details.delivery_postal_code,
        details.delivery_city
      );
      if (match) {
        setDeliveryAddressMode('existing');
        setSelectedDeliveryAddressId(match);
      } else {
        setDeliveryAddressMode('new');
        setNewDeliveryAddress({
          address: details.delivery_address ?? '',
          postalCode: details.delivery_postal_code ?? '',
          city: details.delivery_city ?? '',
        });
      }
    }
  }, [billingAddresses, shippingAddresses, order.billing_address, details]);

  // ---- Computed: Resolved delivery address ----
  const resolvedDeliveryAddress = useMemo(() => {
    if (deliveryAddressMode === 'existing' && selectedDeliveryAddressId) {
      const a = shippingAddresses.find(a => a.id === selectedDeliveryAddressId);
      if (a)
        return {
          address: a.addressLine1,
          postalCode: a.postalCode,
          city: a.city,
        };
    }
    if (deliveryAddressMode === 'new') {
      return newDeliveryAddress;
    }
    // restaurant mode: use first shipping address or billing address
    const defaultAddr =
      shippingAddresses.find(a => a.isDefault) ?? shippingAddresses[0];
    if (defaultAddr)
      return {
        address: defaultAddr.addressLine1,
        postalCode: defaultAddr.postalCode,
        city: defaultAddr.city,
      };
    return { address: '', postalCode: '', city: '' };
  }, [
    deliveryAddressMode,
    selectedDeliveryAddressId,
    shippingAddresses,
    newDeliveryAddress,
  ]);

  return {
    // Billing address state
    billingAddressMode,
    setBillingAddressMode,
    selectedBillingAddressId,
    setSelectedBillingAddressId,
    // Delivery address state
    deliveryAddressMode,
    setDeliveryAddressMode,
    selectedDeliveryAddressId,
    setSelectedDeliveryAddressId,
    newDeliveryAddress,
    setNewDeliveryAddress,
    // Resolved
    resolvedDeliveryAddress,
  };
}
