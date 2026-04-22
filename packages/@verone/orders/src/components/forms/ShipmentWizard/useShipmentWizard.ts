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
import type {
  DeliveryMethod,
  SortOption,
  PacklinkService,
  PackageInfo,
  DropoffPoint,
  PreviousShipmentGroup,
  ShipmentRow,
  ShipmentWizardState,
} from './types';

export function useShipmentWizard(
  salesOrder: SalesOrderForShipment,
  onSuccess: () => void
): ShipmentWizardState {
  const supabase = createClient();
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

  // Previous shipments
  const [previousShipments, setPreviousShipments] = useState<
    PreviousShipmentGroup[]
  >([]);
  const [showPreviousShipments, setShowPreviousShipments] = useState(false);

  // Init items
  useEffect(() => {
    setItems(prepareShipmentItems(salesOrder));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesOrder]);

  // Load previous shipments (commandes avec expéditions partielles ou réservations Packlink).
  // Inclut 'validated' car les shipments Packlink a_payer n'avancent pas le statut
  // (trigger `update_stock_on_shipment` early-return tant que paiement pas confirmé)
  // et 'shipped' pour le cas edge où on ré-ouvre le wizard sur une commande complétée.
  useEffect(() => {
    if (
      !['validated', 'partially_shipped', 'shipped'].includes(salesOrder.status)
    )
      return;

    const loadPreviousShipments = async () => {
      // Select columns including ones not yet in generated types
      // Cast pattern: same as OrderDetailModal.tsx
      const { data: rawData } = await supabase
        .from('sales_order_shipments')
        .select(
          `shipped_at, quantity_shipped, product_id,
          delivery_method, carrier_name, tracking_number, tracking_url,
          packlink_status, shipping_cost,
          products:product_id (name)`
        )
        .eq('sales_order_id', salesOrder.id)
        .order('shipped_at', { ascending: true });

      if (!rawData || rawData.length === 0) return;

      // Cast to access columns not yet in generated Supabase types
      const rows = rawData as unknown as ShipmentRow[];

      // Group by shipped_at timestamp
      const groups = new Map<string, PreviousShipmentGroup>();
      for (const row of rows) {
        const key = row.shipped_at;
        if (!groups.has(key)) {
          groups.set(key, {
            shipped_at: row.shipped_at,
            delivery_method: row.delivery_method,
            carrier_name: row.carrier_name,
            tracking_number: row.tracking_number,
            tracking_url: row.tracking_url,
            packlink_status: row.packlink_status,
            shipping_cost: row.shipping_cost,
            items: [],
          });
        }
        groups.get(key)!.items.push({
          product_name: row.products?.name ?? 'Produit',
          quantity: row.quantity_shipped,
        });
      }
      setPreviousShipments(Array.from(groups.values()));
    };

    void loadPreviousShipments();
  }, [salesOrder.id, salesOrder.status, supabase]);

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

  // Fetch dropoff points for relay services — sender (91300) + receiver (destination)
  const fetchDropoffs = useCallback(async () => {
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
  }, [selectedService, destinationZip]);

  // Create Packlink draft shipment (POST /shipments)
  // Payment is done manually on Packlink PRO website after draft creation
  const handleCreateDraft = async () => {
    if (!selectedService) return;
    setPaying(true);
    setServicesError(null);

    const destination = buildDestination();

    try {
      const res = await fetch('/api/packlink/shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          destination,
          packages,
          content: contentDescription,
          contentValue: declaredValue,
          contentSecondHand: isSecondHand,
          orderReference: salesOrder.order_number ?? salesOrder.id.slice(0, 8),
          ...(selectedSenderDropoff
            ? { dropoffPointId: selectedSenderDropoff }
            : {}),
          ...(collectionDate
            ? {
                collectionDate: collectionDate.split('-').join('/'),
                collectionTime: `${collectionTime}-18:00`,
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

      if (data.success) {
        // Enregistrer l'expédition dans notre DB (packlink_status = 'a_payer')
        // Le trigger INSERT ne décrémente PAS le stock pour les expéditions Packlink
        // Le stock sera décrémenté quand Verone paie le transport (webhook → 'paye')
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.id) {
          const itemsToShip = items
            .filter(i => (i.quantity_to_ship ?? 0) > 0)
            .map(i => ({
              sales_order_item_id: i.sales_order_item_id,
              product_id: i.product_id,
              quantity_to_ship: i.quantity_to_ship ?? 0,
            }));

          if (itemsToShip.length > 0) {
            const dbResult = await validateShipment({
              sales_order_id: salesOrder.id,
              items: itemsToShip,
              shipped_at: new Date().toISOString(),
              shipped_by: user.id,
              delivery_method: 'packlink',
              carrier_name: selectedService.carrier_name,
              carrier_service: selectedService.name,
              shipping_cost: selectedService.price.total_price,
              estimated_delivery_at:
                selectedService.first_estimated_delivery_date ?? undefined,
              packlink_shipment_id: data.shipmentReference,
              packlink_status: 'a_payer',
              notes: `Transport Packlink à payer par Verone — ${selectedService.carrier_name}`,
            });

            if (!dbResult.success) {
              console.error('[ShipmentWizard] DB save failed:', dbResult.error);
            }
          }
        }

        setShipmentResult({
          trackingNumber: null,
          labelUrl: null,
          carrierName: selectedService.carrier_name,
          orderReference: data.shipmentReference,
          totalPaid: selectedService.price.total_price,
        });
        setStep(7); // Success — show link to Packlink PRO for payment
      }
    } catch (err) {
      setServicesError(
        err instanceof Error ? err.message : 'Erreur creation expedition'
      );
    }
    setPaying(false);
  };

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
    showPreviousShipments,
    setShowPreviousShipments,
    totals,
    insurancePrice,
    destinationZip,
    sortedServices,
    stepLabels,
    maxStep,
    validating,
    handleQuantityChange,
    handleShipAll,
    handleAddPackage,
    handleRemovePackage,
    handlePackageChange,
    fetchServices,
    fetchDropoffs,
    handleSimpleValidation,
    handleCreateDraft,
    formatTransit,
    formatTransitLabel,
    formatEstimatedDate,
  };
}
