'use client';

import { useState, useCallback } from 'react';

interface UpdateShipmentPayload {
  shipment_id: string;
  carrier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipping_cost?: number;
  notes?: string;
}

/**
 * Sub-hook : édition d'un shipment manuel (via dynamic import Server Action)
 */
export function useShipmentEdit() {
  const [updating, setUpdating] = useState(false);

  const updateShipment = useCallback(
    async (
      payload: UpdateShipmentPayload
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setUpdating(true);
        const { updateSalesShipment } = await import(
          '../../actions/sales-shipments'
        );
        return await updateSalesShipment(payload);
      } catch (err) {
        console.error('Erreur édition expédition:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        };
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  return { updating, updateShipment };
}
