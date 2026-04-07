'use client';

import { useState, useCallback } from 'react';

import type { ValidateShipmentPayload } from '@verone/types';

/**
 * Sub-hook : validation d'expédition (via dynamic import Server Action)
 */
export function useShipmentValidator() {
  const [validating, setValidating] = useState(false);

  const validateShipment = useCallback(
    async (
      payload: Omit<
        ValidateShipmentPayload,
        'carrier_info' | 'shipping_address'
      > & {
        tracking_number?: string;
        delivery_method?: 'pickup' | 'hand_delivery' | 'manual' | 'packlink';
        carrier_name?: string;
        carrier_service?: string;
        shipping_cost?: number;
        estimated_delivery_at?: string;
        /** Référence expédition Packlink (ex: FR2026PRO0000890560) */
        packlink_shipment_id?: string;
        /** Statut transport Packlink (Verone paie Packlink, PAS le paiement client) */
        packlink_status?:
          | 'a_payer'
          | 'paye'
          | 'in_transit'
          | 'delivered'
          | 'incident';
      }
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setValidating(true);
        const { validateSalesShipment } = await import(
          '../../actions/sales-shipments'
        );
        return await validateSalesShipment(payload);
      } catch (err) {
        console.error('Erreur validation expédition:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        };
      } finally {
        setValidating(false);
      }
    },
    []
  );

  return { validating, validateShipment };
}
