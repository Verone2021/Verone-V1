'use client';

import { useCallback } from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ShipmentItem } from '@verone/types';

import type { PacklinkService } from './types';

interface ShipmentPayload {
  sales_order_id: string;
  items: Array<{
    sales_order_item_id: string;
    product_id: string;
    quantity_to_ship: number;
  }>;
  shipped_at: string;
  shipped_by: string;
  delivery_method: 'packlink';
  carrier_name: string;
  carrier_service: string;
  shipping_cost: number;
  estimated_delivery_at?: string;
  packlink_shipment_id: string;
  packlink_status: 'a_payer';
  notes: string;
  packages_info: Array<{
    weight: number;
    width: number;
    height: number;
    length: number;
  }>;
}

type ValidateShipmentFn = (
  payload: ShipmentPayload
) => Promise<{ success: boolean; error?: string }>;

interface CreateDraftDeps {
  salesOrderId: string;
  salesOrderNumber: string | null;
  items: ShipmentItem[];
  packages: Array<{
    weight: number;
    width: number;
    height: number;
    length: number;
  }>;
  selectedService: PacklinkService | null;
  contentDescription: string;
  declaredValue: number;
  isSecondHand: boolean;
  collectionDate: string;
  collectionTime: string;
  selectedSenderDropoff: string | null;
  pendingPacklinkRef: string | null;
  supabase: SupabaseClient;
  validateShipment: ValidateShipmentFn;
  buildDestination: () => {
    name: string;
    surname: string;
    email: string;
    phone: string;
    street1: string;
    city: string;
    zip_code: string;
    country: string;
  };
  // State setters
  setStep: (step: number) => void;
  setPaying: (v: boolean) => void;
  setServicesError: (v: string | null) => void;
  setDbError: (v: string | null) => void;
  setPendingPacklinkRef: (v: string | null) => void;
  setPendingAction: (v: boolean) => void;
  setShipmentResult: (v: {
    trackingNumber: string | null;
    labelUrl: string | null;
    carrierName: string | null;
    orderReference: string | null;
    totalPaid: number | null;
  }) => void;
}

function buildItemsToShip(items: ShipmentItem[]) {
  return items
    .filter(i => (i.quantity_to_ship ?? 0) > 0)
    .map(i => ({
      sales_order_item_id: i.sales_order_item_id,
      product_id: i.product_id,
      quantity_to_ship: i.quantity_to_ship ?? 0,
    }));
}

async function saveShipmentToDb(
  deps: CreateDraftDeps,
  packlinkRef: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { selectedService, items, salesOrderId, validateShipment } = deps;
  if (!selectedService) return { success: false, error: 'Service manquant' };

  const itemsToShip = buildItemsToShip(items);
  if (itemsToShip.length === 0) {
    return { success: false, error: 'Aucun article avec quantité > 0' };
  }

  return validateShipment({
    sales_order_id: salesOrderId,
    items: itemsToShip,
    shipped_at: new Date().toISOString(),
    shipped_by: userId,
    delivery_method: 'packlink',
    carrier_name: selectedService.carrier_name,
    carrier_service: selectedService.name,
    shipping_cost: selectedService.price.total_price,
    estimated_delivery_at:
      selectedService.first_estimated_delivery_date ?? undefined,
    packlink_shipment_id: packlinkRef,
    packlink_status: 'a_payer',
    notes: `Transport Packlink à payer par Verone — ${selectedService.carrier_name}`,
    packages_info: deps.packages,
  });
}

/**
 * Custom hook that returns the 3 handlers for the create-draft flow.
 * Extracted from useShipmentWizard to keep that hook under 400 lines.
 */
export function useCreateDraftHandlers(deps: CreateDraftDeps) {
  // ── handleCreateDraft ─────────────────────────────────────────────
  const handleCreateDraft = useCallback(async () => {
    const { selectedService } = deps;
    if (!selectedService) return;
    deps.setPaying(true);
    deps.setServicesError(null);

    const destination = deps.buildDestination();

    try {
      const res = await fetch('/api/packlink/shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          destination,
          packages: deps.packages,
          content: deps.contentDescription,
          contentValue: deps.declaredValue,
          contentSecondHand: deps.isSecondHand,
          orderReference:
            deps.salesOrderNumber ?? deps.salesOrderId.slice(0, 8),
          ...(deps.selectedSenderDropoff
            ? { dropoffPointId: deps.selectedSenderDropoff }
            : {}),
          ...(deps.collectionDate
            ? {
                collectionDate: deps.collectionDate.split('-').join('/'),
                collectionTime: `${deps.collectionTime}-18:00`,
              }
            : {}),
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as {
          error?: string;
          details?: string;
        };
        throw new Error(
          errData.details ?? errData.error ?? `Erreur ${res.status}`
        );
      }

      const data = (await res.json()) as {
        success: boolean;
        shipmentReference: string;
      };

      if (!data.success) {
        throw new Error("Packlink n'a pas confirmé la création");
      }

      // 1. Auth guard
      const {
        data: { user },
      } = await deps.supabase.auth.getUser();
      if (!user?.id) {
        deps.setServicesError(
          "Session expirée. Reconnectez-vous pour enregistrer l'expédition."
        );
        deps.setPendingPacklinkRef(data.shipmentReference);
        deps.setStep(8);
        deps.setPaying(false);
        return;
      }

      // 2. Items guard
      const itemsToShip = buildItemsToShip(deps.items);
      if (itemsToShip.length === 0) {
        deps.setServicesError(
          'Aucun article sélectionné avec une quantité > 0.'
        );
        deps.setPendingPacklinkRef(data.shipmentReference);
        deps.setStep(8);
        deps.setPaying(false);
        return;
      }

      // 3. DB INSERT avec gestion erreur explicite
      const dbResult = await saveShipmentToDb(
        deps,
        data.shipmentReference,
        user.id
      );

      if (!dbResult.success) {
        console.error('[ShipmentWizard] DB save failed:', dbResult.error);
        deps.setDbError(
          dbResult.error ?? 'Erreur enregistrement base de données'
        );
        deps.setPendingPacklinkRef(data.shipmentReference);
        deps.setStep(8);
        deps.setPaying(false);
        return;
      }

      // 4. Succès complet
      deps.setShipmentResult({
        trackingNumber: null,
        labelUrl: null,
        carrierName: selectedService.carrier_name,
        orderReference: data.shipmentReference,
        totalPaid: selectedService.price.total_price,
      });
      deps.setStep(7);
    } catch (err) {
      deps.setServicesError(
        err instanceof Error ? err.message : 'Erreur création expédition'
      );
    }
    deps.setPaying(false);
    // exhaustive-deps désactivé : `deps` est un objet recréé à chaque render.
    // Les primitives instables (selectedService, packages, items, etc.) sont listées
    // individuellement ci-dessous. Les setters React (setPaying, setStep, etc.) et
    // les callbacks stable useCallback (buildDestination, validateShipment) sont
    // intentionnellement omis car stables par garantie React/useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deps.selectedService,
    deps.packages,
    deps.contentDescription,
    deps.declaredValue,
    deps.isSecondHand,
    deps.collectionDate,
    deps.collectionTime,
    deps.selectedSenderDropoff,
    deps.salesOrderId,
    deps.salesOrderNumber,
    deps.items,
    deps.supabase,
    deps.validateShipment,
    deps.buildDestination,
  ]);

  // ── handleRetryDbSave ─────────────────────────────────────────────
  const handleRetryDbSave = useCallback(async () => {
    const { pendingPacklinkRef, selectedService } = deps;
    if (!pendingPacklinkRef || !selectedService) return;
    deps.setPendingAction(true);

    const {
      data: { user },
    } = await deps.supabase.auth.getUser();
    if (!user?.id) {
      deps.setPendingAction(false);
      return;
    }

    const dbResult = await saveShipmentToDb(deps, pendingPacklinkRef, user.id);
    if (dbResult.success) {
      deps.setShipmentResult({
        trackingNumber: null,
        labelUrl: null,
        carrierName: selectedService.carrier_name,
        orderReference: pendingPacklinkRef,
        totalPaid: selectedService.price.total_price,
      });
      deps.setStep(7);
      deps.setDbError(null);
      deps.setPendingPacklinkRef(null);
    } else {
      deps.setDbError(
        dbResult.error ?? 'Erreur enregistrement base de données'
      );
    }
    deps.setPendingAction(false);
    // exhaustive-deps désactivé : `deps` est un objet recréé à chaque render.
    // Les primitives instables (pendingPacklinkRef, selectedService, items, etc.)
    // sont listées individuellement. Les setters React (setPendingAction, setDbError,
    // setStep, etc.) sont stables par garantie React et intentionnellement omis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deps.pendingPacklinkRef,
    deps.selectedService,
    deps.items,
    deps.salesOrderId,
    deps.supabase,
    deps.validateShipment,
  ]);

  // ── handleCancelPacklink ──────────────────────────────────────────
  const handleCancelPacklink = useCallback(async () => {
    const { pendingPacklinkRef } = deps;
    if (!pendingPacklinkRef) return;
    deps.setPendingAction(true);

    try {
      const res = await fetch(
        `/api/packlink/shipment/${encodeURIComponent(pendingPacklinkRef)}/cancel`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error('Annulation Packlink échouée');
      deps.setPendingPacklinkRef(null);
      deps.setDbError(null);
      deps.setServicesError(null);
      deps.setStep(1);
    } catch (err) {
      deps.setDbError(
        err instanceof Error
          ? err.message
          : "Impossible d'annuler côté Packlink"
      );
    }
    deps.setPendingAction(false);
    // exhaustive-deps désactivé : `deps` est un objet recréé à chaque render.
    // Seul deps.pendingPacklinkRef est une primitive instable utilisée ici.
    // Les setters React (setPendingAction, setPendingPacklinkRef, setDbError,
    // setServicesError, setStep) sont stables par garantie React et omis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps.pendingPacklinkRef]);

  return { handleCreateDraft, handleRetryDbSave, handleCancelPacklink };
}
