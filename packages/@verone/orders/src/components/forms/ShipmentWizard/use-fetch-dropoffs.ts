'use client';

import { useCallback } from 'react';

import type { PacklinkService, DropoffPoint } from './types';

interface FetchDropoffsDeps {
  selectedService: PacklinkService | null;
  destinationZip: string;
  setSenderDropoffs: (v: DropoffPoint[]) => void;
  setLoadingSenderDropoffs: (v: boolean) => void;
  setReceiverDropoffs: (v: DropoffPoint[]) => void;
  setLoadingReceiverDropoffs: (v: boolean) => void;
}

/**
 * Returns a stable `fetchDropoffs` callback.
 * Extracted from useShipmentWizard to keep that hook under 400 lines.
 */
export function useFetchDropoffs({
  selectedService,
  destinationZip,
  setSenderDropoffs,
  setLoadingSenderDropoffs,
  setReceiverDropoffs,
  setLoadingReceiverDropoffs,
}: FetchDropoffsDeps) {
  return useCallback(async () => {
    if (!selectedService || !destinationZip) return;

    // Fetch sender dropoffs (around Massy 91300)
    setLoadingSenderDropoffs(true);
    try {
      const res = await fetch(
        `/api/packlink/dropoffs?service_id=${selectedService.id}&country=FR&zip=91300`
      );
      if (res.ok) {
        const data = (await res.json()) as { dropoffs: DropoffPoint[] };
        setSenderDropoffs(data.dropoffs ?? []);
      }
    } catch (err) {
      console.error('[Dropoffs sender]', err);
      setSenderDropoffs([]);
    }
    setLoadingSenderDropoffs(false);

    // Fetch receiver dropoffs (around destination)
    if (selectedService.delivery_to_parcelshop) {
      setLoadingReceiverDropoffs(true);
      try {
        const res = await fetch(
          `/api/packlink/dropoffs?service_id=${selectedService.id}&country=FR&zip=${destinationZip}`
        );
        if (res.ok) {
          const data = (await res.json()) as { dropoffs: DropoffPoint[] };
          setReceiverDropoffs(data.dropoffs ?? []);
        }
      } catch (err) {
        console.error('[Dropoffs receiver]', err);
        setReceiverDropoffs([]);
      }
      setLoadingReceiverDropoffs(false);
    }
  }, [
    selectedService,
    destinationZip,
    setSenderDropoffs,
    setLoadingSenderDropoffs,
    setReceiverDropoffs,
    setLoadingReceiverDropoffs,
  ]);
}
