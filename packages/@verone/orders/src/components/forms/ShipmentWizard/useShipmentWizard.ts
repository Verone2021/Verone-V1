'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import type { ShipmentItem } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

import {
  useSalesShipments,
  type SalesOrderForShipment,
} from '@verone/orders/hooks';

import {
  formatTransit,
  formatTransitLabel,
  formatEstimatedDate,
} from './formatters';
import { parseShippingAddress, extractPostalCode } from './parse-address';
import {
  makeQuantityChangeHandler,
  makeShipAllHandler,
  makeAddPackageHandler,
  makeRemovePackageHandler,
  makePackageChangeHandler,
} from './handlers';
import { useCreateDraftHandlers } from './handle-create-draft';
import { useFetchDropoffs } from './use-fetch-dropoffs';
import { usePreviousShipments } from './use-previous-shipments';
import type {
  DeliveryMethod,
  SortOption,
  PacklinkService,
  PackageInfo,
  DropoffPoint,
  ShipmentWizardState,
} from './types';

export function useShipmentWizard(
  salesOrder: SalesOrderForShipment,
  onSuccess: () => void
): ShipmentWizardState {
  // Stabilise the Supabase client so it doesn't trigger useEffect re-runs.
  // createClient() is cache-backed but TypeScript can't guarantee ref stability
  // across renders without useMemo.
  const supabase = useMemo(() => createClient(), []);
  const { prepareShipmentItems, validateShipment, validating } =
    useSalesShipments();

  // Wizard state
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(
    null
  );

  // Manual shipment fields
  const [manualCarrier, setManualCarrier] = useState('');
  const [manualTracking, setManualTracking] = useState('');
  const [manualShippingCost, setManualShippingCost] = useState<number | null>(
    null
  );
  const [notes, setNotes] = useState('');

  // Packlink fields
  const [packages, setPackages] = useState<PackageInfo[]>([
    { weight: 5, width: 30, height: 30, length: 30 },
  ]);
  const [services, setServices] = useState<PacklinkService[]>([]);
  const [selectedService, setSelectedService] =
    useState<PacklinkService | null>(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // Content & insurance (Step 3)
  const [contentDescription, setContentDescription] = useState('');
  const [isSecondHand, setIsSecondHand] = useState(false);
  const [declaredValue, setDeclaredValue] = useState(0);
  const [wantsInsurance, setWantsInsurance] = useState(false);

  // Packlink result
  const [shipmentResult, setShipmentResult] = useState<{
    trackingNumber: string | null;
    labelUrl: string | null;
    carrierName: string | null;
    orderReference: string | null;
    totalPaid: number | null;
  } | null>(null);
  const [paying, setPaying] = useState(false);

  // Error recovery state (step 8)
  const [dbError, setDbError] = useState<string | null>(null);
  const [pendingPacklinkRef, setPendingPacklinkRef] = useState<string | null>(
    null
  );
  const [pendingAction, setPendingAction] = useState(false);

  // Dropoffs — sender + receiver
  const [senderDropoffs, setSenderDropoffs] = useState<DropoffPoint[]>([]);
  const [selectedSenderDropoff, setSelectedSenderDropoff] = useState<
    string | null
  >(null);
  const [loadingSenderDropoffs, setLoadingSenderDropoffs] = useState(false);
  const [receiverDropoffs, setReceiverDropoffs] = useState<DropoffPoint[]>([]);
  const [selectedReceiverDropoff, setSelectedReceiverDropoff] = useState<
    string | null
  >(null);
  const [loadingReceiverDropoffs, setLoadingReceiverDropoffs] = useState(false);

  // Collection date/time
  // Date d'enlevement : VIDE par defaut — l'utilisateur DOIT la selectionner
  // (Packlink PRO exige une confirmation explicite de la date pour passer en "Pret pour le paiement")
  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTime, setCollectionTime] = useState('09:00');

  // Previous shipments — extracted to use-previous-shipments.ts
  const { previousShipments } = usePreviousShipments(
    salesOrder.id,
    salesOrder.status,
    supabase
  );

  // Init items
  useEffect(() => {
    setItems(prepareShipmentItems(salesOrder));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesOrder]);

  // Totals
  const totals = useMemo(() => {
    const totalQty = items.reduce((s, i) => s + (i.quantity_to_ship ?? 0), 0);
    const totalValue = items.reduce(
      (s, i) => s + (i.quantity_to_ship ?? 0) * i.unit_price_ht,
      0
    );
    const hasStockIssue = items.some(
      i => (i.quantity_to_ship ?? 0) > i.stock_available
    );
    return { totalQty, totalValue, hasStockIssue };
  }, [items]);

  // Initialize content description and declared value when items change
  useEffect(() => {
    const names = items
      .filter(i => (i.quantity_to_ship ?? 0) > 0)
      .map(i => i.product_name)
      .join(', ');
    setContentDescription(names);
    setDeclaredValue(totals.totalValue);
  }, [items, totals.totalValue]);

  // Insurance price: 3% of declared value, min 2€
  const insurancePrice = Math.max(2, declaredValue * 0.03);

  // Destination zip from shipping_address (tolerates string or object payload)
  const destinationZip = useMemo(() => {
    return extractPostalCode(parseShippingAddress(salesOrder.shipping_address));
  }, [salesOrder.shipping_address]);

  // Sorted services
  const sortedServices = useMemo(() => {
    const copy = [...services];
    if (sortOption === 'price_asc') {
      copy.sort((a, b) => a.price.total_price - b.price.total_price);
    } else if (sortOption === 'transit_asc') {
      copy.sort(
        (a, b) => parseInt(a.transit_hours, 10) - parseInt(b.transit_hours, 10)
      );
    }
    return copy;
  }, [services, sortOption]);

  // Step constants
  const stepLabels = [
    'Stock',
    'Mode',
    'Colis',
    'Transport',
    'Relais',
    'Resume',
  ];
  const maxStep = deliveryMethod === 'packlink' ? 6 : 2;

  // Handlers — items & packages (sync, extracted to handlers.ts)
  const handleQuantityChange = makeQuantityChangeHandler(setItems);
  const handleShipAll = makeShipAllHandler(setItems);
  const handleAddPackage = makeAddPackageHandler(setPackages);
  const handleRemovePackage = makeRemovePackageHandler(setPackages);
  const handlePackageChange = makePackageChangeHandler(setPackages);

  // Fetch Packlink services
  const fetchServices = useCallback(async () => {
    if (!destinationZip) return;
    setLoadingServices(true);
    setServicesError(null);
    try {
      const res = await fetch('/api/packlink/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toCountry: 'FR',
          toZip: destinationZip,
          packages,
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = (await res.json()) as { services: PacklinkService[] };
      setServices(data.services ?? []);
    } catch (err) {
      setServicesError(err instanceof Error ? err.message : 'Erreur Packlink');
    }
    setLoadingServices(false);
  }, [destinationZip, packages]);

  // Validate shipment (simple modes: pickup / hand_delivery / manual)
  const handleSimpleValidation = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return;

    const itemsToShip = items
      .filter(i => (i.quantity_to_ship ?? 0) > 0)
      .map(i => ({
        sales_order_item_id: i.sales_order_item_id,
        product_id: i.product_id,
        quantity_to_ship: i.quantity_to_ship ?? 0,
      }));

    if (itemsToShip.length === 0) return;

    const result = await validateShipment({
      sales_order_id: salesOrder.id,
      items: itemsToShip,
      shipped_at: new Date().toISOString(),
      tracking_number: manualTracking || undefined,
      notes: notes || undefined,
      shipped_by: user.id,
      delivery_method: deliveryMethod ?? undefined,
      carrier_name: manualCarrier || undefined,
      shipping_cost: manualShippingCost ?? undefined,
    });

    if (result.success) onSuccess();
  };

  // Build destination object from order data
  const buildDestination = useCallback(() => {
    const addr = parseShippingAddress(salesOrder.shipping_address);
    const name = salesOrder.customer_name ?? '';
    const nameParts = name.split(' ');
    const email = salesOrder.organisations?.email ?? 'client@verone.fr';

    return {
      name: nameParts[0] ?? 'Client',
      surname: nameParts.slice(1).join(' ') || 'Client',
      email,
      phone: addr?.phone ?? '+33600000000',
      street1: addr?.address_line1 ?? addr?.line1 ?? '',
      city: addr?.city ?? '',
      zip_code: addr?.postal_code ?? '',
      country: addr?.country ?? 'FR',
    };
  }, [salesOrder]);

  // Fetch dropoff points for relay services — extracted to use-fetch-dropoffs.ts
  const fetchDropoffs = useFetchDropoffs({
    selectedService,
    destinationZip,
    setSenderDropoffs,
    setLoadingSenderDropoffs,
    setReceiverDropoffs,
    setLoadingReceiverDropoffs,
  });

  // Create Packlink draft shipment + DB save — extracted to handle-create-draft.ts
  const { handleCreateDraft, handleRetryDbSave, handleCancelPacklink } =
    useCreateDraftHandlers({
      salesOrderId: salesOrder.id,
      salesOrderNumber: salesOrder.order_number ?? null,
      items,
      packages,
      selectedService,
      contentDescription,
      declaredValue,
      isSecondHand,
      collectionDate,
      collectionTime,
      selectedSenderDropoff,
      pendingPacklinkRef,
      supabase,
      validateShipment,
      buildDestination,
      setStep,
      setPaying,
      setServicesError,
      setDbError,
      setPendingPacklinkRef,
      setPendingAction,
      setShipmentResult,
    });

  return {
    step,
    setStep,
    items,
    setItems,
    deliveryMethod,
    setDeliveryMethod,
    manualCarrier,
    setManualCarrier,
    manualTracking,
    setManualTracking,
    manualShippingCost,
    setManualShippingCost,
    notes,
    setNotes,
    packages,
    setPackages,
    services,
    selectedService,
    setSelectedService,
    loadingServices,
    servicesError,
    sortOption,
    setSortOption,
    contentDescription,
    setContentDescription,
    isSecondHand,
    setIsSecondHand,
    declaredValue,
    setDeclaredValue,
    wantsInsurance,
    setWantsInsurance,
    shipmentResult,
    paying,
    senderDropoffs,
    selectedSenderDropoff,
    setSelectedSenderDropoff,
    loadingSenderDropoffs,
    receiverDropoffs,
    selectedReceiverDropoff,
    setSelectedReceiverDropoff,
    loadingReceiverDropoffs,
    collectionDate,
    setCollectionDate,
    collectionTime,
    setCollectionTime,
    previousShipments,
    totals,
    insurancePrice,
    destinationZip,
    sortedServices,
    stepLabels,
    maxStep,
    validating,
    dbError,
    pendingPacklinkRef,
    pendingAction,
    handleQuantityChange,
    handleShipAll,
    handleAddPackage,
    handleRemovePackage,
    handlePackageChange,
    fetchServices,
    fetchDropoffs,
    handleSimpleValidation,
    handleCreateDraft,
    handleRetryDbSave,
    handleCancelPacklink,
    formatTransit,
    formatTransitLabel,
    formatEstimatedDate,
  };
}
